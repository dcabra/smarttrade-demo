# Roadmap Home · Capa de Riesgo y Decisión (dashboard → cockpit)

> **Origen.** Nace de la evaluación de trader del home Portafolio (27-jul-2026, tras cerrar el
> rediseño terminal). Veredicto: como **panel de *situación*** (qué tengo · qué opina el modelo ·
> qué pasa afuera) el home está completo y bien presentado. Como **panel de *decisión y riesgo***
> todavía es incompleto: falta la capa de "cuánto arriesgo y qué hago al respecto". Este roadmap
> es ese salto. **NO es urgente** — el home ya cumple su función; esto es evolución natural.
>
> **Guardrail común a las 4.** Todo es **frontend puro** sobre datos que la app **ya tiene**
> (`POSITIONS` de Alpaca + el histórico del chart de valor + los endpoints de LECTURA ya
> cableados). **NO toca** `MOTOR_V3` / `motor_flags` / `usa_v3()` / `data_fetcher` / el ejecutor.
> Misma disciplina que el Roadmap Home: cada paso es un bloque autocontenido en `index.html`
> (CSS + card + funciones + 1 línea de hook), `node --check` + harness verdes, revert por
> `git revert`. Cada uno se hace en su propia sesión, con revisión de shape → diseño →
> criterio de éxito → confirmación → código.

## Prioridad sugerida

**R1 (Top movers) → R2 (Riesgo) → R3 (Señal por posición) → R4 (Cash).**
R1 es el más barato y cierra un loop obvio (el P&L del día sin culpable); R2 es el hueco de más
valor (riesgo); R3 y R4 son refinamientos. El orden es sugerencia, no atadura.

---

## R1 — Top movers del día (atribución del P&L)

**El hueco.** El header dice "P&L del día −$1,145" pero no **qué posición** lo causó. El trader
ve la pérdida sin el culpable, y tiene que cruzarlo mentalmente contra la tabla.

**Qué.** Una tira/mini-card **"Movimiento de hoy"**: las 2–3 posiciones que más **suman** y las que
más **restan** al P&L del día, con su aporte en $ y %. Cierra el loop: *veo la pérdida y su origen
en el mismo golpe de vista*.

**Datos.** `POSITIONS` ya trae, por posición, el cambio del día (`unrealized_intraday_pl` /
`change_today` de Alpaca, o `current_price` vs `lastday_price`). Es **cálculo en cliente** sobre
lo que ya está cargado — cero endpoints nuevos. (Verificar en la sesión qué campo intradía trae
exactamente el `POSITIONS` del front.)

**Diseño (boceto).** Fila compacta: `▲ AAPL +$X (+Y%)` (verde) · `▼ TSLA −$Z (−W%)` (rojo),
ordenada por magnitud del aporte. Reusa `fPS`/`fPct`/`sentColor`. Ubicación natural: bajo la
tira de KPIs del header, o como cuarta mini-card de la columna izquierda.

**Criterio de éxito.** Con la cuenta cargada, se ven los 2 mayores aportes positivos y negativos
del día, sumando al P&L del día del header; estado vacío honesto si el campo intradía no viene.

**Riesgo.** Si Alpaca no expone cambio intradía por posición en el `POSITIONS` actual, se degrada
a "aporte sobre costo" (`unrealized_pl`) o se omite — sin bloquear el resto.

---

## R2 — Tarjeta de riesgo (exposición · concentración · drawdown)

**El hueco (el más grande).** El home dice *qué* tenés y *qué opina* el modelo, pero no **cuánto
podés perder**. Falta lo que un trader mira primero.

**Qué.** Una card **"Riesgo"** con, de un vistazo:
- **Exposición neta / apalancamiento:** invertido vs equity (hoy 73%), y si estás net long/short
  (con margen, `poder_de_compra` vs efectivo). Responde "¿cuánto del capital está en riesgo?".
- **Concentración como *alerta*, no como dato:** hoy la card Cartera muestra "Top-3 = 58%, mayor
  SPY 21.9%" en gris plano. Pintarlo como semáforo (ej. >X% mayor posición → ámbar) lo vuelve
  accionable.
- **Drawdown:** cuánto caíste desde el máximo de la serie del chart de valor. El chart muestra el
  valor; esto muestra "cuánto dolió". Se calcula de `PH_DRAW`/la serie ya cargada.
- (Opcional, más caro) **Beta del portafolio vs SPY:** el chart ya tiene la serie de la cuenta y
  la de SPY → una beta aproximada por regresión de retornos es cálculo en cliente.

