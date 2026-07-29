# ROADMAP · Mejoras del Home "Portafolio" (SmartTrade)

**Repo objetivo:** `smarttrade-demo` · archivo único `index.html` (vista Portafolio).
**HEAD frontend (act. 30-jul-2026):** `74e265a` (`main` == `origin/main`, desplegado 30-jul). Cadena del home:
`493aafe` (S3 Pulso + drift) → `03debdc` (S3.5 señales conflict-first) →
`9b06cc4` (fix: panel inferior, frontera deslizable — arreglo del 30-jul sin registrar en su
momento) → `578520f` (Paso 6 · Operados recientemente) → `54d6b58` (fix decimales de confianza)
→ `74e265a` (Paso 6: excluye tickers ya vigilados).

**Estado (act. 30-jul-2026):** Pasos 1 · 2 · 3 · 3.5 ✅ desplegados en GitHub Pages.
**Paso 6 ✅ COMPLETADO** (3 commits: `578520f` + `54d6b58` + `74e265a`; **DESPLEGADO 30-jul en
GitHub Pages, verificado en producción**). **Pasos 4 y 5 EN PAUSA** por decisión de founder. Se
retoman en su sesión.

**Cadena completa del home:** `a545628` (S2 tarjeta) → `ef4a492` (S2 ventana 120d) →
`3e58e50` (S2 pin v3 + `pheFetch`) → `493aafe` (S3 Pulso + drift) → `03debdc`
(S3.5 señales conflict-first) → `9b06cc4` (fix frontera) → `578520f` (Paso 6).
**Regla del roadmap:** un objetivo por chat · un commit aislado por paso · nada toca
el motor de decisión (`MOTOR_V3`, `motor_flags`, predicado `usa_v3()`,
`data_fetcher.py`). Todos los pasos son **frontend puro** sobre endpoints de
lectura que ya existen. Ninguno interfiere con el flip de `MOTOR_V3` (F7 §5.B.2,
ventana lunes 27-jul).

**Antes de cada paso:** verificar HEAD de `smarttrade-demo`, aplicar el cambio,
validar (`node --check` sobre el JS inline), y NO desplegar sin confirmación.
Cada paso trae criterio de éxito verificable y rollback trivial (`git revert`).

---

## Paso 1 — Quitar el popup de hover del chart de valor  ✅ (aplicado)

- **Qué:** al pasar el cursor por la curva "VALOR DE LA CUENTA" aparecía un
  recuadro (`#ph-chart-tt`) + un punto (`#ph-chart-dot`). Se desactiva.
- **Cómo:** `phBindChartHover()` pasa a no-op (`return;`). No se toca
  `phPaintValueChart`, `PH_PTS`, ni el DOM. `phChartHover`/`phChartLeave` quedan
  definidas pero sin uso.
- **Endpoints:** ninguno. Frontend puro.
- **Criterio de éxito:** en el home, pasar el cursor por la gráfica no muestra
  ningún recuadro ni punto; el resto del home sigue igual. `node --check` verde.
- **Rollback:** `git revert <hash>`.

---

## Paso 2 — Tarjeta "Eficiencia del modelo" (señal + forecast)  ✅ (commit `a545628`)

- **Qué:** tarjeta en el home con dos números accionables y una mini-curva cada
  uno: (a) **acierto de señal** (win-rate agregado) y (b) **calibración de
  forecast** (% de precios dentro de [p10,p90], objetivo 80%).
- **Endpoints (ya existen, solo lectura):**
  - `POST /v1/backtest/recompute` → por horizonte 1D/3D/7D: `{buy,sell,total}`
    con `win_rate`, `retorno_promedio` (expectancy) + `curva_equity`.
  - `POST /v1/backtest/forecast` → por horizonte: `cobertura_80`, `sesgo_p50`,
    `mae_p50`, `ancho_medio_pct`, `pinball` + histograma `pit`.
- **✅ Hecho (25-jul · `a545628`, solo `index.html`):** tarjeta `#phe-card`
  **después de Posiciones**; win-rate coloreado por **expectancy** + sparkline de
  `curva_equity`; `cobertura_80` con **delta-vs-80** + **PIT** (guía 10/40/40/10);
  toggle **1D/3D/7D** (default 3D, una llamada por endpoint); **motor vivo
  por-respuesta** (`pheMotorVivo`→`confMotor`, default v2, chip solo v3); **forecast
  v3 → 422 → degrada solo su mitad** con el `detail` real; **fetch one-shot con TTL**
  (5 min) fuera del hot-path; estados vacíos honestos. **+231 líneas, 0 borrados.**
  - **FIX post-deploy `ef4a492`:** acotada la ventana a 120 días (`desde`) — el
    recompute del libro entero disparaba timeout del gateway.
  - **Causa raíz en BACKEND `da17d73`:** los returns de `backtest` devolvían NaN/inf
    (yfinance) que Starlette rechaza → 500 sin CORS. Saneados con `_json_safe`.
  - `3e58e50`: pin v3 + `pheFetch` robusto (timeout + errores).
