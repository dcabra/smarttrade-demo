# MAPA DE IMPACTO EN LA INTERFAZ — Fase 0 · Paso 1

Solo lectura y análisis sobre `index.html` (archivo único, ~13.546 líneas). No se modificó el código.

**Objetivo del giro.** Pasar de "autotrading que predice y opera" a un "cockpit personal honesto": mide riesgo, analiza con IA, muestra información.

**Reglas aplicadas al clasificar:**
- La **señal** y el **forecast de dirección** se quedan como INFORMACIÓN ("esto es lo que ve el modelo"), sin promesa de acertar ni de ganarle al mercado → casi siempre **SE RE-ETIQUETA**.
- Se **AÑADE**: estado de régimen + exposición recomendada; rango de volatilidad (GARCH) como el "forecast" honesto; y más adelante, Analista de IA por acción (ampliación de R6).
- **Motor y estrategias** (automatización, backtest, win-rate del motor) → **SE DEGRADA** a "laboratorio de investigación", fuera del flujo principal. No se borran.
- No se opera automáticamente; "tú ejecutas". No se toca el ejecutor ni las órdenes manuales.

Categorías: **QUEDA** (sin cambios) · **RE-ETIQUETA** (mismo componente, cambia texto/encuadre) · **DEGRADA** (se mueve al laboratorio) · **AÑADE** (componente nuevo).
Esfuerzo: **trivial** (solo texto) · **medio** (texto + lógica) · **mayor** (componente nuevo / backend).

---

## Tabla resumen

| # | Componente | Vista | Categoría | Esfuerzo |
|---|---|---|---|---|
| 1 | Topbar: refresco, modo trading, chip mercado, pausa, cuenta/broker, usermenu | global | QUEDA | — |
| 2 | Chip de régimen `#regimen-chip` (hoy: correlación / risk-on·off) | topbar | RE-ETIQUETA + ancla de AÑADE | medio |
| 3 | Tira de noticias `#news-ticker` (incluye "mejor señal del portafolio") | topbar | RE-ETIQUETA | trivial |
| 4 | Botón/banner HALT | topbar | QUEDA | — |
| 5 | Entrada "Backtest" del usermenu | topbar | DEGRADA | trivial |
| 6 | Portafolio izq: equity, efectivo, P&L, posiciones | izq | QUEDA | — |
| 7 | Watchlist (filas con señal/conf/SL/TP/forecast 3D) | izq | RE-ETIQUETA | medio |
| 8 | Operados recientemente | izq | QUEDA | — |
| 9 | Gráfica: tipos, indicadores, osciladores, SL/TP, período, volumen | centro | QUEDA | — |
| 10 | Capa "📍 Señales" + "◤ Forecast" (cono p10–p50–p90) | centro | RE-ETIQUETA | trivial |
| 11 | Panel ROI backtest sobre la gráfica `#roi-panel` | centro | DEGRADA | medio |
| 12 | Home: KPIs, nota BP, Movimiento de hoy, Cartera/dona, tabla holdings | home | QUEDA | — |
| 13 | Síntesis IA del portafolio `#phia-wrap` (R5 + R6) | home | RE-ETIQUETA | medio |
| 14 | Tarjeta "Valor de la cuenta" vs SPY | home | QUEDA (encuadre neutral) | trivial |
| 15 | **Tarjeta "Eficiencia del modelo"** `#phe-card` (win-rate / acierto) | home | RE-ETIQUETA | medio |
| 16 | Tarjeta "Pulso del modelo hoy" `#phd-card` (señales + drift) | home | RE-ETIQUETA | medio |
| 17 | Tarjeta "Próximos eventos" `#phcal-card` | home | QUEDA | — |
| 18 | Tarjeta "Noticias de mis tickers" `#phnews-card` | home | QUEDA | — |
| 19 | Panel "Riesgo · exposición" `#phrisk` | home | QUEDA + ancla de AÑADE | medio |
| 20 | Panel derecho: precio, "Tu posición", SL/TP, botón orden | ticker | QUEDA | — |
| 21 | Tarjeta "Señal IA" `.rp-sec-sig` (BUY/SELL/HOLD, confianza, síntesis) | ticker | RE-ETIQUETA | medio |
| 22 | Tarjeta "Forecast IA" `.rp-fc-grid` (dirección 1D/3D/7D p50, p10–p90) | ticker | RE-ETIQUETA + ancla de AÑADE | medio |
| 23 | Tarjeta "Desempeño del modelo · {ticker}" `#rp-model-perf` (win-rate, ROI backtest) | ticker | RE-ETIQUETA + DEGRADA (parte backtest) | medio |
| 24 | Pestaña Consulta IA (chat) | tab | QUEDA | — |
| 25 | Pestaña Alertas (+ texto "predicción del modelo") | tab | RE-ETIQUETA | trivial |
| 26 | Pestaña Órdenes manuales + modal de orden Alpaca | tab | QUEDA | — |
| 27 | **Pestaña Estrategias completa** (lista, exposición combinada, detalle live/def/log, modal) | tab | DEGRADA | mayor |
| 28 | Pestaña Mercado (noticias + macro FRED) | tab | QUEDA | — |
| 29 | Pestaña Noticias del ticker (noticias, sentimiento, micro, fundamentales) | tab | QUEDA | — |
| 30 | Pestaña Calendario (eventos + pausas) | tab | QUEDA | — |
| 31 | Pestaña Journal (+ agregado "Win Rate") | tab | RE-ETIQUETA | medio |
| 32 | Modal Backtest (`backtest.html`, pestaña aparte) | global | DEGRADA | medio |
| 33 | **Estado de régimen + exposición recomendada** | home/topbar | AÑADE | mayor |
| 34 | **Rango de volatilidad (GARCH)** como forecast honesto | ticker/watchlist | AÑADE | mayor |
| 35 | **Analista de IA por acción** (ampliación R6) | ticker | AÑADE | mayor |

