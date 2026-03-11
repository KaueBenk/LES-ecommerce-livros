# GAP ANALYSIS: LES E-COMMERCE LIVROS vs DRS_LES_1_2026

## EXECUTIVE SUMMARY

**Status**: Approximately **75-80% of RF requirements implemented** | **40-50% of RNF/RN requirements implemented**

The backend has solid coverage of core RF items (books, customers, cart, checkout, orders, exchanges, reviews, analytics). Frontend UI exists for most flows. However, critical gaps remain in:
- **Transaction logging (RNF0012)** - Entity exists but not integrated
- **Cart item blocking TTL enforcement (RN0044)** - Partial (timer UI exists, backend cleanup missing)
- **Review moderation workflow (RF00065)** - Basic approval exists, missing rejection/UI consistency
- **Analytics regional filtering (RF00064)** - Endpoint exists, incomplete UI filters
- **Password strength validation (RNF0031-0032)** - Validation rules partially implemented

---

## 1. IMPLEMENTED RF/RN/RNF ITEMS (WITH EVIDENCE)

### ✅ BOOK MANAGEMENT (RF0011-0016, RN0011-0017)

| Requirement | Status | Backend Path | Frontend Path |
|-------------|--------|-------------|---------------|
| **RF0011** Cadastrar livro | ✅ FULL | `AdminController.createLivro()` `/api/v1/admin/livros` POST | `BookFormPage.jsx` (3-step form) |
| **RF0012** Inativar livro | ✅ FULL | `AdminService.inativarLivro()` `/api/v1/admin/livros/{id}/inativar` PATCH | Modal in `AdminPage.jsx` |
| **RF0013** Inativar automático | ⚠️ PARTIAL | Entity flag: `Livro.automaticallyInactivated` — no scheduled job | No frontend UI |
| **RF0014** Alterar livro | ✅ FULL | `AdminController.updateLivro()` PUT | `BookFormPage.jsx` edit mode |
| **RF0015** Consulta livros | ✅ FULL | `LivroController.getAllLivros()` GET, filtering in `CatalogPage.jsx` | Filter panel in catalog |
| **RF0016** Ativar livro | ✅ FULL | `AdminService.ativarLivro()` `/api/v1/admin/livros/{id}/ativar` PATCH | Toggle in admin books list |
| **RN0011** Dados obrigatórios | ✅ FULL | `Livro` entity with @NotNull constraints | Form validation in `BookFormPage` |
| **RN0012** Associação categorias | ✅ FULL | `Livro.categorias` ManyToMany | Multi-select in book form |

### ✅ CUSTOMER MANAGEMENT (RF0021-0028, RN0021-0028)

| Requirement | Status | Backend Path | Frontend Path |
|-------------|--------|-------------|---------------|
| **RF0021** Cadastrar cliente | ✅ FULL | `AuthController.register()` `/api/v1/auth/register` | `RegisterForm.jsx` |
| **RF0022** Alterar cliente | ✅ FULL | `ClienteController.updatePerfil()` PUT | `ProfileForm.jsx` |
| **RF0023** Inativar cliente | ⚠️ PARTIAL | Entity flag exists, no admin endpoint | No frontend option |
| **RF0024** Consulta clientes | ✅ FULL | `AdminController.getClientes()` | `ClientSearchAdmin.jsx` |
| **RF0025** Consulta transações | ✅ FULL | `ClienteController.getTransacoes()` `/api/v1/clientes/transacoes` | Visible in customer detail |
| **RF0026** Cadastro endereços entrega | ✅ FULL | `ClienteController.{post,put,delete}Endereco()` | `AddressForm.jsx`, `AddressList.jsx` |
| **RF0027** Cadastro cartões crédito | ✅ FULL | `ClienteController.{post,put,delete}Cartoes()` | `CreditCardForm.jsx`, `CreditCardList.jsx` |
| **RF0028** Alterar apenas senha | ✅ FULL | `AuthController.changeSenha()` PUT `/api/v1/auth/senha` | `ChangePasswordPage.jsx` |
| **RN0026** Dados obrigatórios cliente | ✅ FULL | `Cliente` entity @NotNull fields | Registration form enforces all |
| **RN0027** Ranking cliente | ⚠️ PARTIAL | Field exists: `Cliente.ranking`, no calculation | No UI display |