- **Pin de motor:** `PHE_MOTOR_PREF = 'v3'` (candidato F7; v2 no muestra edge). Solo
  elige el scorer del backtest de LECTURA; NO toca el ruteo del flip.
- **Rollback:** `git revert a545628` (bloque autocontenido).

---

## Paso 3 — Tarjeta "Pulso del modelo hoy" + drift  ✅ (commit `493aafe`)

- **Qué:** señales del último cierre, P&L de la estrategia en el período, y una
  alerta de **drift** (vivo vs. backtest).
- **Endpoints (ya existen, solo lectura):**
  - `GET /v1/papertrading/señales` → señales del libro; se toma el **último
    `job_date`** presente (rotulado), no un "hoy" literal (el job corre 23:00 UTC).
  - `GET /v1/strategies` → estrategia activa (`live` primero, si no la `paper` más
    nueva) con `retorno_pct` (P&L del período).
  - `GET /v1/strategies/{sid}/efectividad` → win-rate vivo + `motor_version`
    derivado de la muestra.
  - `POST /v1/backtest/recompute` → win-rate del backtest.
- **Decisión de motor del drift (crítica, resuelta):** el drift **NO hereda** el pin
  v3 del Paso 2. Empareja el `scorer` del recompute al `motor_version` que declara
  la muestra viva: **v2↔v2 hoy, v3↔v3 tras el flip**, muestra mixta (`v2+v3`) ⇒
  **"no comparable"** (N/A). A prueba del flip con cero cambios de código; nunca
  compara motores distintos en silencio. Reusa el patrón `pheFetch`, NO el
  `PHE_STATE.rc` cacheado (v3/ambos).
- **Umbral:** `PHD_DRIFT_UMBRAL_PTS = 10` (visible/editable), gateado por `n` mínimo
  (`PHD_N_MIN = 30`): por debajo → estado gris "indicativo — sin veredicto".
  Δexpectancy como línea secundaria.
- **✅ Hecho (27-jul · `493aafe`, solo `index.html`):** card `#phd-card` después de
  `#phe-card`; tres zonas (señales / P&L / drift verde-ámbar-gris); one-shot TTL
  fuera del hot-path; 4 lecturas, cero escrituras. `node --check` verde; harness DOM
  en 11 estados. **+270 líneas, 0 borrados.** `MOTOR_V3`/`motor_flags`/`usa_v3()`/
  `data_fetcher` sin tocar.
- **Nota honesta (esperada en prod):** con el bloqueo E5-C (los `confianza_min` de
  las estrategias en escala vieja de puntos), la efectividad viva lee
  `disponible:false` → **drift N/A** mostrando el motivo real. Es el degradado
  correcto; se enciende solo cuando el founder re-fije el umbral en [0,1]
  (post-flip, dentro de E5-C — no lo toca este roadmap).
- **Rollback:** `git revert 493aafe`.

### Paso 3.5 — Señales conflict-first cruzadas contra la cartera  ✅ (commit `03debdc`)

- **Motivo:** el libro de `/señales` es un **universo de investigación
  multi-mercado** (US + BVC Colombia, sembrado a propósito en `universe_tickers`
  con `mercado='BVC'`); la cuenta Alpaca es **solo US**. Mostrar "7 SELL" de tickers
  `.CL` que no se pueden operar por Alpaca, al lado de un portafolio US, engañaba.
  **No es bug del backend: es un problema de presentación.**
- **Qué (solo la zona de señales de `#phd-card`):** cruce señal↔posición contra
  `POSITIONS` (ya cargado por el home, sin fetch nuevo). **Titular = conflictos:**
  número = posiciones con señal contra tu dirección (largo+SELL / corto+BUY); cero →
  verde ("el modelo no contradice tus posiciones"), ≥1 → ámbar con la línea gorda
  (ticker + señal + **P&L no realizado de esa posición**, que es lo accionable).
  **Confirmaciones y resto del libro → pie de página gris**, sin protagonismo (las
  BVC quedan como conteo por mercado: "N de investigación (BVC N)"). Helper
  `phdMercado()` por sufijo (`.CL`→BVC, sin punto→US).
