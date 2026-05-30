/* store.js — estado em memória dos links + operações (add/update/remove/sort).
   Notifica os assinantes (UI) a cada mudança. Persistência real fica para depois. */
window.Store = (function () {
  let links = [];
  const listeners = [];

  function uid() {
    return "l_" + Math.random().toString(36).slice(2, 9);
  }

  function normalize(l) {
    return {
      id: l.id || uid(),
      title: (l.title || "").trim(),
      subtitle: (l.subtitle || "").trim(),
      url: (l.url || "").trim(),
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

  function remove(id) {
    links = links.filter((l) => l.id !== id);
    emit();
  }

  function subscribe(fn) {
    listeners.push(fn);
  }

  return { seed, add, update, remove, get, getSorted, subscribe };
})();
