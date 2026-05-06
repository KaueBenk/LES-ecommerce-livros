-- Ajustes de schema
ALTER TABLE solicitacao_troca DROP CONSTRAINT IF EXISTS solicitacao_troca_status_check;
ALTER TABLE solicitacao_troca
  ADD CONSTRAINT solicitacao_troca_status_check
  CHECK (status IN ('EM_TROCA', 'TROCA_AUTORIZADA', 'TROCADO', 'REJEITADA'));

-- Autores
INSERT INTO autor (nome)
SELECT 'Robert C. Martin'
WHERE NOT EXISTS (SELECT 1 FROM autor WHERE nome = 'Robert C. Martin');

INSERT INTO autor (nome)
SELECT 'Gang of Four'
WHERE NOT EXISTS (SELECT 1 FROM autor WHERE nome = 'Gang of Four');

INSERT INTO autor (nome)
SELECT 'Douglas Crockford'
WHERE NOT EXISTS (SELECT 1 FROM autor WHERE nome = 'Douglas Crockford');

INSERT INTO autor (nome)
SELECT 'Martin Fowler'
WHERE NOT EXISTS (SELECT 1 FROM autor WHERE nome = 'Martin Fowler');

INSERT INTO autor (nome)
SELECT 'Hunt & Thomas'
WHERE NOT EXISTS (SELECT 1 FROM autor WHERE nome = 'Hunt & Thomas');

-- Editoras
INSERT INTO editora (nome)
SELECT 'Prentice Hall'
WHERE NOT EXISTS (SELECT 1 FROM editora WHERE nome = 'Prentice Hall');

INSERT INTO editora (nome)
SELECT 'Addison-Wesley'
WHERE NOT EXISTS (SELECT 1 FROM editora WHERE nome = 'Addison-Wesley');

INSERT INTO editora (nome)
SELECT 'O Reilly'
WHERE NOT EXISTS (SELECT 1 FROM editora WHERE nome = 'O Reilly');

-- Fornecedores
INSERT INTO fornecedor (nome, cnpj)
SELECT 'Fornecedor Central', '12345678000199'
WHERE NOT EXISTS (SELECT 1 FROM fornecedor WHERE cnpj = '12345678000199');

INSERT INTO fornecedor (nome, cnpj)
SELECT 'Distribuidora Sul', '98765432000188'
WHERE NOT EXISTS (SELECT 1 FROM fornecedor WHERE cnpj = '98765432000188');

-- Categorias
INSERT INTO categoria (nome, descricao)
SELECT 'Programação', 'Livros sobre linguagens de programação'
WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nome = 'Programação');

INSERT INTO categoria (nome, descricao)
SELECT 'Algoritmos', 'Livros sobre algoritmos e estruturas de dados'
WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nome = 'Algoritmos');

INSERT INTO categoria (nome, descricao)
SELECT 'Web', 'Desenvolvimento web e aplicações'
WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nome = 'Web');

INSERT INTO categoria (nome, descricao)
SELECT 'Arquitetura', 'Arquitetura de sistemas e design'
WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nome = 'Arquitetura');

-- Grupos de Precificação
INSERT INTO grupo_precificacao (nome, margem_lucro)
SELECT 'Geral', 0.5
WHERE NOT EXISTS (SELECT 1 FROM grupo_precificacao WHERE nome = 'Geral');

INSERT INTO grupo_precificacao (nome, margem_lucro)
SELECT 'Lançamentos', 0.8
WHERE NOT EXISTS (SELECT 1 FROM grupo_precificacao WHERE nome = 'Lançamentos');

-- Bandeiras
INSERT INTO bandeira (nome)
SELECT 'Visa'
WHERE NOT EXISTS (SELECT 1 FROM bandeira WHERE nome = 'Visa');

INSERT INTO bandeira (nome)
SELECT 'MasterCard'
WHERE NOT EXISTS (SELECT 1 FROM bandeira WHERE nome = 'MasterCard');

INSERT INTO bandeira (nome)
SELECT 'American Express'
WHERE NOT EXISTS (SELECT 1 FROM bandeira WHERE nome = 'American Express');