---

## Detalle por componente

### Se quedan sin cambios (QUEDA)

Son la columna vertebral del cockpit informativo: estado de cuenta, datos de mercado, gráfica, noticias, calendario y ejecución manual. Nada de esto promete acertar.

- **Topbar operativa** (L1604–1670): refresco, modo de trading (Swing/Intradía/Scalping), chip de mercado abierto/cerrado, chip de pausa, chip de cuenta/broker Alpaca, menú de usuario. El modo de trading solo fija el timeframe de lo que se muestra.
- **HALT** (botón L1632, banner L1672): freno de órdenes; sigue siendo útil porque las órdenes manuales y de laboratorio pueden ir a Alpaca.
- **Portafolio izquierdo** (L1684–1742): equity, efectivo, P&L realizado, lista de posiciones, operados recientemente.
- **Gráfica central** (L1749–1834): tipos de gráfico, indicadores, osciladores (RSI/MACD/ATR), toggle SL/TP, período, volumen.
- **Home — bloques de estado** (L1840–1988): KPIs del portafolio, nota de poder de compra, "Movimiento de hoy", "Próximos eventos", "Noticias de mis tickers", dona de asignación/concentración, tabla de holdings.
- **Tarjeta "Valor de la cuenta"** (L1878, render L12072): curva de equity vs SPY. Se queda, pero el encuadre debe ser comparación neutral, no "le ganamos al SPY" (ver §3).
- **Panel derecho — datos duros** (L4906–5024): precio/frescura, "Tu posición", tarjeta SL/TP editable con R/B, botón "Orden manual".
- **Pestañas informativas**: Consulta IA (chat, L2300), Órdenes manuales + modal de orden Alpaca (L2446, L2071), Mercado (noticias + macro FRED, L2387), Noticias del ticker (L2409), Calendario + pausas (L2341).
- **Modales de servicio**: login, cambiar contraseña, configuración (salvo la entrada Backtest), buscar tickers de watchlist, HALT, orden Alpaca, registro de bitácora.