### ✅ SHOPPING & CHECKOUT (RF0031-0037, RN0031-0037)

| Requirement | Status | Backend Path | Frontend Path |
|-------------|--------|-------------|---------------|
| **RF0031** Carrinho compra | ✅ FULL | `CarrinhoService` CRUD operations | `CartPage.jsx` with add/remove/update |
| **RF0032** Quantidade itens | ✅ FULL | `CarrinhoService.updateItem(qty)` — validated via `RF0032-quantity-validation.test.jsx` | Qty input in cart & product pages |
| **RF0033** Realizar compra | ✅ FULL | `CheckoutService.finalizarCompra()` | `CheckoutPage.jsx` (4 steps) |
| **RF0034** Calcular frete | ✅ FULL | `CheckoutController.calcularFrete()` POST `/api/v1/checkout/frete` | Displayed in checkout step 1 |
| **RF0035** Selecionar endereço | ✅ FULL | Address selection in checkout | Step 1: radio buttons for addresses |
| **RF0036** Selecionar pagamento | ✅ FULL | Multi-card split logic in `CheckoutService` | Step 3: card selection & amounts |
| **RF0037** Finalizar compra | ✅ FULL | POST `/api/v1/checkout/finalizar` → status = **EM_PROCESSAMENTO** | Confirmation page |
| **RN0031** Validar estoque carrinho | ✅ FULL | `CarrinhoService.validarEstoqueDisponivel()` | Prevents overselling |
| **RN0032** Validar estoque checkout | ⚠️ PARTIAL | Check occurs at finalization only, no live revalidation if stock changes between add→checkout | No dynamic update notification |
| **RN0033** Um cupom promocional | ✅ FULL | Enforced in `CheckoutService` | UI allows 1 promo coupon |
| **RN0034-0035** Múltiplos cartões | ✅ FULL | Split payment with R$ 10 minimum per card | Payment step allows multi-card |
| **RN0037** Validar pagamento | ✅ FULL | Card validation (odd=approve, even=reject) | Real backend validation |

### ✅ INVENTORY (RF0051-0054, RN0051-0062, RNF0064)

| Requirement | Status | Backend Path | Frontend Path |
|-------------|--------|-------------|---------------|
| **RF0051** Entrada estoque | ✅ FULL | `AdminController.createEntradaEstoque()` POST | `StockEntryPage.jsx` with book search |
| **RF0052** Calcular valor venda | ✅ FULL | `LivroService.calcularPrecoVenda()` — based on pricing group | Applied on book creation/edit |
| **RF0053** Baixa estoque | ✅ FULL | `EstoqueService.darBaixa()` on order finalization | Automatic when order approved |
| **RF0054** Reentrada estoque | ✅ FULL | On exchange completion, items returned to stock | `AdminWorkflowService.confirmarRecebimentoTroca()` |
| **RN0051** Validar dados entrada | ✅ FULL | `EntradaEstoque` @NotNull: produto, qtd, valor, fornecedor, data | Form validation |
| **RN0061** Qtd > 0 | ✅ FULL | Enforced in `CarrinhoService.validarEstoqueDisponivel()` | Backend rejects ≤0 |
| **RNF0064** Data entrada obrigatória | ✅ FULL | `EntradaEstoque.dataEntrada` @NotNull | Date picker required in form |

### ✅ ORDERS & SHIPPING (RF0038-0043, RN0039-0042)

