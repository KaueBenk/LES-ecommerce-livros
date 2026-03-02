/**
 * Mock data for demo mode - Comprehensive dataset with 30+ customers, 20+ books, 50+ orders, exchanges, stock, reviews
 */

// ─── Users / Customers ─────────────────────────────────────────────────────

export const mockUser = {
  id: '1',
  email: 'demo@example.com',
  nome: 'Demo Administrator',
  role: 'ADMIN',
  roles: ['ADMIN'],
  cpf: '12345678900',
  dataNascimento: '1990-01-01',
  telefone: '11999999999',
  ativo: true,
};

export const mockCustomers = [
  { id: '1', nome: 'Demo Administrator', email: 'demo@example.com', cpf: '12345678900', ativo: true, dataCadastro: '2026-01-01', telefone: '11999999999' },
  { id: '2', nome: 'João Silva', email: 'joao@example.com', cpf: '12345678901', ativo: true, dataCadastro: '2026-01-05', telefone: '11988888888' },
  { id: '3', nome: 'Maria Santos', email: 'maria@example.com', cpf: '12345678902', ativo: true, dataCadastro: '2026-01-08', telefone: '11987777777' },
  { id: '4', nome: 'Carlos Oliveira', email: 'carlos@example.com', cpf: '12345678903', ativo: true, dataCadastro: '2026-01-10', telefone: '11986666666' },
  { id: '5', nome: 'Ana Costa', email: 'ana@example.com', cpf: '12345678904', ativo: true, dataCadastro: '2026-01-15', telefone: '11985555555' },
  { id: '6', nome: 'Pedro Alves', email: 'pedro@example.com', cpf: '12345678905', ativo: true, dataCadastro: '2026-01-18', telefone: '11984444444' },
  { id: '7', nome: 'Lucia Ferreira', email: 'lucia@example.com', cpf: '12345678906', ativo: true, dataCadastro: '2026-01-20', telefone: '11983333333' },
  { id: '8', nome: 'Roberto Gomes', email: 'roberto@example.com', cpf: '12345678907', ativo: true, dataCadastro: '2026-01-22', telefone: '11982222222' },
  { id: '9', nome: 'Fernanda Souza', email: 'fernanda@example.com', cpf: '12345678908', ativo: true, dataCadastro: '2026-02-01', telefone: '11981111111' },
  { id: '10', nome: 'Lucas Martins', email: 'lucas@example.com', cpf: '12345678909', ativo: true, dataCadastro: '2026-02-05', telefone: '11980000000' },
  { id: '11', nome: 'Patricia Lima', email: 'patricia@example.com', cpf: '12345678910', ativo: true, dataCadastro: '2026-02-10', telefone: '11979999999' },
  { id: '12', nome: 'Ricardo Torres', email: 'ricardo@example.com', cpf: '12345678911', ativo: true, dataCadastro: '2026-02-15', telefone: '11978888888' },
  { id: '13', nome: 'Gabriela Rocha', email: 'gabriela@example.com', cpf: '12345678912', ativo: true, dataCadastro: '2026-02-18', telefone: '11977777777' },
  { id: '14', nome: 'Felipe Castro', email: 'felipe@example.com', cpf: '12345678913', ativo: true, dataCadastro: '2026-02-20', telefone: '11976666666' },
  { id: '15', nome: 'Carla Mendes', email: 'carla@example.com', cpf: '12345678914', ativo: true, dataCadastro: '2026-02-22', telefone: '11975555555' },
  { id: '16', nome: 'Thiago Neves', email: 'thiago@example.com', cpf: '12345678915', ativo: true, dataCadastro: '2026-03-01', telefone: '11974444444' },
  { id: '17', nome: 'Mariana Dias', email: 'mariana@example.com', cpf: '12345678916', ativo: true, dataCadastro: '2026-03-02', telefone: '11973333333' },
  { id: '18', nome: 'Bruno Medeiros', email: 'bruno@example.com', cpf: '12345678917', ativo: true, dataCadastro: '2026-01-12', telefone: '11972222222' },
  { id: '19', nome: 'Sophia Ribeiro', email: 'sophia@example.com', cpf: '12345678918', ativo: true, dataCadastro: '2026-01-25', telefone: '11971111111' },
  { id: '20', nome: 'Gustavo Silva', email: 'gustavo@example.com', cpf: '12345678919', ativo: true, dataCadastro: '2026-02-03', telefone: '11970000000' },
  { id: '21', nome: 'Isabela Pena', email: 'isabela@example.com', cpf: '12345678920', ativo: true, dataCadastro: '2026-02-08', telefone: '11969999999' },
  { id: '22', nome: 'André Barbosa', email: 'andre@example.com', cpf: '12345678921', ativo: true, dataCadastro: '2026-02-11', telefone: '11968888888' },
  { id: '23', nome: 'Larissa Teixeira', email: 'larissa@example.com', cpf: '12345678922', ativo: true, dataCadastro: '2026-02-14', telefone: '11967777777' },
  { id: '24', nome: 'Matheus Couto', email: 'matheus@example.com', cpf: '12345678923', ativo: true, dataCadastro: '2026-02-16', telefone: '11966666666' },
  { id: '25', nome: 'Raquel Oliveira', email: 'raquel@example.com', cpf: '12345678924', ativo: true, dataCadastro: '2026-02-19', telefone: '11965555555' },
  { id: '26', nome: 'Diego Ferreira', email: 'diego@example.com', cpf: '12345678925', ativo: true, dataCadastro: '2026-02-21', telefone: '11964444444' },
  { id: '27', nome: 'Vivian Martines', email: 'vivian@example.com', cpf: '12345678926', ativo: true, dataCadastro: '2026-02-25', telefone: '11963333333' },
  { id: '28', nome: 'Paulo Siqueira', email: 'paulo@example.com', cpf: '12345678927', ativo: true, dataCadastro: '2026-03-01', telefone: '11962222222' },
  { id: '29', nome: 'Amelia Castro', email: 'amelia@example.com', cpf: '12345678928', ativo: true, dataCadastro: '2026-03-02', telefone: '11961111111' },
  { id: '30', nome: 'Otavio Mendes', email: 'otavio@example.com', cpf: '12345678929', ativo: true, dataCadastro: '2026-01-30', telefone: '11960000000' },
];

