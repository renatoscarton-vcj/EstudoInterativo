#!/usr/bin/env node
/**
 * build.js — junta os JSONs de data/ dentro do template e gera o index.html final.
 *
 * Uso:  node scripts/build.js
 *
 * Sem dependências: só Node puro. O resultado é um arquivo único que funciona
 * offline (abrindo direto no navegador) e no GitHub Pages.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const TEMPLATE = path.join(ROOT, 'src', 'template.html');
const OUTPUT = path.join(ROOT, 'index.html');

function erro(msg) {
  console.error('\n❌ ' + msg + '\n');
  process.exit(1);
}

// ---------- 1. lê os JSONs ----------
if (!fs.existsSync(DATA_DIR)) erro('Pasta data/ não encontrada.');

const arquivos = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).sort();
if (!arquivos.length) erro('Nenhum arquivo .json em data/.');

const subjects = [];
const problemas = [];

arquivos.forEach(arq => {
  const caminho = path.join(DATA_DIR, arq);
  let dados;
  try {
    dados = JSON.parse(fs.readFileSync(caminho, 'utf8'));
  } catch (e) {
    problemas.push(`${arq}: JSON inválido — ${e.message}`);
    return;
  }

  // validação de estrutura
  if (!dados.id) problemas.push(`${arq}: falta o campo "id"`);
  if (!dados.name) problemas.push(`${arq}: falta o campo "name"`);
  if (!Array.isArray(dados.questions)) {
    problemas.push(`${arq}: "questions" precisa ser uma lista`);
    return;
  }
  if (dados.date && !/^\d{2}\/\d{2}$/.test(dados.date)) {
    problemas.push(`${arq}: data "${dados.date}" fora do formato DD/MM`);
  }

  dados.questions.forEach((q, i) => {
    const ref = `${arq} · pergunta ${i + 1}`;
    if (!q.q) problemas.push(`${ref}: sem enunciado`);
    if (!Array.isArray(q.opts) || q.opts.length < 2) problemas.push(`${ref}: precisa de ao menos 2 alternativas`);
    if (typeof q.correct !== 'number' || q.correct < 0 || (q.opts && q.correct >= q.opts.length)) {
      problemas.push(`${ref}: campo "correct" aponta para alternativa inexistente`);
    }
    if (!q.fb) problemas.push(`${ref}: sem explicação (campo "fb")`);
    if (!q.tema) problemas.push(`${ref}: sem tema`);
  });

  if (!dados.ano) dados.ano = 4;
  subjects.push(dados);
});

if (problemas.length) {
  console.error('\n❌ Problemas encontrados:\n');
  problemas.forEach(p => console.error('   • ' + p));
  console.error('\nCorrija e rode de novo.\n');
  process.exit(1);
}

// ---------- 2. ordena por ano e depois por data da prova ----------
subjects.sort((a, b) => {
  if (a.ano !== b.ano) return a.ano - b.ano;
  const [da, ma] = (a.date || '99/99').split('/').map(Number);
  const [db, mb] = (b.date || '99/99').split('/').map(Number);
  return (ma - mb) || (da - db);
});

// ---------- 3. injeta no template ----------
if (!fs.existsSync(TEMPLATE)) erro('src/template.html não encontrado.');

let html = fs.readFileSync(TEMPLATE, 'utf8');
if (!html.includes('// __SUBJECTS__')) {
  erro('O template não tem o marcador "// __SUBJECTS__".');
}

const bloco = 'const subjects = ' + JSON.stringify(subjects, null, 2) + ';';
html = html.replace('// __SUBJECTS__', bloco);
html = html.replace(/__BUILD_DATE__/g, new Date().toLocaleDateString('pt-BR'));
html = html.replace(/__BUILD_YEAR__/g, String(new Date().getFullYear()));

fs.writeFileSync(OUTPUT, html, 'utf8');

// ---------- 4. relatório ----------
const total = subjects.reduce((n, s) => n + s.questions.length, 0);
console.log('\n✅ index.html gerado com sucesso\n');
subjects.forEach(s => {
  const data = s.date ? ` · prova ${s.date}` : '';
  console.log(`   ${s.icon || '📘'}  ${s.ano}º ano — ${s.name}: ${s.questions.length} perguntas${data}`);
});
console.log(`\n   Total: ${total} perguntas em ${subjects.length} matérias`);
console.log(`   Tamanho: ${(fs.statSync(OUTPUT).size / 1024).toFixed(0)} KB\n`);
