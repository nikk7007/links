<?php
/* db.php — conexão única (PDO) com o MySQL. Credenciais via cfg() (helpers.php),
   que aceita .env acima do public_html ou api/config.php. */
require_once __DIR__ . '/helpers.php';

function db() {
  static $pdo = null;
  if ($pdo) return $pdo;

  $cfg = cfg();
  $dsn = "mysql:host={$cfg['db_host']};dbname={$cfg['db_name']};charset={$cfg['db_charset']}";

  $pdo = new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
  ]);
  return $pdo;
}