-- Cupons promocionais
INSERT INTO cupom_promocional (codigo, valor, valido, data_validade)
SELECT 'PROMO123', 25.00, true, '2099-12-31'
WHERE NOT EXISTS (SELECT 1 FROM cupom_promocional WHERE upper(codigo) = 'PROMO123');

INSERT INTO cupom_promocional (codigo, valor, valido, data_validade)
SELECT 'DESCONTO10', 10.00, true, '2099-12-31'
WHERE NOT EXISTS (SELECT 1 FROM cupom_promocional WHERE upper(codigo) = 'DESCONTO10');

-- Categorias de Ativação/Inativação
INSERT INTO categoria_ativacao (descricao)
SELECT 'Volta ao mercado'
WHERE NOT EXISTS (SELECT 1 FROM categoria_ativacao WHERE descricao = 'Volta ao mercado');

INSERT INTO categoria_ativacao (descricao)
SELECT 'Reposicionamento de marca'
WHERE NOT EXISTS (SELECT 1 FROM categoria_ativacao WHERE descricao = 'Reposicionamento de marca');

INSERT INTO categoria_inativacao (descricao)
SELECT 'Fora de mercado'
WHERE NOT EXISTS (SELECT 1 FROM categoria_inativacao WHERE descricao = 'Fora de mercado');

INSERT INTO categoria_inativacao (descricao)
SELECT 'Baixa demanda'
WHERE NOT EXISTS (SELECT 1 FROM categoria_inativacao WHERE descricao = 'Baixa demanda');

-- Parâmetros de sistema
INSERT INTO parametro_sistema (chave, valor, descricao)
SELECT 'CARRINHO_TTL_MINUTOS', '30', 'Tempo de reserva de itens no carrinho (minutos)'
WHERE NOT EXISTS (SELECT 1 FROM parametro_sistema WHERE chave = 'CARRINHO_TTL_MINUTOS');

INSERT INTO parametro_sistema (chave, valor, descricao)
SELECT 'LIVRO_INATIVACAO_VALOR_MINIMO_VENDAS', '200.00', 'Valor mínimo de vendas para manter livro sem estoque ativo'
WHERE NOT EXISTS (SELECT 1 FROM parametro_sistema WHERE chave = 'LIVRO_INATIVACAO_VALOR_MINIMO_VENDAS');

INSERT INTO parametro_sistema (chave, valor, descricao)
SELECT 'FRETE_BASE_VALOR', '10.00', 'Valor base do frete'
WHERE NOT EXISTS (SELECT 1 FROM parametro_sistema WHERE chave = 'FRETE_BASE_VALOR');

INSERT INTO parametro_sistema (chave, valor, descricao)
SELECT 'FRETE_POR_ITEM_VALOR', '1.00', 'Valor adicional de frete por item'
WHERE NOT EXISTS (SELECT 1 FROM parametro_sistema WHERE chave = 'FRETE_POR_ITEM_VALOR');

-- Livros (RN0011)
INSERT INTO livro (
  titulo,
  autor_id,
  ano,
  editora_id,
  edicao,
  isbn,
  numero_paginas,
  sinopse,
  altura,
  largura,
  peso,
  profundidade,
  grupo_precificacao_id,
  codigo_barras,
  valor_venda,
  ativo
)
SELECT
  'Clean Code',
  (SELECT id FROM autor WHERE nome = 'Robert C. Martin' ORDER BY id LIMIT 1),
  2008,
  (SELECT id FROM editora WHERE nome = 'Prentice Hall' ORDER BY id LIMIT 1),
  '1ª',
  '9780132350884',
  464,
  'A Handbook of Agile Software Craftsmanship',
  24.0,
  17.0,
  0.5,
  3.0,
  (SELECT id FROM grupo_precificacao WHERE nome = 'Geral' ORDER BY id LIMIT 1),
  '9780132350884',
  89.90,
  true
WHERE NOT EXISTS (SELECT 1 FROM livro WHERE isbn = '9780132350884');

