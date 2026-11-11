import React, { useState, useContext, useRef, useEffect } from 'react'
import './Navbar.css'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import logo from '../../assets/logo.png'
import notificationIcon from '../../assets/notification.png'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'

const Navbar = () => {
  const { isLoggedIn, user, logout, unreadCount, notifications, markNotificationsRead, setShowLogin, cartData } =
    useContext(StoreContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate('/');
  };

  const handleBell = () => {
    const opening = !showNotifMenu;
    setShowNotifMenu(opening);
    if (opening && unreadCount > 0) {
      markNotificationsRead();
    }
  };

  const cartCount = (cartData?.items || []).reduce((sum, i) => sum + i.quantity, 0);

  const isActive = (path) => (path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`));

  const renderNavLinks = () => {
    if (!isLoggedIn || user?.role === 'customer') {
      return (
        <>
          <Link to='/' className={isActive('/') ? 'active' : ''}>Home</Link>
          <Link to='/cooks' className={isActive('/cooks') ? 'active' : ''}>Cooks</Link>
          <Link to='/pickup' className={isActive('/pickup') ? 'active' : ''}>Pick Up</Link>
          <Link to='/orders' className={isActive('/orders') ? 'active' : ''}>Orders</Link>
          <Link to='/wishlist' className={isActive('/wishlist') ? 'active' : ''}>Wishlist</Link>
        </>
      );
    }

    if (user?.role === 'cook') {
      return (
        <>
          <Link to='/' className={pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to='/cook' className={pathname === '/cook' ? 'active' : ''}>My Kitchen</Link>
          <Link to='/cook/menu' className={isActive('/cook/menu') ? 'active' : ''}>My Menu</Link>
          <Link to='/cook/orders' className={isActive('/cook/orders') ? 'active' : ''}>Orders</Link>
        </>
      );
    }

    if (user?.role === 'delivery') {
      return (
        <>
          <Link to='/delivery/pickups' className={isActive('/delivery/pickups') ? 'active' : ''}>Pickups</Link>
          <Link to='/delivery/deliveries' className={isActive('/delivery/deliveries') ? 'active' : ''}>Deliveries</Link>
        </>
      );
    }

    if (user?.role === 'admin') {
      return (
        <>
          <Link to='/admin' className={pathname === '/admin' ? 'active' : ''}>Dashboard</Link>
          <Link to='/admin/cooks' className={isActive('/admin/cooks') ? 'active' : ''}>Cooks</Link>
          <Link to='/admin/orders' className={isActive('/admin/orders') ? 'active' : ''}>Orders</Link>
        </>
      );
    }

    return null;
  };

  return (
    <div className='navbar'>
      <Link to='/'><img src={logo} alt="logo" className="logo" /></Link>

      <ul className="navbar-menu">
        {renderNavLinks()}
      </ul>

      <div className="navbar-right">
        <img
          src={assets.search_icon}
          alt="search"
          style={{ cursor: 'pointer', width: 45, height: 45 }}
          onClick={() => navigate('/cooks')}
        />

        {/* Cart icon — shown for guests and customers */}
        {(!isLoggedIn || user?.role === 'customer') && (
          <div className="navbar-search-icon">
            <Link to='/cart'><img src={assets.basket_icon} alt="cart" style={{ width: 45, height: 45 }} /></Link>
            {cartCount > 0 && (
              <div
                className="dot"
                style={{ minWidth: 16, minHeight: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
              >
                {cartCount}
              </div>
            )}
          </div>
        )}

        {/* Notifications bell — only when logged in */}
        {isLoggedIn && (
          <div className="navbar-bell-wrap" ref={notifRef}>
            <button type="button" className="bell-btn" onClick={handleBell} title="Notifications">
              <img src={notificationIcon} alt="notifications" style={{ width: 45, height: 45, display: 'block' }} />
              {unreadCount > 0 && <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {showNotifMenu && (
              <div className="notif-dropdown">
                {notifications.length === 0 ? (
                  <p className="notif-empty">No notifications</p>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div key={n.id} className={`notif-item ${n.read ? '' : 'notif-unread'}`}>
                      <p>{n.title}</p>
                      {n.body && <p style={{ fontSize: 12, color: '#666', fontWeight: 400, marginTop: 2 }}>{n.body}</p>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Auth button / profile dropdown */}
        {isLoggedIn ? (
          <div className="navbar-profile" ref={profileRef}>
            <img
              src={assets.profile_icon}
              alt="profile"
              className="profile-icon-img"
              onClick={() => setShowProfileMenu((v) => !v)}
              style={{ cursor: 'pointer', width: 50 }}
            />
            {showProfileMenu && (
              <div className="profile-dropdown">
                <p className="profile-name">{user?.name}</p>
                <p style={{ padding: '0 16px 8px', fontSize: 12, color: '#808080', textTransform: 'capitalize' }}>
                  {user?.role}
                </p>
                <hr />
                <button type="button" onClick={handleLogout} className="logout-btn">
                  <img src={assets.logout_icon} alt="logout" style={{ width: 16, marginRight: 6 }} />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => setShowLogin(true)}>sign in</button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