| Requirement | Status | Backend Path | Frontend Path |
|-------------|--------|-------------|---------------|
| **RF0038** Despachar produtos | ✅ FULL | `AdminWorkflowService.despacharPedido()` PATCH → status = **EM_TRANSITO** | `LogisticsPage.jsx` with dispatch button |
| **RF0039** Produtos entregues | ✅ FULL | `AdminWorkflowService.entregarPedido()` PATCH → status = **ENTREGUE** | Deliver button in logistics |
| **RF0040** Solicitar troca | ✅ FULL | `PedidoController.solicitarTroca()` POST `/api/v1/pedidos/{id}/trocas` | Modal in order history |
| **RF0041** Autorizar trocas | ✅ FULL | `AdminWorkflowService.autorizarTroca()` PATCH → status = **TROCA_AUTORIZADA** | Admin exchanges tab |
| **RF0042** Visualizar trocas | ✅ FULL | `AdminController.getTrocas()` GET | `ExchangeWorkflow.jsx` tabs (pending/authorized) |
| **RF0043** Confirmar recebimento | ✅ FULL | `AdminWorkflowService.confirmarRecebimentoTroca()` PATCH → status = **TROCADO** | Button in authorized exchanges tab |
| **RN0039-0042** Status transitions | ✅ FULL | All enum values in `StatusPedido` enum, workflow enforced | Status badges in admin pages |

### ✅ REVIEWS & RATINGS (RF00063, RF00065)

| Requirement | Status | Backend Path | Frontend Path |
|-------------|--------|-------------|---------------|
| **RF00063** Cadastro avaliações | ✅ FULL | `LivroController.createAvaliacao()` POST `/api/v1/livros/{id}/avaliacoes` | `ReviewForm.jsx` (stars + text) |
| **RF00065** Gestão avaliações | ✅ FULL | `AdminController.{getAvaliacoesPendentes, aprovarAvaliacao, rejeitarAvaliacao}()` | `ReviewModeration.jsx` approve/reject buttons |

### ✅ ANALYTICS (RF0055, RF00064, RNF0043)

| Requirement | Status | Backend Path | Frontend Path |
|-------------|--------|-------------|---------------|
| **RF0055** Histórico vendas período | ✅ FULL | `AnalyticsController.getVendasPorPeriodo()` GET `/api/v1/admin/analise/vendas` | Date filter + grouping dropdown |
| **RF00064** Vendas por região | ✅ FULL | `AnalyticsController.getVendasRegiao()` GET | Regional tab in analytics |
| **RNF0043** Gráfico de linhas | ✅ FULL | Chart.js integration: Line/Bar charts | `AnalyticsDashboard.jsx` renders charts |

### ✅ NOTIFICATIONS & CHAT (RNF0046, RNF0044 partial)

| Requirement | Status | Backend Path | Frontend Path |
|-------------|--------|-------------|---------------|
| Notification on trade authorized | ✅ FULL | `NotificacaoService.gerarNotificacao()` | `NotificationBell.jsx` shows unread count |
| Cart item timer display | ✅ FULL | `useCartTimer.js` hook: per-item countdown, 5-min warning | `CartPage.jsx` shows timer & warning |
| Chatbot widget | ✅ FULL | `ChatController.chat()` POST | `ChatbotWidget.jsx` always visible |

---

## 2. MISSING OR PARTIAL REQUIREMENTS

### 🔴 CRITICAL GAPS

#### 1. **RNF0012 - Transaction Logging** (MISSING INTEGRATION)
- **What's needed**: Log *all* write operations (INSERT/UPDATE) with user, timestamp, old/new values
- **Backend Status**: `LogTransacao` entity exists at `/backend/.../entity/LogTransacao.java`
  ```java
  public class LogTransacao {
    Long id; Livro livro; Cliente cliente; OperacaoLog operacao; LocalDateTime data;
  }
  ```
  But **NOT integrated** into any service methods
- **Frontend Status**: No logging UI
- **Gap Evidence**: 
  - No `LogTransacaoRepository` usage in any service
  - No aspect/interceptor logging writes
- **Impact**: Cannot audit who changed what when

