import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import adminService from '../../services/adminService';
import { formatCurrency } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/helpers';
import usePageTitle from '../../hooks/usePageTitle';
import LoadingSpinner from '../common/LoadingSpinner';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// ─── Color palette ────────────────────────────────────────────────────────────
const PALETTE = [
  '#0d6efd', '#dc3545', '#198754', '#ffc107', '#0dcaf0',
  '#6f42c1', '#fd7e14', '#20c997', '#e83e8c', '#6c757d',
];
const getColor = (idx) => PALETTE[idx % PALETTE.length];

// Color gradient for bar chart (value-based: blue → red as value increases)
const barColor = (value, max) => {
  const ratio = max > 0 ? value / max : 0;
  // interpolate from #0d6efd (low) → #dc3545 (high)
  const r = Math.round(13 + (220 - 13) * ratio);
  const g = Math.round(110 + (53 - 110) * ratio);
  const b = Math.round(253 + (69 - 253) * ratio);
  return `rgba(${r},${g},${b},0.8)`;
};

// ─── Default date range: last 3 months ───────────────────────────────────────
const today = new Date();
const defaultEnd = today.toISOString().slice(0, 10);
const defaultStart = new Date(today.getFullYear(), today.getMonth() - 2, 1)
  .toISOString()
  .slice(0, 10);

// ─── Shared Date Filter Form ──────────────────────────────────────────────────

const DateFilterBar = ({
  dataInicio, setDataInicio,
  dataFim, setDataFim,
  formErrors,
  onSubmit,
  loading,
  extra,
}) => (
  <form
    onSubmit={onSubmit}
    className="card mb-4 border-0 bg-light"
    data-testid="analytics-filters"
  >
    <div className="card-body py-3">
      <div className="row g-3 align-items-end">
        <div className="col-12 col-sm-6 col-md-3">
          <label className="form-label small fw-semibold mb-1">
            Data Inicial <span className="text-danger">*</span>
          </label>
          <input
            type="date"
            className={`form-control form-control-sm ${formErrors?.dataInicio ? 'is-invalid' : ''}`}
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            data-testid="filter-data-inicio"
          />
          {formErrors?.dataInicio && (
            <div className="invalid-feedback">{formErrors.dataInicio}</div>
          )}
        </div>
        <div className="col-12 col-sm-6 col-md-3">
          <label className="form-label small fw-semibold mb-1">
            Data Final <span className="text-danger">*</span>
          </label>
          <input
            type="date"
            className={`form-control form-control-sm ${formErrors?.dataFim ? 'is-invalid' : ''}`}
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            data-testid="filter-data-fim"
          />
          {formErrors?.dataFim && (
            <div className="invalid-feedback">{formErrors.dataFim}</div>
          )}
        </div>
        {extra}
        <div className="col-12 col-md-2">
          <button
            type="submit"
            className="btn btn-primary btn-sm w-100"
            disabled={loading}
            data-testid="analytics-submit"
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-1" role="status" />Carregando…</>
            ) : '📊 Gerar Relatório'}
          </button>
        </div>
      </div>
    </div>
  </form>
);

// ─── Tab 1: Sales By Period ───────────────────────────────────────────────────

