# Setup da API (Hostinger — PHP + MySQL)

Passo a passo para ligar os links ao MySQL. Faz uma vez só.

## 1. Criar o banco MySQL
hPanel → **Bancos de dados → Bancos de dados MySQL**:
1. Crie um banco (ex.: `links`) e um usuário, com senha forte.
2. Anote os 4 valores: **host** (`localhost`), **nome do banco**, **usuário**, **senha**.

## 2. Criar a tabela e migrar os links atuais
hPanel → **phpMyAdmin** → selecione o banco → aba **SQL** →
cole o conteúdo de [`schema.sql`](schema.sql) → **Executar**.
Isso cria a tabela `links` já com os 8 links de hoje.

## 3. Configurar credenciais
1. Copie `config.sample.php` para **`config.php`** (mesma pasta `api/`).
2. Preencha `db_name`, `db_user`, `db_pass` com os dados do passo 1.
3. `config.php` **não** vai pro Git (está no `.gitignore`) — preencha direto no servidor.

## 4. Definir a senha do painel
Gere o hash da senha pelo **terminal** (SSH/Terminal do hPanel) — nunca pelo
navegador. Use uma das opções:

```
php api/make-hash.php SUA_SENHA_DO_PAINEL
```

ou, sem depender do arquivo:

```
php -r "echo password_hash('SUA_SENHA_DO_PAINEL', PASSWORD_DEFAULT), PHP_EOL;"
```

Copie o hash gerado (`$2y$...`) e cole em `admin_pass_hash` no `config.php`.

> `make-hash.php` recusa execução via web e o `.htaccess` bloqueia o acesso
> direto a ele — não há endpoint público de geração de hash.

## 5. Subir os arquivos
Envie tudo (FTP ou Gerenciador de Arquivos do hPanel) para a pasta pública
(`public_html`), mantendo a estrutura: `index.html`, `admin/`, `js/`, `css/`,
`assets/`, `vendor/` e `api/`.

## 6. Testar
- Página pública: abre e mostra os links (vindos do MySQL).
- `https://SEU-DOMINIO/api/links.php` → deve devolver um JSON com os links.
- Admin (`/admin/`): edite algo, digite a **senha do painel** e clique **Publicar**.
  Recarregue a página pública: a mudança aparece.

## 7. Deploy automático (GitHub Actions via FTP)
O repositório tem um workflow ([`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml))
que, a cada push na `main`, envia **só o necessário** pro `public_html` por FTP
(`docs/`, `.impeccable/`, `.github/` e arquivos de dev ficam de fora; o
`api/config.php` do servidor nunca é tocado).

Para ativar, crie uma conta FTP no hPanel (**Arquivos → Contas FTP**) e cadastre
3 secrets no GitHub (**Settings → Secrets and variables → Actions → New repository secret**):

| Secret | Valor |
|---|---|
| `FTP_HOST` | host FTP (ex.: `ftp.seudominio.com` ou o IP mostrado no hPanel) |
| `FTP_USERNAME` | usuário da conta FTP |
| `FTP_PASSWORD` | senha da conta FTP |

> Se a conta FTP já abrir **dentro** do `public_html`, troque `server-dir` no
> workflow de `/public_html/` para `./`. O primeiro deploy envia tudo; os
> seguintes mandam só o que mudou.

## Como funciona
- **`links.php`** — `GET` lista os links (público); `PUT` substitui a lista
  inteira no banco (exige sessão).
- **`login.php` / `logout.php`** — senha → cookie de sessão. Sem token no navegador.
- O admin continua editando local (rascunho em `localStorage`); **Publicar**
  manda o lote para o MySQL.
- Se a API estiver fora do ar, a página cai no `js/mock.js` (cópia offline).

## Segurança
- `config.php` (credenciais) fica fora do Git e o `.htaccess` bloqueia acesso direto.
- A senha do painel é guardada como **hash** (`password_hash`), nunca em texto puro.
- Toda a escrita passa por sessão; a leitura é pública (como deve ser num linktree).
- Sirva o site por **HTTPS** (Hostinger oferece SSL grátis) para o cookie de sessão
  viajar seguro.
