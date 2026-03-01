import React from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorBoundary
 * @component
 * @description Catches JavaScript errors in child component tree and displays a fallback UI.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info); // eslint-disable-line no-console
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="container py-5 text-center"
          data-testid="error-boundary"
          role="alert"
        >
          <div className="alert alert-danger d-inline-block">
            <h4 className="alert-heading">Algo deu errado</h4>
            <p className="mb-2">
              {this.state.error?.message || 'Ocorreu um erro inesperado.'}
            </p>
            <button className="btn btn-danger btn-sm" onClick={this.handleReset}>
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onReset: PropTypes.func,
};

ErrorBoundary.defaultProps = {
  onReset: null,
};

export default ErrorBoundary;
