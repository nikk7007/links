-- schema.sql — CONFIGURAÇÃO: cria a tabela `links` (estrutura, sem dados).
-- Rode UMA vez no phpMyAdmin (hPanel > Bancos de dados > phpMyAdmin > aba SQL).
-- Para preencher com os links iniciais, rode depois o seed.sql (opcional).
--
-- id é NÚMERO auto-incremento (1, 2, 3, ...). O vínculo pasta->link é feito por
-- parent_id, que aponta para o id (número) da pasta. A FK com ON DELETE CASCADE
-- garante que apagar uma pasta apaga os links dentro dela.

CREATE TABLE IF NOT EXISTS links (
  id        INT UNSIGNED          NOT NULL AUTO_INCREMENT,
  kind      ENUM('link','folder') NOT NULL DEFAULT 'link',
  parent_id INT UNSIGNED          NULL,
  title     VARCHAR(255)          NOT NULL DEFAULT '',
  subtitle  VARCHAR(255)          NOT NULL DEFAULT '',
  url       TEXT                  NULL,
  ord       INT                   NOT NULL DEFAULT 0,
  featured  TINYINT(1)            NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_parent_ord (parent_id, ord),
  CONSTRAINT fk_links_parent FOREIGN KEY (parent_id)
    REFERENCES links (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
