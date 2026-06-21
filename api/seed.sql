-- seed.sql — DADOS (backup / preenchimento inicial). OPCIONAL.
-- Rode no phpMyAdmin DEPOIS do schema.sql, com a tabela `links` vazia.
-- Serve também de "backup" simples: é só este arquivo que você reexecuta para
-- voltar ao estado inicial de links.
--
-- Os ids são números explícitos só para ligar as pastas (1,2,3) aos seus links
-- (parent_id). As pastas vêm primeiro porque a FK exige o pai antes do filho.
-- A partir daqui o banco continua a numeração sozinho (próximo id = 9).

-- Recomeça do zero (descomente se quiser limpar antes de repreencher):
-- DELETE FROM links;

INSERT INTO links (id, kind, parent_id, title, subtitle, url, ord, featured) VALUES
  (1, 'folder', NULL, 'Projetos',      'Projetos pessoais',            '',                                                     1, 0),
  (2, 'folder', NULL, 'Redes sociais', '',                             '',                                                     2, 0),
  (3, 'folder', NULL, 'Contato',       '',                             '',                                                     3, 0),
  (4, 'link',   1,    'Spin',          'Veja sua sorte',               'https://spin.nikolasleme.com.br',                      1, 0),
  (5, 'link',   2,    'LinkedIn',      'experiência e network',        'https://www.linkedin.com/in/nikolas-santos-184657398', 1, 0),
  (6, 'link',   2,    'GitHub',        'meus repositórios e projetos', 'https://github.com/nikk7007',                          2, 0),
  (7, 'link',   2,    'Instagram',     '',                             'https://www.instagram.com/nik.nls/',                   3, 0),
  (8, 'link',   3,    'Email',         'fale comigo',                  'mailto:nik700789@gmail.com',                           1, 0);