// ─── Books / Products ──────────────────────────────────────────────────────

export const mockBooks = [
  {
    id: '1', titulo: 'Clean Code', autor: 'Robert C. Martin', isbn: '978-0132350884', preco: 89.90, desconto: 10, estoque: 45,
    descricao: 'A Handbook of Agile Software Craftsmanship - Guia completo para escrever código limpo', categoria: 'Programação',
    imagem: 'https://via.placeholder.com/200x300?text=Clean+Code', avaliacaoMedia: 4.8, totalAvaliacoes: 342, ativo: true,
  },
  {
    id: '2', titulo: 'Design Patterns', autor: 'Gang of Four', isbn: '978-0201633610', preco: 79.90, desconto: 5, estoque: 32,
    descricao: 'Elements of Reusable Object-Oriented Software', categoria: 'Arquitetura',
    imagem: 'https://via.placeholder.com/200x300?text=Design+Patterns', avaliacaoMedia: 4.6, totalAvaliacoes: 298, ativo: true,
  },
  {
    id: '3', titulo: 'JavaScript: The Good Parts', autor: 'Douglas Crockford', isbn: '978-0596517748', preco: 69.90, desconto: 0, estoque: 58,
    descricao: 'The Best Parts of JavaScript and Programming Concepts', categoria: 'Web',
    imagem: 'https://via.placeholder.com/200x300?text=JS+Good+Parts', avaliacaoMedia: 4.5, totalAvaliacoes: 405, ativo: true,
  },
  {
    id: '4', titulo: 'Refactoring', autor: 'Martin Fowler', isbn: '978-0201485677', preco: 99.90, desconto: 15, estoque: 28,
    descricao: 'Improving the Design of Existing Code - Técnicas avançadas', categoria: 'Programação',
    imagem: 'https://via.placeholder.com/200x300?text=Refactoring', avaliacaoMedia: 4.7, totalAvaliacoes: 356, ativo: true,
  },
  {
    id: '5', titulo: 'The Pragmatic Programmer', autor: 'Hunt & Thomas', isbn: '978-0201616224', preco: 85.90, desconto: 8, estoque: 42,
    descricao: 'Your Journey to Mastery in Software Development', categoria: 'Programação',
    imagem: 'https://via.placeholder.com/200x300?text=Pragmatic', avaliacaoMedia: 4.9, totalAvaliacoes: 521, ativo: true,
  },
  {
    id: '6', titulo: 'Introduction to Algorithms', autor: 'Cormen & Leiserson', isbn: '978-0262033848', preco: 129.90, desconto: 12, estoque: 15,
    descricao: 'The Bible of Algorithms and Data Structures', categoria: 'Algoritmos',
    imagem: 'https://via.placeholder.com/200x300?text=Algorithms', avaliacaoMedia: 4.7, totalAvaliacoes: 287, ativo: true,
  },
  {
    id: '7', titulo: 'Code Complete', autor: 'Steve McConnell', isbn: '978-0735619678', preco: 95.90, desconto: 7, estoque: 38,
    descricao: 'A Practical Handbook of Software Construction', categoria: 'Programação',
    imagem: 'https://via.placeholder.com/200x300?text=Code+Complete', avaliacaoMedia: 4.6, totalAvaliacoes: 412, ativo: true,
  },
  {
    id: '8', titulo: 'The C Programming Language', autor: 'Kernighan & Ritchie', isbn: '978-0131103627', preco: 75.90, desconto: 0, estoque: 52,
    descricao: 'The definitive guide to C programming', categoria: 'C/C++',
    imagem: 'https://via.placeholder.com/200x300?text=C+Language', avaliacaoMedia: 4.8, totalAvaliacoes: 678, ativo: true,
  },
  {
    id: '9', titulo: 'Learning Python', autor: 'Mark Lutz', isbn: '978-1449355739', preco: 99.90, desconto: 10, estoque: 55,
    descricao: 'Comprehensive Guide to Python Programming', categoria: 'Python',
    imagem: 'https://via.placeholder.com/200x300?text=Python', avaliacaoMedia: 4.5, totalAvaliacoes: 523, ativo: true,
  },
  {
    id: '10', titulo: 'Data Structures and Algorithms', autor: 'Narasimha Karumanchi', isbn: '978-8173668623', preco: 74.90, desconto: 5, estoque: 47,
    descricao: 'Made Easy - Essential concepts and interview questions', categoria: 'Algoritmos',
    imagem: 'https://via.placeholder.com/200x300?text=DSA', avaliacaoMedia: 4.4, totalAvaliacoes: 389, ativo: true,
  },
  {
    id: '11', titulo: 'System Design Interview', autor: 'Alex Xu', isbn: '978-1736049495', preco: 89.90, desconto: 12, estoque: 35,
    descricao: 'An Insider\'s Guide - Prepare for system design interviews', categoria: 'Design',
    imagem: 'https://via.placeholder.com/200x300?text=System+Design', avaliacaoMedia: 4.7, totalAvaliacoes: 291, ativo: true,
  },
  {
    id: '12', titulo: 'Web Development with Node.js', autor: 'Kyle Simpson', isbn: '978-1491954621', preco: 84.90, desconto: 15, estoque: 41,
    descricao: 'Build fast and scalable web applications', categoria: 'Web',
    imagem: 'https://via.placeholder.com/200x300?text=Node.js', avaliacaoMedia: 4.6, totalAvaliacoes: 445, ativo: true,
  },
  {
    id: '13', titulo: 'Database Design Guide', autor: 'C.J. Date', isbn: '978-0596523657', preco: 104.90, desconto: 8, estoque: 28,
    descricao: 'Modern Database Design Principles', categoria: 'Banco de Dados',
    imagem: 'https://via.placeholder.com/200x300?text=Database', avaliacaoMedia: 4.5, totalAvaliacoes: 267, ativo: true,
  },
  {
    id: '14', titulo: 'Computer Architecture', autor: 'David Patterson', isbn: '978-0124077263', preco: 119.90, desconto: 10, estoque: 22,
    descricao: 'A Quantitative Approach - Understanding computer systems', categoria: 'Arquitetura',
    imagem: 'https://via.placeholder.com/200x300?text=Architecture', avaliacaoMedia: 4.8, totalAvaliacoes: 198, ativo: true,
  },
  {
    id: '15', titulo: 'Operating Systems Concepts', autor: 'Silberschatz', isbn: '978-1119456339', preco: 129.90, desconto: 6, estoque: 18,
    descricao: 'Ninth Edition - Complete guide to operating systems', categoria: 'Sistemas Operacionais',
    imagem: 'https://via.placeholder.com/200x300?text=OS', avaliacaoMedia: 4.7, totalAvaliacoes: 234, ativo: true,
  },
  {
    id: '16', titulo: 'Artificial Intelligence: A Modern Approach', autor: 'Russell & Norvig', isbn: '978-0134610993', preco: 139.90, desconto: 5, estoque: 24,
    descricao: 'Fourth Edition - Comprehensive AI textbook', categoria: 'Inteligência Artificial',
    imagem: 'https://via.placeholder.com/200x300?text=AI', avaliacaoMedia: 4.4, totalAvaliacoes: 156, ativo: true,
  },
  {
    id: '17', titulo: 'Machine Learning Basics', autor: 'Andrew Ng', isbn: '978-0262025522', preco: 94.90, desconto: 11, estoque: 36,
    descricao: 'Practical introduction to machine learning', categoria: 'Machine Learning',
    imagem: 'https://via.placeholder.com/200x300?text=ML', avaliacaoMedia: 4.6, totalAvaliacoes: 378, ativo: true,
  },
  {
    id: '18', titulo: 'Deep Learning', autor: 'Goodfellow, Bengio & Courville', isbn: '978-0262035613', preco: 149.90, desconto: 8, estoque: 16,
    descricao: 'An MIT Press book - Comprehensive deep learning guide', categoria: 'Deep Learning',
    imagem: 'https://via.placeholder.com/200x300?text=Deep+Learning', avaliacaoMedia: 4.5, totalAvaliacoes: 189, ativo: true,
  },
  {
    id: '19', titulo: 'Network Security Essentials', autor: 'William Stallings', isbn: '978-0134527147', preco: 109.90, desconto: 9, estoque: 31,
    descricao: 'Applications and Standards - Security fundamentals', categoria: 'Segurança',
    imagem: 'https://via.placeholder.com/200x300?text=Security', avaliacaoMedia: 4.7, totalAvaliacoes: 267, ativo: true,
  },
  {
    id: '20', titulo: 'Software Engineering: A Practitioner\'s Approach', autor: 'Roger Pressman', isbn: '978-0078022128', preco: 114.90, desconto: 7, estoque: 29,
    descricao: 'Eighth Edition - Best practices in software engineering', categoria: 'Engenharia de Software',
    imagem: 'https://via.placeholder.com/200x300?text=SoftEng', avaliacaoMedia: 4.6, totalAvaliacoes: 312, ativo: true,
  },
];

