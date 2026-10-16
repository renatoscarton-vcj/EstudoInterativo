# 🧳 Passaporte do Saber

> Desenvolvido por **Alaris IA**

Jogo de revisão para provas do ensino fundamental. Funciona **offline**, em qualquer
navegador — celular, tablet, Chromebook ou computador. Sem instalação, sem conta, sem servidor.

Feito para o **4º ano do Ensino Fundamental**: mostra o calendário de avaliações da escola,
ensina cada assunto com lições curtas contadas pela turma (Caio, Joana, Manu, Elise, Théo, Lis,
Mia, Gael, Nico e Bia) e testa tudo com desafios em que cada acerto faz o meio de transporte evoluir,
de "a pé" até "nave espacial".

---

## 🎮 Como jogar

Abra o arquivo `index.html` no navegador. É só isso.

- **No computador/Chromebook:** clique duas vezes no arquivo, ou arraste para uma aba do navegador.
- **No celular/tablet:** salve o arquivo e abra com o navegador.
- **Online:** acesse pelo GitHub Pages (link nas configurações do repositório).

O progresso fica salvo no próprio navegador — dá para fechar e continuar depois.

### O que ele faz

- **Calendário de avaliações** (setembro e outubro de 2026) com cores por tipo:
  📝 Avaliação Diversificada · ✏️ Atividade Avaliativa · 👥 Trabalho em grupo ·
  📦 Entrega de trabalho · 🎉 Evento · 🌴 Feriado
- **Próximo desafio** com contagem regressiva e atalho para treinar as matérias daquela data
- **8 matérias**: Língua Portuguesa, Matemática, Ciências, História e Geografia,
  Language Arts, Math, Science e Social Studies
- **Aprender**: lições curtas, com um personagem da turma explicando
- **Cartas de estudo**: vire a carta e veja a resposta com explicação
- **Desafio completo** ou **por tema**, com estrelas, XP, sequência de acertos 🔥, sons e confete
- **Desafio surpresa**: 10 perguntas misturadas, puxando mais das próximas avaliações
- **Continuar** de onde parou e **revisar só os erros**
- **Passaporte de carimbos** (conquistas), **perfis** por aluno e **backup** do progresso

---

## 📁 Estrutura do projeto

```
.
├── index.html            ← o jogo (gerado, não edite à mão)
├── admin.html            ← editor de perguntas (abra no navegador)
├── data/
│   ├── calendario.json   ← as datas de avaliações, trabalhos e eventos
│   └── materias/         ← uma matéria por arquivo (lições + perguntas)
│       ├── port.json
│       ├── mat.json
│       └── ...
├── src/
│   └── template.html     ← o código do jogo (HTML + CSS + JS)
└── scripts/
    └── build.js          ← junta data/ + template → index.html
```

A ideia da separação: **quem quer contribuir com conteúdo mexe só em `data/`**, sem precisar
entender o código. E `index.html` continua sendo um arquivo único que funciona offline.

---

## 📅 Como atualizar o calendário

Edite `data/calendario.json`. Cada evento tem:

```json
{
  "data": "2026-10-19",
  "tipo": "avaliacao",
  "titulo": "Avaliação Diversificada Multidisciplinar de Matemática e História/Geografia",
  "detalhe": "Impressa",
  "materias": ["mat", "histgeo"]
}
```

| Campo | O que é |
|---|---|
| `data` | no formato `AAAA-MM-DD` |
| `tipo` | `avaliacao`, `atividade`, `trabalho`, `entrega`, `evento` ou `feriado` (define a cor) |
| `titulo` | o texto que aparece no calendário |
| `detalhe` | opcional (ex.: "Impressa", "Google Forms") |
| `materias` | opcional: `id` das matérias que caem — viram botões "Estudar" |

A lista `meses` (ex.: `["2026-09", "2026-10"]`) define quais meses aparecem. Depois rode o build.

---

## ✏️ Como adicionar ou corrigir perguntas

### Jeito fácil — pelo editor

