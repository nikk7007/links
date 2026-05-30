/* ui.js — render dos cards, formulário (add/editar) e modal de QR.
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
    alert: `<svg ${A}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>`,
  };

  /* ---------- elementos ---------- */
  const cardsEl = document.getElementById("cards");
  const emptyEl = document.getElementById("empty");

  const form = document.getElementById("card-form");
  const formTitle = document.getElementById("form-title");
  const submitBtn = document.getElementById("submit-btn");
  const cancelBtn = document.getElementById("cancel-btn");
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

  const modal = document.getElementById("qr-modal");
  const qrCanvas = document.getElementById("qr-canvas");
  const qrUrl = document.getElementById("qr-url");
  const qrTitle = document.getElementById("qr-title");
  let qrTrigger = null;
  let qrFilename = "qrcode.png";

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

  /* ---------- render ---------- */
  function renderCards(list) {
    cardsEl.innerHTML = "";
    emptyEl.hidden = list.length > 0;

    list.forEach((l, i) => {
      const t = escapeHtml(l.title);
      const li = document.createElement("li");
      li.className = "card";
      li.dataset.id = l.id;
      li.style.animationDelay = i * 40 + "ms";
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
          <button class="icon-btn" type="button" data-action="edit" aria-label="Editar ${t}">${ICONS.edit}</button>
          <button class="icon-btn icon-btn--danger" type="button" data-action="remove" aria-label="Remover ${t}">${ICONS.trash}</button>
        </div>
        <span class="card__arrow" aria-hidden="true">${ICONS.arrow}</span>`;
      cardsEl.appendChild(li);
    });
  }

  cardsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.closest(".card").dataset.id;
    const link = Store.get(id);
    if (!link) return;
    if (btn.dataset.action === "qr") openQR(link, btn);
    else if (btn.dataset.action === "edit") startEdit(link);
    else if (btn.dataset.action === "remove") removeLink(link);
  });

  /* ---------- validação ---------- */
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
    const v = fields.url.value.trim();
    if (!v) { setError("url", "Informe a URL do link."); return false; }
    let u;
    try { u = new URL(v); } catch (_) {
      setError("url", "URL inválida. Use o formato https://exemplo.com");
      return false;
    }
    const ok = ["http:", "https:", "mailto:", "tel:"].includes(u.protocol);
    if (!ok) { setError("url", "Use http://, https://, mailto: ou tel:"); return false; }
    setError("url", ""); return true;
  }
  function validateOrder() {
    const v = fields.order.value.trim();
    if (v === "") { setError("order", ""); return true; } // vazio = ordem automática
    if (!Number.isFinite(Number(v))) { setError("order", "A ordem deve ser um número."); return false; }
    setError("order", ""); return true;
  }

  fields.title.addEventListener("blur", validateTitle);
  fields.url.addEventListener("blur", validateUrl);
  fields.order.addEventListener("blur", validateOrder);
  ["title", "url", "order"].forEach((n) =>
    fields[n].addEventListener("input", () => {
      if (fields[n].getAttribute("aria-invalid")) setError(n, "");
    })
  );

  function nextOrder() {
    const list = Store.getSorted();
    return list.length ? Math.max(...list.map((l) => l.order)) + 1 : 1;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const valid = [validateTitle(), validateUrl(), validateOrder()].every(Boolean);
    if (!valid) {
      const firstBad = ["title", "url", "order"].find((n) => fields[n].getAttribute("aria-invalid"));
      if (firstBad) fields[firstBad].focus();
      return;
    }
    const data = {
      title: fields.title.value.trim(),
      subtitle: fields.subtitle.value.trim(),
      url: fields.url.value.trim(),
      order: fields.order.value.trim() === "" ? nextOrder() : Number(fields.order.value),
    };
    if (editingId) Store.update(editingId, data);
    else Store.add(data);
    resetForm();
    flashSuccess();
  });

  function startEdit(link) {
    editingId = link.id;
    fields.title.value = link.title;
    fields.subtitle.value = link.subtitle || "";
    fields.url.value = link.url;
    fields.order.value = link.order;
    formTitle.textContent = "Editar link";
    submitBtn.textContent = "Salvar";
    cancelBtn.hidden = false;
    ["title", "url", "order"].forEach((n) => setError(n, ""));
    document.querySelector(".form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    fields.title.focus();
  }

  function resetForm() {
    editingId = null;
    form.reset();
    formTitle.textContent = "Adicionar link";
    submitBtn.textContent = "Adicionar";
    cancelBtn.hidden = true;
    ["title", "url", "order"].forEach((n) => setError(n, ""));
  }
  cancelBtn.addEventListener("click", resetForm);

  function removeLink(link) {
    if (!confirm(`Remover o link “${link.title}”?`)) return;
    if (editingId === link.id) resetForm();
    Store.remove(link.id);
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

  /* ---------- modal QR ---------- */
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

  return { renderCards };
})();