INSERT INTO livro (
  titulo,
  autor_id,
  ano,
  editora_id,
  edicao,
  isbn,
  numero_paginas,
  sinopse,
  altura,
  largura,
  peso,
  profundidade,
  grupo_precificacao_id,
  codigo_barras,
  valor_venda,
  ativo
)
SELECT
  'Design Patterns',
  (SELECT id FROM autor WHERE nome = 'Gang of Four' ORDER BY id LIMIT 1),
  1994,
  (SELECT id FROM editora WHERE nome = 'Addison-Wesley' ORDER BY id LIMIT 1),
  '1ª',
  '9780201633610',
  395,
  'Elements of Reusable Object-Oriented Software',
  23.0,
  18.0,
  0.6,
  3.5,
  (SELECT id FROM grupo_precificacao WHERE nome = 'Geral' ORDER BY id LIMIT 1),
  '9780201633610',
  79.90,
  true
WHERE NOT EXISTS (SELECT 1 FROM livro WHERE isbn = '9780201633610');

INSERT INTO livro (
  titulo,
  autor_id,
  ano,
  editora_id,
  edicao,
  isbn,
  numero_paginas,
  sinopse,
  altura,
  largura,
  peso,
  profundidade,
  grupo_precificacao_id,
  codigo_barras,
  valor_venda,
  ativo
)
SELECT
  'Refactoring',
  (SELECT id FROM autor WHERE nome = 'Martin Fowler' ORDER BY id LIMIT 1),
  1999,
  (SELECT id FROM editora WHERE nome = 'Addison-Wesley' ORDER BY id LIMIT 1),
  '1ª',
  '9780201485677',
  431,
  'Improving the Design of Existing Code',
  24.0,
  19.0,
  0.7,
  4.0,
  (SELECT id FROM grupo_precificacao WHERE nome = 'Geral' ORDER BY id LIMIT 1),
  '9780201485677',
  99.90,
  true
WHERE NOT EXISTS (SELECT 1 FROM livro WHERE isbn = '9780201485677');

INSERT INTO livro (
  titulo,
  autor_id,
  ano,
  editora_id,
  edicao,
  isbn,
  numero_paginas,
  sinopse,
  altura,
  largura,
  peso,
  profundidade,
  grupo_precificacao_id,
  codigo_barras,
  valor_venda,
  ativo
)
SELECT
  'The Pragmatic Programmer',
  (SELECT id FROM autor WHERE nome = 'Hunt & Thomas' ORDER BY id LIMIT 1),
  1999,
  (SELECT id FROM editora WHERE nome = 'Addison-Wesley' ORDER BY id LIMIT 1),
  '1ª',
  '9780201616224',
  352,
  'Your Journey to Mastery',
  22.0,
  18.0,
  0.5,
  3.0,
  (SELECT id FROM grupo_precificacao WHERE nome = 'Geral' ORDER BY id LIMIT 1),
  '9780201616224',
  85.90,
  true
WHERE NOT EXISTS (SELECT 1 FROM livro WHERE isbn = '9780201616224');

INSERT INTO livro (
  titulo,
  autor_id,
  ano,
  editora_id,
  edicao,
  isbn,
  numero_paginas,
  sinopse,
  altura,
  largura,
  peso,
  profundidade,
  grupo_precificacao_id,
  codigo_barras,
  valor_venda,
  ativo
)
SELECT
  'JavaScript: The Good Parts',
  (SELECT id FROM autor WHERE nome = 'Douglas Crockford' ORDER BY id LIMIT 1),
  2008,
  (SELECT id FROM editora WHERE nome = 'O Reilly' ORDER BY id LIMIT 1),
  '1ª',
  '9780596517748',
  176,
  'Unearthing the Excellence in JavaScript',
  21.0,
  15.0,
  0.3,
  2.0,
  (SELECT id FROM grupo_precificacao WHERE nome = 'Geral' ORDER BY id LIMIT 1),
  '9780596517748',
  69.90,
  true
WHERE NOT EXISTS (SELECT 1 FROM livro WHERE isbn = '9780596517748');