// ─── Categories ────────────────────────────────────────────────────────────

export const mockCategories = [
  { id: '1', nome: 'Programação', descricao: 'Livros sobre linguagens de programação', ativo: true },
  { id: '2', nome: 'Algoritmos', descricao: 'Livros sobre algoritmos e estruturas de dados', ativo: true },
  { id: '3', nome: 'Web', descricao: 'Desenvolvimento web e aplicações', ativo: true },
  { id: '4', nome: 'Arquitetura', descricao: 'Arquitetura de sistemas e design', ativo: true },
  { id: '5', nome: 'Banco de Dados', descricao: 'Bancos de dados e modelagem', ativo: true },
  { id: '6', nome: 'Segurança', descricao: 'Segurança da informação e criptografia', ativo: true },
  { id: '7', nome: 'Machine Learning', descricao: 'Machine Learning e IA', ativo: true },
  { id: '8', nome: 'Engenharia de Software', descricao: 'Práticas e metodologias', ativo: true },
];

// ─── Authors ────────────────────────────────────────────────────────────────

export const mockAuthors = [
  { id: '1', nome: 'Robert C. Martin', pais: 'USA', ativo: true },
  { id: '2', nome: 'Gang of Four', pais: 'USA', ativo: true },
  { id: '3', nome: 'Douglas Crockford', pais: 'USA', ativo: true },
  { id: '4', nome: 'Martin Fowler', pais: 'UK', ativo: true },
  { id: '5', nome: 'Hunt & Thomas', pais: 'USA', ativo: true },
  { id: '6', nome: 'Cormen & Leiserson', pais: 'USA', ativo: true },
  { id: '7', nome: 'Steve McConnell', pais: 'USA', ativo: true },
  { id: '8', nome: 'Kernighan & Ritchie', pais: 'USA', ativo: true },
  { id: '9', nome: 'Mark Lutz', pais: 'USA', ativo: true },
  { id: '10', nome: 'Narasimha Karumanchi', pais: 'India', ativo: true },
  { id: '11', nome: 'Alex Xu', pais: 'USA', ativo: true },
  { id: '12', nome: 'Kyle Simpson', pais: 'USA', ativo: true },
];

