/**
 * formatters.js — Data formatting utilities
 */

/**
 * Formats a number as Brazilian Real currency.
 * @param {number} value
 * @returns {string}
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formats a CPF number.
 * @param {string} cpf
 * @returns {string}
 */
export const formatCpf = (cpf) => {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formats a phone number.
 * @param {string} phone
 * @returns {string}
 */
export const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
};

/**
 * Formats a CEP.
 * @param {string} cep
 * @returns {string}
 */
export const formatCep = (cep) => {
  return cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
};

/**
 * Formats a date string for display.
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
};

/**
 * Truncates a string to a given length.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
export const truncate = (str, maxLen = 100) => {
  return str.length > maxLen ? `${str.substring(0, maxLen)}...` : str;
};
