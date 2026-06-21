/* publish.js — publicação no MySQL via api/links.php (carregado SÓ pelo admin).
   O backend (PHP na Hostinger) é a fonte da verdade. "Publicar" grava a lista
   inteira de links no banco, numa transação — igual ao antigo lote, só que o
   destino agora é o MySQL, não o GitHub.
   A escrita é protegida por SESSÃO: o painel faz login com a senha (POST
   api/login.php) e o cookie de sessão autoriza o PUT. Nada de token no navegador.
   Mantém um rascunho local: cada mudança no Store vai para localStorage, então
   as edições sobrevivem ao refresh antes de publicar. */
window.Publish = (function () {
  const API = "../api/"; // admin/ -> raiz -> api/

  const K_DRAFT = "links:draft";
  const K_PUBLISHED = "links:published";

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
    del(k) { try { localStorage.removeItem(k); } catch (_) {} },
  };

  // rascunho salvo de uma sessão anterior (app.js usa como seed se existir)
  function initialData() {
    try {
      const raw = store.get(K_DRAFT);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  const panel = document.getElementById("publish-panel");
  if (!panel) return { initialData };

  /* ---------- elementos ---------- */
  const statusEl = document.getElementById("pub-status");
  const statusText = document.getElementById("pub-status-text");
  const fieldPass = document.getElementById("field-pass");
  const passInput = document.getElementById("f-pass");
  const sessActive = document.getElementById("sess-active");
  const logoutBtn = document.getElementById("logout-btn");
  const errEl = document.getElementById("e-pub");
  const publishBtn = document.getElementById("publish-btn");
  const discardBtn = document.getElementById("discard-btn");

  const ICON_ALERT =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';

  /* ---------- estado dirty (atual vs. último publicado) ---------- */
  const hadDraft = !!store.get(K_DRAFT);
  let firstEmit = true;
  let current = "[]";
  let authed = false;

  function serialize(list) {
    return JSON.stringify(list);
  }

  function isDirty() {
    const published = store.get(K_PUBLISHED);
    if (published) return current !== published;
    return hadDraft;
  }

  function updateStatus() {
    const dirty = isDirty();
    if (statusEl) statusEl.classList.toggle("is-dirty", dirty);
    if (statusText) {
      statusText.textContent = dirty
        ? "Há alterações não publicadas."
        : "Tudo publicado.";
    }
  }

  Store.subscribe((list) => {
    current = serialize(list);
    store.set(K_DRAFT, current); // rascunho sobrevive ao refresh
    if (firstEmit) {
      firstEmit = false;
      if (!hadDraft && !store.get(K_PUBLISHED)) store.set(K_PUBLISHED, current);
    }
    updateStatus();
  });

  /* ---------- sessão ---------- */
  function refreshAuthUI() {
    if (fieldPass) fieldPass.hidden = authed;
    if (sessActive) sessActive.hidden = !authed;
  }
  async function checkAuth() {
    try {
      const res = await fetch(API + "login.php", { headers: { Accept: "application/json" } });
      if (res.ok) authed = !!(await res.json()).authenticated;
    } catch (_) {}
    refreshAuthUI();
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try { await fetch(API + "logout.php"); } catch (_) {}
      authed = false;
      refreshAuthUI();
      if (passInput) passInput.focus();
    });
  }
  checkAuth();

  /* ---------- erro ---------- */
  function setError(msg) {
    if (!errEl) return;
    if (msg) {
      errEl.innerHTML = `${ICON_ALERT}<span>${UI.escapeHtml(msg)}</span>`;
      errEl.classList.add("is-visible");
    } else {
      errEl.classList.remove("is-visible");
      errEl.textContent = "";
    }
  }

  /* ---------- chamadas à API ---------- */
  async function login(pass) {
    const res = await fetch(API + "login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pass }),
    });
    if (!res.ok) {
      const err = new Error("login");
      err.status = res.status;
      throw err;
    }
    authed = true;
    refreshAuthUI();
  }

  async function putLinks() {
    const res = await fetch(API + "links.php", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Store.getSorted()),
    });
    if (!res.ok) {
      const err = new Error("put");
      err.status = res.status;
      throw err;
    }
  }

  function friendlyError(e) {
    if (e.status === 401) return "Senha incorreta ou sessão expirada.";
    if (e.status === 429) return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
    if (e.status === 400) return "Dados inválidos ao publicar.";
    if (e.status === 500) return "Erro no servidor ao salvar. Tente de novo.";
    if (e.status) return "Erro da API (" + e.status + ").";
    return "Sem conexão com o servidor.";
  }

  /* recarrega a lista do servidor e re-semeia o Store. Depois de publicar, faz
     o painel passar a refletir os ids NUMÉRICOS reais do MySQL (e não os ids
     temporários "l_..." dos itens recém-criados). Não apaga nada se o servidor
     estiver inacessível (evita zerar a tela após um PUT que deu certo). */
  async function reloadFromServer() {
    let data = null;
    try {
      const res = await fetch(API + "links.php", { headers: { Accept: "application/json" } });
      if (res.ok) data = await res.json();
    } catch (_) {}
    if (!Array.isArray(data)) return false;
    Store.seed(data);                // dispara o subscribe: atualiza current e K_DRAFT
    store.set(K_PUBLISHED, current); // o que veio do servidor passa a ser o "publicado"
    updateStatus();
    return true;
  }

  /* ---------- publicar ---------- */
  let publishing = false;
  if (publishBtn) {
    publishBtn.addEventListener("click", async () => {
      if (publishing) return;
      setError("");

      // se não há sessão, precisa de senha já no clique
      let pass = "";
      if (!authed) {
        pass = passInput ? passInput.value.trim() : "";
        if (!pass) {
          setError("Digite a senha do painel para publicar.");
          if (passInput) passInput.focus();
          return;
        }
      }

      publishing = true;
      publishBtn.disabled = true;
      publishBtn.textContent = "Publicando…";
      try {
        if (!authed) {
          await login(pass);
          if (passInput) passInput.value = "";
        }
        await putLinks();
        // re-sincroniza com o banco: o painel passa a mostrar os ids numéricos
        await reloadFromServer();
        store.set(K_PUBLISHED, current);
        updateStatus();
        publishBtn.classList.add("is-success");
        publishBtn.textContent = "Publicado!";
        if (statusText) statusText.textContent = "Publicado no servidor.";
        setTimeout(() => {
          publishBtn.classList.remove("is-success");
          publishBtn.textContent = "Publicar";
          updateStatus();
        }, 2500);
      } catch (e) {
        setError(friendlyError(e));
        publishBtn.textContent = "Publicar";
      } finally {
        publishing = false;
        publishBtn.disabled = false;
      }
    });
  }

  /* ---------- descartar rascunho (recarrega do servidor) ---------- */
  if (discardBtn) {
    discardBtn.addEventListener("click", async () => {
      if (isDirty() && !confirm("Descartar as alterações não publicadas?")) return;
      await reloadFromServer(); // joga fora o rascunho local e recarrega do banco
    });
  }

  return { initialData };
})();