1. Abra `admin.html` no navegador (clique duas vezes no arquivo)
2. Carregue os arquivos `.json` da pasta `data/`
3. Edite pela interface: crie matérias, adicione perguntas, marque a resposta certa
4. Clique em **Baixar todos os JSONs**
5. Substitua os arquivos em `data/` pelos que você baixou
6. Rode `node scripts/build.js`

O editor salva seu trabalho no navegador enquanto você edita, então dá para fechar e voltar depois.

### Jeito direto — editando o JSON

Cada matéria é um arquivo em `data/materias/`:

```json
{
  "id": "port",
  "icon": "📖",
  "name": "Língua Portuguesa",
  "ordem": 1,
  "cor": "#C2410C",
  "lingua": "pt",
  "ano": 4,
  "topics": "Substantivos · Adjetivos · Verbos",
  "licoes": [
    {
      "tema": "Substantivos",
      "titulo": "Substantivos: as palavras que dão nome",
      "texto": "Substantivo é a palavra que dá <b>nome</b> a tudo.",
      "pontos": ["<b>Próprio:</b> Joana, Recife", "<b>Comum:</b> cidade, bola"],
      "quem": "Caio",
      "fala": "Meu nome é substantivo próprio!"
    }
  ],
  "questions": [
    {
      "tema": "Pronomes pessoais",
      "q": "Complete: <em>___ vamos viajar amanhã.</em>",
      "opts": ["Eu", "Nós", "Elas", "Tu"],
      "correct": 1,
      "fb": "“Nós” representa o grupo que fala, incluindo quem fala."
    }
  ]
}
```

| Campo | O que é |
|---|---|
| `id` | identificador curto, sem espaços (vira o nome do arquivo) |
| `icon` | um emoji para o menu |
| `name` | nome que aparece na tela |
| `ordem` | posição da matéria no menu |
| `cor` | cor da matéria (`#RRGGBB`, escura o bastante para texto branco) |
| `lingua` | `pt` ou `en` (muda as reações dos personagens) |
| `licoes` | lições do modo Aprender: `tema`, `titulo`, `texto`, `pontos`, `quem` (personagem) e `fala` |
| `ano` | ano/série (número) — usado no filtro |
| `topics` | resumo dos assuntos, aparece embaixo do nome |
| `tema` | agrupa perguntas do mesmo assunto |
| `q` | o enunciado (aceita `<em>` e `<b>`) |
| `opts` | de 2 a 5 alternativas |
| `correct` | **posição** da resposta certa, começando em 0 |
| `fb` | explicação mostrada após responder |

> ⚠️ `correct` conta a partir do zero: `0` é a primeira alternativa, `1` a segunda, e assim por diante.

Depois de editar, rode o build:

```bash
node scripts/build.js
```

O script **valida tudo** antes de gerar — se faltar explicação, se `correct` apontar para uma
alternativa que não existe, ou se o JSON estiver quebrado, ele avisa exatamente onde está o erro
e não gera nada.

---

## 🚀 Publicando no GitHub Pages

1. Vá em **Settings → Pages**
2. Em *Source*, escolha a branch `main` e a pasta `/ (root)`
3. Salve — em alguns minutos o jogo estará no ar

Como `index.html` está na raiz e não depende de nenhum servidor, funciona direto.

---

## 🤝 Contribuindo

Contribuições de perguntas são muito bem-vindas — principalmente de outras séries.

Veja o [CONTRIBUTING.md](CONTRIBUTING.md) para o passo a passo.

---

## 📄 Direitos autorais

**Passaporte do Saber™**
© 2026 Alaris IA. Todos os direitos reservados.

Este software e seu conteúdo são de propriedade da Alaris IA. A reprodução, distribuição
ou modificação sem autorização expressa por escrito não é permitida.

Sobre o **conteúdo das perguntas**: os enunciados são originais, escritos com base em roteiros de
estudo escolares. Algumas perguntas fazem referência a textos de livros didáticos (citando autor e
obra) apenas para fins de estudo, sem reproduzir os textos.

Não afiliado a nenhuma instituição de ensino ou editora.
