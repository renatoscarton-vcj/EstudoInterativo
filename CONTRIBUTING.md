# Como contribuir

Obrigado por querer ajudar! A forma mais útil de contribuir é **adicionando perguntas**,
principalmente de anos/séries que ainda não estão cobertos.

## Você não precisa saber programar

O jeito mais simples:

1. Abra o arquivo `admin.html` no navegador (clique duas vezes nele)
2. Carregue os arquivos `.json` da pasta `data/`
3. Monte as perguntas pela interface
4. Baixe os JSONs e envie para quem mantém o repositório

Se você usa GitHub, pode abrir um Pull Request direto com os arquivos alterados em `data/`.

## O que faz uma boa pergunta

- **A explicação (`fb`) é a parte mais importante.** Ela é o que ensina quando a criança erra.
  Explique o porquê, não só repita a resposta certa.
- **Alternativas erradas plausíveis.** Se as outras três são obviamente absurdas, a criança acerta
  sem entender nada.
- **Uma ideia por pergunta.** Evite enunciados que cobram duas coisas ao mesmo tempo.
- **Linguagem da idade.** Escreva como você explicaria para a criança, não como está no livro.
- **Sem nomes de crianças reais** nos enunciados, já que o material circula entre famílias.

## Não copie textos de livros

É possível fazer perguntas *sobre* um texto do livro didático sem reproduzi-lo. Cite o autor e a obra,
pergunte sobre o conteúdo, mas não cole trechos.

## Antes de enviar

Rode o validador:

```bash
node scripts/build.js
```

Ele avisa se algo estiver faltando ou inconsistente. Se passar, está pronto.

## Reportando erros

Achou uma resposta errada ou uma explicação confusa? Abra uma issue dizendo a matéria e o
enunciado da pergunta. Erro de conteúdo é o tipo de bug mais importante aqui.
