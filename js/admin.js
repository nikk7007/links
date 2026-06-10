/* admin.js — formulário do painel (adicionar/editar/remover, link ou pasta).
   Carregado SÓ por admin/index.html, depois de ui.js e antes de app.js:
   registra os handlers em UI.registerAdmin antes do primeiro render (seed).
   A página pública não baixa nada disto. */
(function () {
  const form = document.getElementById("card-form");
  if (!form) return;

  const escapeHtml = UI.escapeHtml;
  const ICON_ALERT =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';

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
      err.innerHTML = `${ICON_ALERT}<span>${escapeHtml(msg)}</span>`;
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

  // conecta no render comum (ui.js); precisa acontecer antes do seed (app.js)
  UI.registerAdmin({ startEdit, removeItem, onRender: refreshParentOptions });
})();
