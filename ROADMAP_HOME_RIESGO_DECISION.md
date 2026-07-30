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

## Estado final (30-jul-2026) — **ROADMAP COMPLETO**

**Los cinco pasos están cerrados.** El home dejó de ser un panel de *situación* y es un **cockpit
de riesgo**: R1 da la atribución del P&L del día, R2 la exposición + efectivo + concentración +
drawdown, R3 la señal del modelo por posición, y R5 la frase que integra todo eso.

| paso | estado | commit |
|---|---|---|
| R1 · Top movers del día | **COMPLETO** | `27fff81` (+ backend `4c104c3`) |
| R2 · Riesgo / exposición | **COMPLETO** | `388ffcf` (+ fix `61868b3`) |
| R3 · Señal por posición | **COMPLETO** | `ec1eb9f` |
| R4 · Cash como decisión | **CUBIERTO POR R2** — no se implementa aparte | — |
| R5 · Síntesis del portafolio | **COMPLETO** | `435ada4` |

**Excepción al guardrail "frontend puro", registrada.** R1 requirió **un** cambio de backend
acotado (ver su sección). Fue una decisión explícita, en la capa de datos del broker y **no** en el
motor. El guardrail sigue vigente para todo lo demás.

**⚠️ Lo único que queda pendiente: la verificación visual.** Los cinco pasos están commiteados y
desplegados, y cada uno tiene sus harness verdes, pero **nadie los ha revisado de forma sistemática
en el navegador**. Los harness cubren cálculos, clasificación, redacción y cableado — no el render.
Ver la lista concreta al final del documento.

## Prioridad sugerida (original)

**R1 (Top movers) → R2 (Riesgo) → R3 (Señal por posición) → R4 (Cash) → R5 (Síntesis).**
R1 es el más barato y cierra un loop obvio (el P&L del día sin culpable); R2 es el hueco de más
valor (riesgo); R3 y R4 son refinamientos; **R5 va última a propósito** — sintetiza lo que R1–R4 y
las tarjetas ya exponen, así que gana valor cuando el resto ya está. El orden es sugerencia, no
atadura.

*Se siguió ese orden. R4 se resolvió dentro de R2 en vez de como paso propio.*

---

## R1 — Top movers del día (atribución del P&L) · **COMPLETO** (`27fff81`)

> **Cerrado el 30-jul-2026.** Tira **"Movimiento de hoy"** bajo los KPIs del header, con las 2 que
> más suman y las 2 que más restan, su aporte en $ y %, y `Σ posiciones · resto` explícito.
>
> **Requirió un cambio de backend — excepción deliberada al guardrail.** La investigación inicial
> dio por bueno que `change_today` llegaba al front porque el mapper lo leía; era falso: el campo
> se consumía pero **nadie lo producía**. La whitelist de `list_positions()` en
> `alpaca_client.py` no lo copiaba, así que llegaba `undefined → null` y la tira nunca se pintaba
> (código muerto en producción hasta detectarlo). Se agregó **una línea** —
> `"change_today": _f(getattr(p, "change_today", None))` — en el commit de backend **`4c104c3`**.
> Es **capa de datos del broker**, NO el motor: no toca `MOTOR_V3` / `usa_v3()` / `data_fetcher` /
> el ejecutor. De regalo revivieron los chips `day-` del panel izquierdo, muertos por lo mismo.
>
> **Lección que vale para los próximos pasos:** verificar el **productor** del dato, no solo el
> consumidor. Que el front lea un campo no prueba que el backend lo mande.
>
> **Honestidad.** El aporte sale exacto de `value × ct/(1+ct)` (derivación de `change_today`), sin
> inventar datos. La suma de posiciones **no** reconcilia sola con el P&L del día del header —que
> es un delta de *cuenta* e incluye lo operado hoy y movimientos de efectivo—, así que el residuo
> se **muestra** como `resto` en vez de normalizarse. Sin `change_today` usable la tira se oculta:
> no se degrada a `unrealized_pl`, que es P&L de vida de la posición y respondería otra pregunta.

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

