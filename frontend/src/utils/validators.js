/**
 * validators.js — Form validation utilities
 */

/**
 * Validates Brazilian CPF using modulo-11 algorithm.
 * @param {string} cpf
 * @returns {boolean}
 */
export const isValidCpf = (cpf) => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cleaned.charAt(10));
};

/**
 * Validates email format (RFC 5322 simplified).
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validates password strength (min 8 chars, upper, lower, special).
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Ao menos uma letra maiúscula');
  if (!/[a-z]/.test(password)) errors.push('Ao menos uma letra minúscula');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Ao menos um caractere especial');
  return { valid: errors.length === 0, errors };
};

/**
 * Validates Brazilian CEP.
 * @param {string} cep
 * @returns {boolean}
 */
export const isValidCep = (cep) => {
  return /^\d{5}-?\d{3}$/.test(cep);
};

/**
 * Validates phone number (Brazilian format).
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
};
