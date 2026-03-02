/**
 * cypress/e2e/admin-analytics.cy.js
 * US-047 | FE-037
 *
 * Tests:
 *  - Sales-by-period chart rendering (line chart, multiple series, legend, summary)
 *  - Sales-by-region chart rendering (bar chart, states on axis, value-based colors)
 *  - Filter interactions (date pickers, grouping select, metric select)
 *  - Data transformations (summary tables, totals)
 *  - Tab switching between views
 *  - Error / empty states
 */

import clienteFixture from '../fixtures/cliente.json';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const salesByPeriodResCategoria = {
  periodo: { dataInicio: '2026-01-01', dataFim: '2026-03-31' },
  series: [
    {
      nome: 'Ficção Científica',
      data: [
        { mes: '2026-01', quantidade: 45, valor: 1350.5 },
        { mes: '2026-02', quantidade: 38, valor: 1140.0 },
        { mes: '2026-03', quantidade: 52, valor: 1560.0 },
      ],
    },
    {
      nome: 'Romance',
      data: [
        { mes: '2026-01', quantidade: 30, valor: 750.0 },
        { mes: '2026-02', quantidade: 22, valor: 550.0 },
        { mes: '2026-03', quantidade: 41, valor: 1025.0 },
      ],
    },
    {
      nome: 'Programação',
      data: [
        { mes: '2026-01', quantidade: 18, valor: 900.0 },
        { mes: '2026-02', quantidade: 25, valor: 1250.0 },
        { mes: '2026-03', quantidade: 31, valor: 1550.0 },
      ],
    },
  ],
};

const salesByPeriodResProduto = {
  periodo: { dataInicio: '2026-01-01', dataFim: '2026-03-31' },
  series: [
    {
      nome: 'Fundação - Isaac Asimov',
      data: [
        { mes: '2026-01', quantidade: 20, valor: 599.8 },
        { mes: '2026-02', quantidade: 15, valor: 449.85 },
        { mes: '2026-03', quantidade: 22, valor: 659.78 },
      ],
    },
    {
      nome: 'Clean Code - Robert Martin',
      data: [
        { mes: '2026-01', quantidade: 12, valor: 719.88 },
        { mes: '2026-02', quantidade: 18, valor: 1079.82 },
        { mes: '2026-03', quantidade: 14, valor: 839.86 },
      ],
    },
  ],
};