### Se re-etiquetan (RE-ETIQUETA)

Se quedan en el flujo principal, pero el texto/encuadre cambia para quitar la promesa de acierto y presentar la señal y el forecast como "lo que ve el modelo".

- **Chip de régimen `#regimen-chip`** (L1624, lógica L6049): hoy muestra correlación alta y risk-on/off del motor. Se re-etiqueta y se convierte en el ancla visible del nuevo "estado de régimen + exposición" (§4). Medio.
- **Tira de noticias** (L1628, render L7203): incluye "mejor señal del portafolio"; reformular a "señal destacada (información)". Trivial.
- **Watchlist** (L1714, render L6250): cada fila trae señal/confianza/SL/TP/forecast 3D. Mantener como información; quitar cualquier lectura de "probabilidad de ganar"; es también el segundo sitio natural para el rango de volatilidad (§4). Medio.
- **Capa "Señales" + "Forecast"** sobre la gráfica (L1788): el cono p10–p50–p90 es ya el forecast honesto; solo ajustar etiquetas para que no se lean como objetivo de precio. Trivial.
- **Síntesis IA del portafolio `#phia-wrap`** (L1869, render L11217 + prosa IA ~L13320): es análisis con IA, encaja con el giro; revisar que la prosa no prometa rendimiento. Medio.
- **Tarjeta "Eficiencia del modelo" `#phe-card`** (L1911, render `pheRender` L10434): hoy es el win-rate/efectividad del scorer v3 (recompute 120d). Es el componente que más promete. Reencuadrar de "eficiencia/acierto" a "cómo se ha comportado la señal / calibración", con muestra y fechas, sin leerse como garantía. Alternativa a evaluar: moverla entera al laboratorio. Medio.
- **Tarjeta "Pulso del modelo hoy" `#phd-card`** (L1930, render L10788): señales del día + conflictos señal↔posición se quedan como información; el "drift" (win-rate vivo − backtest) es métrica de investigación y debería irse al laboratorio. Medio.
- **Tarjeta "Señal IA" (panel derecho)** (L4943, `buildRP` L4877, `motorBadge` L5691): pill BUY/SELL/HOLD + confianza + síntesis + factores. Mantener como lectura del modelo; quitar el tono de recomendación. El badge v2/v3 es detalle de motor (candidato a nota discreta). Medio.
- **Tarjeta "Forecast IA" (panel derecho)** (L4964): dirección 1D/3D/7D con p50 y rango p10–p90. Es el forecast honesto por excelencia; reformular encabezado a "lo que proyecta el modelo (sin garantía)" y usarla como ancla del rango de volatilidad GARCH (§4). Medio.
- **Tarjeta "Desempeño del modelo · {ticker}" `#rp-model-perf`** (L5004, render `rpLoadModelPerf` L5056): win-rate + sparkline ROI (paper M6 / backtest M5) por ticker. Reencuadrar el win-rate; la parte de ROI de backtest DEGRADA al laboratorio. Medio.
- **Pestaña Alertas** (L2319, render L7577; modal L7688): el cambio de señal se presenta como información; reescribir el texto "Esto es una predicción del modelo" (§3). Trivial.
- **Pestaña Journal** (L2486, agregados L4026): el journal de operaciones se queda; el agregado "Win Rate" se reencuadra o se mueve a métrica de laboratorio. Medio.

### Se degradan al laboratorio (DEGRADA)

Es la automatización y la evaluación del motor: fuera del flujo principal, agrupadas en una sección "Laboratorio de investigación". No se borran.

