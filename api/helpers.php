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

/* ---- rate-limit do login: contador por IP em arquivo (funciona em shared host) ----
   Bloqueia novas tentativas após MAX falhas dentro de WINDOW segundos. Como o
   painel tem uma única senha, o brute-force online é o principal vetor. */
const LOGIN_MAX_FAILS = 8;
const LOGIN_WINDOW    = 900; // 15 min

function _login_throttle_file() {
  $ip = $_SERVER['REMOTE_ADDR'] ?? 'cli';
  return sys_get_temp_dir() . '/links_login_' . hash('sha256', $ip) . '.json';
}

function _login_throttle_read() {
  $f = _login_throttle_file();
  if (is_file($f)) {
    $j = json_decode((string) @file_get_contents($f), true);
    if (is_array($j) && isset($j['count'], $j['first'])) return $j;
  }
  return ['count' => 0, 'first' => time()];
}

/* true se o IP estourou o limite dentro da janela atual */
function login_is_blocked() {
  $s = _login_throttle_read();
  if (time() - $s['first'] > LOGIN_WINDOW) return false; // janela expirou
  return $s['count'] >= LOGIN_MAX_FAILS;
}

/* registra uma falha (reinicia a contagem se a janela já expirou) */
function login_register_failure() {
  $s = _login_throttle_read();
  if (time() - $s['first'] > LOGIN_WINDOW) $s = ['count' => 0, 'first' => time()];
  $s['count']++;
  @file_put_contents(_login_throttle_file(), json_encode($s), LOCK_EX);
}

/* limpa o contador após um login bem-sucedido */
function login_reset() {
  @unlink(_login_throttle_file());
}

/* mesma whitelist do front: só http/https/mailto/tel passam (barra javascript: etc.) */
function sanitize_url($v) {
  $s = trim((string) $v);
  if ($s === '') return '';
  $scheme = strtolower((string) parse_url($s, PHP_URL_SCHEME));
  return in_array($scheme, ['http', 'https', 'mailto', 'tel'], true) ? $s : '';
}
