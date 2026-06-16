<?php
/* logout.php — encerra a sessão do painel. */
require __DIR__ . '/helpers.php';

start_admin_session();
$_SESSION = [];
if (ini_get('session.use_cookies')) {
  $p = session_get_cookie_params();
  setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
}
session_destroy();
json_out(['authenticated' => false]);
