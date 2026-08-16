# 🧳 Passaporte do Saber

> Um produto **Scarton Software**

Jogo de revisão para provas do ensino fundamental. Funciona **offline**, em qualquer
navegador — celular, tablet, Chromebook ou computador. Sem instalação, sem conta, sem servidor.

Feito para ajudar crianças a revisarem o roteiro de estudos de forma menos chata que ler o
caderno de novo: cada acerto faz o meio de transporte evoluir, de "a pé" até "nave espacial".

---

## 🎮 Como jogar

Abra o arquivo `index.html` no navegador. É só isso.

- **No computador/Chromebook:** clique duas vezes no arquivo, ou arraste para uma aba do navegador.
- **No celular/tablet:** salve o arquivo e abra com o navegador.
- **Online:** acesse pelo GitHub Pages (link nas configurações do repositório).

O progresso fica salvo no próprio navegador — dá para fechar e continuar depois.

### O que ele faz

- Escolha da matéria com a data de cada prova
- Filtro por ano/série
- Explicação em toda resposta, certa ou errada
- Evolução do transporte conforme acerta
- **Continuar** de onde parou
- **Modo revisão:** joga só as perguntas que errou da última vez
- Navegação livre para frente e para trás entre as questões

---

## 📁 Estrutura do projeto

```
.
├── index.html          ← o jogo (gerado, não edite à mão)
├── admin.html          ← editor de perguntas (abra no navegador)
├── data/               ← as perguntas, um arquivo por matéria
│   ├── port.json
│   ├── mat.json
│   └── ...
├── src/
│   └── template.html   ← o código do jogo (HTML + CSS + JS)
└── scripts/
    └── build.js        ← junta data/ + template → index.html
```

A ideia da separação: **quem quer contribuir com perguntas mexe só em `data/`**, sem precisar
entender o código. E `index.html` continua sendo um arquivo único que funciona offline.

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

Cada matéria é um arquivo em `data/`:

```json
{
  "id": "port",
  "icon": "📖",
  "name": "Língua Portuguesa",
  "date": "13/08",
  "ano": 4,
  "topics": "Pronomes · Porquês · Adjetivos",
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
| `date` | data da prova, no formato `DD/MM` |
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
© 2026 Scarton Software. Todos os direitos reservados.

Este software e seu conteúdo são de propriedade da Scarton Software. A reprodução, distribuição
ou modificação sem autorização expressa por escrito não é permitida.

Sobre o **conteúdo das perguntas**: os enunciados são originais, escritos com base em roteiros de
estudo escolares. Algumas perguntas fazem referência a textos de livros didáticos (citando autor e
obra) apenas para fins de estudo, sem reproduzir os textos.

Não afiliado a nenhuma instituição de ensino ou editora.
