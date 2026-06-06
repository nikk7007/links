/* app.js — ponto de entrada: liga theme toggle, conecta Store -> UI e injeta o seed. */
(function () {
  /* theme toggle (escuro = padrão; persiste a escolha em localStorage) */
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const root = document.documentElement;
      const cur = root.getAttribute("data-theme") === "light" ? "light" : "dark";
      const next = cur === "light" ? "dark" : "light";
      // [animation-test] troca instantânea (sem fade global)
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (_) {}
    });
  }

  /* Store -> UI */
  Store.subscribe(UI.renderCards);
  Store.seed(window.MOCK_LINKS || []);
})();
