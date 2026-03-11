import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { formatCurrency, formatCpf, formatDate } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/helpers';
import useNotification from '../../hooks/useNotification';
import usePageTitle from '../../hooks/usePageTitle';
import LoadingSpinner from '../common/LoadingSpinner';

const PAGE_SIZE = 20;

// ─── Ranking Badge ─────────────────────────────────────────────────────────────

const RankingBadge = ({ ranking }) => {
  if (ranking == null) return <span className="text-muted small">—</span>;
  let colorClass = 'bg-secondary';
  let label = 'Bronze';
  if (ranking >= 1000) { colorClass = 'bg-warning text-dark'; label = 'Ouro'; }
  else if (ranking >= 500) { colorClass = 'bg-light text-dark border'; label = 'Prata'; }
  return (
    <span className={`badge ${colorClass}`} title={`Pontos: ${ranking}`}>
      {label} ({ranking.toFixed(0)})
    </span>
  );
};

// ─── Client Detail Modal ───────────────────────────────────────────────────────

const ClientDetailModal = ({ clientId, onClose }) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('perfil');
  const { error: notifyError } = useNotification();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminService
      .getCustomer(clientId)
      .then((data) => {
        if (!cancelled) setClient(data);
      })
      .catch((err) => {
        if (!cancelled) notifyError(getErrorMessage(err) || 'Erro ao carregar dados do cliente.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [clientId, notifyError]);

  return (
    <>
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{ zIndex: 1040 }}
      />
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-detail-modal-title"
        style={{ zIndex: 1050 }}
        data-testid="client-detail-modal"
      >
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="client-detail-modal-title">
                {loading ? 'Carregando cliente…' : `Cliente: ${client?.nome ?? '—'}`}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Fechar"
                data-testid="client-detail-close"
              />
            </div>

            <div className="modal-body">
              {loading ? (
                <LoadingSpinner />
              ) : !client ? (
                <div className="alert alert-danger">Não foi possível carregar os dados do cliente.</div>
              ) : (
                <>
                  {/* Tabs */}
                  <ul className="nav nav-tabs mb-3" role="tablist">
                    {[
                      { key: 'perfil', label: '👤 Perfil' },
                      { key: 'enderecos', label: `📍 Endereços (${client.enderecos?.length ?? 0})` },
                      { key: 'cartoes', label: `💳 Cartões (${client.cartoes?.length ?? 0})` },
                      { key: 'transacoes', label: `💰 Transações (${client.transacoes?.length ?? 0})` },
                    ].map((tab) => (
                      <li className="nav-item" key={tab.key}>
                        <button
                          className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
                          onClick={() => setActiveTab(tab.key)}
                          data-testid={`client-tab-${tab.key}`}
                        >
                          {tab.label}
                        </button>
                      </li>
                    ))}
                  </ul>

                  {/* ── Perfil Tab ─────────────────────────────────────────── */}
                  {activeTab === 'perfil' && (
                    <div data-testid="client-tab-perfil-content">
                      <div className="row g-3">
                        <div className="col-sm-6">
                          <label className="form-label small text-muted mb-1">Nome</label>
                          <div className="fw-semibold">{client.nome ?? '—'}</div>
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label small text-muted mb-1">CPF</label>
                          <div className="font-monospace">
                            {client.cpf ? formatCpf(client.cpf) : '—'}
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label small text-muted mb-1">E-mail</label>
                          <div>{client.email ?? '—'}</div>
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label small text-muted mb-1">Gênero</label>
                          <div>{client.genero ?? '—'}</div>
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label small text-muted mb-1">Data de Nascimento</label>
                          <div>
                            {client.dataNascimento
                              ? formatDate(client.dataNascimento)
                              : '—'}
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label small text-muted mb-1">Ranking</label>
                          <div>
                            <RankingBadge ranking={client.ranking} />
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label small text-muted mb-1">Status</label>
                          <div>
                            <span
                              className={`badge ${client.ativo !== false ? 'bg-success' : 'bg-secondary'}`}
                            >
                              {client.ativo !== false ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                        {client.dataCadastro && (
                          <div className="col-sm-6">
                            <label className="form-label small text-muted mb-1">Data de Cadastro</label>
                            <div>{formatDate(client.dataCadastro)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Endereços Tab ──────────────────────────────────────── */}
                  {activeTab === 'enderecos' && (
                    <div data-testid="client-tab-enderecos-content">
                      {!client.enderecos?.length ? (
                        <p className="text-muted">Nenhum endereço cadastrado.</p>
                      ) : (
                        <div className="row g-3">
                          {client.enderecos.map((addr, idx) => (
                            <div key={addr.id ?? idx} className="col-12">
                              <div className="card card-body py-2 px-3 small">
                                <div className="d-flex justify-content-between">
                                  <strong>{addr.apelido ?? `Endereço ${idx + 1}`}</strong>
                                  {addr.principal && (
                                    <span className="badge bg-primary">Principal</span>
                                  )}
                                </div>
                                <div>
                                  {addr.logradouro}, {addr.numero}
                                  {addr.complemento ? ` — ${addr.complemento}` : ''}
                                </div>
                                <div className="text-muted">
                                  {addr.bairro} — {addr.cidade}/{addr.estado} — CEP {addr.cep}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Cartões Tab ────────────────────────────────────────── */}
                  {activeTab === 'cartoes' && (
                    <div data-testid="client-tab-cartoes-content">
                      {!client.cartoes?.length ? (
                        <p className="text-muted">Nenhum cartão cadastrado.</p>
                      ) : (
                        <div className="row g-3">
                          {client.cartoes.map((card, idx) => (
                            <div key={card.id ?? idx} className="col-12 col-sm-6">
                              <div className="card card-body py-2 px-3 small">
                                <div className="d-flex justify-content-between align-items-center">
                                  <strong>{card.apelido ?? `Cartão ${idx + 1}`}</strong>
                                  {card.principal && (
                                    <span className="badge bg-primary">Principal</span>
                                  )}
                                </div>
                                <div className="text-muted font-monospace">
                                  **** **** **** {card.ultimosDigitos ?? '????'}
                                </div>
                                <div className="text-muted">
                                  {card.nomeTitular ?? '—'}
                                </div>
                                <div className="text-muted">
                                  {card.mesValidade && card.anoValidade
                                    ? `Validade: ${card.mesValidade.toString().padStart(2, '0')}/${card.anoValidade}`
                                    : 'Validade não informada'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Transações Tab ─────────────────────────────────────── */}
                  {activeTab === 'transacoes' && (
                    <div data-testid="client-tab-transacoes-content">
                      {!client.transacoes?.length ? (
                        <p className="text-muted">Nenhuma transação encontrada.</p>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-sm align-middle small">
                            <thead className="table-light">
                              <tr>
                                <th>Pedido</th>
                                <th>Data</th>
                                <th className="text-end">Valor</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {client.transacoes.map((tx, idx) => (
                                <tr key={tx.id ?? idx}>
                                  <td className="font-monospace">#{tx.pedidoId ?? tx.id ?? '—'}</td>
                                  <td>
                                    {tx.data ? formatDate(tx.data) : '—'}
                                  </td>
                                  <td className="text-end">
                                    {tx.valor != null ? formatCurrency(tx.valor) : '—'}
                                  </td>
                                  <td>
                                    <span className="badge bg-secondary">{tx.status ?? '—'}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={onClose}
                data-testid="client-detail-close-footer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── ClientSearchAdmin ─────────────────────────────────────────────────────────

/**
 * ClientSearchAdmin
 * @component
 * @description Admin panel section for searching and viewing client details.
 * Renders a filterable, paginated table of clients. Clicking a row opens a
 * detail modal showing personal data, addresses, cards, ranking, and transactions.
 */
const ClientSearchAdmin = () => {
  usePageTitle('Admin — Clientes');
  const { error: notifyError, success: notifySuccess } = useNotification();

  // ── Filters ────────────────────────────────────────────────────────────────
  const [pendingFilters, setPendingFilters] = useState({ nome: '', cpf: '', email: '', ativo: '' });
  const [filters, setFilters] = useState({ nome: '', cpf: '', email: '', ativo: '' });

  // ── Data ───────────────────────────────────────────────────────────────────
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [processingClientId, setProcessingClientId] = useState(null);

  // ── Detail modal ───────────────────────────────────────────────────────────
  const [selectedClientId, setSelectedClientId] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (filters.nome) params.nome = filters.nome;
      if (filters.cpf) params.cpf = filters.cpf.replace(/\D/g, '');
      if (filters.email) params.email = filters.email;
      if (filters.ativo !== '') params.ativo = filters.ativo === 'true';

      const data = await adminService.getCustomers(params);
      setClients(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  }, [page, filters, notifyError]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // ── Filter Handlers ────────────────────────────────────────────────────────
  const handleFilterChange = (key, value) => {
    setPendingFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setFilters({ ...pendingFilters });
    setPage(0);
  };

  const handleFilterReset = () => {
    const empty = { nome: '', cpf: '', email: '', ativo: '' };
    setPendingFilters(empty);
    setFilters(empty);
    setPage(0);
  };

  const hasActiveFilters =
    filters.nome || filters.cpf || filters.email || filters.ativo !== '';

  const handleToggleClientStatus = async (client, event) => {
    event.stopPropagation();
    if (!client?.id) return;

    setProcessingClientId(client.id);
    try {
      if (client.ativo === false) {
        await adminService.activateCustomer(client.id);
        notifySuccess(`Cliente "${client.nome}" ativado com sucesso.`);
      } else {
        await adminService.inactivateCustomer(client.id);
        notifySuccess(`Cliente "${client.nome}" inativado com sucesso.`);
      }
      await fetchClients();
      if (selectedClientId === client.id) {
        setSelectedClientId(null);
      }
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao alterar status do cliente.');
    } finally {
      setProcessingClientId(null);
    }
  };

  return (
    <div data-testid="admin-clients-section">
      {/* Toolbar */}
      <div className="d-flex align-items-center mb-4 flex-wrap gap-2">
        <div>
          <Link to="/admin" className="btn btn-sm btn-outline-secondary me-2" data-testid="admin-clients-back">
            ← Painel
          </Link>
          <h2 className="h4 mb-0 d-inline">
            Clientes
            {!loading && (
              <span className="badge bg-secondary ms-2" data-testid="admin-clients-count">
                {totalElements}
              </span>
            )}
          </h2>
        </div>
      </div>

      {/* Inline Filters */}
      <form
        onSubmit={handleFilterSubmit}
        className="card mb-4 border-0 bg-light"
        data-testid="admin-clients-filters"
      >
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label small fw-semibold mb-1">Nome</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Buscar por nome…"
                value={pendingFilters.nome}
                onChange={(e) => handleFilterChange('nome', e.target.value)}
                data-testid="filter-nome"
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label small fw-semibold mb-1">CPF</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="000.000.000-00"
                value={pendingFilters.cpf}
                onChange={(e) => handleFilterChange('cpf', e.target.value)}
                data-testid="filter-cpf"
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label small fw-semibold mb-1">E-mail</label>
              <input
                type="email"
                className="form-control form-control-sm"
                placeholder="email@exemplo.com"
                value={pendingFilters.email}
                onChange={(e) => handleFilterChange('email', e.target.value)}
                data-testid="filter-email"
              />
            </div>
            <div className="col-6 col-md-1">
              <label className="form-label small fw-semibold mb-1">Status</label>
              <select
                className="form-select form-select-sm"
                value={pendingFilters.ativo}
                onChange={(e) => handleFilterChange('ativo', e.target.value)}
                data-testid="filter-ativo"
              >
                <option value="">Todos</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </select>
            </div>
            <div className="col-6 col-md-2 d-flex gap-1">
              <button
                type="submit"
                className="btn btn-primary btn-sm flex-grow-1"
                data-testid="filter-submit"
              >
                Filtrar
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleFilterReset}
                  data-testid="filter-reset"
                  title="Limpar filtros"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : clients.length === 0 ? (
        <div className="alert alert-info" data-testid="admin-no-clients">
          Nenhum cliente encontrado.
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-link btn-sm ms-2 p-0"
              onClick={handleFilterReset}
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-responsive" data-testid="admin-clients-table-wrapper">
            <table
              className="table table-hover table-sm align-middle"
              data-testid="admin-clients-table"
              style={{ cursor: 'pointer' }}
            >
              <thead className="table-light">
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>E-mail</th>
                  <th className="text-center">Ranking</th>
                  <th className="text-center">Status</th>
                  <th>Data Cadastro</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => {
                  const isActive = client.ativo !== false;
                  const isProcessing = processingClientId === client.id;
                  return (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      data-testid={`admin-client-row-${client.id}`}
                      title="Clique para ver detalhes"
                    >
                      <td className="fw-semibold" data-testid={`client-name-${client.id}`}>
                        {client.nome ?? '—'}
                      </td>
                      <td className="font-monospace small" data-testid={`client-cpf-${client.id}`}>
                        {client.cpf ? formatCpf(client.cpf) : '—'}
                      </td>
                      <td className="small" data-testid={`client-email-${client.id}`}>
                        {client.email ?? '—'}
                      </td>
                      <td className="text-center" data-testid={`client-ranking-${client.id}`}>
                        <RankingBadge ranking={client.ranking} />
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge ${isActive ? 'bg-success' : 'bg-secondary'}`}
                          data-testid={`client-status-${client.id}`}
                        >
                          {isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="small text-muted" data-testid={`client-date-${client.id}`}>
                        {client.dataCadastro ? formatDate(client.dataCadastro) : '—'}
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className={`btn btn-sm ${isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                          onClick={(event) => handleToggleClientStatus(client, event)}
                          disabled={isProcessing}
                          data-testid={`toggle-client-${client.id}`}
                        >
                          {isProcessing ? 'Processando…' : isActive ? 'Inativar' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Paginação de clientes" className="mt-3">
              <ul className="pagination pagination-sm justify-content-center mb-0">
                <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((p) => p - 1)}>
                    ‹ Anterior
                  </button>
                </li>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const total = totalPages;
                  let pageNum;
                  if (total <= 7) {
                    pageNum = i;
                  } else if (page < 4) {
                    pageNum = i < 5 ? i : i === 5 ? -1 : total - 1;
                  } else if (page >= total - 4) {
                    pageNum = i === 0 ? 0 : i === 1 ? -1 : total - 7 + i;
                  } else {
                    if (i === 0) pageNum = 0;
                    else if (i === 1) pageNum = -1;
                    else if (i === 5) pageNum = -1;
                    else if (i === 6) pageNum = total - 1;
                    else pageNum = page + (i - 3);
                  }
                  if (pageNum === -1) {
                    return (
                      <li key={`ellipsis-${i}`} className="page-item disabled">
                        <span className="page-link">…</span>
                      </li>
                    );
                  }
                  return (
                    <li key={pageNum} className={`page-item ${pageNum === page ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setPage(pageNum)}>
                        {pageNum + 1}
                      </button>
                    </li>
                  );
                })}
                <li className={`page-item ${page >= totalPages - 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((p) => p + 1)}>
                    Próxima ›
                  </button>
                </li>
              </ul>
              <div className="text-center text-muted small mt-2">
                Página {page + 1} de {totalPages} — {totalElements} clientes no total
              </div>
            </nav>
          )}
        </>
      )}

      {/* Client Detail Modal */}
      {selectedClientId != null && (
        <ClientDetailModal
          clientId={selectedClientId}
          onClose={() => setSelectedClientId(null)}
        />
      )}
    </div>
  );
};

export default ClientSearchAdmin;