- **Pestaña Estrategias completa** (L2468): panel de exposición combinada (L2469, render L9167), lista de estrategias (L2471, L9202), detalle con sub-pestañas En vivo / Definición / Bitácora (L9257–9394), efectividad mini (L9536), curva (L9555), y el modal de crear/editar estrategia (L8814, form L9648). Toda esta pestaña implementa el "autotrading que predice y opera"; es el corazón de lo que se degrada. El botón "avanzar ciclo" y el monitor "En vivo" dejan de estar en el flujo principal. Mayor.
- **Panel ROI de backtest sobre la gráfica `#roi-panel`** (L1817): overlay de curva de backtest; al laboratorio. Medio.
- **Backtest** (entrada de usermenu + `backtest.html` por handoff localStorage, `openBacktest` L2684): es una vista separada; su acceso baja al laboratorio. Medio (reubicar el acceso; la vista vive en otro archivo, fuera del alcance de este mapa).
- **Métricas de "drift" y win-rate del motor** embebidas en las tarjetas del home y del panel derecho (las partes señaladas en §RE-ETIQUETA): su versión numérica de evaluación va al laboratorio; en el home queda solo la lectura informativa.

### Se añaden (AÑADE)

- **Estado de régimen + exposición recomendada** (nuevo): régimen SPY sobre/bajo su media de 200 → exposición recomendada (p. ej. 50 % en risk-off), más el régimen de tendencia/rango. Mayor: necesita endpoint de backend (régimen + exposición) y un componente nuevo. Ubicación en §4.
- **Rango de volatilidad (GARCH)** (nuevo): el "forecast honesto" de cuánto puede moverse el activo, como banda, junto al forecast de dirección. Mayor si incluye backend GARCH; medio si solo consume un valor ya calculado. Ubicación en §4.
- **Analista de IA por acción** (nuevo, ampliación de R6): análisis cualitativo por ticker bajo demanda, dentro del detalle del ticker. Mayor. Ubicación en §4.

---

## 3 · Texto que promete predicción / acierto / ganar (lista literal para reescribir)

Ubicación por línea aproximada en `index.html`. El pie de disclaimer y las notas "resultados pasados no garantizan resultados futuros" ya son honestos y se mantienen; se listan solo como referencia de dónde vive el encuadre.

| Línea | Texto literal (abreviado) | Dónde | Reescritura sugerida |
|---|---|---|---|
| 5076 | `title="Señales acertadas / evaluadas"` · `✦ {winRate}% · {n} señales` | Desempeño del modelo (panel der.) | "señales evaluadas (histórico, no es promesa)"; quitar "acertadas" como métrica de acierto |
| 5129 | "El modelo **predice** — esto NO constituye consejo de inversión…" | Panel forecast maximizado | "El modelo **proyecta / estima** — información, no consejo" |
| 5179 | "**Efectividad** etiquetada por origen (paper real / backtest simulado)…" | Nota de termómetro | reencuadrar "Efectividad" → "Comportamiento histórico de la señal" |
| 7704 | "Esto es una **predicción** del modelo, no una recomendación de inversión." | Modal de alerta (`alx-why`) | "Esto es lo que **ve** el modelo; información, no recomendación" |
| 10468–10493 | `phe-lbl` "**Acierto de señal**" + hero `{win_rate}%` + unidad "**win-rate**" | Tarjeta "Eficiencia del modelo" (home) | reencuadrar a "Comportamiento de la señal" / "Calibración"; quitar "acierto" y "win-rate" como promesa |
| 10521–10536 | `phe-lbl` "**Calibración del forecast**" | Tarjeta "Eficiencia del modelo" (home) | "calibración" ya es honesto; conservar, revisar el copy de apoyo |
| 1911 (título) | Encabezado "**Eficiencia del modelo**" | Tarjeta home `#phe-card` | retitular (p. ej. "Comportamiento del modelo") |
| 4053 | Etiqueta "**Win Rate**" | Journal, agregados | reencuadrar o mover a laboratorio |
| 8439 | "**win-rate** {x}% ({n} señales)" | Estrategias (fila) | al laboratorio con el resto de Estrategias |
| 9223 | `title="Efectividad histórica: señales acertadas / evaluadas"` · `✦ {win_rate}%` | Estrategias (ítem) | al laboratorio |
| 9286 | "**Efectividad histórica**" | Detalle de estrategia | al laboratorio |
| 9550 | "**Win rate** {x}%" | Detalle de estrategia | al laboratorio |
| 9653 | placeholder "…**probabilidad mínima de acierto** 0.70…" | Modal crear estrategia | al laboratorio |
| 9679 | "**probabilidad mínima de acierto** de la señal IA" | Modal crear estrategia (ayuda) | al laboratorio |
| 9931 | campo "**Probabilidad mín. de acierto**" | Modal crear estrategia | al laboratorio |
| 7203 (ticker) | "**mejor señal** del portafolio" | Tira de noticias | "señal destacada (información)" |
| 1878/12072 | Curva "**vs SPY**" | Tarjeta Valor de la cuenta | encuadre de comparación neutral, no "batir al SPY" |

