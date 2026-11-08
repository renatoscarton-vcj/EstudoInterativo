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
const crypto = require('crypto');

/**
 * Código de versão: data da geração + impressão digital do próprio conteúdo.
 *
 * O código é calculado a partir do HTML já montado (com as perguntas, as lições
 * e o calendário dentro), então duas pessoas que veem o mesmo código estão
 * necessariamente com o mesmo arquivo. Não depende do git nem da ordem entre
 * gerar e commitar.
 */
function codigoVersao(htmlSemVersao) {
  const d = new Date();
  const data = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('.');

  const impressao = crypto
    .createHash('sha256')
    .update(htmlSemVersao, 'utf8')
    .digest('hex')
    .slice(0, 6)
    .toUpperCase();

  return `v${data}·${impressao}`;
}

const ROOT = path.join(__dirname, '..');
const FONTES_DIR = path.join(__dirname, '..', 'assets', 'fontes');

// Os arquivos em assets/fontes/ seguem o padrão <apelido>-<peso>.woff2.
// Este mapa liga o apelido ao nome que o CSS usa em font-family.
const FAMILIAS = { nunito: 'Nunito', baloo2: 'Baloo 2', montserrat: 'Montserrat' };

/**
 * Transforma os .woff2 de assets/fontes/ em regras @font-face com o arquivo
 * embutido em base64. É o que mantém a identidade visual sem internet.
 */
function fontesEmbutidas() {
  if (!fs.existsSync(FONTES_DIR)) return { css: '', kb: 0, n: 0 };
  const arquivos = fs.readdirSync(FONTES_DIR).filter(f => f.endsWith('.woff2')).sort();
  let bytes = 0;
  const css = arquivos.map(arq => {
    const m = arq.match(/^(.+)-(\d{3})\.woff2$/);
    if (!m) {
      console.warn(`   ⚠️  ${arq}: fora do padrão <apelido>-<peso>.woff2, ignorado`);
      return '';
    }
    const familia = FAMILIAS[m[1]];
    if (!familia) {
      console.warn(`   ⚠️  ${arq}: apelido "${m[1]}" não está no mapa FAMILIAS, ignorado`);
      return '';
    }
    const dados = fs.readFileSync(path.join(FONTES_DIR, arq));
    bytes += dados.length;
    return `@font-face{font-family:'${familia}';font-style:normal;font-weight:${m[2]};` +
           `font-display:swap;src:url(data:font/woff2;base64,${dados.toString('base64')}) format('woff2');}`;
  }).filter(Boolean).join('\n');
  return { css, kb: Math.round(bytes / 1024), n: css ? css.split('\n').length : 0 };
}
const MATERIAS_DIR = path.join(ROOT, 'data', 'materias');
const CALENDARIO = path.join(ROOT, 'data', 'calendario.json');
const TEMPLATE = path.join(ROOT, 'src', 'template.html');
const OUTPUT = path.join(ROOT, 'index.html');

const TIPOS = ['sistematizada', 'avaliacao', 'atividade', 'trabalho', 'entrega', 'evento', 'feriado'];

