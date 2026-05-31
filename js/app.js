/* app.js — ponto de entrada: liga theme toggle, conecta Store -> UI e injeta o seed. */
(function () {
  /* theme toggle (escuro = padrão; persiste a escolha em localStorage) */
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    let themeTimer;
    toggle.addEventListener("click", () => {
      const root = document.documentElement;
      const cur = root.getAttribute("data-theme") === "light" ? "light" : "dark";
      const next = cur === "light" ? "dark" : "light";
      // anima a troca em toda a página (classe temporária; só durante o fade)
      root.classList.add("theme-anim");
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (_) {}
      clearTimeout(themeTimer);
      themeTimer = setTimeout(() => root.classList.remove("theme-anim"), 400);
    });
  }

  /* Store -> UI */
  Store.subscribe(UI.renderCards);
  Store.seed(window.MOCK_LINKS || []);
})();
