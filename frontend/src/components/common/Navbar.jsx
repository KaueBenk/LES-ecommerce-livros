import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authContext';
import { useCart } from '../../store/cartContext';
import { ROUTES } from '../../utils/constants';
import { getInitials } from '../../utils/helpers';

/**
 * Navbar
 * @component
 * @description Main navigation bar with links, cart icon, and auth state.
 * @returns {JSX.Element}
 */
const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
    setExpanded(false);
  };

  const closeNav = () => setExpanded(false);

  return (
    <nav
      className="navbar navbar-expand-md navbar-light bg-light border-bottom"
      data-testid="navbar"
    >
      <div className="container">
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-controls="mainNav"
          aria-expanded={expanded}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse${expanded ? ' show' : ''}`} id="mainNav">
          <ul className="navbar-nav me-auto mb-2 mb-md-0">
            <li className="nav-item">
              <NavLink
                to={ROUTES.HOME}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                end
                onClick={closeNav}
                data-testid="nav-home"
              >
                Início
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to={ROUTES.CATALOG}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={closeNav}
                data-testid="nav-catalog"
              >
                Catálogo
              </NavLink>
            </li>
            {isAuthenticated && (
              <li className="nav-item">
                <NavLink
                  to={ROUTES.ACCOUNT}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  onClick={closeNav}
                  data-testid="nav-account"
                >
                  Minha Conta
                </NavLink>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center gap-2">
            {/* Cart icon */}
            <Link
              to={ROUTES.CART}
              className="btn btn-outline-primary position-relative"
              onClick={closeNav}
              data-testid="nav-cart"
            >
              🛒
              {totalItems > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  data-testid="cart-badge"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* Auth buttons */}
            {isAuthenticated ? (
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  data-testid="nav-user-menu"
                >
                  {user ? getInitials(user.nome || user.name) : '👤'}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link
                      className="dropdown-item"
                      to={ROUTES.ACCOUNT}
                      onClick={closeNav}
                      data-testid="nav-profile"
                    >
                      Perfil
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item"
                      to={ROUTES.ORDER_HISTORY}
                      onClick={closeNav}
                      data-testid="nav-orders"
                    >
                      Meus Pedidos
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={handleLogout}
                      data-testid="nav-logout"
                    >
                      Sair
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <Link
                  to={ROUTES.LOGIN}
                  className="btn btn-outline-primary btn-sm"
                  onClick={closeNav}
                  data-testid="nav-login"
                >
                  Entrar
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="btn btn-primary btn-sm"
                  onClick={closeNav}
                  data-testid="nav-register"
                >
                  Cadastrar
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
