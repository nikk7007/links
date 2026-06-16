<?php
/* helpers.php — utilidades comuns às rotas: config, resposta JSON, sessão do
   admin e a mesma whitelist de URL usada no front (store.js / admin.js). */

function cfg() {
  static $c = null;
  if (!$c) $c = require __DIR__ . '/config.php';
  return $c;
}

function json_out($data, $code = 200) {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function body_json() {
  $raw  = file_get_contents('php://input');
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

/* sessão do painel: cookie httponly, mesmo site, seguro quando há HTTPS */
function start_admin_session() {
  if (session_status() === PHP_SESSION_ACTIVE) return;
  session_name(cfg()['session_name']);
  session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Strict',
    'secure'   => !empty($_SERVER['HTTPS']),
  ]);
  session_start();
}

/* barra a escrita se não houver sessão ativa (responde 401 e encerra) */
function require_admin() {
  start_admin_session();
  if (empty($_SESSION['admin'])) json_out(['error' => 'unauthorized'], 401);
}

/* mesma whitelist do front: só http/https/mailto/tel passam (barra javascript: etc.) */
function sanitize_url($v) {
  $s = trim((string) $v);
  if ($s === '') return '';
  $scheme = strtolower((string) parse_url($s, PHP_URL_SCHEME));
  return in_array($scheme, ['http', 'https', 'mailto', 'tel'], true) ? $s : '';
}