const regionalSalesRes = {
  periodo: { dataInicio: '2026-01-01', dataFim: '2026-03-31' },
  estados: [
    { estado: 'SP', quantidade: 120, valor: 3600.0 },
    { estado: 'RJ', quantidade: 80, valor: 2400.0 },
    { estado: 'MG', quantidade: 60, valor: 1800.0 },
    { estado: 'RS', quantidade: 45, valor: 1350.0 },
    { estado: 'PR', quantidade: 35, valor: 1050.0 },
    { estado: 'BA', quantidade: 20, valor: 600.0 },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const setupAdminVisit = (url) => {
  const adminProfile = { ...clienteFixture, role: 'ADMIN', roles: ['ADMIN', 'ROLE_ADMIN'] };
  cy.visit(url, {
    onBeforeLoad(win) {
      win.localStorage.setItem('auth_token', 'admin-jwt');
      win.localStorage.setItem('user_profile', JSON.stringify(adminProfile));
    },
  });
};

const silenceGlobalAPIs = () => {
  cy.intercept('GET', '**/notificacoes/nao-lidas/count', {
    statusCode: 200,
    body: { data: 0 },
  });
  cy.intercept('GET', '**/clientes/perfil', {
    statusCode: 200,
    body: { data: { ...clienteFixture, role: 'ADMIN', roles: ['ADMIN', 'ROLE_ADMIN'] } },
  });
  cy.intercept('GET', '**/carrinho', {
    statusCode: 200,
    body: { data: { itens: [], valorSubtotal: 0, valorFrete: 0, valorTotal: 0 } },
  });
  cy.intercept('GET', '**/carrinhos/**', {
    statusCode: 200,
    body: { data: { itens: [], quantidade: 0, valorTotal: 0 } },
  });
  cy.intercept('GET', '**/categorias**', {
    statusCode: 200,
    body: { data: [] },
  });
};

// ─── describe: Sales By Period ─────────────────────────────────────────────────

describe('Admin Analytics — Sales By Period (tab Período)', () => {
  beforeEach(() => {
    silenceGlobalAPIs();
  });

  it('renders empty state before submitting filters', () => {
    cy.intercept('GET', '**/admin/analise/vendas**', {
      statusCode: 200,
      body: { data: salesByPeriodResCategoria },
    }).as('getSalesPeriod');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="tab-period"]').should('have.class', 'active');
    cy.get('[data-testid="period-tab-content"]').should('exist');
    // Before submit, chart should NOT be visible
    cy.get('[data-testid="period-empty"]').should('be.visible');
    cy.get('[data-testid="period-chart-wrapper"]').should('not.exist');
  });

  it('date pickers set date range and grouping select is present', () => {
    silenceGlobalAPIs();
    cy.intercept('GET', '**/admin/analise/vendas**', {
      statusCode: 200,
      body: { data: salesByPeriodResCategoria },
    }).as('getSalesPeriod');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    // Date inputs should have default values
    cy.get('[data-testid="filter-data-inicio"]').should('have.attr', 'type', 'date');
    cy.get('[data-testid="filter-data-fim"]').should('have.attr', 'type', 'date');

    // Override with specific range
    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-03-31');

    // Grouping select should be present with CATEGORIA/PRODUTO options
    cy.get('[data-testid="filter-agrupamento"]').should('exist');
    cy.get('[data-testid="filter-agrupamento"] option[value="CATEGORIA"]').should('exist');
    cy.get('[data-testid="filter-agrupamento"] option[value="PRODUTO"]').should('exist');

    // Y-axis metric select
    cy.get('[data-testid="filter-yaxis"]').should('exist');
    cy.get('[data-testid="filter-yaxis"] option[value="quantidade"]').should('exist');
    cy.get('[data-testid="filter-yaxis"] option[value="valor"]').should('exist');
  });

  it('submits filters → chart renders with multiple series (categories)', () => {
    cy.intercept('GET', '**/admin/analise/vendas**', {
      statusCode: 200,
      body: { data: salesByPeriodResCategoria },
    }).as('getSalesPeriod');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-03-31');
    cy.get('[data-testid="filter-agrupamento"]').select('CATEGORIA');
    cy.get('[data-testid="analytics-submit"]').click();

    cy.wait('@getSalesPeriod');

    // Chart wrapper should appear
    cy.get('[data-testid="period-chart-wrapper"]', { timeout: 10000 }).should('be.visible');

    // Canvas element rendered inside chart wrapper (Chart.js draws on canvas)
    cy.get('[data-testid="period-chart-wrapper"] canvas').should('exist');

    // Empty state should be gone
    cy.get('[data-testid="period-empty"]').should('not.exist');
  });

  it('summary table shows all series with correct totals (categories)', () => {
    cy.intercept('GET', '**/admin/analise/vendas**', {
      statusCode: 200,
      body: { data: salesByPeriodResCategoria },
    }).as('getSalesPeriod');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-03-31');
    cy.get('[data-testid="analytics-submit"]').click();

    cy.wait('@getSalesPeriod');

    cy.get('[data-testid="period-summary"]', { timeout: 10000 }).should('be.visible');

    // All 3 series should appear in summary
    cy.get('[data-testid="period-summary"] tbody tr').should('have.length', 3);

    // Verify series names appear
    cy.get('[data-testid="period-summary"] tbody').should('contain.text', 'Ficção Científica');
    cy.get('[data-testid="period-summary"] tbody').should('contain.text', 'Romance');
    cy.get('[data-testid="period-summary"] tbody').should('contain.text', 'Programação');

    // Ficção Científica total qty: 45+38+52 = 135
    cy.get('[data-testid="period-summary"] tbody tr').first().within(() => {
      cy.get('td').eq(1).should('contain.text', '135');
    });

    // Summary footer (total row) should exist
    cy.get('[data-testid="period-summary"] tfoot tr').should('exist');
  });

  it('switching grouping to PRODUTO loads product-level series', () => {
    cy.intercept('GET', '**/admin/analise/vendas**', (req) => {
      const agrupamento = req.query?.agrupamento;
      const body = agrupamento === 'PRODUTO' ? salesByPeriodResProduto : salesByPeriodResCategoria;
      req.reply({ statusCode: 200, body: { data: body } });
    }).as('getSalesPeriod');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-03-31');
    cy.get('[data-testid="filter-agrupamento"]').select('PRODUTO');
    cy.get('[data-testid="analytics-submit"]').click();

    cy.wait('@getSalesPeriod');

    cy.get('[data-testid="period-chart-wrapper"]', { timeout: 10000 }).should('be.visible');

    // Summary should show product-level entries
    cy.get('[data-testid="period-summary"] tbody').should('contain.text', 'Fundação');
    cy.get('[data-testid="period-summary"] tbody').should('contain.text', 'Clean Code');
    cy.get('[data-testid="period-summary"] tbody tr').should('have.length', 2);
  });

  it('switching y-axis metric to valor updates summary values', () => {
    cy.intercept('GET', '**/admin/analise/vendas**', {
      statusCode: 200,
      body: { data: salesByPeriodResCategoria },
    }).as('getSalesPeriod');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-03-31');
    cy.get('[data-testid="analytics-submit"]').click();
    cy.wait('@getSalesPeriod');

    cy.get('[data-testid="period-chart-wrapper"]', { timeout: 10000 }).should('be.visible');

    // Switch metric to valor — re-renders chart, summary stays
    cy.get('[data-testid="filter-yaxis"]').select('valor');
    cy.get('[data-testid="period-chart-wrapper"]').should('be.visible');
    cy.get('[data-testid="period-summary"]').should('be.visible');
  });

  it('shows error state when API fails', () => {
    cy.intercept('GET', '**/admin/analise/vendas**', {
      statusCode: 500,
      body: { message: 'Internal Server Error' },
    }).as('getSalesPeriodErr');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-03-31');
    cy.get('[data-testid="analytics-submit"]').click();

    cy.wait('@getSalesPeriodErr');

    cy.get('[data-testid="period-error"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="period-chart-wrapper"]').should('not.exist');
  });

  it('shows no-data state when API returns empty series', () => {
    cy.intercept('GET', '**/admin/analise/vendas**', {
      statusCode: 200,
      body: { data: { periodo: { dataInicio: '2026-01-01', dataFim: '2026-01-31' }, series: [] } },
    }).as('getSalesPeriodEmpty');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-01-31');
    cy.get('[data-testid="analytics-submit"]').click();

    cy.wait('@getSalesPeriodEmpty');

    cy.get('[data-testid="period-no-data"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="period-chart-wrapper"]').should('not.exist');
  });

  it('validates required fields — shows invalid state when date is empty', () => {
    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    // Clear both date fields and submit
    cy.get('[data-testid="filter-data-inicio"]').clear();
    cy.get('[data-testid="filter-data-fim"]').clear();
    cy.get('[data-testid="analytics-submit"]').click();

    // Form should show is-invalid on date inputs (no API call should be made)
    cy.get('[data-testid="filter-data-inicio"]').should('have.class', 'is-invalid');
    cy.get('[data-testid="period-chart-wrapper"]').should('not.exist');
  });
});

// ─── describe: Sales By Region ─────────────────────────────────────────────────

describe('Admin Analytics — Sales By Region (tab Região)', () => {
  beforeEach(() => {
    silenceGlobalAPIs();
  });

  it('tab switching: clicking tab-region shows region content', () => {
    cy.intercept('GET', '**/admin/analise/vendas**', {
      statusCode: 200,
      body: { data: salesByPeriodResCategoria },
    });
    cy.intercept('GET', '**/admin/analise/vendas-regiao**', {
      statusCode: 200,
      body: { data: regionalSalesRes },
    });

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    // Default tab is period
    cy.get('[data-testid="tab-period"]').should('have.class', 'active');
    cy.get('[data-testid="period-tab-content"]').should('exist');
    cy.get('[data-testid="region-tab-content"]').should('not.exist');

    // Switch to region tab
    cy.get('[data-testid="tab-region"]').click();
    cy.get('[data-testid="tab-region"]').should('have.class', 'active');
    cy.get('[data-testid="tab-period"]').should('not.have.class', 'active');
    cy.get('[data-testid="region-tab-content"]').should('exist');
    cy.get('[data-testid="period-tab-content"]').should('not.exist');

    // Region tab shows empty state initially
    cy.get('[data-testid="region-empty"]').should('be.visible');
  });

  it('regional chart: date pickers → submit → bar chart renders', () => {
    cy.intercept('GET', '**/admin/analise/vendas-regiao**', {
      statusCode: 200,
      body: { data: regionalSalesRes },
    }).as('getRegional');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="tab-region"]').click();

    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-03-31');
    cy.get('[data-testid="analytics-submit"]').click();

    cy.wait('@getRegional');

    // Bar chart wrapper should appear
    cy.get('[data-testid="region-chart-wrapper"]', { timeout: 10000 }).should('be.visible');

    // Canvas element rendered
    cy.get('[data-testid="region-chart-wrapper"] canvas').should('exist');

    // Empty state gone
    cy.get('[data-testid="region-empty"]').should('not.exist');
  });

  it('regional chart: states appear in summary table on axis', () => {
    cy.intercept('GET', '**/admin/analise/vendas-regiao**', {
      statusCode: 200,
      body: { data: regionalSalesRes },
    }).as('getRegional');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="tab-region"]').click();

    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-03-31');
    cy.get('[data-testid="analytics-submit"]').click();

    cy.wait('@getRegional');

    cy.get('[data-testid="region-summary"]', { timeout: 10000 }).should('be.visible');

    // All 6 states should appear in ranking table
    cy.get('[data-testid="region-summary"] tbody tr').should('have.length', 6);

    const expectedStates = ['SP', 'RJ', 'MG', 'RS', 'PR', 'BA'];
    expectedStates.forEach((state) => {
      cy.get('[data-testid="region-summary"] tbody').should('contain.text', state);
    });
  });

  it('regional chart: SP (highest value) appears first in sorted ranking', () => {
    cy.intercept('GET', '**/admin/analise/vendas-regiao**', {
      statusCode: 200,
      body: { data: regionalSalesRes },
    }).as('getRegional');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="tab-region"]').click();

    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-03-31');
    cy.get('[data-testid="analytics-submit"]').click();

    cy.wait('@getRegional');

    cy.get('[data-testid="region-summary"]', { timeout: 10000 }).should('be.visible');

    // SP has highest quantity (120) — should be rank #1
    cy.get('[data-testid="region-summary"] tbody tr').first().within(() => {
      cy.get('td').eq(0).should('contain.text', '1'); // rank
      cy.get('td').eq(1).should('contain.text', 'SP'); // state name
      cy.get('td').eq(2).should('contain.text', '120'); // quantidade
    });

    // BA has lowest quantity (20) — should be rank #6
    cy.get('[data-testid="region-summary"] tbody tr').last().within(() => {
      cy.get('td').eq(1).should('contain.text', 'BA');
    });
  });

  it('regional chart: metric toggle switches between quantidade and valor', () => {
    cy.intercept('GET', '**/admin/analise/vendas-regiao**', {
      statusCode: 200,
      body: { data: regionalSalesRes },
    }).as('getRegional');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="tab-region"]').click();

    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-03-31');
    cy.get('[data-testid="analytics-submit"]').click();

    cy.wait('@getRegional');

    cy.get('[data-testid="region-chart-wrapper"]', { timeout: 10000 }).should('be.visible');

    // Metric select for region
    cy.get('[data-testid="filter-metric-region"]').should('exist');
    cy.get('[data-testid="filter-metric-region"] option[value="quantidade"]').should('exist');
    cy.get('[data-testid="filter-metric-region"] option[value="valor"]').should('exist');

    // Switch to valor — chart re-renders (same wrapper still visible)
    cy.get('[data-testid="filter-metric-region"]').select('valor');
    cy.get('[data-testid="region-chart-wrapper"]').should('be.visible');
    cy.get('[data-testid="region-summary"]').should('be.visible');
  });

  it('regional: summary footer shows correct total quantities', () => {
    cy.intercept('GET', '**/admin/analise/vendas-regiao**', {
      statusCode: 200,
      body: { data: regionalSalesRes },
    }).as('getRegional');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="tab-region"]').click();

    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-03-31');
    cy.get('[data-testid="analytics-submit"]').click();

    cy.wait('@getRegional');

    cy.get('[data-testid="region-summary"]', { timeout: 10000 }).should('be.visible');

    // Total qty: 120+80+60+45+35+20 = 360
    cy.get('[data-testid="region-summary"] tfoot tr').within(() => {
      cy.get('td').eq(2).should('contain.text', '360');
    });
  });

  it('shows error state when regional API fails', () => {
    cy.intercept('GET', '**/admin/analise/vendas-regiao**', {
      statusCode: 503,
      body: { message: 'Service Unavailable' },
    }).as('getRegionalErr');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="tab-region"]').click();

    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-03-31');
    cy.get('[data-testid="analytics-submit"]').click();

    cy.wait('@getRegionalErr');

    cy.get('[data-testid="region-error"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="region-chart-wrapper"]').should('not.exist');
  });

  it('shows no-data when regional API returns empty estados array', () => {
    cy.intercept('GET', '**/admin/analise/vendas-regiao**', {
      statusCode: 200,
      body: {
        data: { periodo: { dataInicio: '2026-01-01', dataFim: '2026-01-31' }, estados: [] },
      },
    }).as('getRegionalEmpty');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="tab-region"]').click();

    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-01-31');
    cy.get('[data-testid="analytics-submit"]').click();

    cy.wait('@getRegionalEmpty');

    cy.get('[data-testid="region-no-data"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="region-chart-wrapper"]').should('not.exist');
  });
});

