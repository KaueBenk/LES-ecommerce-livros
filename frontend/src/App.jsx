import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './store/authContext';
import { CartProvider } from './store/cartContext';
import { NotificationProvider } from './store/notificationContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ROUTES } from './utils/constants';

// Lazy loaded pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

/**
 * App — Root component with routing and providers.
 * @returns {JSX.Element}
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <ErrorBoundary>
              <div className="d-flex flex-column min-vh-100">
                <Header />
                <main className="flex-grow-1">
                  <Suspense fallback={<LoadingSpinner message="Carregando..." fullPage />}>
                    <Routes>
                      {/* Public routes */}
                      <Route path={ROUTES.HOME} element={<HomePage />} />
                      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                      <Route path={ROUTES.CATALOG} element={<CatalogPage />} />
                      <Route path={ROUTES.PRODUCT} element={<ProductPage />} />
                      <Route path={ROUTES.CART} element={<CartPage />} />

                      {/* Protected customer routes */}
                      <Route
                        path={ROUTES.CHECKOUT}
                        element={
                          <ProtectedRoute>
                            <CheckoutPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.ORDER_HISTORY}
                        element={
                          <ProtectedRoute>
                            <OrderHistoryPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/account/*"
                        element={
                          <ProtectedRoute>
                            <AccountPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Protected admin routes */}
                      <Route
                        path={ROUTES.ADMIN}
                        element={
                          <ProtectedRoute adminOnly>
                            <AdminPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/*"
                        element={
                          <ProtectedRoute adminOnly>
                            <AdminPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* 404 */}
                      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
              </div>
            </ErrorBoundary>
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