## R2 — Tarjeta de riesgo (exposición · concentración · drawdown) · **COMPLETO** (`388ffcf`)

> **Cerrado el 30-jul-2026.** No salió como card aparte sino como **bloque dentro de la tarjeta
> Cartera**, a la derecha de la dona —espacio que era aire muerto—, en dos columnas:
> - **Izquierda:** la dona, y **debajo** la concentración (antes al costado), ahora con
>   **semáforo**: verde <10% · ámbar 10–20% · rojo >20% de la mayor posición. Solo el color
>   comunica el nivel; sin palabras de juicio.
> - **Derecha:** **efectivo %** como métrica protagónica, `$X en efectivo`, `Y% invertido · $Z en
>   mercado`, **barra efectivo|invertido**, **mayor exposición** (ticker y $) y **drawdown**
>   reactivo al selector 1S/1M/3M/1A.
>
> **Decisiones de honestidad.**
> - **Denominador `EQUITY` con residuo visible:** si hay órdenes pendientes o margen, efectivo% +
>   invertido% no dan 100 y **la barra no cierra**. No se normaliza: cuadrar a la fuerza inventaría
>   una precisión que no existe. Mismo principio que el `resto` de R1.
> - **Colores neutros para magnitudes sin signo:** efectivo y exposición van en gris/azul. Verde y
>   rojo quedan reservados para el **drawdown**, que sí tiene dirección.
> - **Sin adjetivos.** Nada de "pólvora seca" ni "diversificado": el dato desnudo.
> - **Drawdown = actual desde el máximo de la ventana visible**, no la peor caída pico-a-valle del
>   período. Va **rotulado con su rango** (`−4.2% · 3M`) porque el repintado del chart puede salir
>   temprano sin limpiar `PH_DRAW`, y así el número nunca se lee como si fuera de otra ventana.
> - **Beta omitida.** Era el opcional de esta sección; se descartó por serie corta: una beta sobre
>   pocas semanas es ruido con apariencia de métrica.
>
> **Costo de layout, aceptado.** La zona creció ~20–30px que cede la tabla scrolleable (1–2 filas
> menos antes del scroll). El `152px`/`flex-shrink:0` de la dona y el `flex:1;min-height:0` de la
> tabla quedaron intactos.

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

## R3 — Señal del modelo por posición (cruce Cartera ↔ modelo) · **COMPLETO** (`ec1eb9f`)

