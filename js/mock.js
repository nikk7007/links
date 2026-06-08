/* mock.js — dados seed (substituídos por persistência real depois).
   Modelo: { id, kind:"link"|"folder", parentId, title, subtitle?, url, order, featured? }
   - featured (link de topo): marca "comece por aqui" — wash accent + selo na vitrine.
   - kind "folder": pasta (sem url; sempre no topo). Links com parentId = id da pasta ficam dentro.
   - kind "link" (padrão): link normal; parentId null = topo. */
window.MOCK_LINKS = [
  // links soltos no topo

  // pasta "Social" + links filhos
  {
    id: "f-proj",
    kind: "folder",
    title: "Projetos",
    subtitle: "Projetos pessoais",
    order: 1,
  },
  {
    id: "li",
    title: "Spin",
    parentId: "f-proj",
    subtitle: "Veja sua sorte",
    url: "https://nikk7007.github.io/portal/public/spin",
    order: 1,
  },

  {
    id: "f-social",
    kind: "folder",
    title: "Redes sociais",
    subtitle: "me acompanhe por aí",
    order: 2,
  },
  {
    id: "li",
    title: "LinkedIn",
    parentId: "f-social",
    subtitle: "experiência e network",
    url: "https://www.linkedin.com/in/nikolas-santos-184657398",
    order: 1,
  },
  {
    id: "gh",
    title: "GitHub",
    parentId: "f-social",
    subtitle: "meus repositórios e projetos",
    url: "https://github.com/nikk7007",
    order: 2,
  },
  {
    id: "ig",
    title: "Instagram",
    parentId: "f-social",
    url: "https://www.instagram.com/nik.nls/",
    order: 3,
  },

  // pasta "Contato" + links filhos
  { id: "f-contato", kind: "folder", title: "Contato", order: 4 },
  {
    id: "em",
    title: "Email",
    parentId: "f-contato",
    subtitle: "fale comigo",
    url: "mailto:nik700789@gmail.com",
    order: 1,
  },
];