**Datos.** `POSITIONS` (valores, margen) + la serie del chart (`PH_DRAW.vals` para drawdown, y
`spy` para beta) — todo ya en memoria. Cero backend.

**Criterio de éxito.** La card muestra exposición %, un semáforo de concentración, y el drawdown
actual desde máximo; los números cuadran con el header y la card Cartera.

**Nota de honestidad.** Beta/drawdown sobre una serie corta (el libro tiene pocas semanas) es
indicativo, no veredicto — rotularlo como tal, igual que Eficiencia/Pulso ya hacen con la muestra
chica.

---

## R3 — Señal del modelo por posición (cruce Cartera ↔ modelo)

**El hueco.** La Cartera muestra estado (TSLA −23%), no acción. El Pulso dice "0 conflictos" en
**agregado**; el trader quiere, **por posición**, qué dice el modelo de *ese* ticker (señal +
forecast). Hoy hay que cruzarlo mentalmente entre tres tarjetas.

**Qué.** En la tabla de Cartera (o en su hover/tooltip), una columna/indicador de **señal del
modelo por ticker**: BUY/HOLD/SELL del último cierre + (si cabe) el mini-forecast. Convierte la
tabla de "cuánto tengo" en "cuánto tengo **y qué hacer**".

**Datos.** Ya existen los insumos: el Pulso (S3) lee `GET /v1/papertrading/señales` (señales del
cierre, con ticker) y el forecast por-ticker (`GET /v1/forecast/{ticker}`, ya saneado en
`3e6f8e5`) alimenta la watchlist. Es **cruzar** lo que ya se carga contra `POSITIONS` — la misma
lógica conflict-first del Pulso, pero desplegada por fila en vez de agregada.

**Diseño.** Chip por fila: `BUY`/`HOLD`/`SELL` coloreado (verde/gris/rojo), con ⚠ si contradice tu
posición (largo + SELL, etc.) — reusa la evaluación de conflicto de `phdRender`.

**Criterio de éxito.** Cada fila de Cartera muestra la señal del modelo para ese ticker; los
conflictos coinciden con el conteo agregado del Pulso.

**Guardrail extra.** Las señales del libro son un universo de investigación multi-mercado (US +
BVC); Alpaca es solo-US. Respetar el mismo criterio de S3.5 (conflictos accionables primero, resto
degradado) para no mostrar ruido no-operable como si fuera señal.

---

## R4 — Cash como decisión, no como dato

**El hueco.** $25k efectivo (27%) es mucho cash. ¿Es intencional (pólvora seca) o capital ocioso?
El trader se lo pregunta; el home lo muestra plano.

**Qué.** Contextualizar el efectivo: mostrarlo como **% del equity con una lectura** ("27% en cash
— pólvora seca / capital ocioso según tu estilo"), o compararlo con un objetivo de asignación si
el trader define uno. Lo mínimo: que el número invite a una decisión en vez de quedar como dato.

**Datos.** Ya está todo (`efectivo`, `equity`). Es **presentación**, el más liviano de los cuatro.

**Diseño.** Puede ser tan simple como un renglón bajo el KPI de Efectivo con el % y una etiqueta
neutral, o un pequeño medidor. Sin sobre-diseñar: es un empujón cognitivo, no una card entera.

**Criterio de éxito.** El efectivo se lee como proporción del equity con una etiqueta que invite a
decidir; no inventa recomendaciones (Claude/el home no es asesor financiero — describe, no aconseja).

---

## Fuera de alcance (por ahora)

- Cualquier cosa que requiera **endpoints nuevos** o toque el **backend/motor/ejecutor**. Si un
  paso lo necesitara, se saca a su propio roadmap y se decide aparte.
- **Recomendaciones de inversión.** El home describe riesgo y estado; no dice "comprá/vendé". Las
  señales del modelo se muestran como lo que son (salida del sistema), no como consejo.
- Order entry / ejecución desde el home. Esto es un **cockpit de lectura**, no una mesa de órdenes.

## Notas de secuencia

Este roadmap es **independiente** del Roadmap Motor V3 (F7 → 5.C → 5.F → F8) y del ejecutor
(E5-C). Es capa de presentación del home; se puede intercalar en cualquier hueco sin bloquear ni
ser bloqueado por el motor. Prioridad frente al Motor V3: **decisión de founder** — el motor es el
corazón del producto; esto es pulido de cabina.
