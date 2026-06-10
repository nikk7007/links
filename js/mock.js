/* mock.js — dados dos links. GERADO pelo painel admin (Publicar);
   editar de preferência por lá. Modelo:
   { id, kind:"link"|"folder", parentId, title, subtitle?, url, order, featured? } */
window.MOCK_LINKS = [
  {
    "id": "em",
    "kind": "link",
    "parentId": "f-contato",
    "title": "Email",
    "subtitle": "fale comigo",
    "url": "mailto:nik700789@gmail.com",
    "order": 1,
    "featured": false
  },
  {
    "id": "li",
    "kind": "link",
    "parentId": "f-social",
    "title": "LinkedIn",
    "subtitle": "experiência e network",
    "url": "https://www.linkedin.com/in/nikolas-santos-184657398",
    "order": 1,
    "featured": false
  },
  {
    "id": "f-proj",
    "kind": "folder",
    "parentId": null,
    "title": "Projetos",
    "subtitle": "Projetos pessoais",
    "url": "",
    "order": 1,
    "featured": false
  },
  {
    "id": "spin",
    "kind": "link",
    "parentId": "f-proj",
    "title": "Spin",
    "subtitle": "Veja sua sorte",
    "url": "https://nikk7007.github.io/portal/public/spin",
    "order": 1,
    "featured": false
  },
  {
    "id": "gh",
    "kind": "link",
    "parentId": "f-social",
    "title": "GitHub",
    "subtitle": "meus repositórios e projetos",
    "url": "https://github.com/nikk7007",
    "order": 2,
    "featured": false
  },
  {
    "id": "f-social",
    "kind": "folder",
    "parentId": null,
    "title": "Redes sociais",
    "subtitle": "",
    "url": "",
    "order": 2,
    "featured": false
  },
  {
    "id": "f-contato",
    "kind": "folder",
    "parentId": null,
    "title": "Contato",
    "subtitle": "",
    "url": "",
    "order": 3,
    "featured": false
  },
  {
    "id": "ig",
    "kind": "link",
    "parentId": "f-social",
    "title": "Instagram",
    "subtitle": "",
    "url": "https://www.instagram.com/nik.nls/",
    "order": 3,
    "featured": false
  }
];