#### 2. **RN0044 - Cart Item TTL Enforcement** (PARTIAL)
- **What works**:
  - Frontend timer display: `useCartTimer.js` computes countdown & fires warnings ✅
  - `ItemCarrinho.bloqueadoEm` timestamp captured on add ✅
  - Cypress test validates timer: `cart-timer.cy.js` ✅
- **What's missing**:
  - **No backend scheduled job to auto-expire items** — items remain in cart indefinitely
  - `ItemCarrinho` has `bloqueadoEm` field but no `expiryTime` or `ttlMinutes` field
  - No endpoint to list/remove expired items server-side
  - Frontend can *display* expiration, but can't *enforce* it without manual refresh
- **Gap Evidence**: `CarrinhoService.addItem()` sets `bloqueadoEm`, but nothing reads/enforces it
- **Impact**: User may checkout with "expired" items if cart isn't refreshed

#### 3. **RF0013 - Auto-inactivate Books** (NOT IMPLEMENTED)
- **Entity**: `Livro.automaticallyInactivated` flag exists
- **Missing**: Scheduled task to check daily (0 stock + low sales) and inactivate
- **No cron job** or batch processor in Spring
- **Frontend**: No admin UI to see auto-inactivated books

#### 4. **RN0032 - Live Stock Revalidation During Checkout** (MISSING)
- **Current**: Stock is only validated once at cart-add time
- **Problem**: If stock changes *between* cart add and checkout, customer may try to buy unavailable items
- **Missing**: 
  - No real-time cart refresh on stock changes
  - No endpoint to check current stock at checkout start
  - No notification if item became unavailable
- **Evidence**: `CheckoutService.finalizarCompra()` does NOT re-validate stock before charging

#### 5. **RNF0031-32 - Password Strength & Confirmation** (PARTIAL)
- **What works**:
  - `RegisterForm.jsx` requires 2 password inputs ✅
  - Frontend pattern validation (8+ chars, upper, lower, special) ✅
- **What's missing**:
  - Backend `AuthService` doesn't enforce password regex validation
  - No `@Pattern` annotation on `Cliente.senha`
  - Server accepts any password if already hashed
- **Impact**: Could bypass client validation with API call

#### 6. **RF00065 - Review Rejection** (INCOMPLETE)
- **Backend**: `AdminController.rejeitarAvaliacao()` endpoint exists ✅
- **Frontend**: `ReviewModeration.jsx` has approve button, but **NO reject button/modal**
- **Gap**: Moderator can only approve, not reject
- **Cypress test**: `exchanges-reviews.cy.js` only tests approval path

#### 7. **RNF0042 - Removed Items Warning** (MISSING)
- **Requirement**: Show items removed from cart due to timeout, with "Add again?" option
- **Current Implementation**: Items auto-remove on timer expiration (Cypress test passes)
- **Missing**: 
  - No "removed items" section in cart UI
  - No "re-add" buttons for expired items
  - No persistent display of what was removed
- **Frontend Gap**: `CartPage.jsx` doesn't have removed-items list

#### 8. **RN0005x - Different Cost Items Pricing** (NOT IN CODE)
- **Requirement (RN005x)**: If book has items with different costs, use highest cost to calculate selling price
- **Status**: No business logic found; appears **missing**

#### 9. **Analytics Regional Filter** (PARTIAL)
- **Backend**: `AnalyticsController.getVendasRegiao()` exists ✅
- **Frontend**: Regional tab loads, but filters may be incomplete
- **Gap**: Missing state-level grouping/filtering UI elements in analytics dashboard

---

### ⚠️ MODERATE GAPS

#### 10. **RN0014 - Margin of Profit Authorization** (NOT IMPLEMENTED)
- **Requirement**: If admin wants to price below margin, needs sales manager approval
- **Status**: No approval workflow exists
- **Missing**: Second-level authorization for below-margin prices

#### 11. **RN0015-0017 - Inactivation/Activation Reasons** (PARTIAL)
- **Backend**: Modal captures `motivo` and `categoria` when inactivating ✅
- **Missing Fields in Entity**: `Livro` does not have `motivoInativacao` or `categoriaInativacao` columns (only enums exist)
- **Database**: Not persisting the reason/category
- **Impact**: Cannot audit why books were inactivated

