<?php
/* config.sample.php — MODELO. Copie para config.php (no MESMO diretório) e
   preencha com os dados reais. config.php NÃO vai pro Git (está no .gitignore),
   então suas senhas ficam só no servidor da Hostinger. */
return [
  // Banco de dados MySQL — hPanel > Bancos de dados > "Lista de bancos MySQL".
  // Na hospedagem compartilhada o host quase sempre é "localhost".
  'db_host'    => 'localhost',
  'db_name'    => 'uXXXXXXXX_links',     // nome do banco que você criou
  'db_user'    => 'uXXXXXXXX_admin',     // usuário do banco
  'db_pass'    => 'SENHA_DO_BANCO_AQUI', // senha do usuário do banco
  'db_charset' => 'utf8mb4',

  // Senha do painel admin (NÃO a do banco). Guarde só o HASH, nunca a senha pura.
  // Gere o hash abrindo api/make-hash.php no navegador uma vez e APAGUE o arquivo.
  'admin_pass_hash' => '$2y$10$substitua.pelo.hash.gerado.em.make-hash.php',

  // Nome do cookie de sessão do painel (pode deixar como está).
  'session_name' => 'links_admin',
];