-- livro_categoria associations
INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT
  (SELECT id FROM livro WHERE isbn = '9780132350884' ORDER BY id LIMIT 1),
  (SELECT id FROM categoria WHERE nome = 'Programação' ORDER BY id LIMIT 1)
WHERE
  (SELECT id FROM livro WHERE isbn = '9780132350884' ORDER BY id LIMIT 1) IS NOT NULL
  AND (SELECT id FROM categoria WHERE nome = 'Programação' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM livro_categoria
    WHERE livro_id = (SELECT id FROM livro WHERE isbn = '9780132350884' ORDER BY id LIMIT 1)
      AND categoria_id = (SELECT id FROM categoria WHERE nome = 'Programação' ORDER BY id LIMIT 1)
  );

INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT
  (SELECT id FROM livro WHERE isbn = '9780201633610' ORDER BY id LIMIT 1),
  (SELECT id FROM categoria WHERE nome = 'Arquitetura' ORDER BY id LIMIT 1)
WHERE
  (SELECT id FROM livro WHERE isbn = '9780201633610' ORDER BY id LIMIT 1) IS NOT NULL
  AND (SELECT id FROM categoria WHERE nome = 'Arquitetura' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM livro_categoria
    WHERE livro_id = (SELECT id FROM livro WHERE isbn = '9780201633610' ORDER BY id LIMIT 1)
      AND categoria_id = (SELECT id FROM categoria WHERE nome = 'Arquitetura' ORDER BY id LIMIT 1)
  );

INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT
  (SELECT id FROM livro WHERE isbn = '9780201485677' ORDER BY id LIMIT 1),
  (SELECT id FROM categoria WHERE nome = 'Programação' ORDER BY id LIMIT 1)
WHERE
  (SELECT id FROM livro WHERE isbn = '9780201485677' ORDER BY id LIMIT 1) IS NOT NULL
  AND (SELECT id FROM categoria WHERE nome = 'Programação' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM livro_categoria
    WHERE livro_id = (SELECT id FROM livro WHERE isbn = '9780201485677' ORDER BY id LIMIT 1)
      AND categoria_id = (SELECT id FROM categoria WHERE nome = 'Programação' ORDER BY id LIMIT 1)
  );

INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT
  (SELECT id FROM livro WHERE isbn = '9780201485677' ORDER BY id LIMIT 1),
  (SELECT id FROM categoria WHERE nome = 'Arquitetura' ORDER BY id LIMIT 1)
WHERE
  (SELECT id FROM livro WHERE isbn = '9780201485677' ORDER BY id LIMIT 1) IS NOT NULL
  AND (SELECT id FROM categoria WHERE nome = 'Arquitetura' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM livro_categoria
    WHERE livro_id = (SELECT id FROM livro WHERE isbn = '9780201485677' ORDER BY id LIMIT 1)
      AND categoria_id = (SELECT id FROM categoria WHERE nome = 'Arquitetura' ORDER BY id LIMIT 1)
  );

INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT
  (SELECT id FROM livro WHERE isbn = '9780201616224' ORDER BY id LIMIT 1),
  (SELECT id FROM categoria WHERE nome = 'Programação' ORDER BY id LIMIT 1)
WHERE
  (SELECT id FROM livro WHERE isbn = '9780201616224' ORDER BY id LIMIT 1) IS NOT NULL
  AND (SELECT id FROM categoria WHERE nome = 'Programação' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM livro_categoria
    WHERE livro_id = (SELECT id FROM livro WHERE isbn = '9780201616224' ORDER BY id LIMIT 1)
      AND categoria_id = (SELECT id FROM categoria WHERE nome = 'Programação' ORDER BY id LIMIT 1)
  );

INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT
  (SELECT id FROM livro WHERE isbn = '9780596517748' ORDER BY id LIMIT 1),
  (SELECT id FROM categoria WHERE nome = 'Web' ORDER BY id LIMIT 1)
WHERE
  (SELECT id FROM livro WHERE isbn = '9780596517748' ORDER BY id LIMIT 1) IS NOT NULL
  AND (SELECT id FROM categoria WHERE nome = 'Web' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM livro_categoria
    WHERE livro_id = (SELECT id FROM livro WHERE isbn = '9780596517748' ORDER BY id LIMIT 1)
      AND categoria_id = (SELECT id FROM categoria WHERE nome = 'Web' ORDER BY id LIMIT 1)
  );

