/**
 * helpers.js — Miscellaneous helper functions
 */

/**
 * Delays execution by ms milliseconds. Useful for testing.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Extracts error message from API error response.
 * @param {Error} error - Axios or generic error.
 * @returns {string}
 */
export const getErrorMessage = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.errors?.[0]) return error.response.data.errors[0];
  if (error?.message) return error.message;
  return 'Ocorreu um erro inesperado. Tente novamente.';
};

/**
 * Deep clones an object.
 * @param {Object} obj
 * @returns {Object}
 */
export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * Returns initials from a name string.
 * @param {string} name
 * @returns {string}
 */
export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
};

/**
 * Checks if the user is admin based on roles.
 * @param {Object} user
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  return user?.roles?.includes('ADMIN') || user?.role === 'ADMIN';
};
