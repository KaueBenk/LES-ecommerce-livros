import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import useNotification from '../hooks/useNotification';
import customerService from '../services/customerService';
import checkoutService from '../services/checkoutService';
import cartService from '../services/cartService';
import { formatCurrency } from '../utils/formatters';
import { getErrorMessage } from '../utils/helpers';
import { ROUTES } from '../utils/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AddressForm from '../components/account/AddressForm';

// ─── Stepper ──────────────────────────────────────────────────────────────────

const STEPS = ['Endereço', 'Cupons', 'Pagamento', 'Confirmação'];

const Stepper = ({ currentStep }) => (
  <div className="d-flex align-items-center mb-5" data-testid="checkout-stepper">
    {STEPS.map((label, idx) => {
      const stepNum = idx + 1;
      const isDone = currentStep > stepNum;
      const isActive = currentStep === stepNum;
      return (
        <React.Fragment key={stepNum}>
          <div className="d-flex flex-column align-items-center" style={{ minWidth: 80 }}>
            <div
              className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${
                isDone
                  ? 'bg-success text-white'
                  : isActive
                  ? 'bg-primary text-white'
                  : 'bg-light text-muted border'
              }`}
              style={{ width: 40, height: 40 }}
              data-testid={`step-circle-${stepNum}`}
            >
              {isDone ? '✓' : stepNum}
            </div>
            <small
              className={`mt-1 ${isActive ? 'fw-semibold text-primary' : isDone ? 'text-success' : 'text-muted'}`}
            >
              {label}
            </small>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className="flex-grow-1 mx-2"
              style={{
                height: 2,
                backgroundColor: isDone ? '#198754' : '#dee2e6',
                marginBottom: '1.5rem',
              }}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Address card (radio selection) ──────────────────────────────────────────

const AddressCard = ({ address, selected, onSelect }) => {
  const isDelivery = ['ENTREGA', 'ENTREGA_E_FINANCEIRO', 'AMBOS'].includes(address.tipoEndereco);
  return (
    <div
      className={`card mb-3 cursor-pointer ${selected ? 'border-primary shadow-sm' : ''}`}
      style={{ cursor: 'pointer', borderWidth: selected ? 2 : 1 }}
      onClick={() => onSelect(address)}
      data-testid={`address-card-${address.id}`}
    >
      <div className="card-body d-flex align-items-start gap-3">
        <input
          type="radio"
          className="form-check-input mt-1 flex-shrink-0"
          id={`addr-${address.id}`}
          checked={selected}
          onChange={() => onSelect(address)}
          data-testid={`address-radio-${address.id}`}
        />
        <label htmlFor={`addr-${address.id}`} className="mb-0 flex-grow-1" style={{ cursor: 'pointer' }}>
          {address.apelido && (
            <div className="fw-semibold mb-1">{address.apelido}</div>
          )}
          <div className="small text-muted">
            {address.tipoLogradouro} {address.logradouro}, {address.numero}
            {address.complemento ? ` — ${address.complemento}` : ''}<br />
            {address.bairro} — {address.cidade}/{address.estado} — CEP {address.cep}
          </div>
          {!isDelivery && (
            <span className="badge bg-warning text-dark mt-1" data-testid="addr-not-delivery">
              Endereço financeiro — não disponível para entrega
            </span>
          )}
        </label>
        {selected && (
          <span className="badge bg-primary align-self-center" data-testid="addr-selected-badge">
            Selecionado
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Order summary sidebar ────────────────────────────────────────────────────

const OrderSummary = ({ cart, shippingFee, step, couponDiscount }) => {
  const itens = cart?.itens ?? [];
  const subtotal = cart?.valorSubtotal ?? itens.reduce((s, i) => s + (i.subtotal ?? 0), 0);
  const frete = shippingFee ?? (itens.length > 0 ? 10 : 0);
  const discount = couponDiscount ?? 0;
  const total = Math.max(0, subtotal + frete - discount);

  return (
    <div className="card sticky-top" style={{ top: '1rem' }} data-testid="order-summary">
      <div className="card-header fw-semibold">Resumo do Pedido</div>
      <div className="card-body">
        {itens.length > 0 && (
          <ul className="list-unstyled small mb-3">
            {itens.map((item) => (
              <li key={item.id} className="d-flex justify-content-between mb-1">
                <span className="text-truncate me-2" style={{ maxWidth: 160 }}>
                  {item.titulo} <span className="text-muted">×{item.quantidade}</span>
                </span>
                <span className="flex-shrink-0">{formatCurrency(item.subtotal ?? 0)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="d-flex justify-content-between mb-1">
          <span className="text-muted">Subtotal</span>
          <span data-testid="summary-subtotal">{formatCurrency(subtotal)}</span>
        </div>

        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Frete</span>
          <span data-testid="summary-shipping">
            {step >= 1 ? formatCurrency(frete) : '—'}
          </span>
        </div>

        {step >= 2 && discount > 0 && (
          <div className="d-flex justify-content-between mb-2 text-success" data-testid="summary-coupon-discount">
            <span>Descontos</span>
            <span>− {formatCurrency(discount)}</span>
          </div>
        )}

        <hr className="my-2" />

        <div className="d-flex justify-content-between fw-bold">
          <span>Total</span>
          <span className="text-primary" data-testid="summary-total">
            {step >= 1 ? formatCurrency(total) : formatCurrency(subtotal)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Add Address Modal ────────────────────────────────────────────────────────

const AddAddressModal = ({ onClose, onAdded }) => {
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);
  const { success, error: notifyError } = useNotification();

  const handleSave = async (formData) => {
    setSaving(true);
    setServerError(null);
    try {
      const newAddr = await customerService.addAddress(formData);
      success('Endereço adicionado com sucesso!');
      onAdded(newAddr);
    } catch (err) {
      const msg = getErrorMessage(err) || 'Erro ao salvar endereço.';
      setServerError(msg);
      notifyError(msg);
    } finally {
      setSaving(false);
    }
  };

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
        aria-labelledby="add-address-modal-title"
        style={{ zIndex: 1050 }}
        data-testid="add-address-modal"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="add-address-modal-title">
                Adicionar Novo Endereço
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Fechar"
              />
            </div>
            <div className="modal-body">
              <AddressForm
                address={null}
                onSave={handleSave}
                onClose={onClose}
                saving={saving}
                serverError={serverError}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Step 1: Address & Shipping ───────────────────────────────────────────────

const StepAddress = ({ addresses, selectedAddress, onSelect, shippingFee, shippingLoading, onAddAddress }) => {
  const deliveryAddresses = addresses.filter((a) =>
    ['ENTREGA', 'ENTREGA_E_FINANCEIRO', 'AMBOS'].includes(a.tipoEndereco)
  );

  return (
    <div data-testid="step-address">
      <h2 className="h5 fw-bold mb-4">Endereço de Entrega</h2>

      {addresses.length === 0 ? (
        <div className="alert alert-warning" data-testid="no-addresses">
          Você não possui endereços cadastrados.
        </div>
      ) : (
        <>
          {deliveryAddresses.length === 0 && (
            <div className="alert alert-warning" data-testid="no-delivery-addresses">
              Nenhum endereço disponível para entrega. Adicione um novo endereço.
            </div>
          )}
          {deliveryAddresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              selected={selectedAddress?.id === addr.id}
              onSelect={onSelect}
            />
          ))}

          {addresses.filter((a) => !['ENTREGA', 'ENTREGA_E_FINANCEIRO', 'AMBOS'].includes(a.tipoEndereco)).map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              selected={false}
              onSelect={() => {}} // non-delivery addresses can't be selected
            />
          ))}
        </>
      )}

      <button
        type="button"
        className="btn btn-outline-primary btn-sm mb-4"
        onClick={onAddAddress}
        data-testid="add-address-btn"
      >
        + Adicionar Novo Endereço
      </button>

      {selectedAddress && (
        <div className="alert alert-light border mt-2" data-testid="shipping-info">
          <div className="d-flex align-items-center justify-content-between">
            <span>
              <strong>Frete:</strong>{' '}
              {shippingLoading ? (
                <span className="spinner-border spinner-border-sm ms-1" role="status" aria-hidden="true" />
              ) : (
                <span className="text-success fw-semibold" data-testid="shipping-fee-value">
                  {formatCurrency(shippingFee ?? 10)}
                </span>
              )}
            </span>
            <span className="text-muted small">Entrega padrão</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Step 2: Coupon Selection ─────────────────────────────────────────────────

/**
 * StepCoupons
 * Allows the customer to apply trade coupons (cupons de troca) and/or
 * a single promotional coupon code before proceeding to payment.
 */
const StepCoupons = ({ tradeCoupons, couponsLoading, checkoutData, onCouponChange }) => {
  const [promoInput, setPromoInput] = useState(checkoutData.promotionalCoupon || '');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(
    checkoutData.couponDiscount > 0
      ? {
          cupomsTrocaValor: checkoutData.cupomsTrocaValor ?? 0,
          cupomPromocionalValor: checkoutData.cupomPromocionalValor ?? 0,
          desconto: checkoutData.couponDiscount,
          restante: checkoutData.couponRestante,
        }
      : null
  );
  const [validationError, setValidationError] = useState(null);

  // ── Validate coupons whenever selection changes ──────────────────────────
  const validate = useCallback(
    async (tradeCouponIds, promoCode) => {
      // If nothing selected, clear validation
      if (tradeCouponIds.length === 0 && !promoCode) {
        setValidationResult(null);
        setValidationError(null);
        onCouponChange({
          selectedTradeCoupons: tradeCouponIds,
          promotionalCoupon: promoCode,
          couponDiscount: 0,
          couponRestante: null,
          cupomsTrocaValor: 0,
          cupomPromocionalValor: 0,
        });
        return;
      }
      setValidating(true);
      setValidationError(null);
      try {
        const result = await checkoutService.validateCoupons({
          cupomsTroca: tradeCouponIds,
          cupomPromocional: promoCode || undefined,
        });
        setValidationResult(result);
        onCouponChange({
          selectedTradeCoupons: tradeCouponIds,
          promotionalCoupon: promoCode,
          couponDiscount: result.desconto ?? 0,
          couponRestante: result.restante ?? null,
          cupomsTrocaValor: result.cupomsTrocaValor ?? 0,
          cupomPromocionalValor: result.cupomPromocionalValor ?? 0,
        });
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Erro ao validar cupons. Verifique e tente novamente.';
        setValidationError(msg);
        setValidationResult(null);
        onCouponChange({
          selectedTradeCoupons: tradeCouponIds,
          promotionalCoupon: promoCode,
          couponDiscount: 0,
          couponRestante: null,
          cupomsTrocaValor: 0,
          cupomPromocionalValor: 0,
        });
      } finally {
        setValidating(false);
      }
    },
    [onCouponChange]
  );

  // ── Trade coupon toggle ──────────────────────────────────────────────────
  const handleTradeToggle = (couponId) => {
    const current = checkoutData.selectedTradeCoupons ?? [];
    const next = current.includes(couponId)
      ? current.filter((id) => id !== couponId)
      : [...current, couponId];
    validate(next, promoInput.trim());
  };

  // ── Promo code apply ─────────────────────────────────────────────────────
  const handleApplyPromo = () => {
    validate(checkoutData.selectedTradeCoupons ?? [], promoInput.trim());
  };

  const handlePromoKeyDown = (e) => {
    if (e.key === 'Enter') handleApplyPromo();
  };

  const handleClearPromo = () => {
    setPromoInput('');
    validate(checkoutData.selectedTradeCoupons ?? [], '');
  };

  const selectedIds = checkoutData.selectedTradeCoupons ?? [];

  return (
    <div data-testid="step-payment">
      <h2 className="h5 fw-bold mb-4">Cupons &amp; Descontos</h2>

      {/* ── Trade Coupons ── */}
      <div className="card mb-4" data-testid="trade-coupons-section">
        <div className="card-header d-flex align-items-center justify-content-between">
          <span className="fw-semibold">Cupons de Troca</span>
          {validating && (
            <span
              className="spinner-border spinner-border-sm text-primary"
              role="status"
              aria-hidden="true"
            />
          )}
        </div>
        <div className="card-body">
          {couponsLoading ? (
            <div className="text-center py-3">
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Carregando cupons…
            </div>
          ) : tradeCoupons.length === 0 ? (
            <p className="text-muted mb-0" data-testid="no-trade-coupons">
              Você não possui cupons de troca disponíveis.
            </p>
          ) : (
            <ul className="list-unstyled mb-0">
              {tradeCoupons.map((coupon) => {
                const isSelected = selectedIds.includes(coupon.id);
                return (
                  <li
                    key={coupon.id}
                    className={`d-flex align-items-center gap-3 p-3 rounded mb-2 ${
                      isSelected ? 'bg-success bg-opacity-10 border border-success' : 'border'
                    }`}
                    data-testid={`trade-coupon-${coupon.id}`}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input flex-shrink-0"
                      id={`coupon-${coupon.id}`}
                      checked={isSelected}
                      onChange={() => handleTradeToggle(coupon.id)}
                      data-testid={`trade-coupon-checkbox-${coupon.id}`}
                    />
                    <label
                      htmlFor={`coupon-${coupon.id}`}
                      className="mb-0 flex-grow-1"
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="fw-semibold text-success">
                        {formatCurrency(coupon.valor)}
                      </span>
                      <span className="text-muted small ms-2">
                        Gerado em{' '}
                        {new Date(coupon.dataGeracao).toLocaleDateString('pt-BR')}
                        {coupon.pedidoOrigem ? ` — Pedido #${coupon.pedidoOrigem}` : ''}
                      </span>
                    </label>
                    {isSelected && (
                      <span className="badge bg-success" data-testid={`trade-coupon-selected-${coupon.id}`}>
                        Aplicado
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── Promotional Coupon ── */}
      <div className="card mb-4" data-testid="promo-coupon-section">
        <div className="card-header fw-semibold">Cupom Promocional</div>
        <div className="card-body">
          <div className="input-group" data-testid="promo-coupon-input-group">
            <input
              type="text"
              className="form-control text-uppercase"
              placeholder="Digite o código do cupom"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              onKeyDown={handlePromoKeyDown}
              disabled={validating}
              data-testid="promo-coupon-input"
              aria-label="Código do cupom promocional"
            />
            {promoInput && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleClearPromo}
                disabled={validating}
                data-testid="promo-coupon-clear-btn"
                aria-label="Remover cupom"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleApplyPromo}
              disabled={validating || !promoInput.trim()}
              data-testid="promo-coupon-apply-btn"
            >
              {validating ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              ) : (
                'Aplicar'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Validation error ── */}
      {validationError && (
        <div className="alert alert-danger" role="alert" data-testid="coupon-validation-error">
          {validationError}
        </div>
      )}

      {/* ── Discount result ── */}
      {validationResult && !validationError && (
        <div className="card border-success" data-testid="coupon-discount-result">
          <div className="card-body">
            <h6 className="fw-bold text-success mb-3">Descontos Aplicados</h6>
            {validationResult.cupomsTrocaValor > 0 && (
              <div className="d-flex justify-content-between mb-1 small">
                <span className="text-muted">Cupons de troca</span>
                <span className="text-success" data-testid="trade-coupon-discount-value">
                  − {formatCurrency(validationResult.cupomsTrocaValor)}
                </span>
              </div>
            )}
            {validationResult.cupomPromocionalValor > 0 && (
              <div className="d-flex justify-content-between mb-1 small">
                <span className="text-muted">Cupom promocional</span>
                <span className="text-success" data-testid="promo-coupon-discount-value">
                  − {formatCurrency(validationResult.cupomPromocionalValor)}
                </span>
              </div>
            )}
            <hr className="my-2" />
            <div className="d-flex justify-content-between fw-bold">
              <span>Total com desconto</span>
              <span className="text-success" data-testid="coupon-total-after-discount">
                {formatCurrency(validationResult.restante)}
              </span>
            </div>
            {validationResult.restante < 10 && (
              <div className="alert alert-warning mt-3 mb-0 small" data-testid="coupon-low-balance-warning">
                Atenção: o valor restante ({formatCurrency(validationResult.restante)}) é inferior ao mínimo
                permitido de R$&nbsp;10,00.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Skip hint ── */}
      <p className="text-muted small mt-4" data-testid="coupon-skip-hint">
        Os cupons são opcionais. Clique em <strong>Próximo</strong> para continuar sem descontos.
      </p>
    </div>
  );
};

// ─── Step 3: Payment Method Selection ───────────────────────────────────────

const BRAND_COLORS = {
  visa: '#1a1f71',
  mastercard: '#eb001b',
  elo: '#00a4e0',
  amex: '#007bc1',
  hipercard: '#b30000',
};

/**
 * Returns a simple colored badge for a card brand.
 */
const BrandBadge = ({ nome }) => {
  const key = (nome || '').toLowerCase();
  const color = BRAND_COLORS[key] || '#6c757d';
  return (
    <span
      className="badge me-2 text-white"
      style={{ backgroundColor: color, fontSize: '0.7rem', letterSpacing: '0.05em' }}
      data-testid="brand-badge"
    >
      {nome || 'Cartão'}
    </span>
  );
};

/**
 * StepPayment
 * Allows the customer to pick one or more credit cards and distribute the
 * remaining balance across them.  The sum of all card values must equal
 * the remaining balance (after shipping and coupons) before the step
 * can be completed.
 */
const StepPayment = ({ checkoutData, creditCards, cardsLoading, remainingBalance, onPaymentChange }) => {
  // cardValues: { [cardId]: string }  — raw input strings
  const [cardValues, setCardValues] = useState(
    () =>
      (checkoutData.paymentSplits ?? []).reduce((acc, s) => {
        acc[s.cartaoId] = String(s.valor);
        return acc;
      }, {})
  );
  // selectedCardIds: Set-like as array
  const [selectedIds, setSelectedIds] = useState(
    () => (checkoutData.paymentSplits ?? []).map((s) => s.cartaoId)
  );

  // Compute total of entered values
  const total = selectedIds.reduce((sum, id) => {
    const v = parseFloat((cardValues[id] || '0').replace(',', '.'));
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  const target = remainingBalance ?? 0;
  const diff = Math.abs(total - target);
  const isExact = diff < 0.005;

  // Notify parent whenever selection or values change
  useEffect(() => {
    const splits = selectedIds
      .map((id) => {
        const v = parseFloat((cardValues[id] || '0').replace(',', '.'));
        return { cartaoId: id, valor: isNaN(v) ? 0 : v };
      })
      .filter((s) => s.valor > 0);
    onPaymentChange({ paymentSplits: splits, paymentValid: isExact && selectedIds.length > 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardValues, selectedIds]);

  const toggleCard = (cardId) => {
    setSelectedIds((prev) => {
      const next = prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId];
      return next;
    });
    // If newly selected and only one card, pre-fill with remaining
    setCardValues((prev) => {
      const alreadySelected = selectedIds.includes(cardId);
      if (!alreadySelected && !prev[cardId]) {
        return { ...prev, [cardId]: String(target.toFixed(2)) };
      }
      return prev;
    });
  };

  const handleValueChange = (cardId, raw) => {
    setCardValues((prev) => ({ ...prev, [cardId]: raw }));
  };

  const getCardError = (cardId) => {
    if (!selectedIds.includes(cardId)) return null;
    const v = parseFloat((cardValues[cardId] || '0').replace(',', '.'));
    if (isNaN(v) || v <= 0) return 'Informe um valor.';
    if (v < 10) return 'Valor mínimo: R$ 10,00.';
    return null;
  };

  return (
    <div data-testid="step-payment-cards">
      <h2 className="h5 fw-bold mb-1">Forma de Pagamento</h2>
      <p className="text-muted small mb-4">
        Valor a pagar:{' '}
        <strong className="text-primary" data-testid="payment-remaining-balance">
          {formatCurrency(target)}
        </strong>
      </p>

      {cardsLoading ? (
        <div className="text-center py-3">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          Carregando cartões…
        </div>
      ) : creditCards.length === 0 ? (
        <div className="alert alert-warning" data-testid="no-credit-cards">
          Você não possui cartões de crédito cadastrados.{' '}
          <a href="/conta/cartoes" className="alert-link">
            Adicionar cartão
          </a>
        </div>
      ) : (
        <>
          <ul className="list-unstyled mb-3">
            {creditCards.map((card) => {
              const isSelected = selectedIds.includes(card.id);
              const cardError = getCardError(card.id);
              return (
                <li
                  key={card.id}
                  className={`card mb-3 ${
                    isSelected
                      ? cardError
                        ? 'border-danger'
                        : 'border-primary shadow-sm'
                      : ''
                  }`}
                  data-testid={`payment-card-${card.id}`}
                >
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        className="form-check-input flex-shrink-0 mt-0"
                        id={`card-chk-${card.id}`}
                        checked={isSelected}
                        onChange={() => toggleCard(card.id)}
                        data-testid={`payment-card-checkbox-${card.id}`}
                      />
                      {/* Brand + digits */}
                      <label
                        htmlFor={`card-chk-${card.id}`}
                        className="mb-0 flex-grow-1 d-flex align-items-center"
                        style={{ cursor: 'pointer' }}
                      >
                        <BrandBadge nome={card.bandeira?.nome} />
                        <span className="fw-semibold me-2" data-testid={`payment-card-digits-${card.id}`}>
                          •••• {card.ultimosDigitos}
                        </span>
                        <span className="text-muted small">{card.nomeImpresso}</span>
                        {card.preferencial && (
                          <span className="badge bg-warning text-dark ms-2 small">Preferencial</span>
                        )}
                      </label>
                    </div>

                    {/* Value input — only when selected */}
                    {isSelected && (
                      <div className="mt-3 ms-4 ps-2">
                        <label
                          htmlFor={`card-val-${card.id}`}
                          className="form-label small fw-semibold mb-1"
                        >
                          Valor a cobrar neste cartão (R$)
                        </label>
                        <div className="input-group input-group-sm" style={{ maxWidth: 220 }}>
                          <span className="input-group-text">R$</span>
                          <input
                            type="number"
                            id={`card-val-${card.id}`}
                            className={`form-control ${
                              cardError ? 'is-invalid' : total > 0 ? 'is-valid' : ''
                            }`}
                            min="10"
                            step="0.01"
                            value={cardValues[card.id] ?? ''}
                            onChange={(e) => handleValueChange(card.id, e.target.value)}
                            placeholder="0.00"
                            data-testid={`payment-card-value-${card.id}`}
                          />
                          {cardError && (
                            <div className="invalid-feedback" data-testid={`payment-card-error-${card.id}`}>
                              {cardError}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Real-time sum bar */}
          {selectedIds.length > 0 && (
            <div
              className={`card ${
                isExact ? 'border-success bg-success bg-opacity-10' : 'border-danger bg-danger bg-opacity-10'
              } mb-3`}
              data-testid="payment-sum-bar"
            >
              <div className="card-body py-2 d-flex align-items-center justify-content-between">
                <span className="small fw-semibold">Total informado</span>
                <div className="text-end">
                  <span
                    className={`fw-bold ${
                      isExact ? 'text-success' : 'text-danger'
                    }`}
                    data-testid="payment-sum-value"
                  >
                    {formatCurrency(total)}
                  </span>
                  <span className="text-muted small ms-2">/ {formatCurrency(target)}</span>
                </div>
              </div>
              {!isExact && (
                <div
                  className="card-footer py-1 small text-danger fw-semibold"
                  data-testid="payment-sum-mismatch"
                >
                  {total < target
                    ? `Faltam ${formatCurrency(target - total)} para cobrir o valor total.`
                    : `Excesso de ${formatCurrency(total - target)}. Reduza o valor em algum cartão.`}
                </div>
              )}
              {isExact && (
                <div
                  className="card-footer py-1 small text-success fw-semibold"
                  data-testid="payment-sum-match"
                >
                  ✓ Valor correto — pronto para finalizar.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Step 4: Order Review & Confirmation ───────────────────────────────────────

/**
 * StepConfirmation
 * Read-only review of the whole order before final submission.
 * Shows items, pricing breakdown, delivery address, and payment splits.
 * The parent handles the actual POST /checkout/finalizar call.
 */
const StepConfirmation = ({
  checkoutData,
  cart,
  creditCards,
  finalizing,
  finalizeError,
  onFinalize,
}) => {
  const itens = cart?.itens ?? [];
  const subtotal = cart?.valorSubtotal ?? itens.reduce((s, i) => s + (i.subtotal ?? 0), 0);
  const frete = checkoutData.shippingFee ?? 0;
  const discount = checkoutData.couponDiscount ?? 0;
  const total = Math.max(0, subtotal + frete - discount);

  const address = checkoutData.selectedAddress;
  const splits = checkoutData.paymentSplits ?? [];
  const cardMap = creditCards.reduce((m, c) => { m[c.id] = c; return m; }, {});

  return (
    <div data-testid="step-confirmation">
      <h2 className="h5 fw-bold mb-4">Revisão do Pedido</h2>

      {/* Items table */}
      <div className="card mb-4" data-testid="confirmation-items">
        <div className="card-header fw-semibold">Itens do Carrinho</div>
        <div className="card-body p-0">
          <table className="table table-sm mb-0">
            <thead className="table-light">
              <tr>
                <th>Livro</th>
                <th className="text-center">Qtd</th>
                <th className="text-end">Unit.</th>
                <th className="text-end">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id}>
                  <td className="text-truncate" style={{ maxWidth: 200 }}>
                    {item.titulo}
                  </td>
                  <td className="text-center">{item.quantidade}</td>
                  <td className="text-end">{formatCurrency(item.precoUnitario ?? 0)}</td>
                  <td className="text-end">{formatCurrency(item.subtotal ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing summary */}
      <div className="card mb-4" data-testid="confirmation-pricing">
        <div className="card-header fw-semibold">Resumo de Valores</div>
        <div className="card-body">
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">Subtotal</span>
            <span data-testid="confirm-subtotal">{formatCurrency(subtotal)}</span>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">Frete</span>
            <span data-testid="confirm-shipping">{formatCurrency(frete)}</span>
          </div>
          {discount > 0 && (
            <div className="d-flex justify-content-between mb-1 text-success" data-testid="confirm-discount">
              <span>Descontos (cupons)</span>
              <span>− {formatCurrency(discount)}</span>
            </div>
          )}
          <hr className="my-2" />
          <div className="d-flex justify-content-between fw-bold">
            <span>Total</span>
            <span className="text-primary fs-5" data-testid="confirm-total">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Delivery address */}
      {address && (
        <div className="card mb-4" data-testid="confirmation-address">
          <div className="card-header fw-semibold">Endereço de Entrega</div>
          <div className="card-body small">
            {address.apelido && (
              <div className="fw-semibold mb-1">{address.apelido}</div>
            )}
            <div>
              {address.tipoLogradouro} {address.logradouro}, {address.numero}
              {address.complemento ? ` — ${address.complemento}` : ''}
            </div>
            <div>
              {address.bairro} — {address.cidade}/{address.estado} — CEP {address.cep}
            </div>
          </div>
        </div>
      )}

      {/* Payment splits */}
      {splits.length > 0 && (
        <div className="card mb-4" data-testid="confirmation-payment">
          <div className="card-header fw-semibold">Forma de Pagamento</div>
          <ul className="list-group list-group-flush">
            {splits.map((split) => {
              const card = cardMap[split.cartaoId];
              return (
                <li
                  key={split.cartaoId}
                  className="list-group-item d-flex justify-content-between align-items-center"
                  data-testid={`confirm-payment-split-${split.cartaoId}`}
                >
                  <span>
                    {card ? (
                      <>
                        <BrandBadge nome={card.bandeira?.nome} />
                        <span className="fw-semibold">•••• {card.ultimosDigitos}</span>
                        <span className="text-muted small ms-2">{card.nomeImpresso}</span>
                      </>
                    ) : (
                      <span className="text-muted">Cartão #{split.cartaoId}</span>
                    )}
                  </span>
                  <span className="fw-semibold text-primary">{formatCurrency(split.valor)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Finalize error */}
      {finalizeError && (
        <div className="alert alert-danger" role="alert" data-testid="finalize-error">
          <strong>Pagamento não aprovado.</strong>
          {finalizeError.errors && finalizeError.errors.length > 0 ? (
            <ul className="mb-0 mt-2">
              {finalizeError.errors.map((e, i) => (
                <li key={i}>
                  {e.cartaoUltimosDigitos && (
                    <span>Cartão •••• {e.cartaoUltimosDigitos}: </span>
                  )}
                  <span>{e.motivo ?? 'Erro desconhecido'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-1">{finalizeError.message || 'Erro ao processar pagamento. Tente novamente.'}</div>
          )}
        </div>
      )}

      {/* Confirm button */}
      <div className="d-flex justify-content-end mt-2">
        <button
          type="button"
          className="btn btn-success btn-lg px-5"
          onClick={onFinalize}
          disabled={finalizing}
          data-testid="confirm-purchase-btn"
        >
          {finalizing ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              />
              Processando…
            </>
          ) : (
            'Confirmar Compra'
          )}
        </button>
      </div>
    </div>
  );
};

// ─── CheckoutPage ─────────────────────────────────────────────────────────────

/**
 * CheckoutPage
 * @component
 * @description 4-step checkout flow:
 *   Step 1 — address & shipping selection
 *   Step 2 — coupon / discount selection
 *   Step 3 — payment method (credit cards)
 *   Step 4 — order confirmation
 */
const CheckoutPage = () => {
  usePageTitle('Checkout');
  const navigate = useNavigate();
  const { error: notifyError } = useNotification();

  const [currentStep, setCurrentStep] = useState(1);

  // Shared checkout state persisting across steps
  const [checkoutData, setCheckoutData] = useState({
    selectedAddress: null,
    shippingFee: null,
    paymentMethod: null,
    coupons: [],
    // Step 2 – coupons
    selectedTradeCoupons: [],
    promotionalCoupon: '',
    couponDiscount: 0,
    couponRestante: null,
    cupomsTrocaValor: 0,
    cupomPromocionalValor: 0,
    // Step 3 – payment
    paymentSplits: [],      // [{ cartaoId, valor }]
    paymentValid: false,
  });

  // Cart
  const [cart, setCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(true);

  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);

  // Shipping calc
  const [shippingLoading, setShippingLoading] = useState(false);

  // Trade coupons (step 2)
  const [tradeCoupons, setTradeCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  // Credit cards (step 3)
  const [creditCards, setCreditCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(false);

  // Finalization (step 4)
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState(null);

  // Add address modal
  const [showAddModal, setShowAddModal] = useState(false);

  // ── Fetch cart + addresses on mount ──
  const fetchData = useCallback(async () => {
    setCartLoading(true);
    setAddressesLoading(true);
    try {
      const [cartData, addressData] = await Promise.all([
        cartService.getCart(),
        customerService.getAddresses(),
      ]);
      setCart(cartData);
      setAddresses(addressData ?? []);
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao carregar dados do checkout.');
    } finally {
      setCartLoading(false);
      setAddressesLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Shipping calculation when address is selected ──
  const handleSelectAddress = useCallback(
    async (address) => {
      const isDelivery = ['ENTREGA', 'ENTREGA_E_FINANCEIRO', 'AMBOS'].includes(address.tipoEndereco);
      if (!isDelivery) return; // non-delivery addresses cannot be selected

      setCheckoutData((prev) => ({ ...prev, selectedAddress: address, shippingFee: null }));
      setShippingLoading(true);
      try {
        const result = await checkoutService.calculateShipping(address.id);
        setCheckoutData((prev) => ({
          ...prev,
          shippingFee: result?.valorFrete ?? 10,
        }));
      } catch {
        // Fall back to fixed R$10 on error
        setCheckoutData((prev) => ({ ...prev, shippingFee: 10 }));
      } finally {
        setShippingLoading(false);
      }
    },
    []
  );

  // ── Address added from modal ──
  const handleAddressAdded = (newAddr) => {
    setAddresses((prev) => [...prev, newAddr]);
    setShowAddModal(false);
    // Auto-select if it's a delivery address
    if (['ENTREGA', 'ENTREGA_E_FINANCEIRO', 'AMBOS'].includes(newAddr.tipoEndereco)) {
      handleSelectAddress(newAddr);
    }
  };

  // ── Fetch trade coupons when entering step 2 ──────────────────────────────
  useEffect(() => {
    if (currentStep !== 2) return;
    let cancelled = false;
    setCouponsLoading(true);
    customerService
      .getCuponsTraoca()
      .then((data) => {
        if (!cancelled) setTradeCoupons(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setTradeCoupons([]);
      })
      .finally(() => {
        if (!cancelled) setCouponsLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentStep]);

  // ── Coupon change handler (step 2) ────────────────────────────────────────
  const handleCouponChange = useCallback((couponState) => {
    setCheckoutData((prev) => ({ ...prev, ...couponState }));
  }, []);

  // ── Fetch credit cards when entering step 3 ───────────────────────────────
  useEffect(() => {
    if (currentStep !== 3) return;
    let cancelled = false;
    setCardsLoading(true);
    customerService
      .getCreditCards()
      .then((data) => {
        if (!cancelled) setCreditCards(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setCreditCards([]);
      })
      .finally(() => {
        if (!cancelled) setCardsLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentStep]);

  // ── Payment change handler (step 3) ──────────────────────────────────────
  const handlePaymentChange = useCallback(({ paymentSplits, paymentValid }) => {
    setCheckoutData((prev) => ({ ...prev, paymentSplits, paymentValid }));
  }, []);

  // ── Finalize order (step 4) ───────────────────────────────────────────
  const handleFinalize = useCallback(async () => {
    setFinalizing(true);
    setFinalizeError(null);
    try {
      const payload = {
        enderecoEntregaId: checkoutData.selectedAddress?.id,
        cupomsTroca: checkoutData.selectedTradeCoupons ?? [],
        cupomPromocional: checkoutData.promotionalCoupon || undefined,
        formasPagamento: (checkoutData.paymentSplits ?? []).map((s) => ({
          tipo: 'CARTAO_CREDITO',
          cartaoId: s.cartaoId,
          valor: s.valor,
        })),
      };
      const result = await checkoutService.finalizeOrder(payload);
      // Clear cart after successful order
      try { await cartService.clearCart(); } catch { /* best-effort */ }
      navigate(ROUTES.ORDER_CONFIRMATION, { state: { order: result }, replace: true });
    } catch (err) {
      const data = err?.response?.data;
      setFinalizeError({
        message: data?.message || err?.message || 'Erro ao finalizar compra.',
        errors: data?.errors ?? [],
      });
    } finally {
      setFinalizing(false);
    }
  }, [checkoutData, navigate]);

  // ── Remaining balance (what the customer still has to pay) ───────────────
  const remainingBalance = (() => {
    const subtotal = cart?.valorSubtotal ?? 0;
    const frete = checkoutData.shippingFee ?? 0;
    const discount = checkoutData.couponDiscount ?? 0;
    return Math.max(0, subtotal + frete - discount);
  })();

  // ── Navigation ──
  const canProceed = () => {
    if (currentStep === 1) return !!checkoutData.selectedAddress && !!checkoutData.shippingFee;
    if (currentStep === 3) return !!checkoutData.paymentValid;
    return true;
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) setCurrentStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  // ── Loading state ──
  if (cartLoading || addressesLoading) {
    return (
      <div className="container page-container" data-testid="checkout-page">
        <LoadingSpinner />
      </div>
    );
  }

  // ── Empty cart guard ──
  const itens = cart?.itens ?? [];
  if (itens.length === 0) {
    return (
      <div className="container page-container text-center" data-testid="checkout-page">
        <h1 className="mb-3">Checkout</h1>
        <div className="alert alert-warning" data-testid="checkout-empty-cart">
          Seu carrinho está vazio.
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(ROUTES.CART)}
        >
          Voltar ao Carrinho
        </button>
      </div>
    );
  }

  return (
    <div className="container page-container" data-testid="checkout-page">
      <h1 className="mb-4">Checkout</h1>

      <Stepper currentStep={currentStep} />

      <div className="row g-4">
        {/* Main content */}
        <div className="col-lg-8">
          {currentStep === 1 && (
            <StepAddress
              addresses={addresses}
              selectedAddress={checkoutData.selectedAddress}
              onSelect={handleSelectAddress}
              shippingFee={checkoutData.shippingFee}
              shippingLoading={shippingLoading}
              onAddAddress={() => setShowAddModal(true)}
            />
          )}
          {currentStep === 2 && (
            <StepCoupons
              tradeCoupons={tradeCoupons}
              couponsLoading={couponsLoading}
              checkoutData={checkoutData}
              onCouponChange={handleCouponChange}
            />
          )}
          {currentStep === 3 && (
            <StepPayment
              checkoutData={checkoutData}
              creditCards={creditCards}
              cardsLoading={cardsLoading}
              remainingBalance={remainingBalance}
              onPaymentChange={handlePaymentChange}
            />
          )}
          {currentStep === 4 && (
            <StepConfirmation
              checkoutData={checkoutData}
              cart={cart}
              creditCards={creditCards}
              finalizing={finalizing}
              finalizeError={finalizeError}
              onFinalize={handleFinalize}
            />
          )}

          {/* Navigation buttons */}
          <div className="d-flex justify-content-between mt-4 pt-3 border-top">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handlePrev}
              disabled={currentStep === 1}
              data-testid="checkout-prev-btn"
            >
              ← Anterior
            </button>

            {currentStep < STEPS.length ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                disabled={!canProceed()}
                title={
                  !canProceed() && currentStep === 1
                    ? 'Selecione um endereço de entrega para continuar'
                    : !canProceed() && currentStep === 3
                    ? 'Distribua o valor total entre os cartões selecionados'
                    : ''
                }
                data-testid="checkout-next-btn"
              >
                Próximo →
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-success"
                onClick={handleFinalize}
                disabled={!canProceed() || finalizing}
                data-testid="checkout-finish-btn"
              >
                {finalizing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Processando…
                  </>
                ) : (
                  'Confirmar Compra'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          <OrderSummary
            cart={cart}
            shippingFee={checkoutData.shippingFee}
            step={currentStep}
            couponDiscount={checkoutData.couponDiscount}
          />
        </div>
      </div>

      {/* Add address modal */}
      {showAddModal && (
        <AddAddressModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleAddressAdded}
        />
      )}
    </div>
  );
};

export default CheckoutPage;