-- Estoque
INSERT INTO estoque (livro_id, quantidade_total, quantidade_bloqueada, quantidade_disponivel)
SELECT
  (SELECT id FROM livro WHERE isbn = '9780132350884' ORDER BY id LIMIT 1),
  50,
  0,
  50
WHERE
  (SELECT id FROM livro WHERE isbn = '9780132350884' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM estoque WHERE livro_id = (SELECT id FROM livro WHERE isbn = '9780132350884' ORDER BY id LIMIT 1)
  );

INSERT INTO estoque (livro_id, quantidade_total, quantidade_bloqueada, quantidade_disponivel)
SELECT
  (SELECT id FROM livro WHERE isbn = '9780201633610' ORDER BY id LIMIT 1),
  40,
  0,
  40
WHERE
  (SELECT id FROM livro WHERE isbn = '9780201633610' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM estoque WHERE livro_id = (SELECT id FROM livro WHERE isbn = '9780201633610' ORDER BY id LIMIT 1)
  );

INSERT INTO estoque (livro_id, quantidade_total, quantidade_bloqueada, quantidade_disponivel)
SELECT
  (SELECT id FROM livro WHERE isbn = '9780201485677' ORDER BY id LIMIT 1),
  35,
  0,
  35
WHERE
  (SELECT id FROM livro WHERE isbn = '9780201485677' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM estoque WHERE livro_id = (SELECT id FROM livro WHERE isbn = '9780201485677' ORDER BY id LIMIT 1)
  );

INSERT INTO estoque (livro_id, quantidade_total, quantidade_bloqueada, quantidade_disponivel)
SELECT
  (SELECT id FROM livro WHERE isbn = '9780201616224' ORDER BY id LIMIT 1),
  50,
  0,
  50
WHERE
  (SELECT id FROM livro WHERE isbn = '9780201616224' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM estoque WHERE livro_id = (SELECT id FROM livro WHERE isbn = '9780201616224' ORDER BY id LIMIT 1)
  );

INSERT INTO estoque (livro_id, quantidade_total, quantidade_bloqueada, quantidade_disponivel)
SELECT
  (SELECT id FROM livro WHERE isbn = '9780596517748' ORDER BY id LIMIT 1),
  60,
  0,
  60
WHERE
  (SELECT id FROM livro WHERE isbn = '9780596517748' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM estoque WHERE livro_id = (SELECT id FROM livro WHERE isbn = '9780596517748' ORDER BY id LIMIT 1)
  );

-- Clientes (Senha padrão: Admin@123)
INSERT INTO cliente (nome, email, cpf, senha, genero, data_nascimento, ranking, role, ativo)
SELECT
  'Admin',
  'admin@admin.com',
  '00000000000',
  '$2b$12$GzZMrdFWIdxmpqN8BQpK0.tahbeapM/loAP2hTpPUBDkUINjiQanu',
  'OUTRO',
  '2000-01-01',
  1000.0,
  'ROLE_ADMIN',
  true
WHERE NOT EXISTS (SELECT 1 FROM cliente WHERE lower(email) = lower('admin@admin.com'));

INSERT INTO cliente (nome, email, cpf, senha, genero, data_nascimento, ranking, role, ativo)
SELECT
  'João Silva',
  'joao@example.com',
  '12345678901',
  '$2b$12$GzZMrdFWIdxmpqN8BQpK0.tahbeapM/loAP2hTpPUBDkUINjiQanu',
  'MASCULINO',
  '1990-01-15',
  250.50,
  'ROLE_CLIENTE',
  true
WHERE NOT EXISTS (SELECT 1 FROM cliente WHERE lower(email) = lower('joao@example.com'));

-- Garantir estado determinístico de credenciais/status para fluxos reais e E2E
UPDATE cliente
SET senha = '$2b$12$GzZMrdFWIdxmpqN8BQpK0.tahbeapM/loAP2hTpPUBDkUINjiQanu',
    ativo = true,
    role = 'ROLE_ADMIN'