Notas honestas sobre lo que **no** hay que tocar en este paso: el pie global "SmartTrade es una herramienta de análisis con IA · NO constituye consejo de inversión…" (L2004) y los avisos "Resultados pasados no garantizan resultados futuros" (L5129, L5179) ya cumplen el encuadre honesto; sirven de plantilla para el copy nuevo.

---

## 4 · Dónde encajan los componentes nuevos (sin romper el layout)

- **Estado de régimen + exposición recomendada.** Dos sitios naturales, idealmente ambos:
  1. **Topbar `#regimen-chip`** (L1624): hoy ya muestra risk-on/off y correlación; ampliarlo a un chip "Régimen: alcista · exposición sugerida 100 %" / "bajista · 50 %". Compacto, ya existe el hueco.
  2. **Panel "Riesgo · exposición" del home `#phrisk`** (L1987, render L11477): ya muestra % cash/invertido y mayor exposición; añadir ahí una fila/tarjeta "Exposición recomendada por régimen vs tu exposición actual". Es el lugar conceptualmente correcto y no desplaza nada.

- **Rango de volatilidad (GARCH).** Junto al forecast de dirección, que ya es una rejilla por horizonte:
  1. **Tarjeta "Forecast IA" del panel derecho `.rp-fc-grid`** (L4964): añadir una fila/columna "rango de volatilidad esperado (±X %)" al lado de p10–p90 de dirección. Mismo contenedor, mismo patrón visual.
  2. **Filas de la watchlist** (render L6250): añadir una banda de volatilidad compacta por ticker, junto al forecast 3D.

- **Analista de IA por acción (ampliación R6).** En el **detalle del ticker (panel derecho, `buildRP` L4877)**, como tarjeta nueva bajo "Señal IA"/"Forecast IA", o como acción que abre el chat de **Consulta IA** (L2300) ya contextualizado al ticker activo. Reutiliza el revestimiento IA que ya existe para la síntesis del portafolio (`phiaDetalleHTML` ~L13320), por lo que el patrón de carga diferida y verificación ya está en la casa.

---

## 5 · Esfuerzo (resumen)

- **Trivial (solo texto):** reescrituras de §3 que no tocan lógica — tira de noticias, capa de forecast de la gráfica, texto de alerta, entrada Backtest del menú, encuadre "vs SPY".
- **Medio (texto + lógica):** chip de régimen re-etiquetado, watchlist, síntesis IA del portafolio, tarjetas "Eficiencia del modelo", "Pulso del modelo", "Señal IA", "Forecast IA", "Desempeño del modelo", Journal, panel ROI backtest (ocultar/mover), panel de riesgo ampliado, acceso a Backtest.
- **Mayor (componente nuevo / backend):** degradar toda la pestaña Estrategias a laboratorio; estado de régimen + exposición recomendada; rango de volatilidad GARCH; Analista de IA por acción.

**No se toca** el ejecutor, las órdenes manuales ni Alpaca; no se opera automáticamente. La pestaña Estrategias y el backtest no se borran: se agrupan bajo "Laboratorio de investigación".
