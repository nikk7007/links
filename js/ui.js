/* ui.js — render de cards/pastas + modal QR (comum) e formulário (só admin).
   Modo detectado pela presença de #card-form:
     - admin  → QR/editar/remover nos cards + formulário (link ou pasta)
     - público (read-only) → cards só com QR; pastas expansíveis (accordion)
   Pastas: 1 nível, topo misto, accordion (só uma aberta por vez, começam fechadas).
   Expõe window.UI.renderCards (assinado pelo Store em app.js). */
window.UI = (function () {
  /* ---------- ícones (Lucide, SVG inline — sem emoji) ---------- */
  const A =
    'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const ICONS = {
    qr: `<svg ${A}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3M21 14v3M14 17.5v3.5M17.5 21H21"/></svg>`,
    edit: `<svg ${A}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
    trash: `<svg ${A}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/></svg>`,
    arrow: `<svg ${A}><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
    chevronDown: `<svg ${A}><path d="m6 9 6 6 6-6"/></svg>`,
    folder: `<svg ${A}><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
    alert: `<svg ${A}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>`,
  };

  /* ---------- modo ---------- */
  const form = document.getElementById("card-form");
  const ADMIN = !!form;

  /* ---------- elementos comuns ---------- */
  const cardsEl = document.getElementById("cards");
  const emptyEl = document.getElementById("empty");

  const modal = document.getElementById("qr-modal");
  const qrCanvas = document.getElementById("qr-canvas");
  const qrUrl = document.getElementById("qr-url");
  const qrTitle = document.getElementById("qr-title");
  let qrTrigger = null;
  let qrFilename = "qrcode.png";

  // handlers de admin (definidos no bloco ADMIN; null no modo público)
  let adminStartEdit = null;
  let adminRemoveItem = null;
  let adminOnRender = null;

  // accordion: id da pasta aberta (persiste entre re-renders)
  let openFolderId = null;

  /* ---------- helpers ---------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }
  function pad(n) { return String(n).padStart(2, "0"); }
  function slug(s) {
    return (
      s.toLowerCase().normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "link"
    );
  }
  function adminActions(t) {
    if (!ADMIN) return "";
    return (
      `<button class="icon-btn" type="button" data-action="edit" aria-label="Editar ${t}">${ICONS.edit}</button>` +
      `<button class="icon-btn icon-btn--danger" type="button" data-action="remove" aria-label="Remover ${t}">${ICONS.trash}</button>`
    );
  }

  /* ---------- render: card de link ---------- */
  function buildLinkCard(l) {
    const t = escapeHtml(l.title);
    const li = document.createElement("li");
    li.className = "card";
    li.dataset.id = l.id;
    li.innerHTML = `
      <span class="card__order">${pad(l.order)}</span>
      <div class="card__body">
        <a class="card__link" href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">
          <span class="card__title">${t}</span>
        </a>
        ${l.subtitle ? `<span class="card__subtitle">${escapeHtml(l.subtitle)}</span>` : ""}
      </div>
      <div class="card__actions">
        <button class="icon-btn" type="button" data-action="qr" aria-label="Gerar QR code de ${t}">${ICONS.qr}</button>
        ${adminActions(t)}
      </div>
      <span class="card__arrow" aria-hidden="true">${ICONS.arrow}</span>`;
    return li;
  }

  /* ---------- render: pasta (accordion) ---------- */
  function buildFolder(folder) {
    const t = escapeHtml(folder.title);
    const open = folder.id === openFolderId;
    const panelId = "ch-" + folder.id;
    const li = document.createElement("li");
    li.className = "folder" + (open ? " is-open" : "");
    li.dataset.id = folder.id;
    li.innerHTML = `
      <div class="folder__row">
        <button class="folder__head" type="button" data-action="toggle"
                aria-expanded="${open ? "true" : "false"}" aria-controls="${panelId}">
          <span class="card__order">${pad(folder.order)}</span>
          <span class="folder__icon" aria-hidden="true">${ICONS.folder}</span>
          <span class="folder__body">
            <span class="folder__title">${t}</span>
            ${folder.subtitle ? `<span class="folder__subtitle">${escapeHtml(folder.subtitle)}</span>` : ""}
          </span>
          <span class="folder__chevron" aria-hidden="true">${ICONS.chevronDown}</span>
        </button>
        ${ADMIN ? `<div class="folder__actions">${adminActions(t)}</div>` : ""}
      </div>
      <div class="folder__panel" id="${panelId}">
        <div class="folder__panel-inner">
          <ul class="folder__children"></ul>
        </div>
      </div>`;

    const ul = li.querySelector(".folder__children");
    const children = folder.children || [];
    if (children.length) {
      children.forEach((c) => ul.appendChild(buildLinkCard(c)));
    } else {
      const empty = document.createElement("li");
      empty.className = "folder__empty";
      empty.textContent = ADMIN ? "Pasta vazia — adicione links com esta pasta como pai." : "Sem links ainda.";
      ul.appendChild(empty);
    }

    // conteúdo inacessível por teclado/AT quando fechada
    li.querySelector(".folder__panel-inner").inert = !open;
    return li;
  }

  /* ---------- render principal ---------- */
  function renderCards() {
    const tree = Store.getTree();
    cardsEl.innerHTML = "";
    emptyEl.hidden = tree.length > 0;

    tree.forEach((item, i) => {
      const li = item.kind === "folder" ? buildFolder(item) : buildLinkCard(item);
      li.style.animationDelay = 80 + i * 60 + "ms";
      cardsEl.appendChild(li);
    });

    if (adminOnRender) adminOnRender();
  }

  /* ---------- accordion ---------- */
  function setFolderOpen(li, open) {
    li.classList.toggle("is-open", open);
    li.querySelector(".folder__head").setAttribute("aria-expanded", String(open));
    li.querySelector(".folder__panel-inner").inert = !open;
  }
  function toggleFolder(li) {
    const id = li.dataset.id;
    if (openFolderId === id) { openFolderId = null; setFolderOpen(li, false); return; }
    if (openFolderId) {
      const prev = cardsEl.querySelector('.folder[data-id="' + openFolderId + '"]');
      if (prev) setFolderOpen(prev, false);
    }
    openFolderId = id;
    setFolderOpen(li, true);
  }

  /* ---------- delegação de clique ---------- */
  cardsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const host = btn.closest(".card, .folder");
    const action = btn.dataset.action;
    if (action === "toggle") { toggleFolder(host); return; }
    const item = Store.get(host.dataset.id);
    if (!item) return;
    if (action === "qr") openQR(item, btn);
    else if (action === "edit" && adminStartEdit) adminStartEdit(item);
    else if (action === "remove" && adminRemoveItem) adminRemoveItem(item);
  });

  /* ---------- modal QR (comum) ---------- */
  function openQR(link, trigger) {
    qrTrigger = trigger || null;
    qrTitle.textContent = link.title;
    qrUrl.textContent = link.url;
    qrFilename = "qr-" + slug(link.title) + ".png";
    QR.render(qrCanvas, link.url);
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
  }
  function closeQR() {
    if (modal.open) modal.close();
    else modal.removeAttribute("open");
  }
  modal.addEventListener("click", (e) => { if (e.target === modal) closeQR(); }); // backdrop
  modal.addEventListener("close", () => {
    qrCanvas.innerHTML = "";
    if (qrTrigger) { qrTrigger.focus(); qrTrigger = null; }
  });
  document.getElementById("qr-close").addEventListener("click", closeQR);
  document.getElementById("qr-close-2").addEventListener("click", closeQR);
  document.getElementById("qr-download").addEventListener("click", () => QR.download(qrCanvas, qrFilename));

  /* ---------- formulário (somente admin) ---------- */
  if (ADMIN) {
    const formTitle = document.getElementById("form-title");
    const submitBtn = document.getElementById("submit-btn");
    const cancelBtn = document.getElementById("cancel-btn");
    const kindChk = document.getElementById("f-kind");
    const parentSel = document.getElementById("f-parent");
    const fieldUrl = document.getElementById("field-url");
    const fieldParent = document.getElementById("field-parent");
    const fields = {
      title: document.getElementById("f-title"),
      subtitle: document.getElementById("f-subtitle"),
      url: document.getElementById("f-url"),
      order: document.getElementById("f-order"),
    };
    const errors = {
      title: document.getElementById("e-title"),
      url: document.getElementById("e-url"),
      order: document.getElementById("e-order"),
    };
    let editingId = null;

    function isFolder() { return kindChk.checked; }

    // progressive disclosure: URL/pasta-pai só fazem sentido para link
    function applyKindVisibility() {
      const folder = isFolder();
      fieldUrl.hidden = folder;
      fieldParent.hidden = folder;
      if (folder) setError("url", "");
    }

    // repovoa o <select> de pasta pai com as pastas existentes (preserva seleção válida)
    function refreshParentOptions() {
      const folders = Store.getSorted().filter((l) => l.kind === "folder" && l.id !== editingId);
      const current = parentSel.value;
      parentSel.innerHTML =
        '<option value="">— nenhuma (topo) —</option>' +
        folders.map((f) => `<option value="${f.id}">${escapeHtml(f.title)}</option>`).join("");
      if (folders.some((f) => f.id === current)) parentSel.value = current;
    }

    function setError(name, msg) {
      const inp = fields[name];
      const err = errors[name];
      if (msg) {
        inp.setAttribute("aria-invalid", "true");
        err.innerHTML = `${ICONS.alert}<span>${escapeHtml(msg)}</span>`;
        err.classList.add("is-visible");
      } else {
        inp.removeAttribute("aria-invalid");
        err.classList.remove("is-visible");
        err.textContent = "";
      }
    }
    function validateTitle() {
      if (!fields.title.value.trim()) { setError("title", "Informe um título."); return false; }
      setError("title", ""); return true;
    }
    function validateUrl() {
      if (isFolder()) { setError("url", ""); return true; } // pasta não tem URL
      const v = fields.url.value.trim();
      if (!v) { setError("url", "Informe a URL do link."); return false; }
      let u;
      try { u = new URL(v); } catch (_) {
        setError("url", "URL inválida. Use o formato https://exemplo.com");
        return false;
      }
      if (!["http:", "https:", "mailto:", "tel:"].includes(u.protocol)) {
        setError("url", "Use http://, https://, mailto: ou tel:");
        return false;
      }
      setError("url", ""); return true;
    }
    function validateOrder() {
      const v = fields.order.value.trim();
      if (v === "") { setError("order", ""); return true; } // vazio = ordem automática
      if (!Number.isFinite(Number(v))) { setError("order", "A ordem deve ser um número."); return false; }
      setError("order", ""); return true;
    }

    kindChk.addEventListener("change", applyKindVisibility);
    fields.title.addEventListener("blur", validateTitle);
    fields.url.addEventListener("blur", validateUrl);
    fields.order.addEventListener("blur", validateOrder);
    ["title", "url", "order"].forEach((n) =>
      fields[n].addEventListener("input", () => {
        if (fields[n].getAttribute("aria-invalid")) setError(n, "");
      })
    );

    // próxima ordem entre os IRMÃOS (mesmo parentId)
    function nextOrder(parentId) {
      const sibs = Store.getSorted().filter((l) => (l.parentId || null) === (parentId || null));
      return sibs.length ? Math.max(...sibs.map((l) => l.order)) + 1 : 1;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const valid = [validateTitle(), validateUrl(), validateOrder()].every(Boolean);
      if (!valid) {
        const firstBad = ["title", "url", "order"].find((n) => fields[n].getAttribute("aria-invalid"));
        if (firstBad) fields[firstBad].focus();
        return;
      }
      const folder = isFolder();
      const parentId = folder ? null : (parentSel.value || null);
      const data = {
        kind: folder ? "folder" : "link",
        parentId: parentId,
        title: fields.title.value.trim(),
        subtitle: fields.subtitle.value.trim(),
        url: folder ? "" : fields.url.value.trim(),
        order: fields.order.value.trim() === "" ? nextOrder(parentId) : Number(fields.order.value),
      };
      if (editingId) Store.update(editingId, data);
      else Store.add(data);
      resetForm();
      flashSuccess();
    });

    function startEdit(item) {
      editingId = item.id;
      kindChk.checked = item.kind === "folder";
      applyKindVisibility();
      refreshParentOptions();
      parentSel.value = item.parentId || "";
      fields.title.value = item.title;
      fields.subtitle.value = item.subtitle || "";
      fields.url.value = item.url || "";
      fields.order.value = item.order;
      formTitle.textContent = item.kind === "folder" ? "Editar pasta" : "Editar link";
      submitBtn.textContent = "Salvar";
      cancelBtn.hidden = false;
      ["title", "url", "order"].forEach((n) => setError(n, ""));
      document.querySelector(".form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
      fields.title.focus();
    }
    function resetForm() {
      editingId = null;
      form.reset();
      kindChk.checked = false;
      applyKindVisibility();
      refreshParentOptions();
      formTitle.textContent = "Adicionar";
      submitBtn.textContent = "Adicionar";
      cancelBtn.hidden = true;
      ["title", "url", "order"].forEach((n) => setError(n, ""));
    }
    cancelBtn.addEventListener("click", resetForm);

    function removeItem(item) {
      let msg = `Remover o link “${item.title}”?`;
      if (item.kind === "folder") {
        const n = Store.childrenOf(item.id).length;
        msg = n
          ? `Remover a pasta “${item.title}” e os ${n} link(s) dentro dela?`
          : `Remover a pasta “${item.title}”?`;
      }
      if (!confirm(msg)) return;
      if (editingId === item.id) resetForm();
      Store.remove(item.id);
    }

    function flashSuccess() {
      submitBtn.classList.add("is-success");
      submitBtn.disabled = true;
      submitBtn.textContent = "Salvo!";
      setTimeout(() => {
        submitBtn.classList.remove("is-success");
        submitBtn.disabled = false;
        submitBtn.textContent = editingId ? "Salvar" : "Adicionar";
      }, 1100);
    }

    // estado inicial dos campos condicionais
    applyKindVisibility();

    // expõe para o escopo externo
    adminStartEdit = startEdit;
    adminRemoveItem = removeItem;
    adminOnRender = refreshParentOptions;
  }

  return { renderCards };
})();