> **Cerrado el 30-jul-2026.** Se implementó **conflict-only**, no un chip de señal en cada fila:
> se marcan con **⚠ ámbar** (más borde izquierdo y fondo tenue) solo las posiciones que el modelo
> contradice —largo + SELL, o corto + BUY—. Una fila sin marca es una fila sin fricción. En el
> header de la tarjeta, junto a "N posiciones", un **pie de cobertura**:
> `⚠ N en conflicto · ● M confirmada · K sin señal`. El ⚠ va dentro de la celda del símbolo, no en
> una columna nueva: la tabla ya había cedido alto con R2.
>
> **Requirió refactor de `phdRender` (S3).** El cruce señal↔posición vivía **inline** dentro del
> Pulso, en un arrow local inaccesible desde fuera. Se extrajo a **`phConflictos()`**, ahora
> **única fuente de verdad** que consumen el Pulso y la tabla: es imposible que una tarjeta cuente
> 2 conflictos y la otra 3. La regla no cambió (`qty null` sigue asumiendo largo). Se agregó
> normalización de ticker en **ambos** lados: antes solo `POSITIONS` venía en mayúsculas y una fila
> del libro con otro case no cruzaba, **en silencio**. El refactor se validó con un **snapshot
> byte-a-byte** de la salida de `phdRender` en 7 escenarios, capturado *antes* de tocar el código:
> sin regresiones, mismo `N=2` y mismos tickers.
>
> **`sig null` ≠ `sig []`.** Si el libro no se pudo leer, **no se marca nada**: la ausencia de ⚠
> debe significar "sin conflicto", nunca "no sé".
>
> **⚠️ NOTA PARA EL FUTURO — el title NO muestra la confianza, a propósito.** El libro
> (`GET /v1/papertrading/señales`) devuelve `confianza` en **dos escalas mezcladas dentro del mismo
> `job_date`** y **ninguna fila declara cuál**: verificado en runtime, 52 filas en puntos v2
> [30,95] (`NKE 53`, `SONY 60`) y 6 en probabilidad v3 [0,1] (`AAPL 0.5705`, `AMD 0.6109`). Como el
> convenio del front es "sin etiqueta ⇒ v2", una fila v3 se imprimiría como **`1%` en vez de 57%** —
> un número falso, no un redondeo. El Pulso ya evitaba `confianza` deliberadamente ("a prueba del
> flip") y R3 mantiene esa línea: **ningún dato es mejor que un dato mentiroso**.
> **Es un bug del libro/motor, fuera del alcance de este roadmap**, registrado como pendiente. Al
> arreglarlo, la fila debería emitir `motor_version` — el front ya sabe leerlo (`confPct()`).

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

## R4 — Cash como decisión, no como dato · **CUBIERTO POR R2** (no se implementa aparte)

> **Resuelto dentro de R2 el 30-jul-2026 — esto no es un olvido, es una decisión.**
>
> El objetivo de R4 era *"que el efectivo se lea como proporción del equity e invite a decidir, sin
> inventar recomendaciones"*. **R2 ya lo cumple:** el **efectivo %** es la métrica **protagónica**
> del bloque de riesgo —el número más grande, arriba de todo—, con su monto en $ debajo y la barra
> efectivo|invertido al lado. Dejó de ser un dato plano en la fila de KPIs.
>
> **Lo que sí se descartó, y por qué:** la "lectura" que R4 proponía —etiquetar el cash como
> *"pólvora seca / capital ocioso según tu estilo"*—. La app **no puede saber** si ese efectivo es
> intencional u ocioso: eso depende de la tesis del trader, que el home no conoce. Ponerle esa
> etiqueta sería que la interfaz **decida por el trader**, justo la línea que este roadmap promete
> no cruzar ("describe, no aconseja"). El **dato desnudo y prominente** es la forma honesta de
> cumplir el objetivo: el % grande invita a la decisión sin tomarla.
>
> Por eso no queda un paso R4 pendiente: su hueco está cerrado, y la parte que no se hizo fue
> **descartada a propósito**, no postergada.

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

## R5 — Síntesis del portafolio (frase por reglas, no "opinión IA") · **COMPLETO** (`435ada4`)

> **Cerrado el 30-jul-2026 por la Variante A (reglas).** Tarjeta delgada sobre la tira "Movimiento
> de hoy" con **una frase** armada por **plantilla determinista** desde los números que R2/R3 ya
> calcularon. Sin LLM, sin red, sin recalcular nada. **Estilo neutro a propósito** (azul apagado,
> no dorado): no es una opinión de IA y no debe parecerlo.
>
> **Priorización — destaca lo que está fuera de lo normal:** conflictos del modelo (titular) >
> concentración >20% > drawdown >10% > exposición (siempre, como cierre). Máximo **2 destacados**
> más la exposición. Si nada dispara, describe el estado tranquilo; **nunca inventa una alerta**.
> El umbral de concentración **reusa** `PHRISK_CONC_ROJO` de R2, así el semáforo de la dona y la
> síntesis no pueden discrepar.
>
> **Describe, NO aconseja.** Indicativo, hechos. Cero imperativos ("reduce", "vende", "considera").
> Sin adjetivos de juicio: el mockup original decía *"exposición repartida"* y se cambió por el
> hecho verificable *"Ninguna posición supera el 20% de la cartera"* — misma razón por la que R4
> descartó "pólvora seca". Español neutro. El harness **falla** si aparece un imperativo o voseo en
> cualquiera de las frases generadas.
>
> **Estados honestos.** Si el libro de señales no se pudo leer (`disponible === false`) se **omite**
> la parte de conflictos y la frase **no** afirma "alineadas con el modelo": decir "0 conflictos"
> sería afirmar algo que no sabemos. Sin posiciones, la tarjeta se oculta. Sin `EQUITY`, se omite la
> exposición.
>
> **Fuentes compartidas — misma disciplina que `phConflictos()` en R3.** Se extrajeron
> **`phsynConcentracion()`** y **`phsynExposicion()`**, que ahora consumen **tanto R2 como R5**:
> es imposible que el bloque de riesgo y la síntesis digan cifras distintas del mismo dato. La
> concentración sale de `POSITIONS`, **no** de las rebanadas de la dona, para que la cifra no cambie
> al tocar el selector *Por posición / Por clase*.
>
> **Los dos denominadores se mantienen SEPARADOS a propósito.** Exposición divide por `EQUITY` con
> `homeAggregates().mv` (incluye negativos si hay cortos); concentración divide por
> `Σ(value>0) + efectivo`, que es la base de la dona. Unificarlos habría cambiado números de R2 ya
> desplegados: meter una regresión por elegancia. El snapshot lo verifica en el escenario de
> posición corta, justo donde divergen.
>
> **Verificado:** `node --check` 4/4 · harness R5 **55 PASS / 0 FAIL** (los 6 escenarios del diseño,
> umbrales exactos, prioridad y tope, más anti-imperativo y anti-voseo sobre **todas** las frases) ·
> **snapshot byte-a-byte** de `renderHomeAllocation` + `phriskRender` en 9 escenarios **sin
> regresiones** (R2 muestra exactamente lo mismo que antes de la extracción).

**El hueco.** El home tiene 6–7 tarjetas; el trader tiene que **integrar mentalmente** cartera +
modelo + noticias + eventos para saber "qué historia cuentan juntas". Falta el **resumen ejecutivo
del cockpit**: una línea que haga esa integración.

**Qué.** Una **tira horizontal siempre visible** (al final del home, o bajo el header) con **una
frase** que sintetiza lo que muestran las tarjetas. Ejemplo con datos reales:
> *"Concentración alta (top-3 58%), sesgo tecnología. Modelo: forecast bien calibrado (92%),
> señal sin edge (59%, muestra chica). Esta semana: FOMC en 2 días (alto impacto)."*

**⚠️ Distinción crítica — síntesis, NO opinión.** La tentación es dejar que un LLM **interprete y
juzgue** ("desbalanceado", "noticias malas de la FED"). Eso es peligroso por tres razones:
1. **Se lee como consejo.** "Desbalanceado / malas" empuja a una decisión; el home **describe, no
   aconseja** (no es asesor financiero). Una frase que suena a veredicto cruza esa línea.
2. **Alucina.** Un LLM en prosa libre inventa matices que los números no dicen ("malas de la FED"
   cuando el evento es solo "FOMC en 2 días", sin signo). Y la síntesis es lo único que el usuario
   lee como "la conclusión": si miente, **contamina la confianza de todo el panel**.
3. **Rompe el tono honesto de la app** ("DRIFT N/A", "en desarrollo", "muestra chica"). Una frase
   que afirma con seguridad contradice ese estándar.

**Variante A — por REGLAS (recomendada para el MVP).** La frase se **arma por plantilla** desde
umbrales sobre los datos que las tarjetas **ya calcularon** — NO la escribe un LLM. Cada fragmento
sale de una regla sobre un dato real: concentración >55% → "alta"; win-rate <60% + n chico → "sin
edge, muestra chica"; evento de impacto alto a <3 días → se menciona; sesgo sectorial desde
`asset_class`/composición. **Determinista, auditable, sin costo, sin latencia, sin alucinación.**
Si un fragmento no aplica, no aparece. Es **frontend puro** sobre datos ya presentes (concentración,
win-rate, cobertura, `sentimiento_score` agregado, eventos) — cero backend, cero LLM.

**Variante B — LLM anclado (evolución opcional).** Si la frase por reglas se siente robótica, se
puede pedir a un LLM que la **redacte** (más natural) — pero anclado fuerte: se le pasan **solo los
números ya calculados**, se le **prohíbe agregar datos** y **recomendar**, y se muestra un
disclaimer ("resumen automático · no es consejo"). Usa el carril `/consulta IA` que la app ya tiene.
Más caro (una llamada), más lento, y hay que vigilar que no se desmadre. **No para el MVP** — 90%
del valor con 10% del riesgo está en la Variante A.

**Datos.** Todo ya en las tarjetas: concentración/sesgo (Cartera), win-rate/cobertura (Eficiencia),
conflictos/drift (Pulso), eventos (Próximos eventos), sentimiento agregado (Noticias). R5 **lee lo
que R1–R4 y las tarjetas existentes ya computaron** — conviene hacerla **última**, cuando las demás
ya expongan sus números.

**Criterio de éxito.** La tira muestra una frase construida por reglas desde datos reales; cada
fragmento es trazable a un umbral sobre un número visible en otra tarjeta; ningún fragmento juzga
("bueno/malo") ni recomienda; se degrada omitiendo fragmentos sin dato (nunca inventa).

**Rollback.** `git revert <hash>` — bloque autocontenido.

**Encuadre (importante).** Se llama **"Síntesis del portafolio"**, no "Opinión IA". *Síntesis*
invita a resumir; *opinión* invita a aconsejar — y ahí es donde se mete en problemas. El home no da
recomendaciones de inversión; resume estado.

---

## Fuera del roadmap, hechos en la misma sesión (30-jul-2026)

Se dejan asentados porque tocaron el mismo archivo y conviven con estos commits:

- **Órdenes Manuales · Alpaca por defecto** (`3eb536d`). La sub-pestaña "Alpaca" (órdenes reales de
  la cuenta) pasa a ser la primera y la seleccionada al abrir; "Bitácora" (registro local) queda
  segunda. La bitácora suele estar vacía y confundía como pantalla de entrada. El arranque pasó a
  ir por `moSetSource(MO_SOURCE)` para que los filtros de estado y "+ Registrar orden" —que solo
  aplican a la bitácora— queden sincronizados desde el primer pintado.
- **Corrección de idioma a español neutro** (`540eb48`). Se coló voseo en textos de UI: el title
  del ⚠ de R3, la línea de conflicto del Pulso y un "acá" en P&L Realizado. Solo texto, 8 líneas.

## ⚠️ Regresión propia encontrada y corregida (`61868b3`)

Durante la investigación de R5 apareció un bug que **R2 había introducido y llevaba tres commits
desplegado**: el prefijo `phr*` ya era de **"Operados recientemente" (Paso 6)** —`phrAgoDays`,
`phrAgoTxt`, `phrBuild`, `phrRender`, y las clases `.phr-row/-sym/-pnl/…`— y R2 lo reutilizó sin
comprobar que estuviera libre.

- **`phrRender` quedaba declarada dos veces** (Paso 6 con `(r, nowMs)`; R2 sin argumentos). Son dos
  `function` de nivel superior en el mismo scope: **gana la última**. La llamada de Paso 6
  —`try{ phrRender(r); }catch(e){}`— ejecutaba la de R2, que ignora el argumento. Resultado:
  **"Operados recientemente" dejó de pintarse desde `388ffcf`**, y el `try/catch` puesto para
  aislarlo **se tragó el síntoma**: sin error en consola, sin pista visible.
- **`.phr-row` estaba definida dos veces**, así que las filas de Paso 6 heredaban el
  `align-items`/`gap`/`padding` de R2.

**Fix:** se renombró **lo de R2** a `phrisk*` / `.phrisk-*` (Paso 6 tiene el prefijo por antigüedad
y más superficie), verificando por hash que sus regiones quedaran byte-idénticas.

**Lección, y el harness que la fija.** `node --check` **no ve** una función redeclarada: es
JavaScript legal. Y el harness de R2 probaba su propia función aislada, sin preguntar si el nombre
ya existía. Se agregó un **harness anti-colisión** con dos chequeos —(1) ninguna función declarada
dos veces; (2) clases CSS con regla base duplicada en bloques separados, contra un *baseline* de los
12 overrides deliberados preexistentes— **validado contra el código con el bug**, donde reporta
`phrRender` y `.phr-row`. Es la misma lección de R1 en otro eje: allí se verificó el consumidor y no
el productor; aquí, la función propia y no el espacio de nombres ocupado.

**Antes de agregar una tarjeta nueva:** `grep -nE "^(function|const|let) <prefijo>"` y
`grep -nE "^\.<prefijo>"`. `index.html` es un archivo único sin módulos: todo comparte scope y
cascada.

## Pendientes que dejó esta tanda (fuera de alcance, para otro roadmap)

- **Escalas mezcladas en el libro de señales.** `GET /v1/papertrading/señales` devuelve `confianza`
  en puntos [30,95] y en probabilidad [0,1] dentro del mismo `job_date`, sin que la fila declare
  cuál (`_row()` no emite `motor_version`). Mientras siga así, **ningún consumidor del front
  debería leer `confianza` de ese endpoint** — es la razón por la que el ⚠ de R3 no la muestra.
  Es del libro/motor, no del home.
- **⚠️ VERIFICACIÓN VISUAL — pendiente, es lo único que falta del roadmap.** Todo está desplegado y
  con harness verdes, pero nadie lo ha revisado en el navegador. En una sola pasada:
  1. **R1** — `POSITIONS.map(p => p.change_today)` debe dar números, y en **escala de fracción**
     (`-0.0134`, no `-1.34`); si viniera en porcentaje, R1 necesita un ajuste de frontend.
  2. **Fix `61868b3`** — que **"Operados recientemente"** haya vuelto al panel izquierdo (estuvo
     muerto tres commits).
  3. **R2/R3** — el ⚠ en las posiciones en conflicto sin desalinear la columna del símbolo, el pie
     de cobertura sin romper el header a dos líneas, y el drawdown siguiendo al selector de rango.
  4. **R5** — que la frase entre en una línea y no empuje feo las tarjetas de abajo. Y lo que
     ningún harness puede juzgar: **si aporta o estorba**. Que sea verdadera, determinista y que no
     aconseje está probado; que valga la pena leerla cada vez es criterio de trader.

## Fuera de alcance (por ahora)

- Cualquier cosa que requiera **endpoints nuevos** o toque el **backend/motor/ejecutor**. Si un
  paso lo necesitara, se saca a su propio roadmap y se decide aparte.
  *(Excepción registrada: R1 necesitó una línea en la whitelist de `list_positions()` —capa de
  datos del broker, no el motor—. Se decidió explícitamente y se acotó a ese campo; ver R1.)*
- **Recomendaciones de inversión.** El home describe riesgo y estado; no dice "comprá/vendé". Las
  señales del modelo se muestran como lo que son (salida del sistema), no como consejo.
- Order entry / ejecución desde el home. Esto es un **cockpit de lectura**, no una mesa de órdenes.

## Notas de secuencia

Este roadmap es **independiente** del Roadmap Motor V3 (F7 → 5.C → 5.F → F8) y del ejecutor
(E5-C). Es capa de presentación del home; se puede intercalar en cualquier hueco sin bloquear ni
ser bloqueado por el motor. Prioridad frente al Motor V3: **decisión de founder** — el motor es el
corazón del producto; esto es pulido de cabina.
