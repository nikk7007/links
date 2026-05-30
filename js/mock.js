/* mock.js — dados seed dos links (substituídos por persistência real depois).
   Modelo: { id, title, subtitle?, url, order } */
window.MOCK_LINKS = [
  { id: "gh", title: "GitHub",      subtitle: "meus repositórios e projetos", url: "https://github.com/seu-usuario",        order: 1 },
  { id: "li", title: "LinkedIn",    subtitle: "experiência e network",         url: "https://linkedin.com/in/seu-usuario",   order: 2 },
  { id: "pf", title: "Portfólio",   subtitle: "projetos selecionados",         url: "https://seu-site.dev",                  order: 3 },
  { id: "tw", title: "X / Twitter",                                            url: "https://x.com/seu-usuario",             order: 4 },
  { id: "em", title: "Email",       subtitle: "fale comigo",                   url: "mailto:voce@exemplo.com",               order: 5 },
];
