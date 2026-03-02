import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

/**
 * Footer
 * @component
 * @description Application footer with links and branding.
 * @returns {JSX.Element}
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-white mt-auto py-4" data-testid="footer">
      <div className="container">
        <div className="row gy-3">
          <div className="col-md-4">
            <h5 className="fw-bold mb-2">📚 LES Livraria</h5>
            <p className="text-white-50 small mb-0">
              Sua livraria online com os melhores títulos.
            </p>
          </div>

          <div className="col-md-4">
            <h6 className="fw-semibold mb-2">Links Rápidos</h6>
            <ul className="list-unstyled mb-0">
              <li>
                <Link to={ROUTES.HOME} className="text-white-50 small text-decoration-none">
                  Início
                </Link>
              </li>
              <li>
                <Link to={ROUTES.CATALOG} className="text-white-50 small text-decoration-none">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link to={ROUTES.CART} className="text-white-50 small text-decoration-none">
                  Carrinho
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-md-4">
            <h6 className="fw-semibold mb-2">Minha Conta</h6>
            <ul className="list-unstyled mb-0">
              <li>
                <Link to={ROUTES.LOGIN} className="text-white-50 small text-decoration-none">
                  Entrar
                </Link>
              </li>
              <li>
                <Link to={ROUTES.REGISTER} className="text-white-50 small text-decoration-none">
                  Cadastrar
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.ORDER_HISTORY}
                  className="text-white-50 small text-decoration-none"
                >
                  Meus Pedidos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-secondary mt-3 mb-2" />
        <p className="text-center text-white-50 small mb-0">
          © {currentYear} LES Livraria. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