const SalesByPeriod = () => {
  const [dataInicio, setDataInicio] = useState(defaultStart);
  const [dataFim, setDataFim] = useState(defaultEnd);
  const [agrupamento, setAgrupamento] = useState('CATEGORIA');
  const [yAxis, setYAxis] = useState('quantidade');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  React.useEffect(() => {
    adminService.getCategories()
      .then((res) => {
        setAllCategories(res || []);
        setSelectedCategories((res || []).map(c => c.nome));
      })
      .catch(() => {});
  }, []);

  const validate = () => {
    const errs = {};
    if (!dataInicio) errs.dataInicio = 'Data inicial é obrigatória.';
    if (!dataFim) errs.dataFim = 'Data final é obrigatória.';
    if (dataInicio && dataFim && dataInicio > dataFim)
      errs.dataFim = 'Data final deve ser posterior à data inicial.';
    return errs;
  };

  const handleFetch = useCallback(async (e) => {
    if (e) e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    setLoading(true);
    setError(null);
    try {
      const params = { dataInicio, dataFim, agrupamento };
      if (agrupamento === 'CATEGORIA' && selectedCategories.length > 0) {
        params.categorias = selectedCategories.join(',');
      }
      const data = await adminService.getSalesAnalytics(params);
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err) || 'Erro ao carregar dados de análise.');
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim, agrupamento, selectedCategories]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildChartData = () => {
    if (!result?.series?.length) return null;
    const labelSet = new Set();
    result.series.forEach((s) => s.data?.forEach((d) => labelSet.add(d.mes)));
    const labels = Array.from(labelSet).sort();
    const datasets = result.series.map((serie, idx) => {
      const color = getColor(idx);
      const dataMap = {};
      (serie.data ?? []).forEach((d) => { dataMap[d.mes] = d[yAxis] ?? 0; });
      return {
        label: serie.nome,
        data: labels.map((m) => dataMap[m] ?? 0),
        borderColor: color,
        backgroundColor: color + '22',
        pointBackgroundColor: color,
        tension: 0.3,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });
    return { labels, datasets };
  };

  const chartData = buildChartData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, padding: 16 } },
      title: {
        display: true,
        text: `Vendas por ${agrupamento === 'CATEGORIA' ? 'Categoria' : 'Produto'} — ${yAxis === 'quantidade' ? 'Quantidade' : 'Valor (R$)'}`,
        font: { size: 14 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y;
            return yAxis === 'valor'
              ? ` ${ctx.dataset.label}: ${formatCurrency(val)}`
              : ` ${ctx.dataset.label}: ${val} unid.`;
          },
        },
      },
    },
    scales: {
      x: { title: { display: true, text: 'Mês' }, grid: { color: 'rgba(0,0,0,0.05)' } },
      y: {
        title: { display: true, text: yAxis === 'quantidade' ? 'Quantidade vendida' : 'Valor (R$)' },
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { callback: (v) => yAxis === 'valor' ? `R$ ${Number(v).toLocaleString('pt-BR')}` : v },
      },
    },
  };

  const summary = result?.series?.length
    ? result.series.map((serie, idx) => ({
        nome: serie.nome,
        totQtd: (serie.data ?? []).reduce((acc, d) => acc + (d.quantidade ?? 0), 0),
        totVal: (serie.data ?? []).reduce((acc, d) => acc + (d.valor ?? 0), 0),
        color: getColor(idx),
      }))
    : null;

  const extra = (
    <>
      <div className="col-12 col-sm-6 col-md-2">
        <label className="form-label small fw-semibold mb-1">Agrupar por</label>
        <select
          className="form-select form-select-sm"
          value={agrupamento}
          onChange={(e) => setAgrupamento(e.target.value)}
          data-testid="filter-agrupamento"
        >
          <option value="CATEGORIA">Categoria</option>
          <option value="PRODUTO">Produto</option>
        </select>
      </div>
      <div className="col-12 col-sm-6 col-md-2">
        <label className="form-label small fw-semibold mb-1">Métrica</label>
        <select
          className="form-select form-select-sm"
          value={yAxis}
          onChange={(e) => setYAxis(e.target.value)}
          data-testid="filter-yaxis"
        >
          <option value="quantidade">Quantidade</option>
          <option value="valor">Valor (R$)</option>
        </select>
      </div>
      {agrupamento === 'CATEGORIA' && allCategories.length > 0 && (
        <div className="col-12 mt-3">
          <label className="form-label small fw-semibold mb-1">Filtrar Categorias</label>
          <div className="d-flex flex-wrap gap-2 p-2 border rounded bg-white">
            {allCategories.map(cat => (
              <div className="form-check form-check-inline m-0" key={cat.id}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`cat-${cat.id}`}
                  checked={selectedCategories.includes(cat.nome)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedCategories([...selectedCategories, cat.nome]);
                    else setSelectedCategories(selectedCategories.filter(n => n !== cat.nome));
                  }}
                />
                <label className="form-check-label small" htmlFor={`cat-${cat.id}`}>{cat.nome}</label>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div data-testid="period-tab-content">
      <DateFilterBar
        dataInicio={dataInicio} setDataInicio={setDataInicio}
        dataFim={dataFim} setDataFim={setDataFim}
        formErrors={formErrors}
        onSubmit={handleFetch}
        loading={loading}
        extra={extra}
      />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="alert alert-danger d-flex align-items-center gap-2" data-testid="period-error">
          <span>⚠️ {error}</span>
          <button type="button" className="btn btn-sm btn-outline-danger ms-auto" onClick={handleFetch}>Tentar novamente</button>
        </div>
      ) : !result ? (
        <div className="text-center text-muted py-5" data-testid="period-empty">
          <div style={{ fontSize: 48 }}>📊</div>
          <p className="mt-2">Selecione o período e clique em "Gerar Relatório".</p>
        </div>
      ) : !chartData ? (
        <div className="alert alert-info" data-testid="period-no-data">Nenhum dado para o período selecionado.</div>
      ) : (
        <>
          <div className="d-flex flex-wrap gap-3 mb-3 text-muted small">
            <span>📅 Período: <strong>{result.periodo?.dataInicio}</strong> a <strong>{result.periodo?.dataFim}</strong></span>
            <span>📦 Agrupamento: <strong>{agrupamento === 'CATEGORIA' ? 'Categoria' : 'Produto'}</strong></span>
            <span>📈 <strong>{result.series.length}</strong> série(s)</span>
          </div>

          <div className="card border-0 shadow-sm mb-4 p-3" data-testid="period-chart-wrapper">
            <Line data={chartData} options={chartOptions} />
          </div>

          {summary && (
            <div className="card border-0 shadow-sm" data-testid="period-summary">
              <div className="card-header bg-white border-bottom fw-semibold small">
                Resumo por {agrupamento === 'CATEGORIA' ? 'Categoria' : 'Produto'}
              </div>
              <div className="table-responsive">
                <table className="table table-sm table-hover mb-0 align-middle small">
                  <thead className="table-light">
                    <tr><th>Série</th><th className="text-end">Total Qtd.</th><th className="text-end">Total Valor</th></tr>
                  </thead>
                  <tbody>
                    {summary.map((s) => (
                      <tr key={s.nome}>
                        <td>
                          <span className="rounded-circle me-2 flex-shrink-0" style={{ width: 10, height: 10, backgroundColor: s.color, display: 'inline-block' }} />
                          {s.nome}
                        </td>
                        <td className="text-end">{s.totQtd.toLocaleString('pt-BR')}</td>
                        <td className="text-end">{formatCurrency(s.totVal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light fw-semibold">
                    <tr>
                      <td>Total</td>
                      <td className="text-end">{summary.reduce((a, s) => a + s.totQtd, 0).toLocaleString('pt-BR')}</td>
                      <td className="text-end">{formatCurrency(summary.reduce((a, s) => a + s.totVal, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Tab 2: Sales By Region ───────────────────────────────────────────────────

const SalesByRegion = () => {
  const [dataInicio, setDataInicio] = useState(defaultStart);
  const [dataFim, setDataFim] = useState(defaultEnd);
  const [metric, setMetric] = useState('quantidade');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!dataInicio) errs.dataInicio = 'Data inicial é obrigatória.';
    if (!dataFim) errs.dataFim = 'Data final é obrigatória.';
    if (dataInicio && dataFim && dataInicio > dataFim)
      errs.dataFim = 'Data final deve ser posterior à data inicial.';
    return errs;
  };

  const handleFetch = useCallback(async (e) => {
    if (e) e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getRegionalSalesAnalytics({ dataInicio, dataFim });
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err) || 'Erro ao carregar dados regionais.');
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildChartData = () => {
    const estados = result?.estados;
    if (!estados?.length) return null;
    const sorted = [...estados].sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0));
    const labels = sorted.map((e) => e.estado);
    const values = sorted.map((e) => e[metric] ?? 0);
    const maxVal = Math.max(...values, 1);
    const colors = values.map((v) => barColor(v, maxVal));
    const borderColors = colors.map((c) => c.replace('0.8', '1'));
    return {
      labels,
      datasets: [{
        label: metric === 'quantidade' ? 'Quantidade vendida' : 'Valor (R$)',
        data: values,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 4,
      }],
    };
  };

  const chartData = buildChartData();
  const chartHeight = result?.estados?.length
    ? Math.max(300, result.estados.length * 34 + 80)
    : 320;

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `Vendas por Estado — ${metric === 'quantidade' ? 'Quantidade' : 'Valor (R$)'}`,
        font: { size: 14 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.x;
            return metric === 'valor' ? ` ${formatCurrency(val)}` : ` ${val} unid.`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        title: { display: true, text: metric === 'quantidade' ? 'Quantidade' : 'Valor (R$)' },
        ticks: { callback: (v) => metric === 'valor' ? `R$ ${Number(v).toLocaleString('pt-BR')}` : v },
      },
      y: { grid: { display: false } },
    },
  };

  const extra = (
    <div className="col-12 col-sm-6 col-md-2">
      <label className="form-label small fw-semibold mb-1">Métrica</label>
      <select
        className="form-select form-select-sm"
        value={metric}
        onChange={(e) => setMetric(e.target.value)}
        data-testid="filter-metric-region"
      >
        <option value="quantidade">Quantidade</option>
        <option value="valor">Valor (R$)</option>
      </select>
    </div>
  );

  return (
    <div data-testid="region-tab-content">
      <DateFilterBar
        dataInicio={dataInicio} setDataInicio={setDataInicio}
        dataFim={dataFim} setDataFim={setDataFim}
        formErrors={formErrors}
        onSubmit={handleFetch}
        loading={loading}
        extra={extra}
      />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="alert alert-danger d-flex align-items-center gap-2" data-testid="region-error">
          <span>⚠️ {error}</span>
          <button type="button" className="btn btn-sm btn-outline-danger ms-auto" onClick={handleFetch}>Tentar novamente</button>
        </div>
      ) : !result ? (
        <div className="text-center text-muted py-5" data-testid="region-empty">
          <div style={{ fontSize: 48 }}>🗺️</div>
          <p className="mt-2">Selecione o período e clique em "Gerar Relatório".</p>
        </div>
      ) : !chartData ? (
        <div className="alert alert-info" data-testid="region-no-data">Nenhum dado regional para o período selecionado.</div>
      ) : (
        <>
          <div className="d-flex flex-wrap gap-3 mb-3 text-muted small">
            <span>📅 Período: <strong>{result.periodo?.dataInicio}</strong> a <strong>{result.periodo?.dataFim}</strong></span>
            <span>🗺️ <strong>{result.estados.length}</strong> estado(s) com vendas</span>
          </div>

          <div
            className="card border-0 shadow-sm mb-4 p-3"
            data-testid="region-chart-wrapper"
            style={{ height: chartHeight }}
          >
            <Bar data={chartData} options={chartOptions} />
          </div>

          <div className="card border-0 shadow-sm" data-testid="region-summary">
            <div className="card-header bg-white border-bottom fw-semibold small">
              Ranking de Vendas por Estado
            </div>
            <div className="table-responsive">
              <table className="table table-sm table-hover mb-0 align-middle small">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Estado</th>
                    <th className="text-end">Quantidade</th>
                    <th className="text-end">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[...result.estados]
                    .sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0))
                    .map((e, idx) => (
                      <tr key={e.estado}>
                        <td className="text-muted">{idx + 1}</td>
                        <td className="fw-semibold">{e.estado}</td>
                        <td className="text-end">{(e.quantidade ?? 0).toLocaleString('pt-BR')}</td>
                        <td className="text-end">{formatCurrency(e.valor ?? 0)}</td>
                      </tr>
                    ))}
                </tbody>
                <tfoot className="table-light fw-semibold">
                  <tr>
                    <td colSpan={2}>Total</td>
                    <td className="text-end">
                      {result.estados.reduce((a, e) => a + (e.quantidade ?? 0), 0).toLocaleString('pt-BR')}
                    </td>
                    <td className="text-end">
                      {formatCurrency(result.estados.reduce((a, e) => a + (e.valor ?? 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── AnalyticsDashboard ───────────────────────────────────────────────────────

/**
 * AnalyticsDashboard
 * @component
 * @description Admin analytics panel with two tabs:
 *   - "Por Período": line chart of sales grouped by Categoria/Produto
 *   - "Por Região": horizontal bar chart of sales by Brazilian state
 */
const AnalyticsDashboard = () => {
  usePageTitle('Admin — Analytics de Vendas');
  const [activeTab, setActiveTab] = useState('period');

  return (
    <div data-testid="admin-analytics-section">
      {/* Toolbar */}
      <div className="d-flex align-items-center mb-4 flex-wrap gap-2">
        <div>
          <Link
            to="/admin"
            className="btn btn-sm btn-outline-secondary me-2"
            data-testid="admin-analytics-back"
          >
            ← Painel
          </Link>
          <h2 className="h4 mb-0 d-inline">Analytics de Vendas</h2>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4" role="tablist">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'period' ? 'active' : ''}`}
            onClick={() => setActiveTab('period')}
            data-testid="tab-period"
          >
            📊 Por Período
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'region' ? 'active' : ''}`}
            onClick={() => setActiveTab('region')}
            data-testid="tab-region"
          >
            🗺️ Por Região
          </button>
        </li>
      </ul>

      {activeTab === 'period' ? <SalesByPeriod /> : <SalesByRegion />}
    </div>
  );
};

export default AnalyticsDashboard;
