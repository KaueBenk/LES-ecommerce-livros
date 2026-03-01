import React from 'react';
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import { ROUTES } from '../utils/constants';

/**
 * HomePage
 * @component
 * @description Landing page / vitrine principal.
 * @returns {JSX.Element}
 */
const HomePage = () => {
  usePageTitle('Início');

  return (
    <div className="page-container" data-testid="home-page">
      {/* Hero section */}
      <section className="bg-primary text-white py-5 mb-4">
        <div className="container text-center">
          <h1 className="display-4 fw-bold mb-3">📚 Bem-vindo à LES Livraria</h1>
          <p className="lead mb-4">Descubra os melhores livros com os melhores preços.</p>
          <Link to={ROUTES.CATALOG} className="btn btn-light btn-lg" data-testid="hero-cta">
            Ver Catálogo
          </Link>
        </div>
      </section>

      {/* Featured section placeholder */}
      <div className="container">
        <h2 className="mb-4">Destaques</h2>
        <div className="row g-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="col-sm-6 col-md-3">
              <div className="card h-100 shadow-sm">
                <div
                  className="card-img-top bg-secondary"
                  style={{ height: 200 }}
                  data-testid={`book-placeholder-${i}`}
                />
                <div className="card-body">
                  <h6 className="card-title placeholder-glow">
                    <span className="placeholder col-6" />
                  </h6>
                  <p className="card-text placeholder-glow">
                    <span className="placeholder col-4" />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
