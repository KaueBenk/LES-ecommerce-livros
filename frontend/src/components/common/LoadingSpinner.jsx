import React from 'react';
import PropTypes from 'prop-types';

/**
 * LoadingSpinner
 * @component
 * @description Displays a centered Bootstrap spinner for loading states.
 * @param {Object} props
 * @param {string} props.message - Optional loading message.
 * @param {'sm'|'md'|'lg'} props.size - Spinner size.
 * @param {boolean} props.fullPage - Whether to take full page height.
 * @returns {JSX.Element}
 */
const LoadingSpinner = ({ message, size, fullPage }) => {
  const sizeClass = size === 'sm' ? 'spinner-border-sm' : '';

  return (
    <div
      className={`d-flex flex-column align-items-center justify-content-center gap-2 ${
        fullPage ? 'min-vh-100' : 'py-5'
      }`}
      data-testid="loading-spinner"
      role="status"
      aria-label={message || 'Carregando...'}
    >
      <div className={`spinner-border text-primary ${sizeClass}`} />
      {message && <span className="text-muted small">{message}</span>}
    </div>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullPage: PropTypes.bool,
};

LoadingSpinner.defaultProps = {
  message: '',
  size: 'md',
  fullPage: false,
};

export default LoadingSpinner;