- **Decisión de trader:** no se premia la confirmación "refuerza tu largo" en verde
  (sesgo de promediar a la baja); va gris. El resto-del-libro BVC (no operable,
  datos ralos de yfinance) se degrada, no se lista.
- **✅ Hecho (27-jul · `03debdc`, solo `index.html`):** `node --check` verde; harness
  DOM en 7 estados (conflicto largo/corto, confirmación, sin conflicto, sin cartera,
  job no corrido, señales nulas). **+75 / −17** (reescritura de la zona de señales +
  helper + 2 clases CSS). Motor/estrategias/drift/P&L/fetch **intactos**.
- **Verificado en prod:** el 26-jul lee *"0 · el modelo no contradice tus posiciones
  hoy · Ninguna de tus 5 posiciones tiene señal de salida · 7 de investigación
  (BVC 7)"*. Correcto.
- **Rollback:** `git revert 03debdc`.
- **Pregunta de fondo que la card ahora expone (no es tarea de frontend):** el modelo
  tiene convicción en BVC y silencio en los US large-caps que se operan. ¿Se opera el
  universo donde el modelo aporta? Queda planteado para una sesión de estrategia/datos.

---

## Paso 4 — Mini calendario macro (CPI/FOMC/earnings)  ⏸️ EN PAUSA (27-jul)

- **Qué:** próximos eventos de la semana filtrados a los tickers del portafolio,
  por su impacto en el riesgo del día.
- **Endpoint (ya existe y ya está cableado en el front):**
  `GET /v1/strategies/calendar/events?tickers=<mis tickers>&dias=7` →
  `{eventos:[{tipo,ticker,fecha,dias_restantes,impacto,descripcion}]}`.
- **Clasificación:** frontend puro. Es el paso más barato; puede adelantarse.
- **Criterio de éxito:** lista compacta ordenada por fecha, con badge de impacto
  y días restantes; tickers tomados del portafolio actual.
- **Rollback:** `git revert <hash>`.
- **Estado:** dejado en pausa por pivote al roadmap Motor V3. Retomar en su sesión.

---

## Paso 5 — "Noticias de mis posiciones"  ⏸️ EN PAUSA (27-jul)

- **Qué:** feed filtrado a mis tickers (titulares recientes + sentimiento), no
  genérico.
- **Endpoint (ya existe, solo lectura):** `GET /v1/context/{ticker}` →
  `noticias.titulares_recientes[]` (`titulo,fuente,url,fecha,resumen`) +
  `sentimiento_score`. Complementar con `GET /v1/alerts?ticker=…`.
- **Clasificación:** frontend puro, con un **fan-out**: una llamada a `/context`
  por ticker. Cachea 24h y hay AV premium (75 req/min); conviene límite de
  concurrencia y estado de carga por ticker.
- **Criterio de éxito:** feed agrupado por ticker, con carga progresiva y estado
  vacío honesto por ticker; sin bloquear el render del home.
- **Rollback:** `git revert <hash>`.
- **Estado:** dejado en pausa por pivote al roadmap Motor V3. Retomar en su sesión.

---

## Paso 6 — "Operados recientemente" (panel izquierdo, bajo el Watchlist)  ✅ COMPLETADO Y DESPLEGADO (`578520f` + `54d6b58` + `74e265a`)

- **Motivo:** al cerrarse AAPL por TP (primer round-trip del sistema, 29-jul), salió del
  portafolio y no quedó a la vista (Watchlist ≠ posiciones). Un ticker recién operado suele
  querer seguirse; automáticamente al Watchlist lo saturaría. Esta lista **aparte, con TTL**,
  es la solución curada.
- **Qué se hizo:** sección **bajo el Watchlist** (panel izquierdo) con round-trips **cerrados**
  en los **últimos N=8 dentro de X=7 días** (ambas condiciones; constantes `RECIENTES_N_MAX`/
  `RECIENTES_DIAS` editables). Cada ítem: ticker + P&L coloreado + botón "＋ Watchlist" (reusa
  `wlsAdd`; oculto si ya está en Watchlist o si hay posición abierta → muestra "Ya en lista" /
  "Posición abierta"). **Dedupe por ticker** (fila = cierre más reciente; "×N" = nº de cierres
  distintos, agrupados por `exitIso`). **Estado vacío → oculta la sección entera.**
- **Fuente de datos:** reusa `.trips` del P&L Realizado (Journal), ya calculado client-side.
  **Cero backend.** Filtra por ventana, agrupa por cierre, dedup por ticker, ordena, corta en N.
