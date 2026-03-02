# Demo Mode - Mock Data Reference

## Current Demo Data Status ✅

The demo mode now includes a comprehensive mock dataset suitable for full interface demonstration without a backend API.

### Customers
- **Total**: 30 customers registered
- **Date Range**: 2026-01-01 to 2026-03-02
- **Attributes**: Full profiles with names, emails, CPF, phone, registration dates
- **Admin Panel**: All customers searchable by name, email, or CPF

### Books / Products
- **Total**: 20 books in catalog
- **Categories**: 8 categories (Programação, Algoritmos, Web, Arquitetura, etc.)
- **Authors**: 12 authors
- **Details**: Each book has price, discount, stock level, description, rating, review count
- **Stock**: Real-time inventory per book location

### Orders
- **Total**: 27 orders with realistic distribution
- **Status Distribution**:
  - ENTREGUE (Delivered): 14 orders
  - PROCESSANDO (Processing): 4 orders
  - ENVIADO (Shipped): 4 orders
  - PENDENTE (Pending): 3 orders
  - CANCELADO (Cancelled): 2 orders
- **Date Range**: 2026-01-05 to 2026-03-02
- **Order Items**: Each order contains 1-4 books with pricing and discounts applied

### Reviews & Ratings
- **Total**: 8 product reviews
- **Distribution**: Across 6 different books
- **Ratings**: 4-5 stars (realistic positive reviews)
- **Attributes**: Title, comment, useful count, total votes, review date

### Exchanges & Returns
- **Total**: 5 exchange/return records
- **Status Distribution**:
  - PENDENTE (Pending): 1
  - APROVADO (Approved): 2
  - PROCESSANDO (Processing): 1
  - REJEITADO (Rejected): 1
- **Reasons**: Product defect, content satisfaction, shipping damage, edition swap, loose pages

### Stock Inventory
- **Coverage**: All 20 books have stock entries
- **Attributes**: Quantity, reserved items, minimum threshold, location (Shelf A-J), last movement date
- **Stock Range**: 15-58 units per book
- **Reserved**: 2-12 units per book

### Analytics Data
- **Period**: 2026-01-01 to 2026-03-02 (61 days)
- **Metrics**:
  - Total Sales: R$ 27,000
  - Total Orders: 27
  - Total Customers: 30
  - Average Ticket: R$ 1,000
- **Daily Sales**: Realistic variation across all days in date range
- **Top Products**: Clean Code (8 sales), Learning Python (6 sales), Refactoring (5 sales)
- **Best Categories**: Programação (18 sales), Algoritmos (8 sales), Web (7 sales)

### Notifications
- **Total**: 3 sample notifications
- **Types**: Order delivery, promotions, order confirmation
- **Auto-read Status**: Mixed (1 read, 2 unread)

---

## How Demo Mode Works

1. **Auto-Login**: User automatically logged in as "Demo Administrator" with ADMIN role
2. **No API Calls**: Custom axios adapter intercepts all requests before network call
3. **Transparent Integration**: Application code unchanged - works as if real API is responding
4. **All Endpoints**: 40+ API endpoints mapped to mock responses

## Accessing Demo Mode

```bash
# Start demo mode
npm run dev:demo

# Or manually
VITE_DEMO_MODE=true npm run dev
```

Access at `http://localhost:5174/` - you'll be auto-logged in as admin.

---

## Endpoint Coverage

### Implemented Endpoints
- ✅ `/auth/login` - Auto-login as admin
- ✅ `/admin/livros` - Get books (with pagination)
- ✅ `/admin/pedidos` - Get orders (with pagination, filtering)
- ✅ `/admin/clientes` - Get customers (with search, pagination)
- ✅ `/admin/trocas` - Get exchanges/returns (with pagination)
- ✅ `/admin/estoque` - Get stock data (with pagination)
- ✅ `/catalogo/livros` - Client catalog
- ✅ `/admin/analytics` - Dashboard analytics
- ✅ `/clientes/avaliacoes` - Product reviews
- ✅ `+30 more endpoints...`

---

## Testing Checklist

### Admin Panel
- [ ] View 30 customers in admin customer list
- [ ] Search customers by name/email/CPF
- [ ] View all 20 books in admin catalog
- [ ] View 27 orders with status breakdown
- [ ] Filter orders by status
- [ ] View 5 exchange/return requests
- [ ] View stock inventory for all books
- [ ] Analytics dashboard shows sales data
- [ ] Date range filter works (01/01/2026 - 03/02/2026)

### Customer Interface
- [ ] Browse 20 books in public catalog
- [ ] View book details with reviews and ratings
- [ ] See stock availability for books
- [ ] View order history (for logged-in demo admin)
- [ ] See order statuses and dates
- [ ] View product reviews with ratings
- [ ] See customer profile information

### Data Consistency
- [ ] Order items reference valid books
- [ ] Customer IDs in orders match customer list
- [ ] Book prices and discounts applied correctly
- [ ] Stock quantities make sense (reserved < total)
- [ ] Dates in logical order (registrations → orders → reviews)
- [ ] Order statuses have realistic distribution

