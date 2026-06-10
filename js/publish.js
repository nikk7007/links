/* publish.js — publicação via GitHub (carregado SÓ pelo admin, antes de app.js).
   O GitHub é o "backend": Publicar grava js/mock.js no repo via Contents API com
   um fine-grained token que só o dono tem (salvo no localStorage DESTE navegador).
   O Pages redeploya sozinho (~1 min). Sem token nada é salvo no repo — quem
   protege a escrita é o GitHub, não esta página.
   Também mantém um rascunho local: cada mudança no Store vai para localStorage,
   então as edições sobrevivem ao refresh antes de publicar. */
window.Publish = (function () {
  const REPO = "nikk7007/links";
  const PATH = "js/mock.js";
  const BRANCH = "main";
  const API = `https://api.github.com/repos/${REPO}/contents/${PATH}`;

  const K_DRAFT = "links:draft";
  const K_TOKEN = "links:token";
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
  const fieldToken = document.getElementById("field-token");
  const tokenInput = document.getElementById("f-token");
  const tokenSaved = document.getElementById("token-saved");
  const tokenChange = document.getElementById("token-change");
  const errEl = document.getElementById("e-pub");
  const publishBtn = document.getElementById("publish-btn");
  const discardBtn = document.getElementById("discard-btn");

  const ICON_ALERT =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';

  /* ---------- estado dirty (atual vs. último publicado) ---------- */
  // o seed inicial dispara o primeiro emit; se não havia rascunho, esse estado
  // É o publicado (veio do mock) e vira o snapshot de referência
  const hadDraft = !!store.get(K_DRAFT);
  let firstEmit = true;
  let current = "[]";

  function serialize(list) {
    return JSON.stringify(list);
  }

  function isDirty() {
    const published = store.get(K_PUBLISHED);
    if (published) return current !== published;
    // sem snapshot: rascunho herdado de outra sessão = provavelmente sujo
    return hadDraft;
  }

  function updateStatus() {
    const dirty = isDirty();
    statusEl.classList.toggle("is-dirty", dirty);
    statusText.textContent = dirty
      ? "Há alterações não publicadas."
      : "Tudo publicado.";
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

  /* ---------- token ---------- */
  function refreshTokenUI() {
    const has = !!store.get(K_TOKEN);
    fieldToken.hidden = has;
    tokenSaved.hidden = !has;
  }
  tokenChange.addEventListener("click", () => {
    store.del(K_TOKEN);
    refreshTokenUI();
    tokenInput.focus();
  });
  refreshTokenUI();

  /* ---------- erro ---------- */
  function setError(msg) {
    if (msg) {
      errEl.innerHTML = `${ICON_ALERT}<span>${UI.escapeHtml(msg)}</span>`;
      errEl.classList.add("is-visible");
    } else {
      errEl.classList.remove("is-visible");
      errEl.textContent = "";
    }
  }

  /* ---------- conteúdo do arquivo publicado ---------- */
  function fileContent() {
    return (
      "/* mock.js — dados dos links. GERADO pelo painel admin (Publicar);\n" +
      "   editar de preferência por lá. Modelo:\n" +
      '   { id, kind:"link"|"folder", parentId, title, subtitle?, url, order, featured? } */\n' +
      "window.MOCK_LINKS = " +
      JSON.stringify(Store.getSorted(), null, 2) +
      ";\n"
    );
  }

  // base64 de string UTF-8 (btoa puro quebra com acentos)
  function b64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
  }

  /* ---------- publicar ---------- */
  async function gh(method, url, token, body) {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = new Error("HTTP " + res.status);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  function friendlyError(e) {
    if (e.status === 401) return "Token inválido ou expirado.";
    if (e.status === 403) return "Token sem permissão (precisa de Contents: read & write).";
    if (e.status === 404) return "Repositório/arquivo não encontrado — confira o acesso do token ao repo " + REPO + ".";
    if (e.status === 409) return "Conflito de versão no repo. Tente publicar de novo.";
    if (e.status) return "Erro da API do GitHub (" + e.status + ").";
    return "Sem conexão com a API do GitHub.";
  }

  let publishing = false;
  publishBtn.addEventListener("click", async () => {
    if (publishing) return;
    setError("");

    // token: o salvo, ou o que estiver no campo (e aí salva)
    let token = store.get(K_TOKEN);
    if (!token) {
      token = tokenInput.value.trim();
      if (!token) {
        setError("Cole seu token do GitHub para publicar.");
        tokenInput.focus();
        return;
      }
      store.set(K_TOKEN, token);
      tokenInput.value = "";
      refreshTokenUI();
    }

    publishing = true;
    publishBtn.disabled = true;
    publishBtn.textContent = "Publicando…";
    try {
      const meta = await gh("GET", API + "?ref=" + BRANCH, token);
      await gh("PUT", API, token, {
        message: "Atualiza links via admin",
        content: b64(fileContent()),
        sha: meta.sha,
        branch: BRANCH,
      });
      store.set(K_PUBLISHED, current);
      updateStatus();
      publishBtn.classList.add("is-success");
      publishBtn.textContent = "Publicado!";
      statusText.textContent = "Publicado — o site atualiza em ~1 min.";
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

  /* ---------- descartar rascunho ---------- */
  discardBtn.addEventListener("click", () => {
    if (isDirty() && !confirm("Descartar as alterações não publicadas?")) return;
    store.del(K_DRAFT);
    Store.seed(window.MOCK_LINKS || []);
  });

  return { initialData };
})();
