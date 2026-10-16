#!/usr/bin/env node
/**
 * build.js — junta as matérias e o calendário de data/ dentro do template
 * e gera o index.html final.
 *
 * Uso:  node scripts/build.js
 *
 * Sem dependências: só Node puro. O resultado é um arquivo único que funciona
 * offline (abrindo direto no navegador) e no GitHub Pages.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MATERIAS_DIR = path.join(ROOT, 'data', 'materias');
const CALENDARIO = path.join(ROOT, 'data', 'calendario.json');
const TEMPLATE = path.join(ROOT, 'src', 'template.html');
const OUTPUT = path.join(ROOT, 'index.html');

const TIPOS = ['avaliacao', 'atividade', 'trabalho', 'entrega', 'evento', 'feriado'];

function erro(msg) {
  console.error('\n❌ ' + msg + '\n');
  process.exit(1);
}

function lerJSON(caminho, rotulo, problemas) {
  try {
    return JSON.parse(fs.readFileSync(caminho, 'utf8'));
  } catch (e) {
    problemas.push(`${rotulo}: JSON inválido — ${e.message}`);
    return null;
  }
}

const problemas = [];

// ---------- 1. matérias ----------
if (!fs.existsSync(MATERIAS_DIR)) erro('Pasta data/materias/ não encontrada.');

const arquivos = fs.readdirSync(MATERIAS_DIR).filter(f => f.endsWith('.json')).sort();
if (!arquivos.length) erro('Nenhum arquivo .json em data/materias/.');

const subjects = [];

arquivos.forEach(arq => {
  const dados = lerJSON(path.join(MATERIAS_DIR, arq), arq, problemas);
  if (!dados) return;

  if (!dados.id) problemas.push(`${arq}: falta o campo "id"`);
  if (!dados.name) problemas.push(`${arq}: falta o campo "name"`);
  if (dados.cor && !/^#[0-9a-fA-F]{6}$/.test(dados.cor)) problemas.push(`${arq}: "cor" precisa ser #RRGGBB`);
  if (!Array.isArray(dados.questions)) {
    problemas.push(`${arq}: "questions" precisa ser uma lista`);
    return;
  }

  dados.questions.forEach((q, i) => {
    const ref = `${arq} · pergunta ${i + 1}`;
    if (!q.q) problemas.push(`${ref}: sem enunciado`);
    if (!Array.isArray(q.opts) || q.opts.length < 2) problemas.push(`${ref}: precisa de ao menos 2 alternativas`);
    if (typeof q.correct !== 'number' || q.correct < 0 || (q.opts && q.correct >= q.opts.length)) {
      problemas.push(`${ref}: campo "correct" aponta para alternativa inexistente`);
    }
    if (q.opts && new Set(q.opts).size !== q.opts.length) problemas.push(`${ref}: alternativas repetidas`);
    if (!q.fb) problemas.push(`${ref}: sem explicação (campo "fb")`);
    if (!q.tema) problemas.push(`${ref}: sem tema`);
  });

  const enunciados = new Set();
  dados.questions.forEach((q, i) => {
    if (enunciados.has(q.q)) problemas.push(`${arq} · pergunta ${i + 1}: enunciado repetido`);
    enunciados.add(q.q);
  });

  (dados.licoes || []).forEach((l, i) => {
    const ref = `${arq} · lição ${i + 1}`;
    if (!l.titulo) problemas.push(`${ref}: sem título`);
    if (!l.texto) problemas.push(`${ref}: sem texto`);
    if (!l.tema) problemas.push(`${ref}: sem tema`);
    if (l.pontos && !Array.isArray(l.pontos)) problemas.push(`${ref}: "pontos" precisa ser uma lista`);
  });

  if (!dados.ano) dados.ano = 4;
  if (!dados.licoes) dados.licoes = [];
  subjects.push(dados);
});

// ---------- 2. calendário ----------
if (!fs.existsSync(CALENDARIO)) erro('data/calendario.json não encontrado.');
const calendario = lerJSON(CALENDARIO, 'calendario.json', problemas) || { eventos: [], meses: [] };
const ids = new Set(subjects.map(s => s.id));

(calendario.meses || []).forEach(m => {
  if (!/^\d{4}-\d{2}$/.test(m)) problemas.push(`calendario.json: mês "${m}" fora do formato AAAA-MM`);
});
(calendario.eventos || []).forEach((ev, i) => {
  const ref = `calendario.json · evento ${i + 1}`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ev.data || '')) problemas.push(`${ref}: data "${ev.data}" fora do formato AAAA-MM-DD`);
  if (!TIPOS.includes(ev.tipo)) problemas.push(`${ref}: tipo "${ev.tipo}" inválido (use: ${TIPOS.join(', ')})`);
  if (!ev.titulo) problemas.push(`${ref}: sem título`);
  (ev.materias || []).forEach(id => {
    if (!ids.has(id)) problemas.push(`${ref}: matéria "${id}" não existe em data/materias/`);
  });
});
calendario.eventos = (calendario.eventos || []).slice().sort((a, b) => a.data.localeCompare(b.data));

if (problemas.length) {
  console.error('\n❌ Problemas encontrados:\n');
  problemas.forEach(p => console.error('   • ' + p));
  console.error('\nCorrija e rode de novo.\n');
  process.exit(1);
}

// ---------- 3. ordena por ano e pelo campo "ordem" (sem ordem, vão para o fim) ----------
subjects.sort((a, b) => {
  if (a.ano !== b.ano) return a.ano - b.ano;
  return (a.ordem || 99) - (b.ordem || 99);
});

// ---------- 4. injeta no template ----------
if (!fs.existsSync(TEMPLATE)) erro('src/template.html não encontrado.');

let html = fs.readFileSync(TEMPLATE, 'utf8');
if (!html.includes('// __DADOS__')) erro('O template não tem o marcador "// __DADOS__".');

const bloco =
  'const subjects = ' + JSON.stringify(subjects, null, 1) + ';\n' +
  'const calendario = ' + JSON.stringify(calendario, null, 1) + ';';
html = html.replace('// __DADOS__', () => bloco);
html = html.replace(/__BUILD_DATE__/g, new Date().toLocaleDateString('pt-BR'));
html = html.replace(/__BUILD_YEAR__/g, String(new Date().getFullYear()));

fs.writeFileSync(OUTPUT, html, 'utf8');

// ---------- 5. relatório ----------
const total = subjects.reduce((n, s) => n + s.questions.length, 0);
const licoes = subjects.reduce((n, s) => n + s.licoes.length, 0);
console.log('\n✅ index.html gerado com sucesso\n');
subjects.forEach(s => {
  console.log(`   ${s.icon || '📘'}  ${s.ano}º ano — ${s.name}: ${s.licoes.length} lições, ${s.questions.length} perguntas`);
});
console.log(`\n   Total: ${licoes} lições e ${total} perguntas em ${subjects.length} matérias`);
console.log(`   Calendário: ${calendario.eventos.length} eventos`);
console.log(`   Tamanho: ${(fs.statSync(OUTPUT).size / 1024).toFixed(0)} KB\n`);
