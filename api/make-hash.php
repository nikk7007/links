<?php
/* make-hash.php — FERRAMENTA DE USO ÚNICO.
   Abra no navegador: .../api/make-hash.php?p=SUA_SENHA
   Copie o hash gerado para 'admin_pass_hash' no config.php e DEPOIS APAGUE este
   arquivo do servidor (ele permite descobrir hashes de senhas que você digitar). */
header('Content-Type: text/plain; charset=utf-8');

$p = isset($_GET['p']) ? (string) $_GET['p'] : '';
if ($p === '') {
  echo "Use ?p=SUA_SENHA para gerar o hash.\n";
  echo "Depois cole o resultado em config.php (admin_pass_hash) e APAGUE este arquivo.\n";
  exit;
}

echo password_hash($p, PASSWORD_DEFAULT) . "\n";
