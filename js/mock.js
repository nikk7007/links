/* mock.js — dados seed (substituídos por persistência real depois).
   Modelo: { id, kind:"link"|"folder", parentId, title, subtitle?, url, order, featured? }
   - featured (link de topo): marca "comece por aqui" — wash accent + selo na vitrine.
   - kind "folder": pasta (sem url; sempre no topo). Links com parentId = id da pasta ficam dentro.
   - kind "link" (padrão): link normal; parentId null = topo. */
window.MOCK_LINKS = [
  // links soltos no topo
  { id: "pf", title: "Portfólio", subtitle: "projetos selecionados",        url: "https://seu-site.dev",          order: 1, featured: true },
  { id: "gh", title: "GitHub",   subtitle: "meus repositórios e projetos", url: "https://github.com/seu-usuario", order: 2 },

  // pasta "Social" + links filhos
  { id: "f-social", kind: "folder", title: "Redes sociais", subtitle: "me acompanhe por aí", order: 3 },
  { id: "li", title: "LinkedIn",    parentId: "f-social", subtitle: "experiência e network", url: "https://linkedin.com/in/seu-usuario", order: 1 },
  { id: "tw", title: "X / Twitter", parentId: "f-social",                                    url: "https://x.com/seu-usuario",          order: 2 },
  { id: "ig", title: "Instagram",   parentId: "f-social",                                    url: "https://instagram.com/seu-usuario",  order: 3 },

  // pasta "Contato" + links filhos
  { id: "f-contato", kind: "folder", title: "Contato", order: 4 },
  { id: "em", title: "Email",     parentId: "f-contato", subtitle: "fale comigo", url: "mailto:voce@exemplo.com", order: 1 },
  { id: "wa", title: "WhatsApp",  parentId: "f-contato",                          url: "https://wa.me/5500000000000", order: 2 },
];
