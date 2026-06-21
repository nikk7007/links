<?php
/* links.php — a "fonte da verdade" dos links.
   GET           -> lista pública em JSON.
   PUT (ou POST) -> substitui a lista inteira no banco, numa transação.
                    Exige sessão ativa (login.php). O front manda o lote completo,
                    igual ao antigo "Publicar".

   IDs são NÚMEROS (AUTO_INCREMENT no MySQL). O front, porém, monta a árvore de
   pastas no navegador antes de salvar e usa ids próprios (números já vindos do
   banco para itens existentes, ou ids temporários "l_x..." para itens novos)
   só para ligar pai<->filho. Por isso, ao gravar, ignoramos os ids recebidos
   como chave e deixamos o banco gerar os números; os ids recebidos servem
   apenas para resolver os vínculos parent_id dentro deste lote. */
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
      'id'       => (int) $r['id'],
      'kind'     => $r['kind'],
      'parentId' => $r['parent_id'] !== null ? (int) $r['parent_id'] : null,
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

  // separa topo (sem pai) dos filhos: o pai precisa existir antes do filho (FK)
  $tops = [];
  $children = [];
  foreach ($items as $it) {
    $pid = $it['parentId'] ?? null;
    if ($pid === null || $pid === '') $tops[] = $it;
    else                              $children[] = $it;
  }

  $pdo = db();
  $pdo->beginTransaction();
  try {
    // CASCADE cuida da auto-referência ao limpar tudo de uma vez
    $pdo->exec("DELETE FROM links");
    $stmt = $pdo->prepare(
      "INSERT INTO links (kind, parent_id, title, subtitle, url, ord, featured)
            VALUES (:kind, :parent_id, :title, :subtitle, :url, :ord, :featured)"
    );

    // id-do-cliente (string) -> id-novo-no-banco (número)
    $map = [];
    $insertRow = function ($it, $parentDbId) use ($stmt, $pdo, &$map) {
      $kind = (($it['kind'] ?? 'link') === 'folder') ? 'folder' : 'link';
      $stmt->execute([
        ':kind'      => $kind,
        // pasta é sempre topo e não tem URL (espelha store.js)
        ':parent_id' => $kind === 'folder' ? null : $parentDbId,
        ':title'     => trim((string) ($it['title'] ?? '')),
        ':subtitle'  => trim((string) ($it['subtitle'] ?? '')),
        ':url'       => $kind === 'folder' ? '' : sanitize_url($it['url'] ?? ''),
        ':ord'       => (int) ($it['order'] ?? 0),
        ':featured'  => (!empty($it['featured']) && $kind === 'link') ? 1 : 0,
      ]);
      $newId = (int) $pdo->lastInsertId();
      $clientId = (string) ($it['id'] ?? '');
      if ($clientId !== '') $map[$clientId] = $newId;
      return $newId;
    };

    // 1ª passada: pastas e links de topo (ganham o número que vira parent dos filhos)
    foreach ($tops as $it) $insertRow($it, null);
    // 2ª passada: filhos, resolvendo parent_id para o número novo (órfão -> topo)
    foreach ($children as $it) {
      $clientParent = (string) ($it['parentId'] ?? '');
      $parentDbId = $map[$clientParent] ?? null;
      $insertRow($it, $parentDbId);
    }

    $pdo->commit();
  } catch (Throwable $e) {
    $pdo->rollBack();
    json_out(['error' => 'save_failed'], 500);
  }

  json_out(['ok' => true, 'count' => count($items)]);
}

json_out(['error' => 'method'], 405);