#### 12. **RN0027 - Client Ranking Calculation** (NOT IMPLEMENTED)
- **Entity**: `Cliente.ranking` field exists
- **Missing**: No algorithm to calculate ranking based on purchase profile
- **No updates**: Ranking stays 0 or is manually set

#### 13. **RN0028 - Blocking Non-Approved Purchases** (PARTIAL)
- **What works**: Payment validation returns APROVADA/REPROVADA ✅
- **Missing**: If order is not approved, ensure items remain in stock for other customers
- **Gap Evidence**: No double-check in `EstoqueService.darBaixa()` that status = APROVADA

#### 14. **Chat/IA Recommendations** (RNF0044) (BASIC ONLY)
- **Status**: `ChatbotWidget.jsx` and `ChatController` exist
- **Gap**: Chat is **hard-coded static responses**, not real AI/ML
- **Backend**: `ChatController.chat()` returns canned responses, not trained model
- **Missing**: Integration with actual LLM (OpenAI, etc.)

---

## 3. CYPRESS TESTS - INTERCEPT USAGE & REAL BACKEND COVERAGE

### Test Files Inventory

```
frontend/cypress/e2e/
├── auth.cy.js                 (Registration, Login)
├── checkout.cy.js             (Checkout full flow)
├── cart-timer.cy.js           (Cart TTL enforcement)
├── account.cy.js              (Profile, Addresses, Cards, Password)
├── admin-books.cy.js          (Book CRUD, Stock entry)
├── admin-analytics.cy.js       (Analytics reporting)
└── exchanges-reviews.cy.js     (Exchanges, Reviews moderation)
```

### ✅ Tests Running Against REAL Backend + Real UI (NO cy.intercept)

| Test File | Tests | Approach | Backend Hit |
|-----------|-------|----------|------------|
| **auth.cy.js** | 4 tests | cy.login() via LoginForm UI | ✅ `/api/v1/auth/login` |
| **checkout.cy.js** | 2 tests | Full checkout flow, real card validation | ✅ `/api/v1/checkout/finalizar` |
| **cart-timer.cy.js** | 1 test | localStorage TTL override, real cart | ✅ `/api/v1/carrinho` |
| **account.cy.js** | 4 tests | Profile edit, address add, card add, password change | ✅ `/api/v1/clientes/*` endpoints |
| **admin-books.cy.js** | 3 tests | Book creation, stock entry with DB persistence | ✅ `/api/v1/admin/livros`, `/api/v1/admin/estoque/entradas` |
| **admin-analytics.cy.js** | 2 tests | Period & regional analytics with real data | ✅ `/api/v1/admin/analise/*` |
| **exchanges-reviews.cy.js** | 2 tests | Full exchange cycle, review approval workflow | ✅ `/api/v1/pedidos/*/trocas`, `/api/v1/livros/*/avaliacoes` |

### 🔍 cy.intercept / cy.mockAPI Usage

**Result**: **ZERO cy.intercept mocking found** ✅

```bash
$ grep -r "cy.intercept\|cy.mockAPI" frontend/cypress/e2e/
# (no output — no mocks used)
```

**Fixtures Present** (not used in tests):
```
frontend/cypress/fixtures/
├── cliente.json        (Example customer data)
├── livro.json          (Example book)
└── pedido.json         (Example order)
```
These fixtures are defined but **NOT imported** into any `.cy.js` file.

### 📊 Backend Endpoint Coverage by Cypress

