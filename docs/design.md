# Design System — Linktree pessoal

Documento de referência visual. Fonte-da-verdade que guia `index.html` + `css/` + `js/`
(estrutura em [plano.md](plano.md)).

## Personalidade & direção

| Dimensão | Direção |
|----------|---------|
| Quem é | **Dev / tech** |
| Vibe | **Calma, minimalista, editorial** — arejada e atemporal |
| Estilo | **Cards limpos e suaves**: borda 1px sutil, cantos macios, sombra leve. Sem ruído. |
| Base | **Claro "papel quente"** (padrão) + **escuro charcoal sereno** via toggle |
| Cor | Neutros quentes + **1 accent sóbrio (verde musgo)** usado com parcimônia |
| Tipografia | **Young Serif** (serif display encorpada, nome/títulos) + **Hanken Grotesk** (sans limpa, corpo) |

**Histórico:** v1 era glass/gradiente navy→ciano = "cara de IA"; v2 neo-brutalista ficou **poluída**.
Esta v3 busca o oposto do poluído: **silêncio visual**, hierarquia por tipografia e espaço,
um único detalhe de cor. Editorial e humano.

## 1. Princípios
1. **Espaço em primeiro lugar** — respiro generoso; o vazio faz parte do design.
2. **Hierarquia por tipografia**, não por cor/efeito — serif elegante para o nome, sans calma no resto.
3. **1 accent, com parcimônia** — o verde musgo aparece só na seta (hover), foco e ações; nunca enche a tela.
4. **Suave, não chamativo** — borda 1px, sombra leve, cantos macios; nada de gradiente/glow/grid/sombra dura.
5. **Acessível** — AA, alvos ≥44px, foco visível, `prefers-reduced-motion`. Mobile-first.

## 2. Tokens → `css/tokens.css`
Neutros + 1 accent. `:root` (claro) + `[data-theme="dark"]` (charcoal). Sem hex cru nos componentes.

**Claro (padrão):** `--bg #FBFAF8` (papel quente) · `--surface #FFFFFF` (card) · `--surface-2 #F4F2EE`
(inputs) · bordas `--border rgba(24,22,18,.10)` / `--border-strong …18` · `--text #1B1A18` ·
`--text-muted #63605A` (AA com folga ~5.6:1) · `--accent #4D7C2A` (verde musgo) · `--accent-weak` (10%) · `--danger #B42318` · `--success #0E7C5A`.
**Escuro:** `--bg #16181D` · `--surface #1D2026` · `--text #E9E8E5` · `--text-muted #9B9892` ·
`--accent #8FBF52`. Contraste suave, sem brilho.
**Forma/elevação:** `--radius 14px` / `--radius-sm 10px`; sombras leves `--shadow-1` (1px) e `--shadow-2` (8–10px difusa).
**QR:** placa `#FFFFFF` sempre.

## 3. Tipografia → `css/base.css`
- **Display (h1–h3):** `Young Serif` 400 (serif display, x-height alto → nome reduzido) — nome, títulos. `line-height` ~1.1.
- **Corpo / UI / labels:** `Hanken Grotesk` 400/500/600 — subtítulos, inputs, botões. `line-height` 1.55.
- Caixa normal (sem MAIÚSCULAS forçadas). Body 16px. `tabular-nums` no número de ordem.
- `<link>`: `Young+Serif` + `Hanken+Grotesk:400;500;600` (`display=swap`).

## 4. Componentes → `css/layout.css` + `css/components.css`
- **Fundo:** cor sólida lisa (sem grid/blobs).
- **Container:** centralizado, `max-width 560px`, padding generoso (respiro).
- **Header:** avatar **círculo** (foto no público com anel accent; monograma em Young Serif no admin) à esquerda + theme toggle à direita;
  nome em serif grande; handle e bio em sans muted. Calmo, sem kicker/ruído.
- **Card (suave):** `--surface`, borda 1px `--border`, `--radius`, `--shadow-1`. Linha:
  `[nº ordem muted]` · `[título + subtítulo]` · `[seta]`. *Stretched link* (`<a>::after` cobre o card)
  com ações QR/editar/remover acima (z-index maior), discretas (ícone muted; hover = accent suave).
  **Hover/focus:** `translateY(-1px)` + `--shadow-2` + borda um pouco mais forte; a **seta desliza 3px**
  e ganha a cor accent. Movimento mínimo, elegante.
- **Pasta (accordion):** cabeçalho `<button>` (ícone pasta + título + subtítulo + chevron), sem URL/QR;
  abre **abaixo** os links filhos (uma aberta por vez, começam fechadas). Expansão suave via
  `grid-template-rows 0fr→1fr`; chevron rotaciona 180° (estado não só por cor); conteúdo `inert`
  quando fechado; `aria-expanded`/`aria-controls`; filhos com leve recuo e superfície mais discreta.
  (UI guiada pela skill ui-ux-pro-max.)
- **Formulário:** painel `--surface` borda 1px + sombra leve; labels peso 500 (sem caixa-alta);
  inputs `--surface-2`, foco = borda accent + ring suave `--accent-weak`; erro com ícone+texto (`aria-live`),
  validação no `blur`. CTA primário (accent) + "Cancelar" (ghost). Flash "Salvo!".
- **Botões:** cantos macios; primário = bg accent / texto claro (hover escurece leve);
  ghost = borda sutil. Sem sombra dura.
- **Modal QR (`<dialog>`):** card suave, sombra difusa, backdrop translúcido leve; anima sutil (slide-up).
  **QR em placa branca** com borda fina. URL muted; "Baixar PNG" + "Fechar" (Esc/backdrop, foco volta ao gatilho).

## 5. Movimento
160–200ms `ease`; só `transform`/`opacity`; micro-interações sutis (lift de 1px, seta desliza 3px).
Respeita `prefers-reduced-motion`.

## 6. Acessibilidade
AA 4.5:1 (texto) nos dois temas; alvos ≥44px; `:focus-visible` (outline accent) nunca removido;
`prefers-reduced-motion`/`prefers-color-scheme`; cor nunca é o único indicador; ícones SVG (Lucide) —
sem emoji; `aria-label` nos icon buttons; `<label for>`; placa do QR sempre clara.

## 7. Anti-padrões a evitar
**Poluição visual** (muitos elementos/cores/efeitos competindo) · gradiente · glow · glassmorphism/blur ·
blobs · grid de fundo · sombra dura · cores alternando por item · caixa-alta em tudo ·
Space Grotesk/Inter genéricos ("AI slop") · emoji como ícone · label só no placeholder · remover focus ring.

## 8. Mapa tokens → arquivos
`tokens.css` (tokens + 2 temas) · `base.css` (reset, fontes, tipografia, foco) ·
`layout.css` (fundo, container, header) · `components.css` (card, form, botões, modal, toggle).
