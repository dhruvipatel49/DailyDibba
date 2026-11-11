import React, { createContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, getMe } from '../api/auth.js';
import { getCart, setCartItem, clearCart as apiClearCart } from '../api/cart.js';
import { getWishlist, toggleWishlist as apiToggleWishlist } from '../api/wishlist.js';
import { getNotifications, markAllRead as apiMarkAllRead } from '../api/notifications.js';
import { useToast } from '../components/Toast/Toast.jsx';

export const StoreContext = createContext(null);

const EMPTY_CART = { items: [], subtotal: 0, deliveryFee: 0, total: 0, cookCount: 0 };

const StoreContextProvider = ({ children }) => {
  const { showToast, ToastComponent } = useToast();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [token, setToken] = useState(() => localStorage.getItem('dd_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('dd_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // ── Menu data (populated by Home page) ───────────────────────────────────
  const [foodList, setFoodList] = useState([]);

  // ── Cart ──────────────────────────────────────────────────────────────────
  const [cartData, setCartData] = useState(EMPTY_CART);
  const [cartLoading, setCartLoading] = useState(false);

  // ── Wishlist ──────────────────────────────────────────────────────────────
  const [wishlistIds, setWishlistIds] = useState(() => new Set());
  const [wishlistItems, setWishlistItems] = useState([]);

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Login popup ───────────────────────────────────────────────────────────
  const [showLogin, setShowLogin] = useState(false);

  const isLoggedIn = Boolean(token && user);

  // ── Persist auth ──────────────────────────────────────────────────────────
  const persistAuth = useCallback((newToken, newUser) => {
    localStorage.setItem('dd_token', newToken);
    localStorage.setItem('dd_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('dd_token');
    localStorage.removeItem('dd_user');
    setToken(null);
    setUser(null);
    setCartData(EMPTY_CART);
    setWishlistIds(new Set());
    setWishlistItems([]);
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // ── On 401 from any API call ──────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      clearAuth();
      showToast('Session expired. Please sign in again.', 'error');
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [clearAuth, showToast]);

  // ── Fetch cart + wishlist (customers only) ────────────────────────────────
  const fetchCart = useCallback(async () => {
    if (!localStorage.getItem('dd_token')) return;
    setCartLoading(true);
    try {
      const data = await getCart();
      setCartData(data || EMPTY_CART);
    } catch (err) {
      if (err.status !== 401) showToast(err.message, 'error');
    } finally {
      setCartLoading(false);
    }
  }, [showToast]);

  const fetchWishlist = useCallback(async () => {
    if (!localStorage.getItem('dd_token')) return;
    try {
      const data = await getWishlist();
      const items = Array.isArray(data) ? data : (data?.items || []);
      setWishlistItems(items);
      setWishlistIds(new Set(items.map((i) => i.id)));
    } catch (err) {
      if (err.status !== 401) showToast(err.message, 'error');
    }
  }, [showToast]);

  const fetchNotifications = useCallback(async () => {
    if (!localStorage.getItem('dd_token')) return;
    try {
      const data = await getNotifications();
      const list = Array.isArray(data) ? data : (data?.notifications || []);
      setNotifications(list);
      setUnreadCount(
        typeof data?.unreadCount === 'number'
          ? data.unreadCount
          : list.filter((n) => !n.read).length,
      );
    } catch {
      // Background polling errors shouldn't spam toasts
    }
  }, []);

  // ── On mount: restore & verify session via GET /api/auth/me ───────────────
  useEffect(() => {
    const storedToken = localStorage.getItem('dd_token');
    if (!storedToken) return;

    getMe()
      .then((data) => {
        const me = data.user || data;
        persistAuth(storedToken, me);
      })
      .catch(() => {
        clearAuth();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch customer data + notifications when logged in ────────────────────
  useEffect(() => {
    if (!isLoggedIn) return;
    if (user?.role === 'customer') {
      fetchCart();
      fetchWishlist();
    }
    fetchNotifications();
  }, [isLoggedIn, user?.role, fetchCart, fetchWishlist, fetchNotifications]);

  // ── Notifications polling (every 30s) ─────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return;
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, [isLoggedIn, fetchNotifications]);

  // ── Auth actions ──────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    persistAuth(data.token, data.user);
    return data.user;
  }, [persistAuth]);

  const register = useCallback(async (formData) => {
    const data = await apiRegister(formData);
    persistAuth(data.token, data.user);
    return data.user;
  }, [persistAuth]);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  // ── Cart actions (keyed by { menuItemId, size }) ──────────────────────────
  const getCartItemQuantity = useCallback(
    (menuItemId, size = 'regular') => {
      const found = (cartData.items || []).find(
        (item) => item.menuItemId === menuItemId && item.size === size,
      );
      return found ? found.quantity : 0;
    },
    [cartData.items],
  );

  const addToCart = useCallback(
    async (menuItemId, size = 'regular', delta = 1, instructions = undefined) => {
      if (!isLoggedIn) {
        setShowLogin(true);
        return;
      }
      if (user?.role !== 'customer') {
        showToast('Please sign in with a customer account to order tiffins.', 'error');
        return;
      }
      const existing = getCartItemQuantity(menuItemId, size);
      try {
        const updated = await setCartItem(menuItemId, size, existing + delta, instructions);
        setCartData(updated || EMPTY_CART);
      } catch (err) {
        showToast(err.message || 'Could not update cart', 'error');
      }
    },
    [isLoggedIn, user?.role, getCartItemQuantity, showToast],
  );

  const decrementFromCart = useCallback(
    async (menuItemId, size = 'regular') => {
      if (!isLoggedIn) return;
      const existing = getCartItemQuantity(menuItemId, size);
      const nextQty = Math.max(0, existing - 1);
      try {
        const updated = await setCartItem(menuItemId, size, nextQty);
        setCartData(updated || EMPTY_CART);
      } catch (err) {
        showToast(err.message || 'Could not update cart', 'error');
      }
    },
    [isLoggedIn, getCartItemQuantity, showToast],
  );

  const removeFromCart = useCallback(
    async (menuItemId, size = 'regular') => {
      if (!isLoggedIn) return;
      try {
        const updated = await setCartItem(menuItemId, size, 0);
        setCartData(updated || EMPTY_CART);
      } catch (err) {
        showToast(err.message || 'Could not remove item from cart', 'error');
      }
    },
    [isLoggedIn, showToast],
  );

  const clearLocalCart = useCallback(() => {
    setCartData(EMPTY_CART);
  }, []);

  const clearCart = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const updated = await apiClearCart();
      setCartData(updated || EMPTY_CART);
    } catch (err) {
      showToast(err.message || 'Could not clear cart', 'error');
    }
  }, [isLoggedIn, showToast]);

  const getTotalCartAmount = useCallback(() => {
    return cartData?.subtotal ?? 0;
  }, [cartData]);

  // ── Wishlist actions (optimistic with rollback) ───────────────────────────
  const toggleWishlist = useCallback(
    async (dishId) => {
      if (!isLoggedIn) {
        setShowLogin(true);
        return;
      }
      if (user?.role !== 'customer') {
        showToast('Please sign in with a customer account to save dishes.', 'error');
        return;
      }
      const wasIn = wishlistIds.has(dishId);
      const prevItems = wishlistItems;

      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (wasIn) next.delete(dishId);
        else next.add(dishId);
        return next;
      });
      if (wasIn) {
        setWishlistItems((prev) => prev.filter((item) => item.id !== dishId));
      }

      try {
        await apiToggleWishlist(dishId);
        await fetchWishlist();
      } catch (err) {
        // Rollback on error
        setWishlistIds((prev) => {
          const next = new Set(prev);
          if (wasIn) next.add(dishId);
          else next.delete(dishId);
          return next;
        });
        setWishlistItems(prevItems);
        showToast(err.message || 'Could not update wishlist', 'error');
      }
    },
    [isLoggedIn, user?.role, wishlistIds, wishlistItems, fetchWishlist, showToast],
  );

  // ── Notification actions ──────────────────────────────────────────────────
  const markNotificationsRead = useCallback(async () => {
    try {
      await apiMarkAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      showToast(err.message || 'Could not mark notifications as read', 'error');
    }
  }, [showToast]);

  const contextValue = {
    // Auth
    token,
    user,
    isLoggedIn,
    login,
    register,
    logout,

    // Login popup
    showLogin,
    setShowLogin,

    // Toast
    showToast,

    // Menu
    foodList,
    setFoodList,

    // Cart
    cartData,
    cartLoading,
    getCartItemQuantity,
    addToCart,
    decrementFromCart,
    removeFromCart,
    clearCart,
    clearLocalCart,
    getTotalCartAmount,
    fetchCart,

    // Wishlist
    wishlistIds,
    wishlistItems,
    toggleWishlist,
    fetchWishlist,

    // Notifications
    notifications,
    unreadCount,
    markNotificationsRead,
    fetchNotifications,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
      {ToastComponent}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
