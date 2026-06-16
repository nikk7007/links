<?php
/* links.php — a "fonte da verdade" dos links.
   GET           -> lista pública em JSON (mesmo formato do antigo mock.js).
   PUT (ou POST) -> substitui a lista inteira no banco, numa transação.
                    Exige sessão ativa (login.php). O front manda o lote completo,
                    igual ao antigo "Publicar". */
require __DIR__ . '/helpers.php';
require __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $rows = db()->query(
    "SELECT id, kind, parent_id, title, subtitle, url, ord, featured
       FROM links
   ORDER BY ord ASC, title ASC"
  )->fetchAll();

  // MySQL devolve tudo como string; normaliza os tipos para o front
  $out = array_map(function ($r) {
    return [
      'id'       => $r['id'],
      'kind'     => $r['kind'],
      'parentId' => $r['parent_id'] !== null ? $r['parent_id'] : null,
      'title'    => (string) $r['title'],
      'subtitle' => (string) $r['subtitle'],
      'url'      => (string) $r['url'],
      'order'    => (int) $r['ord'],
      'featured' => (bool) $r['featured'],
    ];
  }, $rows);

  json_out($out);
}

if ($method === 'PUT' || $method === 'POST') {
  require_admin();

  $items = body_json();
  if (isset($items['links'])) $items = $items['links']; // aceita {links:[...]} também
  if (!is_array($items)) json_out(['error' => 'bad_payload'], 400);

  $pdo = db();
  $pdo->beginTransaction();
  try {
    $pdo->exec("DELETE FROM links");
    $stmt = $pdo->prepare(
      "INSERT INTO links (id, kind, parent_id, title, subtitle, url, ord, featured)
            VALUES (:id, :kind, :parent_id, :title, :subtitle, :url, :ord, :featured)"
    );
    foreach ($items as $it) {
      $kind = (($it['kind'] ?? 'link') === 'folder') ? 'folder' : 'link';
      $id   = substr((string) ($it['id'] ?? ''), 0, 32);
      if ($id === '') $id = 'l_' . substr(bin2hex(random_bytes(4)), 0, 7);
      $stmt->execute([
        ':id'        => $id,
        ':kind'      => $kind,
        // pasta é sempre topo e não tem URL (espelha store.js)
        ':parent_id' => $kind === 'folder' ? null : (($it['parentId'] ?? null) ?: null),
        ':title'     => trim((string) ($it['title'] ?? '')),
        ':subtitle'  => trim((string) ($it['subtitle'] ?? '')),
        ':url'       => $kind === 'folder' ? '' : sanitize_url($it['url'] ?? ''),
        ':ord'       => (int) ($it['order'] ?? 0),
        ':featured'  => (!empty($it['featured']) && $kind === 'link') ? 1 : 0,
      ]);
    }
    $pdo->commit();
  } catch (Throwable $e) {
    $pdo->rollBack();
    json_out(['error' => 'save_failed'], 500);
  }

  json_out(['ok' => true, 'count' => count($items)]);
}

json_out(['error' => 'method'], 405);
