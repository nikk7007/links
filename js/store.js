/* store.js — estado em memória dos links + operações (add/update/remove/sort).
   Notifica os assinantes (UI) a cada mudança. Persistência real fica para depois. */
window.Store = (function () {
  let links = [];
  const listeners = [];

  function uid() {
    return "l_" + Math.random().toString(36).slice(2, 9);
  }

  function normalize(l) {
    const kind = l.kind === "folder" ? "folder" : "link";
    return {
      id: l.id || uid(),
      kind: kind,
      // pasta é sempre topo (1 nível) e não tem URL
      parentId: kind === "folder" ? null : (l.parentId || null),
      title: (l.title || "").trim(),
      subtitle: (l.subtitle || "").trim(),
      url: kind === "folder" ? "" : (l.url || "").trim(),
      order: Number.isFinite(Number(l.order)) ? Number(l.order) : 0,
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
    emit();
  }

  function add(data) {
    links.push(normalize(data));
    emit();
  }

  function update(id, data) {
    const i = links.findIndex((l) => l.id === id);
    if (i === -1) return;
    links[i] = normalize({ ...links[i], ...data, id });
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

  return { seed, add, update, remove, get, getSorted, getTree, childrenOf, subscribe };
})();