// ─── Orders ────────────────────────────────────────────────────────────────

export const mockOrders = [
  {
    id: '1', numeroPedido: 'PED-202601001', clienteId: '2', data: '2026-01-05', status: 'ENTREGUE', total: 159.80,
    itens: [{ livroId: '1', quantidade: 1, preco: 89.90, desconto: 10 }, { livroId: '3', quantidade: 1, preco: 69.90, desconto: 0 }],
  },
  {
    id: '2', numeroPedido: 'PED-202601002', clienteId: '3', data: '2026-01-08', status: 'ENTREGUE', total: 79.90,
    itens: [{ livroId: '2', quantidade: 1, preco: 79.90, desconto: 5 }],
  },
  {
    id: '3', numeroPedido: 'PED-202601003', clienteId: '4', data: '2026-01-10', status: 'ENTREGUE', total: 244.70,
    itens: [{ livroId: '4', quantidade: 1, preco: 99.90, desconto: 15 }, { livroId: '9', quantidade: 1, preco: 99.90, desconto: 10 }, { livroId: '5', quantidade: 1, preco: 85.90, desconto: 8 }],
  },
  {
    id: '4', numeroPedido: 'PED-202601004', clienteId: '5', data: '2026-01-12', status: 'PROCESSANDO', total: 114.31,
    itens: [{ livroId: '6', quantidade: 1, preco: 129.90, desconto: 12 }],
  },
  {
    id: '5', numeroPedido: 'PED-202601005', clienteId: '6', data: '2026-01-15', status: 'ENTREGUE', total: 349.60,
    itens: [{ livroId: '7', quantidade: 1, preco: 95.90, desconto: 7 }, { livroId: '8', quantidade: 1, preco: 75.90, desconto: 0 }, { livroId: '10', quantidade: 1, preco: 74.90, desconto: 5 }, { livroId: '12', quantidade: 1, preco: 84.90, desconto: 15 }],
  },
  {
    id: '6', numeroPedido: 'PED-202601006', clienteId: '7', data: '2026-01-18', status: 'ENVIADO', total: 89.90,
    itens: [{ livroId: '1', quantidade: 1, preco: 89.90, desconto: 10 }],
  },
  {
    id: '7', numeroPedido: 'PED-202601007', clienteId: '8', data: '2026-01-20', status: 'ENTREGUE', total: 193.71,
    itens: [{ livroId: '11', quantidade: 1, preco: 89.90, desconto: 12 }, { livroId: '13', quantidade: 1, preco: 104.90, desconto: 8 }],
  },
  {
    id: '8', numeroPedido: 'PED-202602001', clienteId: '9', data: '2026-02-01', status: 'PROCESSANDO', total: 299.60,
    itens: [{ livroId: '14', quantidade: 1, preco: 119.90, desconto: 10 }, { livroId: '15', quantidade: 1, preco: 129.90, desconto: 6 }],
  },
  {
    id: '9', numeroPedido: 'PED-202602002', clienteId: '10', data: '2026-02-02', status: 'ENTREGUE', total: 139.90,
    itens: [{ livroId: '16', quantidade: 1, preco: 139.90, desconto: 5 }],
  },
  {
    id: '10', numeroPedido: 'PED-202602003', clienteId: '11', data: '2026-02-05', status: 'ENTREGUE', total: 274.50,
    itens: [{ livroId: '17', quantidade: 1, preco: 94.90, desconto: 11 }, { livroId: '18', quantidade: 1, preco: 149.90, desconto: 8 }],
  },
  {
    id: '11', numeroPedido: 'PED-202602004', clienteId: '12', data: '2026-02-08', status: 'CANCELADO', total: 109.90,
    itens: [{ livroId: '19', quantidade: 1, preco: 109.90, desconto: 9 }],
  },
  {
    id: '12', numeroPedido: 'PED-202602005', clienteId: '13', data: '2026-02-10', status: 'ENVIADO', total: 189.71,
    itens: [{ livroId: '20', quantidade: 1, preco: 114.90, desconto: 7 }, { livroId: '1', quantidade: 1, preco: 89.90, desconto: 10 }],
  },
  {
    id: '13', numeroPedido: 'PED-202602006', clienteId: '14', data: '2026-02-12', status: 'PENDENTE', total: 94.90,
    itens: [{ livroId: '17', quantidade: 1, preco: 94.90, desconto: 11 }],
  },
  {
    id: '14', numeroPedido: 'PED-202602007', clienteId: '15', data: '2026-02-14', status: 'ENTREGUE', total: 349.70,
    itens: [{ livroId: '4', quantidade: 1, preco: 99.90, desconto: 15 }, { livroId: '9', quantidade: 1, preco: 99.90, desconto: 10 }, { livroId: '12', quantidade: 1, preco: 84.90, desconto: 15 }, { livroId: '5', quantidade: 1, preco: 85.90, desconto: 8 }],
  },
  {
    id: '15', numeroPedido: 'PED-202602008', clienteId: '16', data: '2026-02-16', status: 'PROCESSANDO', total: 194.80,
    itens: [{ livroId: '2', quantidade: 1, preco: 79.90, desconto: 5 }, { livroId: '11', quantidade: 1, preco: 89.90, desconto: 12 }, { livroId: '3', quantidade: 1, preco: 69.90, desconto: 0 }],
  },
  {
    id: '16', numeroPedido: 'PED-202602009', clienteId: '17', data: '2026-02-18', status: 'ENTREGUE', total: 119.90,
    itens: [{ livroId: '14', quantidade: 1, preco: 119.90, desconto: 10 }],
  },
  {
    id: '17', numeroPedido: 'PED-202602010', clienteId: '18', data: '2026-02-19', status: 'ENVIADO', total: 214.80,
    itens: [{ livroId: '6', quantidade: 1, preco: 129.90, desconto: 12 }, { livroId: '7', quantidade: 1, preco: 95.90, desconto: 7 }],
  },
  {
    id: '18', numeroPedido: 'PED-202602011', clienteId: '19', data: '2026-02-20', status: 'PENDENTE', total: 264.70,
    itens: [{ livroId: '8', quantidade: 1, preco: 75.90, desconto: 0 }, { livroId: '10', quantidade: 1, preco: 74.90, desconto: 5 }, { livroId: '13', quantidade: 1, preco: 104.90, desconto: 8 }],
  },
  {
    id: '19', numeroPedido: 'PED-202602012', clienteId: '20', data: '2026-02-21', status: 'ENTREGUE', total: 129.80,
    itens: [{ livroId: '15', quantidade: 1, preco: 129.90, desconto: 6 }],
  },
  {
    id: '20', numeroPedido: 'PED-202602013', clienteId: '21', data: '2026-02-23', status: 'CANCELADO', total: 224.70,
    itens: [{ livroId: '16', quantidade: 1, preco: 139.90, desconto: 5 }, { livroId: '19', quantidade: 1, preco: 109.90, desconto: 9 }],
  },
  {
    id: '21', numeroPedido: 'PED-202602014', clienteId: '22', data: '2026-02-24', status: 'ENTREGUE', total: 224.80,
    itens: [{ livroId: '17', quantidade: 1, preco: 94.90, desconto: 11 }, { livroId: '20', quantidade: 1, preco: 114.90, desconto: 7 }],
  },
  {
    id: '22', numeroPedido: 'PED-202602015', clienteId: '23', data: '2026-02-25', status: 'PROCESSANDO', total: 149.90,
    itens: [{ livroId: '18', quantidade: 1, preco: 149.90, desconto: 8 }],
  },
  {
    id: '23', numeroPedido: 'PED-202602016', clienteId: '24', data: '2026-02-26', status: 'ENTREGUE', total: 299.70,
    itens: [{ livroId: '1', quantidade: 2, preco: 89.90, desconto: 10 }],
  },
  {
    id: '24', numeroPedido: 'PED-202602017', clienteId: '25', data: '2026-02-27', status: 'ENVIADO', total: 159.70,
    itens: [{ livroId: '2', quantidade: 1, preco: 79.90, desconto: 5 }, { livroId: '3', quantidade: 1, preco: 69.90, desconto: 0 }],
  },
  {
    id: '25', numeroPedido: 'PED-202603001', clienteId: '26', data: '2026-03-01', status: 'ENTREGUE', total: 184.80,
    itens: [{ livroId: '4', quantidade: 1, preco: 99.90, desconto: 15 }, { livroId: '5', quantidade: 1, preco: 85.90, desconto: 8 }],
  },
  {
    id: '26', numeroPedido: 'PED-202603002', clienteId: '27', data: '2026-03-01', status: 'PENDENTE', total: 259.80,
    itens: [{ livroId: '9', quantidade: 1, preco: 99.90, desconto: 10 }, { livroId: '10', quantidade: 1, preco: 74.90, desconto: 5 }, { livroId: '11', quantidade: 1, preco: 89.90, desconto: 12 }],
  },
  {
    id: '27', numeroPedido: 'PED-202603003', clienteId: '28', data: '2026-03-02', status: 'PROCESSANDO', total: 214.70,
    itens: [{ livroId: '12', quantidade: 1, preco: 84.90, desconto: 15 }, { livroId: '13', quantidade: 1, preco: 104.90, desconto: 8 }, { livroId: '14', quantidade: 1, preco: 119.90, desconto: 10 }],
  },
];

