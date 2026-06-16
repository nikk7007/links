<?php
/* make-hash.php — gera o hash da senha do painel. USO VIA TERMINAL (CLI) apenas.

   Uso:  php api/make-hash.php SUA_SENHA

   Copie o hash gerado ($2y$...) para 'admin_pass_hash' no config.php.
   Por segurança este arquivo RECUSA execução via web: não é um endpoint público
   (rodar bcrypt sob entrada de visitantes seria um vetor de DoS/abuso). O
   .htaccess também bloqueia o acesso direto a ele como reforço. */

if (PHP_SAPI !== 'cli') {
  http_response_code(404);
  exit;
}

$p = $argv[1] ?? '';
if ($p === '') {
  fwrite(STDERR, "Uso: php make-hash.php SUA_SENHA\n");
  exit(1);
}

echo password_hash($p, PASSWORD_DEFAULT) . "\n";