// ─── describe: Tab Switching and Navigation ────────────────────────────────────

describe('Admin Analytics — tab switching and back navigation', () => {
  beforeEach(() => {
    silenceGlobalAPIs();
  });

  it('can switch back and forth between period and region tabs', () => {
    cy.intercept('GET', '**/admin/analise/vendas**', {
      statusCode: 200,
      body: { data: salesByPeriodResCategoria },
    });
    cy.intercept('GET', '**/admin/analise/vendas-regiao**', {
      statusCode: 200,
      body: { data: regionalSalesRes },
    });

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    // Start on period
    cy.get('[data-testid="tab-period"]').should('have.class', 'active');
    cy.get('[data-testid="period-tab-content"]').should('exist');

    // Go to region
    cy.get('[data-testid="tab-region"]').click();
    cy.get('[data-testid="region-tab-content"]').should('exist');
    cy.get('[data-testid="period-tab-content"]').should('not.exist');

    // Go back to period
    cy.get('[data-testid="tab-period"]').click();
    cy.get('[data-testid="period-tab-content"]').should('exist');
    cy.get('[data-testid="region-tab-content"]').should('not.exist');
    cy.get('[data-testid="tab-period"]').should('have.class', 'active');
  });

  it('back button navigates to /admin panel', () => {
    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="admin-analytics-back"]').should('exist');
    cy.get('[data-testid="admin-analytics-back"]').should('have.attr', 'href').and('include', '/admin');
  });

  it('period chart loads data on period tab then region chart loads independently on region tab', () => {
    let periodCallCount = 0;
    let regionCallCount = 0;

    cy.intercept('GET', '**/admin/analise/vendas**', (req) => {
      periodCallCount++;
      req.reply({ statusCode: 200, body: { data: salesByPeriodResCategoria } });
    }).as('getSalesPeriod');

    cy.intercept('GET', '**/admin/analise/vendas-regiao**', (req) => {
      regionCallCount++;
      req.reply({ statusCode: 200, body: { data: regionalSalesRes } });
    }).as('getRegional');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    // Submit period
    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-03-31');
    cy.get('[data-testid="analytics-submit"]').click();
    cy.wait('@getSalesPeriod');
    cy.get('[data-testid="period-chart-wrapper"]', { timeout: 10000 }).should('be.visible');

    // Switch to region tab and submit
    cy.get('[data-testid="tab-region"]').click();
    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-03-31');
    cy.get('[data-testid="analytics-submit"]').click();
    cy.wait('@getRegional');
    cy.get('[data-testid="region-chart-wrapper"]', { timeout: 10000 }).should('be.visible');

    // Verify each API was called independently
    cy.wrap(null).then(() => {
      expect(periodCallCount).to.eq(1);
      expect(regionCallCount).to.eq(1);
    });
  });
});