- **Enganche:** 1 línea `try{ phrRender(r); }catch(e){}` al inicio de `renderRealizedPnL` —
  aislado: si `phrRender` falla, el P&L Realizado sigue intacto.
- **Radio:** `578520f` = **solo `index.html`, +150 líneas, 0 borradas.** CSS `.phr-*` (17) +
  HTML 3 nodos (10) + JS `phrBuild`/`phrRender`/`phrAgo*` + constantes (122) + enganche (1).
- **Verificación:** `node --check` verde en los 4 bloques. **Harness 51/51** en 9 estados
  (los 6 del roadmap + pnlPct nulo + lotes-mismo-cierre + aislamiento del enganche).
  **No-regresión por SHA-256:** `calculateRealizedPnL` y 11 funciones reusadas
  **byte-idénticas**; solo `renderRealizedPnL` cambió (+1 línea). 0 sorpresas.
- **Evidencia:** en `scratchpad` — `resultado_harness.txt`, `correcciones_harness.txt`,
  `verificacion_noregresion.txt`, `harness_p6.js`, `verifica_noregresion.js`.
- **Rollback:** `git revert 578520f`.
- **⚠️ Cambios posteriores (30-jul, misma sesión):**
  - **`54d6b58` — fix decimales de confianza.** La confianza salía como `43.419999999999995%`
    (float crudo de `confPct` v3) en watchlist (`renderWatchlist` L5897) y portafolio (`fillRow`
    L5430). Se pasa por `fmtConfPct` (Math.round), que ya existía y ya se usaba en el panel
    derecho. Solo el texto; la barra (`width:${conf}%`) y `confColor` sin tocar. +2/−2.
  - **`74e265a` — excluye tickers ya vigilados.** `phrBuild` ahora filtra los que están en
    `WATCHLIST` o son posición abierta (`TICKERS`) ANTES del corte a N. La sección muestra solo
    los "sueltos" (los que salieron del portafolio y podrían perderse de vista); si un ticker
    cerrado ya está vigilado, se excluye; si todos lo están, la sección se oculta. Filtrar→cortar,
    sin ensanchar la ventana. `phr-in` queda como defensa inerte (documentado). Harness Estado 2
    reescrito para verificar EXCLUSIÓN: **59/59** (antes 51, +8 aserciones — endurecido). +12/−1.
    **Nota:** esto hace la spec original ("botón oculto si ya está en watchlist") obsoleta — ahora
    el ticker ni siquiera aparece.
- **✅ CERRADO:** (1) **desplegado y verificado en vivo 30-jul** (badge 2, el filtro actúa, la
  confianza sale `43%`) — push de los 3 commits a `origin/main` + GitHub Pages; (2) **prueba de
  humo en navegador real HECHA** — el harness (59/59) cubría la lógica; en producción se confirmó
  el render: la sección aparece con su P&L, el filtro de vigilados excluye de verdad, y la
  confianza ya no muestra decimales sucios en watchlist ni portafolio; (3) **versionar este
  `ROADMAP_HOME_PORTAFOLIO.md`** — en curso con este mismo commit (deja de estar untracked).

---

## Orden recomendado y por qué

1. **Paso 1** ✅ — limpieza rápida, cero riesgo.
2. **Paso 2** ✅ — mayor palanca (qué tan bueno es el modelo).
3. **Paso 3** ✅ — reusa el Paso 2; el drift cae casi de regalo.
4. **Paso 3.5** ✅ — refinamiento de trader: señales relativas a lo que operás.
5. **Paso 6** ✅ — Operados recientemente (desplegado: `578520f` + `54d6b58` + `74e265a`). Frontend
   puro, cero backend. Ojo: `74e265a` cambia el **comportamiento visible** respecto de la spec
   original — un ticker ya vigilado (Watchlist o posición abierta) **ya no aparece** en la lista,
   en vez de aparecer con la marca "Ya en lista" / "Posición abierta".
6. **Paso 4** ⏸️ — barato; slot flexible (endpoint ya cableado). **Siguiente candidato.**
7. **Paso 5** ⏸️ — valor medio, algo más de plomería (fan-out).

## Guardrail permanente (flip de MOTOR_V3)

Todos los pasos son `smarttrade-demo`/`index.html`, frontend puro, sobre
endpoints de lectura. No tocan el motor, `motor_flags`, `usa_v3()` ni
`data_fetcher.py`, y por tanto **no interfieren con el flip del lunes 27-jul**.
La única dependencia del motor es de *lectura*: la tarjeta de Eficiencia (Paso 2)
muestra el `motor_version` vivo y degrada el forecast v3 (422); el drift (Paso 3)
empareja el scorer al motor de la muestra viva.