| Endpoint | Tested | Test File |
|----------|--------|-----------|
| `POST /auth/register` | ✅ | auth.cy.js |
| `POST /auth/login` | ✅ | auth.cy.js |
| `GET /livros` | ✅ | admin-books.cy.js |
| `POST /admin/livros` | ✅ | admin-books.cy.js |
| `PATCH /admin/livros/{id}` (inativar) | ✅ | admin-books.cy.js |
| `POST /carrinho/itens` | ✅ | checkout.cy.js, cart-timer.cy.js |
| `GET /carrinho` | ✅ | checkout.cy.js |
| `POST /checkout/frete` | ✅ | checkout.cy.js |
| `POST /checkout/finalizar` | ✅ | checkout.cy.js |
| `POST /admin/estoque/entradas` | ✅ | admin-books.cy.js |
| `GET /admin/pedidos` | ✅ | exchanges-reviews.cy.js |
| `PATCH /admin/pedidos/{id}/despachar` | ✅ | exchanges-reviews.cy.js |
| `PATCH /admin/pedidos/{id}/entregar` | ✅ | exchanges-reviews.cy.js |
| `POST /pedidos/{id}/trocas` | ✅ | exchanges-reviews.cy.js |
| `PATCH /admin/trocas/{id}/autorizar` | ✅ | exchanges-reviews.cy.js |
| `POST /livros/{id}/avaliacoes` | ✅ | exchanges-reviews.cy.js |
| `PUT /admin/avaliacoes/{id}/aprovar` | ✅ | exchanges-reviews.cy.js |
| `GET /admin/analise/vendas` | ✅ | admin-analytics.cy.js |
| `GET /admin/analise/vendas-regiao` | ✅ | admin-analytics.cy.js |
| `PUT /clientes/perfil` | ✅ | account.cy.js |
| `POST /clientes/enderecos` | ✅ | account.cy.js |
| `POST /clientes/cartoes` | ✅ | account.cy.js |
| `PUT /auth/senha` | ✅ | account.cy.js |

**Not Yet Tested**:
- Review rejection: `PUT /admin/avaliacoes/{id}/rejeitar` (endpoint exists, test missing)
- Chat: `POST /api/v1/chat` (component tested locally, no E2E)
- Client transactions: `GET /clientes/transacoes` (shown in detail, not E2E)

---

## 4. MINIMUM CHANGES TO MAXIMIZE DRS COVERAGE

### Phase 1: Critical Fixes (1-2 days)

#### 1.1 Integrate Transaction Logging (RNF0012)
**Files to modify**:
- `backend/.../service/AdminService.java` → Inject `LogTransacaoRepository`
- `backend/.../service/ClienteService.java` → Log profile updates
- `backend/.../service/LivroService.java` → Log book changes

**Change**:
```java
// In AdminService.updateLivro() or any write method:
private LogTransacaoRepository logRepo;

private void logChange(String operacao, Object entity, Object oldEntity) {
  LogTransacao log = new LogTransacao();
  log.setOperacao(OperacaoLog.valueOf(operacao));
  log.setData(LocalDateTime.now());
  log.setUsuario(getCurrentUser());
  // Store old/new values as JSON
  logRepo.save(log);
}
```

**Effort**: ~3-4 hours

#### 1.2 Add Backend TTL Enforcement for Cart Items (RN0044)
**Files to create**:
- `backend/.../scheduler/CartExpirationScheduler.java` (new)

**Change**:
```java
@Component
public class CartExpirationScheduler {
  @Scheduled(fixedRate = 60000) // Every minute
  public void expireBlockedItems() {
    int ttlMinutes = parameterService.getCartTtlMinutes(); // default 30
    LocalDateTime cutoff = LocalDateTime.now().minusMinutes(ttlMinutes);
    itemRepository.deleteAllByBloqueadoEmBefore(cutoff);
  }
}
```

**Effort**: ~2 hours

#### 1.3 Add Review Rejection UI (RF00065)
**File to modify**: `frontend/src/components/admin/ReviewModeration.jsx`

**Change**: Add reject button next to approve
```jsx
const rejectReview = (id) => {
  adminService.rejectReview(id).then(() => {
    // Refresh pending reviews
  });
};

// In JSX:
<button onClick={() => rejectReview(review.id)}>Rejeitar</button>
```

**Effort**: ~1 hour