WHERE lower(email) = lower('admin@admin.com');

UPDATE cliente
SET senha = '$2b$12$GzZMrdFWIdxmpqN8BQpK0.tahbeapM/loAP2hTpPUBDkUINjiQanu',
    ativo = true,
    role = 'ROLE_CLIENTE'
WHERE lower(email) = lower('joao@example.com');

-- Telefones
INSERT INTO telefone (tipo, ddd, numero, cliente_id)
SELECT
  'CELULAR',
  '11',
  '987654321',
  (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1)
WHERE
  (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM telefone
    WHERE cliente_id = (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1)
      AND tipo = 'CELULAR'
      AND ddd = '11'
      AND numero = '987654321'
  );

-- Endereços
INSERT INTO endereco (
  apelido,
  tipo_residencia,
  tipo_logradouro,
  logradouro,
  numero,
  bairro,
  cep,
  cidade,
  estado,
  pais,
  tipo_endereco,
  cliente_id
)
SELECT
  'Casa',
  'APARTAMENTO',
  'RUA',
  'Rua das Flores',
  '123',
  'Centro',
  '12345678',
  'São Paulo',
  'SP',
  'Brasil',
  'AMBOS',
  (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1)
WHERE
  (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM endereco
    WHERE cliente_id = (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1)
      AND apelido = 'Casa'
      AND logradouro = 'Rua das Flores'
      AND numero = '123'
  );

-- Cartões de Crédito
INSERT INTO cartao_credito (numero, nome_impresso, bandeira_id, codigo_seguranca, preferencial, cliente_id)
SELECT
  '1234567890123456',
  'JOAO SILVA',
  (SELECT id FROM bandeira WHERE nome = 'Visa' ORDER BY id LIMIT 1),
  '123',
  true,
  (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1)
WHERE
  (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1) IS NOT NULL
  AND (SELECT id FROM bandeira WHERE nome = 'Visa' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM cartao_credito
    WHERE cliente_id = (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1)
      AND numero = '1234567890123456'
  );

INSERT INTO cartao_credito (numero, nome_impresso, bandeira_id, codigo_seguranca, preferencial, cliente_id)
SELECT
  '1234567890123457',
  'JOAO SILVA',
  (SELECT id FROM bandeira WHERE nome = 'MasterCard' ORDER BY id LIMIT 1),
  '321',
  false,
  (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1)
WHERE
  (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1) IS NOT NULL
  AND (SELECT id FROM bandeira WHERE nome = 'MasterCard' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM cartao_credito
    WHERE cliente_id = (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1)
      AND numero = '1234567890123457'
  );

INSERT INTO cartao_credito (numero, nome_impresso, bandeira_id, codigo_seguranca, preferencial, cliente_id)
SELECT
  '1234567890123459',
  'JOAO SILVA',
  (SELECT id FROM bandeira WHERE nome = 'Visa' ORDER BY id LIMIT 1),
  '456',
  false,
  (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1)
WHERE
  (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1) IS NOT NULL
  AND (SELECT id FROM bandeira WHERE nome = 'Visa' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM cartao_credito
    WHERE cliente_id = (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1)
      AND numero = '1234567890123459'
  );

-- Pedido sample
INSERT INTO pedido (cliente_id, endereco_entrega, status, valor_frete, valor_total, data_pedido)
SELECT
  (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1),
  'Rua das Flores, 123, Centro, São Paulo, SP, Brasil',
  'ENTREGUE',
  10.0,
  189.80,
  '2026-03-01 10:45:00'
WHERE
  (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM pedido
    WHERE cliente_id = (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1)
      AND data_pedido = '2026-03-01 10:45:00'
  );

-- Itens do Pedido
INSERT INTO item_pedido (pedido_id, livro_id, quantidade, valor_unitario)
SELECT
  (SELECT id FROM pedido WHERE data_pedido = '2026-03-01 10:45:00' ORDER BY id LIMIT 1),
  (SELECT id FROM livro WHERE isbn = '9780132350884' ORDER BY id LIMIT 1),
  2,
  89.90