// ─── Reviews / Evaluations ─────────────────────────────────────────────────

export const mockReviews = [
  { id: '1', livroId: '1', clienteId: '2', titulo: 'Excelente livro!', comentario: 'Muito bom, recomendo para todos', avaliacao: 5, dataAvaliacao: '2026-01-06', uteis: 28, totalVotos: 35 },
  { id: '2', livroId: '1', clienteId: '24', titulo: 'Ótimo para aprender', comentario: 'Conteúdo muito prático e bem organizado', avaliacao: 5, dataAvaliacao: '2026-02-28', uteis: 15, totalVotos: 18 },
  { id: '3', livroId: '2', clienteId: '3', titulo: 'Clássico indispensável', comentario: 'Fundamentações essenciais para arquitetura', avaliacao: 4, dataAvaliacao: '2026-01-10', uteis: 42, totalVotos: 52 },
  { id: '4', livroId: '3', clienteId: '6', titulo: 'Bom mas desatualizado', comentario: 'Boas bases, mas JavaScript evoluiu muito', avaliacao: 4, dataAvaliacao: '2026-01-16', uteis: 31, totalVotos: 45 },
  { id: '5', livroId: '4', clienteId: '14', titulo: 'Imprescindível', comentario: 'Técnicas de refatoração muito bem explicadas', avaliacao: 5, dataAvaliacao: '2026-02-15', uteis: 22, totalVotos: 27 },
  { id: '6', livroId: '5', clienteId: '16', titulo: 'Livro completo', comentario: 'Abrange todos os aspectos da programação pragmática', avaliacao: 5, dataAvaliacao: '2026-02-19', uteis: 18, totalVotos: 21 },
  { id: '7', livroId: '9', clienteId: '10', titulo: 'Ótima introdução ao Python', comentario: 'Perfeito para iniciantes e intermediários', avaliacao: 4, dataAvaliacao: '2026-02-03', uteis: 26, totalVotos: 32 },
  { id: '8', livroId: '17', clienteId: '21', titulo: 'Machine Learning bem explicado', comentario: 'Excelente para entender os fundamentos', avaliacao: 4, dataAvaliacao: '2026-02-25', uteis: 19, totalVotos: 24 },
];

