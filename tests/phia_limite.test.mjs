// SmartTrade · frontend · prueba de la guarda "límite" del filtro anti-consejo.
// ─────────────────────────────────────────────────────────────────────────────
// El frontend es HTML puro (sin build ni framework de pruebas). Esta prueba EXTRAE
// las funciones reales de index.html (no las copia) y las evalúa en un sandbox vm,
// para que verifique el código vivo. Gemela de tests/test_m14_payload.py (backend):
// "límite" sustantivo con determinante PASA; imperativo de limitar sin artículo MARCA.
//
// Correr:  node tests/phia_limite.test.mjs   (exit 0 = verde)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');

// ── Extractores (conteo de llaves/paréntesis sobre el fuente real) ────────────
function grabFunction(name) {
  const m = new RegExp('function\\s+' + name + '\\s*\\(').exec(html);
  if (!m) throw new Error('no se encontró function ' + name);
  let depth = 0, started = false;
  for (let j = html.indexOf('{', m.index); j < html.length; j++) {
    const c = html[j];
    if (c === '{') { depth++; started = true; }
    else if (c === '}') { depth--; if (started && depth === 0) return html.slice(m.index, j + 1); }
  }
  throw new Error('no se cerró function ' + name);
}
function grabConst(name) {
  const m = new RegExp('const\\s+' + name + '\\b').exec(html);
  if (!m) throw new Error('no se encontró const ' + name);
  let depth = 0;
  for (let j = html.indexOf('=', m.index); j < html.length; j++) {
    const c = html[j];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ';' && depth === 0) return html.slice(m.index, j + 1);
  }
  throw new Error('no se cerró const ' + name);
}

const fuente = [
  grabFunction('phiaEscRe'),
  grabFunction('phiaSinAcentos'),
  grabFunction('phiaNormTexto'),
  grabFunction('phiaHallaAlguno'),
  grabConst('PHIA_IMPERATIVOS'),
  grabConst('PHIA_JUICIO'),
  grabConst('PHIA_VOSEO'),
  grabConst('PHIA_DETERMINANTES'),
  grabConst('PHIA_RE_LIMITAR'),
  grabFunction('phiaEsImperativoLimitar'),
  grabFunction('phiaVerifLing'),
  // Vetos de dirección/atribución dependen del payload; con payload undefined no
  // aplican. Se sustituyen por no-ops para aislar la barrera pura de listas+guarda.
  'function phiaVetoDireccion(){ return false; }',
  'function phiaVetoAtribucion(){ return false; }',
  'globalThis.__x = { phiaVerifLing, phiaEsImperativoLimitar, PHIA_IMPERATIVOS };',
].join('\n');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fuente, ctx);
const { phiaVerifLing, PHIA_IMPERATIVOS } = ctx.__x;

// ── Aserciones (espejo del backend) ───────────────────────────────────────────
let fallos = 0;
function check(desc, cond) {
  if (cond) { console.log('  ok  ', desc); }
  else { console.error('  FAIL', desc); fallos++; }
}

// 0 · 'limita'/'limite' ya NO están en la lista genérica de imperativos.
check("PHIA_IMPERATIVOS sin 'limita'/'limite'",
  !PHIA_IMPERATIVOS.includes('limita') && !PHIA_IMPERATIVOS.includes('limite'));

// 1 · Sustantivo con determinante delante → PASA (true).
check('"El límite del 15 % por acción no se supera." PASA',
  phiaVerifLing('El límite del 15 % por acción no se supera.') === true);
check('"La posición está cerca del límite." PASA',
  phiaVerifLing('La posición está cerca del límite.') === true);
check('"Su límite por acción es del 15 %." PASA',
  phiaVerifLing('Su límite por acción es del 15 %.') === true);

// 2 · Imperativo de limitar sin artículo → MARCA (false).
check('"Limite su exposición a la acción." MARCA',
  phiaVerifLing('Limite su exposición a la acción.') === false);
check('"Limita el riesgo de la cartera." MARCA',
  phiaVerifLing('Limita el riesgo de la cartera.') === false);

// 3 · La guarda no baja la guardia sobre el resto del léxico.
check('"Considera el límite del 15 %." MARCA (considera)',
  phiaVerifLing('Considera el límite del 15 %.') === false);
check('"Vende la posición ahora." MARCA (vende)',
  phiaVerifLing('Vende la posición ahora.') === false);
check('"Tenés que revisar la cartera." MARCA (voseo)',
  phiaVerifLing('Tenés que revisar la cartera.') === false);

if (fallos) { console.error(`\n${fallos} fallo(s)`); process.exit(1); }
console.log('\nTODO VERDE (9/9)');