WHERE
  (SELECT id FROM pedido WHERE data_pedido = '2026-03-01 10:45:00' ORDER BY id LIMIT 1) IS NOT NULL
  AND (SELECT id FROM livro WHERE isbn = '9780132350884' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM item_pedido
    WHERE pedido_id = (SELECT id FROM pedido WHERE data_pedido = '2026-03-01 10:45:00' ORDER BY id LIMIT 1)
      AND livro_id = (SELECT id FROM livro WHERE isbn = '9780132350884' ORDER BY id LIMIT 1)
  );

-- Forma de Pagamento
INSERT INTO forma_pagamento (pedido_id, tipo, valor, cartao_credito_id)
SELECT
  (SELECT id FROM pedido WHERE data_pedido = '2026-03-01 10:45:00' ORDER BY id LIMIT 1),
  'CARTAO_CREDITO',
  189.80,
  (SELECT id FROM cartao_credito WHERE numero = '1234567890123456' ORDER BY id LIMIT 1)
WHERE
  (SELECT id FROM pedido WHERE data_pedido = '2026-03-01 10:45:00' ORDER BY id LIMIT 1) IS NOT NULL
  AND (SELECT id FROM cartao_credito WHERE numero = '1234567890123456' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM forma_pagamento
    WHERE pedido_id = (SELECT id FROM pedido WHERE data_pedido = '2026-03-01 10:45:00' ORDER BY id LIMIT 1)
      AND tipo = 'CARTAO_CREDITO'
      AND valor = 189.80
  );

-- Cupom de troca de exemplo para fluxo de checkout (RF0036 / RN0035 / RN0036)
INSERT INTO cupom_troca (cliente_id, valor, utilizado, data_geracao, pedido_origem_id)
SELECT
  (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1),
  15.00,
  false,
  '2026-03-05 09:00:00',
  (SELECT id FROM pedido WHERE data_pedido = '2026-03-01 10:45:00' ORDER BY id LIMIT 1)
WHERE
  (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1) IS NOT NULL
  AND (SELECT id FROM pedido WHERE data_pedido = '2026-03-01 10:45:00' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM cupom_troca
    WHERE cliente_id = (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1)
      AND valor = 15.00
      AND utilizado = false
      AND pedido_origem_id = (SELECT id FROM pedido WHERE data_pedido = '2026-03-01 10:45:00' ORDER BY id LIMIT 1)
  );

INSERT INTO cupom_troca (cliente_id, valor, utilizado, data_geracao, pedido_origem_id)
SELECT
  (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1),
  12.00,
  false,
  '2026-03-06 09:00:00',
  (SELECT id FROM pedido WHERE data_pedido = '2026-03-01 10:45:00' ORDER BY id LIMIT 1)
WHERE
  (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1) IS NOT NULL
  AND (SELECT id FROM pedido WHERE data_pedido = '2026-03-01 10:45:00' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM cupom_troca
    WHERE cliente_id = (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1)
      AND valor = 12.00
      AND utilizado = false
      AND pedido_origem_id = (SELECT id FROM pedido WHERE data_pedido = '2026-03-01 10:45:00' ORDER BY id LIMIT 1)
  );

INSERT INTO cupom_troca (cliente_id, valor, utilizado, data_geracao, pedido_origem_id)
SELECT
  (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1),
  8.00,
  false,
  '2026-03-07 09:00:00',
  (SELECT id FROM pedido WHERE data_pedido = '2026-03-01 10:45:00' ORDER BY id LIMIT 1)
WHERE
  (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1) IS NOT NULL
  AND (SELECT id FROM pedido WHERE data_pedido = '2026-03-01 10:45:00' ORDER BY id LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM cupom_troca
    WHERE cliente_id = (SELECT id FROM cliente WHERE lower(email) = lower('joao@example.com') ORDER BY id LIMIT 1)
      AND valor = 8.00
      AND utilizado = false
      AND pedido_origem_id = (SELECT id FROM pedido WHERE data_pedido = '2026-03-01 10:45:00' ORDER BY id LIMIT 1)
  );