// Tipos de questão. "escolha" é o padrão quando o campo "tipo" não aparece,
// então todo o conteúdo antigo continua valendo sem precisar ser mexido.
const TIPOS_QUESTAO = ['escolha', 'ordenar', 'ligar'];

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
    const tipo = q.tipo || 'escolha';
    if (!q.q) problemas.push(`${ref}: sem enunciado`);
    if (!q.fb) problemas.push(`${ref}: sem explicação (campo "fb")`);
    if (!q.tema) problemas.push(`${ref}: sem tema`);
    if (!TIPOS_QUESTAO.includes(tipo)) {
      problemas.push(`${ref}: tipo "${tipo}" inválido (use: ${TIPOS_QUESTAO.join(', ')})`);
      return;
    }

    if (tipo === 'ordenar') {
      // "itens" já vem NA ORDEM CERTA; o jogo é que embaralha na tela
      if (!Array.isArray(q.itens) || q.itens.length < 3) {
        problemas.push(`${ref}: "ordenar" precisa de ao menos 3 itens em "itens"`);
      } else {
        if (q.itens.length > 6) problemas.push(`${ref}: "ordenar" com ${q.itens.length} itens é demais para criança (máximo 6)`);
        if (new Set(q.itens).size !== q.itens.length) problemas.push(`${ref}: itens repetidos`);
        if (q.itens.some(t => typeof t !== 'string' || !t.trim())) problemas.push(`${ref}: item vazio`);
      }
      return;
    }

    if (tipo === 'ligar') {
      if (!Array.isArray(q.pares) || q.pares.length < 3) {
        problemas.push(`${ref}: "ligar" precisa de ao menos 3 pares`);
      } else {
        if (q.pares.length > 6) problemas.push(`${ref}: "ligar" com ${q.pares.length} pares é demais para criança (máximo 6)`);
        if (q.pares.some(p => !Array.isArray(p) || p.length !== 2 || !p[0] || !p[1])) {
          problemas.push(`${ref}: cada par precisa ser uma lista de dois textos`);
        } else {
          // repetição dos dois lados torna a questão ambígua: o mesmo
          // destino serviria para duas ligações diferentes
          if (new Set(q.pares.map(p => p[0])).size !== q.pares.length) problemas.push(`${ref}: item repetido na coluna da esquerda`);
          if (new Set(q.pares.map(p => p[1])).size !== q.pares.length) problemas.push(`${ref}: item repetido na coluna da direita`);
        }
      }
      return;
    }

    // escolha simples
    if (!Array.isArray(q.opts) || q.opts.length < 2) problemas.push(`${ref}: precisa de ao menos 2 alternativas`);
    if (typeof q.correct !== 'number' || q.correct < 0 || (q.opts && q.correct >= q.opts.length)) {
      problemas.push(`${ref}: campo "correct" aponta para alternativa inexistente`);
    }
    if (q.opts && new Set(q.opts).size !== q.opts.length) problemas.push(`${ref}: alternativas repetidas`);
  });

  const enunciados = new Set();
  dados.questions.forEach((q, i) => {
    if (enunciados.has(q.q)) problemas.push(`${arq} · pergunta ${i + 1}: enunciado repetido`);
    enunciados.add(q.q);
  });

  // Quem escreve conteúdo digita a resposta certa primeiro, sem perceber.
  // Com isso a criança gabarita escolhendo sempre "A" e não aprende nada.
  // O jogo embaralha as alternativas na hora de jogar, mas um arquivo
  // viciado continua sendo um defeito — então aqui ele barra o build.
  const escolhas = dados.questions.filter(q => (q.tipo || 'escolha') === 'escolha');
  const porPosicao = {};
  escolhas.forEach(q => {
    if (typeof q.correct === 'number') porPosicao[q.correct] = (porPosicao[q.correct] || 0) + 1;
  });
  const concentracao = Math.max(0, ...Object.values(porPosicao));
  if (escolhas.length >= 8 && concentracao / escolhas.length > 0.5) {
    const letra = 'ABCDE'[Object.keys(porPosicao).find(k => porPosicao[k] === concentracao)] || '?';
    const pct = Math.round((concentracao / escolhas.length) * 100);
    problemas.push(
      `${arq}: ${pct}% das respostas certas estão na alternativa "${letra}". ` +
      `Espalhe o gabarito entre as alternativas (o limite é 50%).`
    );
  }

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

const fontes = fontesEmbutidas();
if (!html.includes('/* __FONTES__ */')) erro('O template não tem o marcador "/* __FONTES__ */".');
if (!fontes.css) erro('Nenhuma fonte .woff2 encontrada em assets/fontes/ — o jogo ficaria sem identidade visual offline.');
html = html.replace('/* __FONTES__ */', () => fontes.css);
html = html.replace(/__BUILD_DATE__/g, new Date().toLocaleDateString('pt-BR'));
html = html.replace(/__BUILD_YEAR__/g, String(new Date().getFullYear()));

// a impressão digital é calculada sobre o HTML já pronto, com os placeholders
// de versão ainda no lugar — assim o mesmo conteúdo gera sempre o mesmo código
const VERSAO = codigoVersao(html);
html = html.replace(/__BUILD_VERSION__/g, VERSAO);

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
console.log(`   Fontes embutidas: ${fontes.n} (${fontes.kb} KB) — funciona offline`);
console.log(`   Tamanho: ${(fs.statSync(OUTPUT).size / 1024).toFixed(0)} KB\n`);
