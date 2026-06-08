# Plano: Linktree pessoal (front-end)

## Context
O usuário quer um "linktree" pessoal. Cada link é um **card** com: título, subtítulo (opcional),
URL, posição (ordem numérica) e um botão de **gerar QR code**. O foco agora é **só o front-end**
(sem backend). O diretório `c:\Users\nik70\JavaScript\links` está vazio — projeto greenfield.

Decisões tomadas com o usuário:
- **Stack:** HTML/CSS/JS puro, sem build/bundler (fácil de rodar e hospedar depois).
- **Ordem:** cada card tem um campo numérico de ordem; cards exibidos ordenados por ele.
- **Edição:** formulário na própria UI para adicionar/editar/remover cards.
- **QR code:** gerado offline por biblioteca JS local (sem API externa).
- **Dados:** por enquanto vêm de um `mock.js` (seed). A persistência real e a separação
  visualizar/editar serão tratadas pela infra depois — não fazem parte deste escopo.
- **Visual:** estilo definitivo PENDENTE. Montar com CSS variables e tema neutro para trocar depois.

## Estrutura de arquivos
```
links/
├── index.html             # VIEW PÚBLICA (read-only): perfil + cards + QR p/ compartilhar
├── admin/
│   └── index.html         # PAINEL ADMIN: tudo da view + formulário add/editar/remover
├── css/                   # compartilhado pelas duas páginas
│   ├── tokens.css         # design tokens: cores, espaçamentos, raios (CSS variables, 2 temas)
│   ├── base.css           # reset/normalização + tipografia base
│   ├── layout.css         # fundo, container, header/perfil
│   └── components.css     # card, formulário, botões, modal QR, theme toggle
├── js/                    # compartilhado pelas duas páginas
│   ├── mock.js            # dados seed dos cards (array de objetos)
│   ├── store.js           # estado em memória + operações (add/edit/remove/sort)
│   ├── ui.js              # render dos cards + modal QR; form só quando há #card-form (admin)
│   ├── qr.js              # wrapper para gerar QR via lib offline
│   └── app.js             # ponto de entrada: theme toggle + liga store↔ui
├── vendor/
│   └── qr-code-styling.js # biblioteca de QR estilizado offline (vendorizada localmente)
└── docs/
    ├── plano.md           # esta documentação
    └── design.md          # design system (visual)
```

**Modos:** o `ui.js` detecta o modo pela presença do formulário (`#card-form`). A view pública
(`index.html`) não tem formulário → cards renderizam só o botão de QR (sem editar/remover). O admin
(`admin/index.html`) tem o formulário → cards ganham editar/remover e o painel de add/editar.
As páginas usam os **mesmos** CSS/JS (o admin referencia com `../`).

> Separação **estrutural** apenas. O admin ainda não tem autenticação e os dados são em memória
> (seed do `mock.js`) — proteção de acesso e persistência ficam para a infra depois.

Ordem dos assets: CSS `tokens → base → layout → components`; JS no fim do `<body>`
`vendor/qr-code-styling.js → mock.js → store.js → qr.js → ui.js → app.js`.

## Modelo de dados (`js/mock.js` / `js/store.js`)
Array de itens (links e pastas):
```js
// link de topo
{ id, kind:"link", parentId:null, title, subtitle?, url, order }
// pasta (1 nível, sempre no topo, sem url)
{ id, kind:"folder", parentId:null, title, subtitle?, order }
// link dentro de pasta
{ id, kind:"link", parentId:"<id-da-pasta>", title, subtitle?, url, order }
```
- `kind` default `"link"`. `subtitle` opcional. `order` ordena entre **irmãos** (mesmo `parentId`).
- `Store.getTree()` monta a árvore (topo + `children` de cada pasta); `renderCards` consome isso.
- Remover uma pasta remove **em cascata** os links dentro dela.

### Pastas (accordion)
- **1 nível**, topo misto (links + pastas), **accordion** (uma aberta por vez, começam fechadas).
- UI segue a skill **ui-ux-pro-max**: cabeçalho `<button>` com `aria-expanded`/`aria-controls`,
  teclado, alvo ≥44px, chevron que rotaciona (estado não só por cor), expansão suave via
  `grid-template-rows 0fr→1fr`, conteúdo `inert` quando fechado, respeita `prefers-reduced-motion`.
- Admin: campo **Tipo** (Link/Pasta) e **Pasta pai**; ao escolher Pasta, o campo URL some
  (progressive disclosure).

## `index.html`
- `<header>` com avatar/título da página (placeholder) — área pessoal do dono.
- Seção **formulário** (`<form id="card-form">`): inputs para título, subtítulo (opcional),
  url, ordem (number), botão "Adicionar/Salvar".
- Seção **lista** (`<ul id="cards">`): onde os cards são renderizados.
- `<dialog id="qr-modal">` (ou overlay) para exibir o QR gerado de um card.
- Carrega scripts no fim do `<body>` na ordem definida na estrutura de arquivos.

## JavaScript (`js/`) — comportamento
- **`store.js`** — estado: array `links` em memória, inicializado a partir do `mock.js`.
  Expõe operações: `add`, `update`, `remove`, e leitura ordenada por `order`
  (`.sort((a,b) => a.order - b.order)`).
- **`ui.js`** — `render()`: limpa `#cards`, pega a lista ordenada do store, cria um card por
  item com título, subtítulo (se houver), link clicável (`<a target="_blank" rel="noopener">`),
  badge da ordem, e botões "Editar", "Remover", "Gerar QR".
  - **Formulário:** submit adiciona novo card (ou salva edição se houver `editingId`);
    valida URL básica (`new URL()` em try/catch) e ordem numérica; limpa o form ao concluir.
  - **Editar:** preenche o form com os dados do card e entra em modo edição.
  - **Remover:** chama o store e re-renderiza (com confirmação simples).
- **`qr.js`** — wrapper sobre a lib offline; gera o QR da `url` do card dentro do `#qr-modal`,
  com botão de fechar. (Opcional: "baixar PNG" via canvas — incluir se trivial.)
- **`app.js`** — ponto de entrada: liga store + ui no carregamento da página.
- Sem dependências de framework; módulos simples (IIFE ou `type="module"`).

## Estilo (`css/`)
- **`tokens.css`** — paleta, espaçamentos, raios e fontes em `:root { --bg; --card; --text; --accent; ... }`
  para trocar o tema facilmente quando o usuário decidir o visual.
- **`base.css`** — reset/normalização e estilos base (body, tipografia).
- **`layout.css`** — layout centralizado, largura máx. ~600px, header, empilhamento, responsivo (mobile-first).
- **`components.css`** — card, formulário, botões e modal de QR.
- Tema neutro padrão (claro/sóbrio) até o visual ser definido.

## Biblioteca de QR (offline)
- Vendorizar `qr-code-styling.js` localmente em `vendor/` (kozakdenys/qr-code-styling,
  build UMD → global `QRCodeStyling`). Sem chamadas a serviços externos em runtime.

## Verificação (end-to-end)
1. Abrir `index.html` no navegador (duplo clique ou `Start-Process .\index.html`).
2. Conferir que os cards do `mock.js` aparecem ordenados pelo campo `order`.
3. Adicionar um card pelo formulário → aparece na posição correta.
4. Editar e remover um card → lista atualiza corretamente.
5. Clicar "Gerar QR" → modal mostra o QR; escanear com o celular abre a URL do card.
6. Validar responsividade reduzindo a largura da janela.

## Fora de escopo (depois)
- Backend / persistência real, autenticação, separação visualizar-vs-editar (infra).
- Visual definitivo / branding.
