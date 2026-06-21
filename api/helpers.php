<?php
/* helpers.php — utilidades comuns às rotas: config, resposta JSON, sessão do
   admin e a mesma whitelist de URL usada no front (store.js / admin.js). */

/* Carrega as credenciais procurando em vários lugares, para o arquivo de
   segredos poder ficar FORA do diretório de deploy (assim o deploy por Git não
   o apaga). Aceita .env (chave=valor) OU config.php (return [...]).
   Ordem de procura:
     1. LINKS_CONFIG (caminho completo p/ .env ou .php), se a env var existir;
     2. .env na pasta ACIMA da raiz web (irmão de public_html) — RECOMENDADO:
        fora do repo, sobrevive a todos os deploys por Git;
     3. links_config.php acima da raiz web (mesma ideia, formato PHP);
     4. .env na raiz do projeto;
     5. api/config.php (dentro do projeto) — usado em local/Docker. */
function cfg() {
  static $c = null;
  if ($c !== null) return $c;
  $webroot = $_SERVER['DOCUMENT_ROOT'] ?? '';
  $cands = [];
  if (getenv('LINKS_CONFIG')) $cands[] = getenv('LINKS_CONFIG');
  if ($webroot) {
    $cands[] = dirname($webroot) . '/.env';
    $cands[] = dirname($webroot) . '/links_config.php';
  }
  $cands[] = dirname(__DIR__) . '/.env';
  $cands[] = __DIR__ . '/config.php';
  foreach ($cands as $p) {
    if (!$p || !is_file($p)) continue;
    $c = (substr($p, -4) === '.php') ? require $p : parse_env_config($p);
    return $c;
  }
  json_out(['error' => 'config_missing'], 500);
}

/* lê um .env simples (KEY=valor, # comentário, aspas opcionais) e mapeia para o
   mesmo formato do config.php. */
function parse_env_config($path) {
  $v = [];
  foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    $line = trim($line);
    if ($line === '' || $line[0] === '#') continue;
    $eq = strpos($line, '=');
    if ($eq === false) continue;
    $key = trim(substr($line, 0, $eq));
    $val = trim(substr($line, $eq + 1));
    if (strlen($val) >= 2 && ($val[0] === '"' || $val[0] === "'") && substr($val, -1) === $val[0]) {
      $val = substr($val, 1, -1); // tira aspas externas
    }
    $v[$key] = $val;
  }
  return [
    'db_host'         => $v['DB_HOST']         ?? 'localhost',
    'db_name'         => $v['DB_NAME']         ?? '',
    'db_user'         => $v['DB_USER']         ?? '',
    'db_pass'         => $v['DB_PASS']         ?? '',
    'db_charset'      => $v['DB_CHARSET']      ?? 'utf8mb4',
    'admin_pass_hash' => $v['ADMIN_PASS_HASH'] ?? '',
    'session_name'    => $v['SESSION_NAME']    ?? 'links_admin',
  ];
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