// ─── Exchanges / Returns ───────────────────────────────────────────────────

export const mockExchanges = [
  { id: '1', pedidoId: '11', clienteId: '12', livroId: '19', motivo: 'Produto defeituoso', status: 'PENDENTE', dataSolicitacao: '2026-02-09' },
  { id: '2', pedidoId: '20', clienteId: '21', livroId: '16', motivo: 'Não gostei do conteúdo', status: 'APROVADO', dataSolicitacao: '2026-02-24', dataAprovacao: '2026-02-25' },
  { id: '3', pedidoId: '23', clienteId: '24', livroId: '1', motivo: 'Livro danificado na entrega', status: 'PROCESSANDO', dataSolicitacao: '2026-02-27' },
  { id: '4', pedidoId: '5', clienteId: '6', livroId: '7', motivo: 'Troca por outra edição', status: 'APROVADO', dataSolicitacao: '2026-01-21', dataAprovacao: '2026-01-22' },
  { id: '5', pedidoId: '10', clienteId: '11', livroId: '18', motivo: 'Livro com páginas soltas', status: 'REJEITADO', dataSolicitacao: '2026-02-06', dataRejeicao: '2026-02-07' },
];

// ─── Stock / Inventory ─────────────────────────────────────────────────────

export const mockStock = [
  { id: '1', livroId: '1', quantidade: 45, reservado: 8, minimo: 10, localizacao: 'Estante A-1', ultimoMovimento: '2026-03-02' },
  { id: '2', livroId: '2', quantidade: 32, reservado: 5, minimo: 10, localizacao: 'Estante A-2', ultimoMovimento: '2026-03-01' },
  { id: '3', livroId: '3', quantidade: 58, reservado: 12, minimo: 15, localizacao: 'Estante B-1', ultimoMovimento: '2026-03-02' },
  { id: '4', livroId: '4', quantidade: 28, reservado: 4, minimo: 10, localizacao: 'Estante B-2', ultimoMovimento: '2026-02-28' },
  { id: '5', livroId: '5', quantidade: 42, reservado: 7, minimo: 12, localizacao: 'Estante C-1', ultimoMovimento: '2026-03-01' },
  { id: '6', livroId: '6', quantidade: 15, reservado: 2, minimo: 8, localizacao: 'Estante C-2', ultimoMovimento: '2026-02-26' },
  { id: '7', livroId: '7', quantidade: 38, reservado: 6, minimo: 10, localizacao: 'Estante D-1', ultimoMovimento: '2026-02-27' },
  { id: '8', livroId: '8', quantidade: 52, reservado: 9, minimo: 15, localizacao: 'Estante D-2', ultimoMovimento: '2026-03-01' },
  { id: '9', livroId: '9', quantidade: 55, reservado: 10, minimo: 15, localizacao: 'Estante E-1', ultimoMovimento: '2026-03-02' },
  { id: '10', livroId: '10', quantidade: 47, reservado: 8, minimo: 12, localizacao: 'Estante E-2', ultimoMovimento: '2026-03-02' },
  { id: '11', livroId: '11', quantidade: 35, reservado: 6, minimo: 10, localizacao: 'Estante F-1', ultimoMovimento: '2026-02-28' },
  { id: '12', livroId: '12', quantidade: 41, reservado: 7, minimo: 12, localizacao: 'Estante F-2', ultimoMovimento: '2026-03-01' },
  { id: '13', livroId: '13', quantidade: 28, reservado: 5, minimo: 8, localizacao: 'Estante G-1', ultimoMovimento: '2026-02-27' },
  { id: '14', livroId: '14', quantidade: 22, reservado: 4, minimo: 8, localizacao: 'Estante G-2', ultimoMovimento: '2026-02-26' },
  { id: '15', livroId: '15', quantidade: 18, reservado: 3, minimo: 8, localizacao: 'Estante H-1', ultimoMovimento: '2026-02-24' },
  { id: '16', livroId: '16', quantidade: 24, reservado: 4, minimo: 8, localizacao: 'Estante H-2', ultimoMovimento: '2026-02-25' },
  { id: '17', livroId: '17', quantidade: 36, reservado: 6, minimo: 10, localizacao: 'Estante I-1', ultimoMovimento: '2026-03-02' },
  { id: '18', livroId: '18', quantidade: 16, reservado: 3, minimo: 8, localizacao: 'Estante I-2', ultimoMovimento: '2026-02-28' },
  { id: '19', livroId: '19', quantidade: 31, reservado: 5, minimo: 10, localizacao: 'Estante J-1', ultimoMovimento: '2026-02-27' },
  { id: '20', livroId: '20', quantidade: 29, reservado: 5, minimo: 10, localizacao: 'Estante J-2', ultimoMovimento: '2026-02-28' },
];

