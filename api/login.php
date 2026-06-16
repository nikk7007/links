<?php
/* login.php — autenticação do painel por senha.
   GET  -> diz se a sessão atual está autenticada.
   POST -> { "password": "..." }: confere contra o hash e abre a sessão. */
require __DIR__ . '/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  start_admin_session();
  json_out(['authenticated' => !empty($_SESSION['admin'])]);
}

if ($method === 'POST') {
  // trava de força bruta: barra o IP após muitas falhas seguidas
  if (login_is_blocked()) {
    json_out(['error' => 'too_many', 'authenticated' => false], 429);
  }
  $pass = (string) (body_json()['password'] ?? '');
  if ($pass !== '' && password_verify($pass, cfg()['admin_pass_hash'])) {
    start_admin_session();
    session_regenerate_id(true); // evita fixação de sessão após o login
    $_SESSION['admin'] = true;
    login_reset(); // zera o contador de tentativas
    json_out(['authenticated' => true]);
  }
  login_register_failure();
  usleep(400000); // pequena pausa: desacelera tentativas de força bruta
  json_out(['error' => 'invalid', 'authenticated' => false], 401);
}

json_out(['error' => 'method'], 405);
