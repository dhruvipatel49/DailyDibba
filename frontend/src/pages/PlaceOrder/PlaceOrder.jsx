import React, { useState, useContext, useEffect, useMemo } from 'react'
import './PlaceOrder.css'
import { StoreContext } from '../../context/StoreContext'
import { useNavigate } from 'react-router-dom'
import { checkout } from '../../api/orders.js'

const PlaceOrder = () => {
  const { cartData, clearLocalCart, fetchNotifications, user, showToast } = useContext(StoreContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: user?.phone || '',
    street: '',
    city: 'Ahmedabad',
    state: 'Gujarat',
    zip: '',
    country: 'India',
    paymentMethod: 'cod',
    notes: '',
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      email: prev.email || user?.email || '',
      phone: prev.phone || user?.phone || '',
    }));
  }, [user]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const items = useMemo(() => cartData?.items || [], [cartData?.items]);

  // Group items by cook to clearly preview one order per cook, each with its own delivery fee
  const cookGroups = useMemo(() => {
    const map = new Map();
    const cookCount = cartData?.cookCount || new Set(items.map((i) => i.cookId)).size || 1;
    const perCookFee = cookCount > 0 ? Math.round((cartData?.deliveryFee ?? 0) / cookCount) : 0;

    items.forEach((item) => {
      if (!map.has(item.cookId)) {
        map.set(item.cookId, {
          cookId: item.cookId,
          cookName: item.cookName || 'Home Kitchen',
          items: [],
          subtotal: 0,
          deliveryFee: perCookFee,
        });
      }
      const group = map.get(item.cookId);
      group.items.push(item);
      group.subtotal += item.lineTotal;
    });
    return Array.from(map.values());
  }, [items, cartData?.cookCount, cartData?.deliveryFee]);

  if (items.length === 0) {
    return (
      <div className='place-order' style={{ flexDirection: 'column', alignItems: 'center', padding: '60px' }}>
        <p style={{ fontSize: 18, color: '#49557e' }}>Your cart is empty.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{ marginTop: 16, padding: '10px 32px', background: 'tomato', color: '#fff', border: 'none', borderRadius: 50, cursor: 'pointer' }}
        >
          Browse Dibbas
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = {
        contact: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        },
        address: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          zip: form.zip.trim(),
          country: form.country.trim(),
        },
        paymentMethod: form.paymentMethod,
        notes: form.notes.trim() || undefined,
      };

      const res = await checkout(body);
      const createdOrders = res?.orders || [];
      clearLocalCart();
      fetchNotifications();
      showToast(
        createdOrders.length > 1
          ? `Placed ${createdOrders.length} orders (one per cook)!`
          : 'Order placed successfully!',
        'success',
      );
      navigate('/orders');
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cartData?.subtotal ?? 0;
  const deliveryFee = cartData?.deliveryFee ?? 0;
  const total = cartData?.total ?? 0;

  return (
    <form onSubmit={handleSubmit} className='place-order'>
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input type="text" placeholder='First name' value={form.firstName} onChange={set('firstName')} required />
          <input type="text" placeholder='Last name' value={form.lastName} onChange={set('lastName')} required />
        </div>
        <input type="email" placeholder='Email address' value={form.email} onChange={set('email')} required />
        <input type="text" placeholder='Street' value={form.street} onChange={set('street')} minLength={2} required />
        <div className="multi-fields">
          <input type="text" placeholder='City' value={form.city} onChange={set('city')} minLength={2} required />
          <input type="text" placeholder='State' value={form.state} onChange={set('state')} minLength={2} required />
        </div>
        <div className="multi-fields">
          <input type="text" placeholder='Zip code' value={form.zip} onChange={set('zip')} minLength={3} required />
          <input type="text" placeholder='Country' value={form.country} onChange={set('country')} minLength={2} required />
        </div>
        <input type="tel" placeholder='Phone (e.g. 9876543210)' value={form.phone} onChange={set('phone')} required />
        <textarea
          placeholder='Special notes (optional)'
          value={form.notes}
          onChange={set('notes')}
          rows={2}
          style={{ marginTop: 4, width: '100%', padding: 12, borderRadius: 6, border: '1px solid #c5c5c5', fontSize: 14, fontFamily: 'inherit' }}
        />

        <div style={{ marginTop: 14 }}>
          <label style={{ fontWeight: 600, fontSize: 14, color: '#49557e' }}>Payment Method</label>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            {['cod', 'online'].map((pm) => (
              <label key={pm} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={pm}
                  checked={form.paymentMethod === pm}
                  onChange={set('paymentMethod')}
                  style={{ width: 'auto', margin: 0 }}
                />
                {pm === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
              </label>
            ))}
          </div>
        </div>

        {error && (
          <p style={{ color: '#e53e3e', marginTop: 12, fontSize: 13 }}>{error}</p>
        )}
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Order Summary</h2>

          {/* Per-cook breakdown */}
          {cookGroups.map((group) => (
            <div key={group.cookId} style={{ background: '#fafafa', padding: 12, borderRadius: 8, border: '1px solid #eee' }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: '#262626', marginBottom: 6 }}>{group.cookName}</p>
              {group.items.map((item) => (
                <div key={`${item.menuItemId}-${item.size}`} className="cart-total-details" style={{ fontSize: 13, color: '#555' }}>
                  <span>{item.name} ({item.size}) × {item.quantity}</span>
                  <span>₹{item.lineTotal}</span>
                </div>
              ))}
              <div className="cart-total-details" style={{ fontSize: 13, color: '#777', marginTop: 4 }}>
                <span>Cook Delivery Fee</span>
                <span>₹{group.deliveryFee}</span>
              </div>
            </div>
          ))}

          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>₹{subtotal}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee ({cookGroups.length} {cookGroups.length === 1 ? 'order' : 'orders'})</p>
              <p>₹{deliveryFee}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>₹{total}</b>
            </div>
          </div>

          <p style={{ fontSize: 12, color: '#808080' }}>
            * Items from different kitchens are placed as separate orders, each with its own delivery fee.
          </p>

          <button type='submit' disabled={loading} style={{ opacity: loading ? 0.65 : 1 }}>
            {loading ? 'Placing Order…' : 'PROCEED TO PAYMENT'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
