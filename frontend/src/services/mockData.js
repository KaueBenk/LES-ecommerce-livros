/**
 * Mock data for demo mode
 */

export const mockUser = {
  id: '1',
  email: 'demo@example.com',
  nome: 'Demo User',
  role: 'ADMIN',
  roles: ['ADMIN'],
  cpf: '12345678900',
  dataNascimento: '1990-01-01',
  telefone: '11999999999',
  ativo: true,
};

export const mockBooks = [
  {
    id: '1',
    titulo: 'Clean Code',
    autor: 'Robert C. Martin',
    isbn: '978-0132350884',
    preco: 89.90,
    desconto: 10,
    estoque: 25,
    descricao: 'A Handbook of Agile Software Craftsmanship',
    categoria: 'Programação',
    imagem: 'https://via.placeholder.com/200x300?text=Clean+Code',
    avaliacaoMedia: 4.8,
    totalAvaliacoes: 142,
    ativo: true,
  },
  {
    id: '2',
    titulo: 'Design Patterns',
    autor: 'Gang of Four',
    isbn: '978-0201633610',
    preco: 79.90,
    desconto: 5,
    estoque: 15,
    descricao: 'Elements of Reusable Object-Oriented Software',
    categoria: 'Arquitetura',
    imagem: 'https://via.placeholder.com/200x300?text=Design+Patterns',
    avaliacaoMedia: 4.6,
    totalAvaliacoes: 98,
    ativo: true,
  },
  {
    id: '3',
    titulo: 'JavaScript: The Good Parts',
    autor: 'Douglas Crockford',
    isbn: '978-0596517748',
    preco: 69.90,
    desconto: 0,
    estoque: 30,
    descricao: 'The Best Parts of JavaScript',
    categoria: 'Web',
    imagem: 'https://via.placeholder.com/200x300?text=JS+Good+Parts',
    avaliacaoMedia: 4.5,
    totalAvaliacoes: 205,
    ativo: true,
  },
  {
    id: '4',
    titulo: 'Refactoring',
    autor: 'Martin Fowler',
    isbn: '978-0201485677',
    preco: 99.90,
    desconto: 15,
    estoque: 8,
    descricao: 'Improving the Design of Existing Code',
    categoria: 'Programação',
    imagem: 'https://via.placeholder.com/200x300?text=Refactoring',
    avaliacaoMedia: 4.7,
    totalAvaliacoes: 156,
    ativo: true,
  },
  {
    id: '5',
    titulo: 'The Pragmatic Programmer',
    autor: 'Hunt & Thomas',
    isbn: '978-0201616224',
    preco: 85.90,
    desconto: 8,
    estoque: 20,
    descricao: 'Your Journey to Mastery',
    categoria: 'Desenvolvimento',
    imagem: 'https://via.placeholder.com/200x300?text=Pragmatic+Programmer',
    avaliacaoMedia: 4.9,
    totalAvaliacoes: 178,
    ativo: true,
  },
  {
    id: '6',
    titulo: 'Algorithms',
    autor: 'Robert Sedgewick',
    isbn: '978-0321573513',
    preco: 129.90,
    desconto: 20,
    estoque: 12,
    descricao: 'Parts 1-4: Fundamentals, Data Structures, Sorting, Searching',
    categoria: 'Ciência da Computação',
    imagem: 'https://via.placeholder.com/200x300?text=Algorithms',
    avaliacaoMedia: 4.6,
    totalAvaliacoes: 87,
    ativo: true,
  },
];

export const mockCategories = [
  { id: '1', nome: 'Programação' },
  { id: '2', nome: 'Arquitetura' },
  { id: '3', nome: 'Web' },
  { id: '4', nome: 'Desenvolvimento' },
  { id: '5', nome: 'Ciência da Computação' },
];

export const mockAuthors = [
  { id: '1', nome: 'Robert C. Martin' },
  { id: '2', nome: 'Gang of Four' },
  { id: '3', nome: 'Douglas Crockford' },
  { id: '4', nome: 'Martin Fowler' },
  { id: '5', nome: 'Hunt & Thomas' },
  { id: '6', nome: 'Robert Sedgewick' },
];

export const mockOrders = [
  {
    id: '1',
    numeroPedido: 'PED-2024-001',
    data: '2024-01-15',
    status: 'ENTREGUE',
    total: 189.80,
    itens: [
      {
        livroId: '1',
        titulo: 'Clean Code',
        quantidade: 2,
        preco: 89.90,
      },
    ],
  },
  {
    id: '2',
    numeroPedido: 'PED-2024-002',
    data: '2024-02-10',
    status: 'PROCESSANDO',
    total: 79.90,
    itens: [
      {
        livroId: '2',
        titulo: 'Design Patterns',
        quantidade: 1,
        preco: 79.90,
      },
    ],
  },
];

export const mockReviews = {
  '1': [
    {
      id: '1',
      livroId: '1',
      usuarioId: '1',
      nomeUsuario: 'John Doe',
      classificacao: 5,
      titulo: 'Excelente livro!',
      comentario: 'Um dos melhores livros sobre código limpo que já li.',
      data: '2024-01-10',
    },
    {
      id: '2',
      livroId: '1',
      usuarioId: '2',
      nomeUsuario: 'Jane Smith',
      classificacao: 4,
      titulo: 'Muito bom',
      comentario: 'Bom conteúdo, mas alguns exemplos são em Java.',
      data: '2024-01-15',
    },
  ],
};

export const mockAddresses = [
  {
    id: '1',
    tipoEndereco: 'RESIDENCIAL',
    logradouro: 'Rua A',
    numero: '123',
    complemento: 'Apto 101',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    padraoEntrega: true,
  },
];

export const mockCreditCards = [
  {
    id: '1',
    numeroMascarado: '****-****-****-1234',
    titular: 'Demo User',
    bandeira: 'VISA',
    dataExpiracao: '12/26',
    padraoCobranca: true,
  },
];

export const mockAnalytics = {
  totalVendas: 45230.50,
  totalPedidos: 256,
  totalClientes: 1230,
  ticketMedio: 176.70,
  topBooks: mockBooks.slice(0, 5),
  vendsPorDia: [
    { data: '2024-02-25', vendas: 2450 },
    { data: '2024-02-26', vendas: 3120 },
    { data: '2024-02-27', vendas: 2890 },
    { data: '2024-02-28', vendas: 4560 },
    { data: '2024-03-01', vendas: 3780 },
    { data: '2024-03-02', vendas: 5230 },
  ],
};

export const mockNotifications = [
  {
    id: '1',
    tipo: 'PEDIDO',
    titulo: 'Pedido Confirmado',
    mensagem: 'Seu pedido PED-2024-002 foi confirmado.',
    lido: false,
    data: new Date().toISOString(),
  },
];
