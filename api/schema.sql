-- schema.sql — cria a tabela de links e insere os dados atuais (migração inicial).
-- Rode UMA vez no phpMyAdmin (hPanel > Bancos de dados > phpMyAdmin > aba SQL).

CREATE TABLE IF NOT EXISTS links (
  id        VARCHAR(32)            NOT NULL PRIMARY KEY,
  kind      ENUM('link','folder') NOT NULL DEFAULT 'link',
  parent_id VARCHAR(32)           NULL,
  title     VARCHAR(255)          NOT NULL DEFAULT '',
  subtitle  VARCHAR(255)          NOT NULL DEFAULT '',
  url       TEXT                  NULL,
  ord       INT                   NOT NULL DEFAULT 0,
  featured  TINYINT(1)            NOT NULL DEFAULT 0,
  KEY idx_parent_ord (parent_id, ord)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dados atuais (vindos do antigo js/mock.js). Pode rodar de novo sem duplicar.
INSERT INTO links (id, kind, parent_id, title, subtitle, url, ord, featured) VALUES
  ('f-proj',    'folder', NULL,        'Projetos',      'Projetos pessoais',            '',                                                        1, 0),
  ('f-social',  'folder', NULL,        'Redes sociais', '',                             '',                                                        2, 0),
  ('f-contato', 'folder', NULL,        'Contato',       '',                             '',                                                        3, 0),
  ('spin',      'link',   'f-proj',    'Spin',          'Veja sua sorte',               'https://nikk7007.github.io/portal/public/spin',           1, 0),
  ('li',        'link',   'f-social',  'LinkedIn',      'experiência e network',        'https://www.linkedin.com/in/nikolas-santos-184657398',    1, 0),
  ('gh',        'link',   'f-social',  'GitHub',        'meus repositórios e projetos', 'https://github.com/nikk7007',                             2, 0),
  ('ig',        'link',   'f-social',  'Instagram',     '',                             'https://www.instagram.com/nik.nls/',                      3, 0),
  ('em',        'link',   'f-contato', 'Email',         'fale comigo',                  'mailto:nik700789@gmail.com',                              1, 0)
ON DUPLICATE KEY UPDATE
  kind = VALUES(kind), parent_id = VALUES(parent_id), title = VALUES(title),
  subtitle = VALUES(subtitle), url = VALUES(url), ord = VALUES(ord), featured = VALUES(featured);