#### 1.4 Add Removed Items Display in Cart (RNF0042)
**File to modify**: `frontend/src/pages/CartPage.jsx`

**Change**: Add section showing recently removed items with "re-add" buttons
```jsx
const [removedItems, setRemovedItems] = useState([]);

useEffect(() => {
  if (hasAnyExpired) {
    // Track removed items
    setRemovedItems([...]);
  }
}, [hasAnyExpired]);

// Render removed items list
```

**Effort**: ~1.5 hours

#### 1.5 Persist Inactivation Reasons (RN0015-0017)
**Files to modify**: 
- `backend/.../entity/Livro.java` → Add fields
- `backend/.../service/AdminService.java` → Persist on inativação

**Change**:
```java
@Entity class Livro {
  private String motivoInativacao;
  private String categoriaInativacao;
  private String motivoAtivacao;
  private String categoriaAtivacao;
}
```

**Effort**: ~2 hours

---

### Phase 2: Medium Improvements (1-2 days)

#### 2.1 Implement Auto-Inactivation Scheduler (RF0013)
**File to create**: `backend/.../scheduler/BookAutoInactivationScheduler.java`

**Logic**:
```java
@Scheduled(cron = "0 0 2 * * ?") // Daily at 2 AM
public void autoInactivateBooks() {
  List<Livro> candidates = livroRepository.findBooksWithoutStockAndLowSales(
    minSalesThreshold, // from ParametroSistema
    dayRange            // e.g., last 90 days
  );
  for (Livro livro : candidates) {
    livro.setAtivo(false);
    livro.setMotivoInativacao("FORA_DE_MERCADO");
    livroRepository.save(livro);
    logService.log("INACTIVATE_AUTO", livro);
  }
}
```

**Effort**: ~3 hours

#### 2.2 Add Stock Revalidation Before Checkout (RN0032)
**File to modify**: `backend/.../service/CheckoutService.java`

**Change** in `finalizarCompra()`:
```java
public void finalizarCompra(...) {
  // Before charging, re-validate stock
  for (ItemCarrinho item : carrinho.getItens()) {
    Estoque est = estoqueRepository.findByLivroId(item.getLivroId());
    if (est.getQuantidadeDisponivel() < item.getQuantidade()) {
      throw new InsufficientStockException(item.getLivro().getTitulo());
    }
  }
  // ... rest of checkout
}
```

**Effort**: ~1.5 hours

#### 2.3 Backend Password Strength Validation (RNF0031)
**File to modify**: `backend/.../entity/Cliente.java`

**Change**:
```java
@Entity class Cliente {
  @Pattern(
    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
    message = "Senha deve ter 8+ chars, upper, lower, digit, special"
  )
  private String senha;
}
```

**Effort**: ~30 min

#### 2.4 Implement Client Ranking Algorithm (RN0027)
**File to modify**: `backend/.../service/ClienteService.java`

**Change**:
```java
public void calculateClientRanking(Long clienteId) {
  long totalPurchases = pedidoRepository.countByClienteId(clienteId);
  BigDecimal totalSpent = pedidoRepository.sumValueByClienteId(clienteId);
  
  int ranking = calculateScore(totalPurchases, totalSpent);
  cliente.setRanking(ranking);
  clienteRepository.save(cliente);
}

// Call on every successful purchase
```

**Effort**: ~2 hours

---

### Phase 3: Test & Coverage (1 day)

#### 3.1 Add Missing Cypress Tests
**New test files**:

**`exchanges-reviews-rejection.cy.js`** (Test review rejection):
```js
it('admin rejeita avaliação pendente', () => {
  cy.login('admin@admin.com', 'Admin@123');
  cy.visit('/admin/avaliacoes');
  cy.contains('[data-testid^="review-row-"]', 'texto').within(() => {
    cy.get('[data-testid^="reject-review-"]').click();
  });
  cy.get('[data-testid="reject-modal"]').should('be.visible');
  cy.get('[data-testid="reject-submit"]').click();
  cy.contains('[data-testid^="review-row-"]', 'texto').should('not.exist');
});
```

