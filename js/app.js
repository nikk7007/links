/* app.js — ponto de entrada: liga theme toggle, conecta Store -> UI e injeta o seed. */
(function () {
  /* theme toggle (padrão = preferência do sistema; persiste a escolha em localStorage) */
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

  /* compartilhar a página (só no público): share nativo no toque, QR no resto */
  const shareBtn = document.getElementById("share-page");
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const url = location.href.split("#")[0];
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        try { await navigator.share({ title: document.title, url }); } catch (_) {} // cancelar é ok
      } else {
        UI.openQR({ title: "Compartilhar esta página", url }, shareBtn);
      }
    });
  }

  /* Store -> UI; seed: rascunho do admin (se houver) > MySQL (api/links.php).
     A API mora em /api/ na raiz do site; o admin fica em /admin/, então sobe um nível. */
  Store.subscribe(UI.renderCards);

  const apiBase = location.pathname.includes("/admin/") ? "../" : "";

  async function loadInitial() {
    if (window.Publish && Publish.initialData) {
      const draft = Publish.initialData();
      if (draft) return draft; // edição local ainda não publicada tem prioridade
    }
    try {
      const res = await fetch(apiBase + "api/links.php", { headers: { Accept: "application/json" } });
      if (res.ok) return await res.json();
    } catch (_) {} // servidor fora do ar: lista vazia (a fonte da verdade é o MySQL)
    return [];
  }

  loadInitial().then((data) => Store.seed(data));
})();
