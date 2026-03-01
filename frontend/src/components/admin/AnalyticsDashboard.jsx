import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
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
  Title,
  Tooltip,
  Legend
);

// ─── Color palette for series ─────────────────────────────────────────────────
const PALETTE = [
  '#0d6efd', '#dc3545', '#198754', '#ffc107', '#0dcaf0',
  '#6f42c1', '#fd7e14', '#20c997', '#e83e8c', '#6c757d',
];

const getColor = (idx) => PALETTE[idx % PALETTE.length];

// ─── Default date range: last 3 months ───────────────────────────────────────
const today = new Date();
const defaultEnd = today.toISOString().slice(0, 10);
const defaultStart = new Date(today.getFullYear(), today.getMonth() - 2, 1)
  .toISOString()
  .slice(0, 10);

// ─── AnalyticsDashboard ───────────────────────────────────────────────────────

/**
 * AnalyticsDashboard
 * @component
 * @description Admin analytics panel displaying a line chart of sales by period.
 * Supports grouping by PRODUTO or CATEGORIA, toggling Y-axis between quantity and value.
 */
const AnalyticsDashboard = () => {
  usePageTitle('Admin — Analytics de Vendas');

  // ── Form state ─────────────────────────────────────────────────────────────
  const [dataInicio, setDataInicio] = useState(defaultStart);
  const [dataFim, setDataFim] = useState(defaultEnd);
  const [agrupamento, setAgrupamento] = useState('CATEGORIA');
  const [yAxis, setYAxis] = useState('quantidade'); // 'quantidade' | 'valor'

  // ── Data state ─────────────────────────────────────────────────────────────
  const [result, setResult] = useState(null); // { periodo, series }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // ── Validate ───────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!dataInicio) errs.dataInicio = 'Data inicial é obrigatória.';
    if (!dataFim) errs.dataFim = 'Data final é obrigatória.';
    if (dataInicio && dataFim && dataInicio > dataFim)
      errs.dataFim = 'Data final deve ser posterior à data inicial.';
    return errs;
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const handleFetch = useCallback(async (e) => {
    if (e) e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getSalesAnalytics({
        dataInicio,
        dataFim,
        agrupamento,
      });
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err) || 'Erro ao carregar dados de análise.');
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim, agrupamento]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Build chart data ───────────────────────────────────────────────────────
  const buildChartData = () => {
    if (!result?.series?.length) return null;

    // Collect all unique months across all series (sorted)
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
      legend: {
        position: 'top',
        labels: { usePointStyle: true, padding: 16 },
      },
      title: {
        display: true,
        text: `Vendas por ${agrupamento === 'CATEGORIA' ? 'Categoria' : 'Produto'} — ${yAxis === 'quantidade' ? 'Quantidade' : 'Valor (R$)'}`,
        font: { size: 14 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y;
            if (yAxis === 'valor') return ` ${ctx.dataset.label}: ${formatCurrency(val)}`;
            return ` ${ctx.dataset.label}: ${val} unid.`;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Mês' },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      y: {
        title: {
          display: true,
          text: yAxis === 'quantidade' ? 'Quantidade vendida' : 'Valor (R$)',
        },
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          callback: (value) =>
            yAxis === 'valor'
              ? `R$ ${Number(value).toLocaleString('pt-BR')}`
              : value,
        },
      },
    },
  };

  // ── Summary totals ─────────────────────────────────────────────────────────
  const buildSummary = () => {
    if (!result?.series?.length) return null;
    return result.series.map((serie, idx) => {
      const totQtd = (serie.data ?? []).reduce((acc, d) => acc + (d.quantidade ?? 0), 0);
      const totVal = (serie.data ?? []).reduce((acc, d) => acc + (d.valor ?? 0), 0);
      return { nome: serie.nome, totQtd, totVal, color: getColor(idx) };
    });
  };
  const summary = buildSummary();

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

      {/* Filters Form */}
      <form
        onSubmit={handleFetch}
        className="card mb-4 border-0 bg-light"
        data-testid="analytics-filters"
      >
        <div className="card-body py-3">
          <div className="row g-3 align-items-end">
            {/* Data Início */}
            <div className="col-12 col-sm-6 col-md-3">
              <label className="form-label small fw-semibold mb-1">
                Data Inicial <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                className={`form-control form-control-sm ${formErrors.dataInicio ? 'is-invalid' : ''}`}
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                data-testid="filter-data-inicio"
              />
              {formErrors.dataInicio && (
                <div className="invalid-feedback">{formErrors.dataInicio}</div>
              )}
            </div>

            {/* Data Fim */}
            <div className="col-12 col-sm-6 col-md-3">
              <label className="form-label small fw-semibold mb-1">
                Data Final <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                className={`form-control form-control-sm ${formErrors.dataFim ? 'is-invalid' : ''}`}
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                data-testid="filter-data-fim"
              />
              {formErrors.dataFim && (
                <div className="invalid-feedback">{formErrors.dataFim}</div>
              )}
            </div>

            {/* Agrupamento */}
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

            {/* Y Axis toggle */}
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

            {/* Submit */}
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

      {/* Content */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="alert alert-danger d-flex align-items-center gap-2" data-testid="analytics-error">
          <span>⚠️</span>
          <span>{error}</span>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-auto"
            onClick={handleFetch}
          >
            Tentar novamente
          </button>
        </div>
      ) : !result ? (
        <div className="text-center text-muted py-5" data-testid="analytics-empty">
          <div style={{ fontSize: 48 }}>📊</div>
          <p className="mt-2">Selecione o período e clique em "Gerar Relatório" para visualizar os dados.</p>
        </div>
      ) : !chartData ? (
        <div className="alert alert-info" data-testid="analytics-no-data">
          Nenhum dado de vendas encontrado para o período selecionado.
        </div>
      ) : (
        <>
          {/* Period info */}
          <div className="d-flex align-items-center gap-3 mb-3 text-muted small">
            <span>
              📅 Período: <strong>{result.periodo?.dataInicio}</strong> a <strong>{result.periodo?.dataFim}</strong>
            </span>
            <span>
              📦 Agrupamento: <strong>{agrupamento === 'CATEGORIA' ? 'Categoria' : 'Produto'}</strong>
            </span>
            <span>
              📈 Série(s): <strong>{result.series.length}</strong>
            </span>
          </div>

          {/* Chart */}
          <div
            className="card border-0 shadow-sm mb-4 p-3"
            data-testid="analytics-chart-wrapper"
          >
            <Line
              data={chartData}
              options={chartOptions}
              data-testid="analytics-chart"
            />
          </div>

          {/* Summary table */}
          {summary && (
            <div className="card border-0 shadow-sm" data-testid="analytics-summary">
              <div className="card-header bg-white border-bottom fw-semibold small">
                Resumo por {agrupamento === 'CATEGORIA' ? 'Categoria' : 'Produto'}
              </div>
              <div className="table-responsive">
                <table className="table table-sm table-hover mb-0 align-middle small">
                  <thead className="table-light">
                    <tr>
                      <th>Série</th>
                      <th className="text-end">Total Qtd.</th>
                      <th className="text-end">Total Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((s) => (
                      <tr key={s.nome}>
                        <td className="d-flex align-items-center gap-2">
                          <span
                            className="rounded-circle flex-shrink-0"
                            style={{
                              width: 10,
                              height: 10,
                              backgroundColor: s.color,
                              display: 'inline-block',
                            }}
                          />
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
                      <td className="text-end">
                        {summary.reduce((a, s) => a + s.totQtd, 0).toLocaleString('pt-BR')}
                      </td>
                      <td className="text-end">
                        {formatCurrency(summary.reduce((a, s) => a + s.totVal, 0))}
                      </td>
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

export default AnalyticsDashboard;
