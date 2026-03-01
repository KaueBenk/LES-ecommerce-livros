import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';

/**
 * Header
 * @component
 * @description Main application header with logo and navigation.
 * @returns {JSX.Element}
 */
const Header = () => {
  return (
    <header className="sticky-top" data-testid="header">
      <div className="bg-primary text-white py-2 px-3 d-flex align-items-center justify-content-between">
        <Link to="/" className="text-white text-decoration-none">
          <div className="d-flex align-items-center gap-2">
            <span className="fs-4 fw-bold">📚 LES Livraria</span>
          </div>
        </Link>
        <small className="text-white-50 d-none d-md-block">
          Os melhores livros para você
        </small>
      </div>
      <Navbar />
    </header>
  );
};

export default Header;
