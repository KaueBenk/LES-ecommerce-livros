# 🎯 Modo Demo - Interface com Dados Mockados

Esta guia explica como usar o **Modo Demo** para exibir a interface com dados mockados, sem necessidade de uma API real.

## 🚀 Iniciar em Modo Demo

### Opção 1: Com `.env.local` (Recomendado para desenvolvimento contínuo)

O arquivo `.env.local` já está configurado com `VITE_DEMO_MODE=true`.

```bash
cd frontend
npm install
npm run dev:demo
```

Acesse: **http://localhost:5173**

### Opção 2: Usar variável de ambiente diretamente

```bash
cd frontend
VITE_DEMO_MODE=true npm run dev
```

### Opção 3: Build de produção com modo demo

```bash
cd frontend
VITE_DEMO_MODE=true npm run build
npm run preview
```

---

## ✨ Funcionalidades do Modo Demo

### ✅ Autenticação Automática
- Você é automaticamente logado como **admin**
- Email: `demo@example.com`
- Sem necessidade de inserir credenciais
- Acesso completo ao painel de administração

### ✅ Dados Mockados Disponíveis

#### 📚 Catálogo
- **6 livros** com informações completas (título, autor, preço, avaliações, imagens)
- Paginação funcional
- Busca e filtros funcionam

#### 👤 Perfil do Usuário
- Nome: Demo User
- Email: demo@example.com
- CPF, telefone, data de nascimento (dados fake)

#### 📍 Endereços
- 1 endereço de entrega configurado
- Pode adicionar/editar/deletar endereços em modo demo

#### 💳 Cartões de Crédito
- 1 cartão VISA mockado
- Pode gerenciar cartões no painel

#### 📦 Pedidos
- 2 pedidos de exemplo com status diferentes
- Histórico de pedidos funcional

#### 📊 Admin Dashboard
- Estatísticas de vendas (mockadas)
- Gráficos funcionais com dados demo
- Acesso a todos os painéis administrativos

### ✅ Carrinho de Compras
- Funciona como esperado
- Pode adicionar/remover livros
- Checkout mockado (cria pedido fake)

### ✅ Reviews de Livros
- Reviews pré-carregados
- Pode submeter novos reviews (salvos localmente)

---

## 🔧 Desabilitar Modo Demo

### Opção 1: Editar `.env.local`
```bash
# Mude esta linha:
VITE_DEMO_MODE=true
# Para:
VITE_DEMO_MODE=false
```

### Opção 2: Deletar `.env.local` e usar API real
```bash
rm frontend/.env.local
npm run dev  # Usa API real em /api/v1
```

---

## 📝 O que foi Implementado

### Arquivos Criados
- ✅ `src/services/mockData.js` - Dados mockados
- ✅ `src/services/demoInterceptor.js` - Interceptador de requisições
- ✅ `.env.local` - Configuração de modo demo
- ✅ `package.json` - Script `dev:demo` adicionado

### Arquivos Modificados
- ✅ `src/services/api.js` - Integração do interceptador
- ✅ `src/store/authContext.jsx` - Auto-login em modo demo
- ✅ `src/components/auth/ProtectedRoute.jsx` - Bypass de proteção em demo

---

## 🎬 Fluxos de Teste

### Teste Completo de Compra
1. Home → Catálogo → Selecione um livro
2. Adicione ao carrinho
3. Vá para o carrinho → Checkout
4. Preencha endereço e pagamento
5. Confirme o pedido ✅

### Teste de Admin
1. Acesso automático ao `/admin`
2. Analytics dashboard com dados mock
3. Pode navegar entre todos os painéis

### Teste de Perfil
1. Clique em "Minha Conta" → Perfil
2. Editar informações pessoais
3. Gerenciar endereços (CRUD)
4. Gerenciar cartões de crédito

---

## 🐛 Troubleshooting

### Porta 5173 já está em uso
```bash
npm run dev:demo -- --port 3000
```

### Modo demo não está ativado
Verifique se `VITE_DEMO_MODE=true` está no `.env.local`:
```bash
cat frontend/.env.local
```

### Dados desaparecem ao recarregar
É esperado - dados mockados não são persistidos no backend. O localStorage mantém itens do carrinho.

### Erro de CORS
Em modo demo, as requisições são interceptadas antes de chegar ao CORS, não deve haver erro.

---

## 📚 Dados Mockados Disponíveis

Todos os dados estão em `src/services/mockData.js`:

```javascript
export const mockUser = { ... }           // Usuário logado
export const mockBooks = [ ... ]          // 6 livros
export const mockCategories = [ ... ]     // 5 categorias
export const mockAuthors = [ ... ]        // 6 autores
export const mockOrders = [ ... ]         // 2 pedidos
export const mockReviews = { ... }        // Reviews por livro
export const mockAddresses = [ ... ]      // Endereços do usuário
export const mockCreditCards = [ ... ]    // Cartões de crédito
export const mockAnalytics = { ... }      // Dashboard analytics
export const mockNotifications = [ ... ]  // Notificações
```

Você pode customizar esses dados conforme necessário.

---

## 🎯 Próximos Passos

Quando a API real estiver pronta:
1. Remova `VITE_DEMO_MODE=true` do `.env.local`
2. Configure `VITE_API_URL` para apontar para sua API
3. Todo o código existente funcionará com a API real (sem mudanças)

---

**Happy testing! 🚀**