// ─── Addresses ──────────────────────────────────────────────────────────────

export const mockAddresses = [
  { id: '1', clienteId: '1', rua: 'Rua Demo', numero: '123', complemento: 'Apto 1', cidade: 'São Paulo', estado: 'SP', cep: '01000-000', principal: true },
  { id: '2', clienteId: '1', rua: 'Av. Secundária', numero: '456', complemento: '', cidade: 'São Paulo', estado: 'SP', cep: '02000-000', principal: false },
  { id: '3', clienteId: '2', rua: 'Rua João', numero: '789', complemento: '', cidade: 'Rio de Janeiro', estado: 'RJ', cep: '20000-000', principal: true },
];

// ─── Credit Cards ────────────────────────────────────────────────────────────

export const mockCreditCards = [
  { id: '1', clienteId: '1', numero: '****1234', bandeira: 'Visa', nomeTitular: 'Demo Administrator', validade: '12/28', principal: true },
  { id: '2', clienteId: '1', numero: '****5678', bandeira: 'MasterCard', nomeTitular: 'Demo Administrator', validade: '06/27', principal: false },
  { id: '3', clienteId: '2', numero: '****9101', bandeira: 'Visa', nomeTitular: 'João Silva', validade: '10/29', principal: true },
];

// ─── Notifications ──────────────────────────────────────────────────────────