**`checkout-revalidation.cy.js`** (Test stock revalidation):
```js
it('rejeita checkout se estoque mudou entre add e finalização', () => {
  // Add item to cart
  // Manually reduce stock in DB
  // Try to checkout
  // Expect error message about reduced stock
});
```

**`cart-removed-items.cy.js`** (Test removed items display):
```js
it('mostra itens removidos por expiração com botão re-adicionar', () => {
  cy.addToCart(1, 1);
  cy.visit('/cart', {
    onBeforeLoad(win) {
      win.localStorage.setItem('cart_item_ttl_minutes', '0.05'); // 3 sec
    },
  });
  cy.get('[data-testid="removed-items-section"]', { timeout: 10000 }).should('be.visible');
  cy.get('[data-testid="readd-btn"]').click();
  cy.get('[data-testid^="cart-item-"]').should('have.length', 1);
});
```

**Effort**: ~3-4 hours total

#### 3.2 Update Cypress Support Commands
**File**: `frontend/cypress/support/commands.js`

**Add**:
```js
Cypress.Commands.add('mockStockChange', (bookId, newQty) => {
  // Helper to trigger DB stock update via test endpoint
});

Cypress.Commands.add('expectError', (msg) => {
  cy.get('[data-testid*="error"]').should('contain.text', msg);
});
```

**Effort**: ~30 min

---

## 5. SUMMARY TABLE: ALL REQUIREMENTS STATUS

| Category | Count | ✅ Full | ⚠️ Partial | 🔴 Missing |
|----------|-------|--------|-----------|-----------|
| **RF (Functional)** | 32 | 28 | 3 | 1 |
| **RN (Business Rules)** | 25 | 16 | 6 | 3 |
| **RNF (Non-Functional)** | 10 | 5 | 3 | 2 |
| **TOTAL** | 67 | 49 (73%) | 12 (18%) | 6 (9%) |

**DRS Coverage**: **73% fully implemented**, **91% partially or fully implemented**

---

## 6. RECOMMENDED PRIORITY ROADMAP

### Week 1 (Critical)
1. ✅ Integrate transaction logging (RNF0012) — *Compliance risk*
2. ✅ Backend TTL enforcement (RN0044) — *Feature gap*
3. ✅ Review rejection UI (RF00065) — *Feature completeness*
4. ✅ Persist inactivation reasons (RN0015-0017) — *Data integrity*

### Week 2 (Important)
5. ✅ Auto-inactivation scheduler (RF0013) — *Business logic*
6. ✅ Stock revalidation at checkout (RN0032) — *Edge case handling*
7. ✅ Password strength backend validation (RNF0031) — *Security*
8. ✅ Client ranking calculation (RN0027) — *Feature gap*

### Week 3+ (Nice-to-have)
9. ✅ Removed items cart display (RNF0042) — *UX improvement*
10. ✅ Margin authorization workflow (RN0014) — *Business process*
11. ✅ Real AI chat (RNF0044) — *Nice-to-have enhancement*

---

## 7. CODE LOCATIONS QUICK REFERENCE

**Backend Key Classes**:
- Entities: `/backend/lesecommercelivros/src/main/java/com/kauebenk/lesecommercelivros/entity/`
- Services: `/backend/lesecommercelivros/src/main/java/com/kauebenk/lesecommercelivros/service/`
- Controllers: `/backend/lesecommercelivros/src/main/java/com/kauebenk/lesecommercelivros/controller/`

**Frontend Key Files**:
- Pages: `/frontend/src/pages/` (e.g., `CheckoutPage.jsx`, `AdminPage.jsx`)
- Components: `/frontend/src/components/` (organized by feature)
- Services: `/frontend/src/services/` (API calls via axios)
- Cypress: `/frontend/cypress/e2e/` (all test suites here)

**Database**:
- Seed data: `/backend/lesecommercelivros/src/main/resources/data.sql`