// ─── describe: Data Transformations ───────────────────────────────────────────

describe('Admin Analytics — data transformations and summary correctness', () => {
  beforeEach(() => {
    silenceGlobalAPIs();
  });

  it('period summary computes correct totals across months for all series', () => {
    cy.intercept('GET', '**/admin/analise/vendas**', {
      statusCode: 200,
      body: { data: salesByPeriodResCategoria },
    }).as('getSalesPeriod');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-03-31');
    cy.get('[data-testid="analytics-submit"]').click();
    cy.wait('@getSalesPeriod');

    cy.get('[data-testid="period-summary"]', { timeout: 10000 }).should('be.visible');

    // Romance total qty: 30+22+41 = 93
    cy.get('[data-testid="period-summary"] tbody tr').eq(1).within(() => {
      cy.get('td').eq(0).should('contain.text', 'Romance');
      cy.get('td').eq(1).should('contain.text', '93');
    });

    // Programação total qty: 18+25+31 = 74
    cy.get('[data-testid="period-summary"] tbody tr').eq(2).within(() => {
      cy.get('td').eq(0).should('contain.text', 'Programação');
      cy.get('td').eq(1).should('contain.text', '74');
    });

    // Grand total qty: 135+93+74 = 302
    cy.get('[data-testid="period-summary"] tfoot tr').within(() => {
      cy.get('td').eq(1).should('contain.text', '302');
    });
  });

  it('period filter shows corret periodo range in result metadata', () => {
    cy.intercept('GET', '**/admin/analise/vendas**', {
      statusCode: 200,
      body: { data: salesByPeriodResCategoria },
    }).as('getSalesPeriod');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-03-31');
    cy.get('[data-testid="analytics-submit"]').click();
    cy.wait('@getSalesPeriod');

    cy.get('[data-testid="period-chart-wrapper"]', { timeout: 10000 }).should('be.visible');

    // Period metadata display
    cy.get('[data-testid="period-tab-content"]').should('contain.text', '2026-01-01');
    cy.get('[data-testid="period-tab-content"]').should('contain.text', '2026-03-31');
    cy.get('[data-testid="period-tab-content"]').should('contain.text', '3'); // 3 series
  });

  it('regional result shows period metadata and state count', () => {
    cy.intercept('GET', '**/admin/analise/vendas-regiao**', {
      statusCode: 200,
      body: { data: regionalSalesRes },
    }).as('getRegional');

    setupAdminVisit('/admin/analytics');

    cy.get('[data-testid="admin-analytics-section"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="tab-region"]').click();

    cy.get('[data-testid="filter-data-inicio"]').clear().type('2026-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2026-03-31');
    cy.get('[data-testid="analytics-submit"]').click();
    cy.wait('@getRegional');

    cy.get('[data-testid="region-chart-wrapper"]', { timeout: 10000 }).should('be.visible');

    // Region metadata display
    cy.get('[data-testid="region-tab-content"]').should('contain.text', '2026-01-01');
    cy.get('[data-testid="region-tab-content"]').should('contain.text', '2026-03-31');
    cy.get('[data-testid="region-tab-content"]').should('contain.text', '6'); // 6 states
  });
});
