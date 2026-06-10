# Product

## Register

brand

## Users

O dono é um desenvolvedor/pessoa tech que quer um "linktree" pessoal: uma página
única que reúne seus links importantes para compartilhar (bio social, perfil, QR).
O público visitante chega por um link na bio de redes sociais, geralmente no celular,
e quer encontrar e abrir o link certo em segundos. O dono também usa um painel admin
separado para adicionar, editar, reordenar e remover os cards (links e pastas).

A página pública é a superfície principal — é a vitrine que representa a pessoa.
O admin é ferramenta de apoio, secundária.

## Product Purpose

Reunir os links pessoais do dono em uma página calma e bem-feita, com cards ordenáveis,
pastas (accordion, 1 nível) e geração de QR code offline para compartilhar cada link.
Sem backend próprio: os dados vivem em `js/mock.js` no repo e o admin publica
mudanças via API do GitHub com um token que só o dono tem (rascunho local até
publicar). Sucesso = uma página que carrega rápido,
funciona bem no celular e passa a impressão de cuidado e bom gosto — não de template genérico.

## Brand Personality

Calma, minimalista, editorial. Atemporal e humana, não "techy chamativa".
A voz é de alguém confiante que não precisa gritar: silêncio visual, hierarquia por
tipografia e espaço, um único detalhe de cor (verde musgo) usado com parcimônia.
Serif editorial (Fraunces) para nome/títulos + sans calma (Hanken Grotesk) no corpo.
Personalidade em 3 palavras: **sóbria, arejada, cuidada.**

## Anti-references

Não pode parecer "cara de IA" nem template de linktree genérico. Evitar explicitamente:
gradiente navy→ciano (era a v1, descartada), neo-brutalismo poluído (v2, descartada),
glassmorphism/blur decorativo, glow, blobs, grid de fundo, sombra dura, cores alternando
por item, MAIÚSCULAS em tudo, fontes genéricas (Inter/Space Grotesk como default de IA),
emoji como ícone, eyebrow/kicker em cada seção. O inimigo é a poluição visual: muitos
elementos competindo por atenção.

## Design Principles

1. **Espaço em primeiro lugar** — respiro generoso; o vazio faz parte do design.
2. **Hierarquia por tipografia, não por cor/efeito** — serif elegante para o nome, sans calma no resto.
3. **1 accent, com parcimônia** — o verde musgo aparece só em seta/foco/ações; nunca enche a tela.
4. **Suave, não chamativo** — borda 1px, sombra leve, cantos macios; movimento mínimo e elegante.
5. **Mobile-first e humano** — a maioria chega pelo celular; cada toque é fácil e a página parece feita à mão, não gerada.

## Accessibility & Inclusion

WCAG AA nos dois temas (claro/escuro): contraste ≥4.5:1 para texto, ≥3:1 para texto grande.
Alvos de toque ≥44px. `:focus-visible` sempre presente (outline accent), nunca removido.
Cor nunca é o único indicador de estado (ex.: chevron rotaciona além de mudar de cor).
Respeita `prefers-reduced-motion` e `prefers-color-scheme`. Ícones SVG (Lucide), sem emoji;
`aria-label` nos icon-buttons; `<label for>` nos campos; placa do QR sempre clara.
