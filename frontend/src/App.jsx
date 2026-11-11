import React, { lazy, Suspense, useContext, useEffect } from 'react'
import { Route, Routes, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import Home from './pages/Home/Home'
import Cart from './pages/Cart/Cart'
import PlaceOrder from './pages/PlaceOrder/PlaceOrder'
import Cooks from './pages/Cooks/Cooks'
import CookDetails from './components/CookDetails/CookDetails'
import PickUp from './pages/PickUp/PickUp'
import MyOrders from './pages/MyOrders/MyOrders'
import Wishlist from './pages/Wishlist/Wishlist'
import Footer from './components/Footer/Footer'
import LoginPopup from './components/LoginPopup/LoginPopup'
import { StoreContext } from './context/StoreContext'

// Role-specific portals — lazy loaded
const CookPortal         = lazy(() => import('./pages/CookPortal/CookPortal'))
const CookMenu           = lazy(() => import('./pages/CookPortal/CookMenu'))
const CookOrders         = lazy(() => import('./pages/CookPortal/CookOrders'))
const DeliveryPickups    = lazy(() => import('./pages/DeliveryPortal/DeliveryPickups'))
const DeliveryDeliveries = lazy(() => import('./pages/DeliveryPortal/DeliveryDeliveries'))
const AdminDashboard     = lazy(() => import('./pages/Admin/AdminDashboard'))
const AdminCooks         = lazy(() => import('./pages/Admin/AdminCooks'))
const AdminOrders        = lazy(() => import('./pages/Admin/AdminOrders'))

const ROLE_HOME = {
  customer: '/',
  cook:     '/cook',
  delivery: '/delivery/pickups',
  admin:    '/admin',
};

function RequireLoginRedirect() {
  const { setShowLogin } = useContext(StoreContext);
  const location = useLocation();

  useEffect(() => {
    setShowLogin(true);
  }, [setShowLogin, location.pathname]);

  return <Navigate to="/" replace state={{ from: location }} />;
}

/** Guard: must be logged in; optionally must have one of the allowed roles. */
function ProtectedRoute({ children, roles }) {
  const { isLoggedIn, user } = useContext(StoreContext);

  if (!isLoggedIn) {
    return <RequireLoginRedirect />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={ROLE_HOME[user?.role] || '/'} replace />;
  }

  return children;
}

const LoadingFallback = () => (
  <div style={{ padding: '60px', textAlign: 'center', color: '#808080' }}>Loading…</div>
);

const App = () => {
  const { showLogin, setShowLogin } = useContext(StoreContext);

  return (
    <>
      {showLogin && <LoginPopup setShowLogin={setShowLogin} />}
      <div className='app'>
        <Navbar />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public */}
            <Route path='/'          element={<Home />} />
            <Route path='/cooks'     element={<Cooks />} />
            <Route path='/cooks/:id' element={<CookDetails />} />

            {/* Customer-protected */}
            <Route path='/cart'     element={<ProtectedRoute roles={['customer']}><Cart /></ProtectedRoute>} />
            <Route path='/order'    element={<ProtectedRoute roles={['customer']}><PlaceOrder /></ProtectedRoute>} />
            <Route path='/pickup'   element={<ProtectedRoute roles={['customer']}><PickUp /></ProtectedRoute>} />
            <Route path='/orders'   element={<ProtectedRoute roles={['customer']}><MyOrders /></ProtectedRoute>} />
            <Route path='/wishlist' element={<ProtectedRoute roles={['customer']}><Wishlist /></ProtectedRoute>} />

            {/* Cook portal */}
            <Route path='/cook'        element={<ProtectedRoute roles={['cook']}><CookPortal /></ProtectedRoute>} />
            <Route path='/cook/menu'   element={<ProtectedRoute roles={['cook']}><CookMenu /></ProtectedRoute>} />
            <Route path='/cook/orders' element={<ProtectedRoute roles={['cook']}><CookOrders /></ProtectedRoute>} />

            {/* Delivery portal */}
            <Route path='/delivery/pickups'    element={<ProtectedRoute roles={['delivery']}><DeliveryPickups /></ProtectedRoute>} />
            <Route path='/delivery/deliveries' element={<ProtectedRoute roles={['delivery']}><DeliveryDeliveries /></ProtectedRoute>} />

            {/* Admin */}
            <Route path='/admin'        element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path='/admin/cooks'  element={<ProtectedRoute roles={['admin']}><AdminCooks /></ProtectedRoute>} />
            <Route path='/admin/orders' element={<ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </Suspense>
      </div>
      <Footer />
    </>
  );
};

export default App;
