/* ui.js — render de cards/pastas + modal QR (comum às duas páginas).
   Modo detectado pela presença de #card-form:
     - admin  → QR/editar/remover nos cards (handlers registrados por admin.js)
     - público (read-only) → cards só com QR; pastas expansíveis (accordion)
   Pastas: 1 nível, topo misto, accordion (só uma aberta por vez, começam fechadas).
   O formulário do painel vive em js/admin.js (carregado só pelo admin), que se
   conecta aqui via UI.registerAdmin. Expõe window.UI.renderCards (assinado pelo
   Store em app.js). */
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
    star: `<svg ${A}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  };

  /* ---------- modo ---------- */
  const ADMIN = !!document.getElementById("card-form");

  /* ---------- elementos comuns ---------- */
  const cardsEl = document.getElementById("cards");
  const emptyEl = document.getElementById("empty");

  const modal = document.getElementById("qr-modal");
  const qrCanvas = document.getElementById("qr-canvas");
  const qrUrl = document.getElementById("qr-url");
  const qrTitle = document.getElementById("qr-title");
  let qrTrigger = null;
  let qrFilename = "qrcode.png";

  // handlers de admin (registrados por admin.js via registerAdmin; vazios no público)
  const admin = { startEdit: null, removeItem: null, onRender: null };
  function registerAdmin(handlers) {
    Object.assign(admin, handlers);
  }

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
  // número de ordem: conceito de ordenação (admin). Na vitrine pública ele não
  // significa nada para o visitante (parece ranking/passo) — então só no admin.
  function orderBadge(n) {
    return ADMIN ? `<span class="card__order">${pad(n)}</span>` : "";
  }
  // estrela clicável (só admin, só link de topo): marca/desmarca o favorito.
  function favStar(l) {
    if (!ADMIN || l.parentId) return "";
    const on = !!l.featured;
    const lbl = on
      ? `Remover destaque de ${escapeHtml(l.title)}`
      : `Marcar ${escapeHtml(l.title)} como destaque`;
    return (
      `<button class="icon-btn icon-btn--star${on ? " is-active" : ""}" type="button" ` +
      `data-action="fav" aria-pressed="${on}" aria-label="${lbl}">${ICONS.star}</button>`
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
    li.className = "card" + (l.featured ? " card--featured" : "");
    li.dataset.id = l.id;
    li.innerHTML = `
      ${orderBadge(l.order)}
      <div class="card__body">
        ${(l.featured && !ADMIN) ? `<span class="card__badge">${ICONS.star}<span>Em destaque</span></span>` : ""}
        <a class="card__link" href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">
          <span class="card__title">${t}</span>
        </a>
        ${l.subtitle ? `<span class="card__subtitle">${escapeHtml(l.subtitle)}</span>` : ""}
      </div>
      <div class="card__actions">
        ${favStar(l)}
        <button class="icon-btn" type="button" data-action="qr" aria-label="Gerar QR code de ${t}">${ICONS.qr}</button>
        ${adminActions(t)}
      </div>
      ${ADMIN ? "" : `<span class="card__arrow" aria-hidden="true">${ICONS.arrow}</span>`}`;
    return li;
  }

  /* ---------- render: pasta (accordion) ---------- */
  function buildFolder(folder) {
    const t = escapeHtml(folder.title);
    const open = folder.id === openFolderId;
    const panelId = "ch-" + folder.id;
    const childCount = (folder.children || []).length;
    const li = document.createElement("li");
    li.className = "folder" + (open ? " is-open" : "");
    li.dataset.id = folder.id;
    li.innerHTML = `
      <div class="folder__row">
        <button class="folder__head" type="button" data-action="toggle"
                aria-expanded="${open ? "true" : "false"}" aria-controls="${panelId}">
          ${orderBadge(folder.order)}
          <span class="folder__icon" aria-hidden="true">${ICONS.folder}</span>
          <span class="folder__body">
            <span class="folder__title">${t}</span>
            ${folder.subtitle ? `<span class="folder__subtitle">${escapeHtml(folder.subtitle)}</span>` : ""}
          </span>
          ${childCount > 0 ? `<span class="folder__count">${childCount} ${childCount === 1 ? "link" : "links"}</span>` : ""}
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
  let firstRender = true;
  function renderCards() {
    const tree = Store.getTree();
    cardsEl.innerHTML = "";
    emptyEl.hidden = tree.length > 0;

    tree.forEach((item, i) => {
      const li = item.kind === "folder" ? buildFolder(item) : buildLinkCard(item);
      // entrada com stagger só na primeira pintura; nos re-renders (add/edit/
      // remove no admin) a lista não "renasce" — aparece já no lugar
      if (firstRender) li.style.animationDelay = 80 + i * 60 + "ms";
      else li.style.animation = "none";
      cardsEl.appendChild(li);
    });
    firstRender = false;

    if (admin.onRender) admin.onRender();
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
    else if (action === "fav") Store.setFeatured(item.id);
    else if (action === "edit" && admin.startEdit) admin.startEdit(item);
    else if (action === "remove" && admin.removeItem) admin.removeItem(item);
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

  return { renderCards, registerAdmin, escapeHtml };
})();
