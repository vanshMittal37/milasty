import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { CartProvider, useCart } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';

// Portfolio & Original Pages
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Nutrition from './pages/Nutrition';
import OurStory from './pages/OurStory';
import TestimonialsPage from './pages/TestimonialsPage';
import Contact from './pages/Contact';
import LegalPage from './pages/LegalPage';

// Customer E-commerce Pages
import Shop from './pages/Shop';
import CataloguePage from './pages/CataloguePage';
import ShopProductDetail from './pages/ShopProductDetail';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AccountDashboard from './pages/AccountDashboard';
import OrderHistoryPage from './pages/OrderHistoryPage';
import CustomerOrderDetailPage from './pages/CustomerOrderDetailPage';

// Admin Panel Layout & Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboardMain from './pages/admin/AdminDashboardMain';
import AdminProductList from './pages/admin/AdminProductList';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrderList from './pages/admin/AdminOrderList';
import AdminCustomerList from './pages/admin/AdminCustomerList';
import AdminCouponList from './pages/admin/AdminCouponList';
import AdminReviewList from './pages/admin/AdminReviewList';

import { CheckCircle2 } from 'lucide-react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ToastNotification() {
  const { toastMessage } = useCart();
  if (!toastMessage) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#274C37',
        color: '#FDFBF7',
        padding: '0.75rem 1.5rem',
        borderRadius: '999px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.9rem',
        fontWeight: '600',
      }}
      className="animate-slide-up"
    >
      <CheckCircle2 size={18} color="var(--accent-gold)" />
      <span>{toastMessage}</span>
    </div>
  );
}

const PAGE_BACKGROUNDS = {
  '/our-story': '/images/about_background_image.jpeg',
  '/shop': '/images/ritiual_background_image.jpeg',
  '/nutrition': '/images/nutrition_background_image.jpeg',
  '/contact': '/images/shop_background_image.jpeg',
  '/wishlist': '/images/ritiual_background_image.jpeg',
  '/terms': '/images/about_background_image.jpeg',
  '/shipping': '/images/about_background_image.jpeg',
  '/refund': '/images/about_background_image.jpeg',
  '/privacy': '/images/about_background_image.jpeg',
};

function MainLayout() {
  const location = useLocation();
  const currentBg = PAGE_BACKGROUNDS[location.pathname];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      {currentBg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundImage: `url(${currentBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}
      <Navbar />
      <main style={{ flexGrow: 1, position: 'relative', zIndex: 1, paddingTop: '135px' }}>
        <Routes>
          {/* Company Portfolio Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Navigate to="/shop" replace />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/our-story" element={<OurStory />} />
          <Route path="/reviews" element={<TestimonialsPage />} />
          <Route path="/testimonials" element={<TestimonialsPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/shipping" element={<LegalPage />} />
          <Route path="/refund" element={<LegalPage />} />
          <Route path="/privacy" element={<LegalPage />} />
          <Route path="/terms" element={<LegalPage />} />

          {/* Customer E-commerce System */}
          <Route path="/catalogue" element={<Navigate to="/shop" replace />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/product/:id" element={<ShopProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/account" element={<AccountDashboard />} />
          <Route path="/account/orders" element={<OrderHistoryPage />} />
          <Route path="/account/orders/:id" element={<CustomerOrderDetailPage />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <ToastNotification />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              {/* Admin Separate Portal */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboardMain />} />
                <Route path="products" element={<AdminProductList />} />
                <Route path="products/add" element={<AdminProductForm />} />
                <Route path="products/edit/:id" element={<AdminProductForm />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="orders" element={<AdminOrderList />} />
                <Route path="customers" element={<AdminCustomerList />} />
                <Route path="coupons" element={<AdminCouponList />} />
                <Route path="reviews" element={<AdminReviewList />} />
              </Route>

              {/* Public Website & Store */}
              <Route path="/*" element={<MainLayout />} />
            </Routes>
          </Router>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
