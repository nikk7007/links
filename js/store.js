/* store.js — estado em memória dos links + operações (add/update/remove/sort).
   Notifica os assinantes (UI) a cada mudança. Persistência real fica para depois. */
window.Store = (function () {
  let links = [];
  const listeners = [];

  function uid() {
    return "l_" + Math.random().toString(36).slice(2, 9);
  }

  // mesma whitelist do form do admin; o seed não passa pelo form, então o
  // store também barra protocolos perigosos (ex.: javascript:)
  function safeUrl(v) {
    const s = String(v || "").trim();
    if (!s) return "";
    try {
      const u = new URL(s);
      return ["http:", "https:", "mailto:", "tel:"].includes(u.protocol) ? s : "";
    } catch (_) {
      return "";
    }
  }

  // o banco usa id NUMÉRICO; o front trata id como texto opaco (dataset.id sempre
  // volta string e é comparado com ===). Convertendo aqui, número e string batem.
  function asId(v) {
    return v === null || v === undefined || v === "" ? null : String(v);
  }

  function normalize(l) {
    const kind = l.kind === "folder" ? "folder" : "link";
    return {
      id: asId(l.id) || uid(),
      kind: kind,
      // pasta é sempre topo (1 nível) e não tem URL
      parentId: kind === "folder" ? null : asId(l.parentId),
      title: (l.title || "").trim(),
      subtitle: (l.subtitle || "").trim(),
      url: kind === "folder" ? "" : safeUrl(l.url),
      order: Number.isFinite(Number(l.order)) ? Number(l.order) : 0,
      // destaque só faz sentido para link de topo ("comece por aqui")
      featured: kind === "link" && !l.parentId && !!l.featured,
    };
  }

  function emit() {
    const sorted = getSorted();
    listeners.forEach((fn) => fn(sorted));
  }

  function getSorted() {
    return [...links].sort(
      (a, b) => a.order - b.order || a.title.localeCompare(b.title)
    );
  }

  function get(id) {
    return links.find((l) => l.id === id) || null;
  }

  // itens do mesmo grupo (mesmo parentId)
  function siblings(parentId) {
    return links.filter((l) => (l.parentId || null) === (parentId || null));
  }

  // renumera os irmãos sequencialmente (1..k) pela ordem atual
  function reindex(parentId) {
    siblings(parentId)
      .sort((a, b) => a.order - b.order)
      .forEach((l, i) => { l.order = i + 1; });
  }

  // coloca `activeId` na posição pedida e EMPURRA os demais (1 vira 2, etc.)
  function placeAndReindex(activeId, parentId) {
    siblings(parentId)
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        if (a.id === activeId) return -1; // em empate, o item ativo assume a posição
        if (b.id === activeId) return 1;
        return 0;
      })
      .forEach((l, i) => { l.order = i + 1; });
  }

  // árvore (1 nível): itens de topo ordenados; pastas recebem `children`
  function getTree() {
    const sorted = getSorted();
    const top = sorted.filter((l) => !l.parentId);
    return top.map((item) =>
      item.kind === "folder"
        ? { ...item, children: sorted.filter((l) => l.parentId === item.id) }
        : item
    );
  }

  // links diretamente dentro de uma pasta
  function childrenOf(folderId) {
    return getSorted().filter((l) => l.parentId === folderId);
  }

  function seed(data) {
    links = (data || []).map(normalize);
    // normaliza as ordens de cada grupo para 1..k
    [...new Set(links.map((l) => l.parentId || null))].forEach(reindex);
    emit();
  }

  function add(data) {
    const item = normalize(data);
    links.push(item);
    placeAndReindex(item.id, item.parentId);
    emit();
  }

  function update(id, data) {
    const i = links.findIndex((l) => l.id === id);
    if (i === -1) return;
    const oldParent = links[i].parentId || null;
    links[i] = normalize({ ...links[i], ...data, id });
    const newParent = links[i].parentId || null;
    placeAndReindex(id, newParent);
    if (oldParent !== newParent) reindex(oldParent); // fecha o buraco no grupo antigo
    emit();
  }

  // destaque: marca um link de topo como favorito (e desmarca os demais).
  // clicar de novo no já-favorito remove o destaque (nenhum favorito).
  function setFeatured(id) {
    const target = links.find((l) => l.id === id);
    if (!target) return;
    const turnOn = !target.featured;
    links.forEach((l) => {
      if (l.kind === "link" && !l.parentId) l.featured = turnOn && l.id === id;
    });
    emit();
  }

  // remover: se for pasta, remove a pasta E seus links (cascata)
  function remove(id) {
    links = links.filter((l) => l.id !== id && l.parentId !== id);
    emit();
  }

  function subscribe(fn) {
    listeners.push(fn);
  }

  return { seed, add, update, remove, setFeatured, get, getSorted, getTree, childrenOf, subscribe };
})();