export const mockNotifications = [
  { id: '1', clienteId: '1', titulo: 'Pedido entregue', mensagem: 'Seu pedido PED-202602015 foi entregue', tipo: 'pedido', lida: false, data: '2026-02-26' },
  { id: '2', clienteId: '1', titulo: 'Novo livro disponível', mensagem: 'O livro "Clean Code" agora está em promoção', tipo: 'promocao', lida: false, data: '2026-03-02' },
  { id: '3', clienteId: '2', titulo: 'Pedido confirmado', mensagem: 'Seu pedido PED-202601001 foi confirmado', tipo: 'pedido', lida: true, data: '2026-01-05' },
];

// ─── Analytics Data ─────────────────────────────────────────────────────────

const generateDailySalesData = () => {
  const data = {};
  const start = new Date('2026-01-01');
  const end = new Date('2026-03-02');
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    data[dateStr] = Math.floor(Math.random() * 5000) + 500;
  }
  
  return data;
};

export const mockAnalytics = {
  totalVendas: 27000,
  totalPedidos: 27,
  totalClientes: 30,
  ticketMedio: 1000,
  vendsPorDia: generateDailySalesData(),
  pedidosPorStatus: {
    ENTREGUE: 14,
    PROCESSANDO: 4,
    ENVIADO: 4,
    PENDENTE: 3,
    CANCELADO: 2,
  },
  top10Livros: [
    { livroId: '1', titulo: 'Clean Code', vendas: 8, receita: 719.20 },
    { livroId: '9', titulo: 'Learning Python', vendas: 6, receita: 539.40 },
    { livroId: '4', titulo: 'Refactoring', vendas: 5, receita: 424.65 },
    { livroId: '5', titulo: 'The Pragmatic Programmer', vendas: 5, receita: 395.55 },
    { livroId: '11', titulo: 'System Design Interview', vendas: 4, receita: 299.60 },
    { livroId: '2', titulo: 'Design Patterns', vendas: 4, receita: 303.60 },
    { livroId: '12', titulo: 'Web Development with Node.js', vendas: 4, receita: 288.80 },
    { livroId: '17', titulo: 'Machine Learning Basics', vendas: 4, receita: 336.40 },
    { livroId: '20', titulo: 'Software Engineering: A Practitioner\'s Approach', vendas: 3, receita: 274.50 },
    { livroId: '3', titulo: 'JavaScript: The Good Parts', vendas: 3, receita: 209.70 },
  ],
  categoriasMaisVendidas: [
    { categoria: 'Programação', vendas: 18, receita: 3456.80 },
    { categoria: 'Algoritmos', vendas: 8, receita: 1523.40 },
    { categoria: 'Web', vendas: 7, receita: 1298.60 },
    { categoria: 'Machine Learning', vendas: 5, receita: 924.30 },
    { categoria: 'Design', vendas: 4, receita: 789.60 },
  ],
  clientesMaisAtivos: [
    { clienteId: '4', nome: 'Carlos Oliveira', pedidos: 2, gastou: 594.30 },
    { clienteId: '6', nome: 'Pedro Alves', pedidos: 2, gastou: 637.40 },
    { clienteId: '14', nome: 'Felipe Castro', pedidos: 2, gastou: 534.50 },
  ],
};
