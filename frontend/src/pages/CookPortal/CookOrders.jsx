import React, { useState, useEffect, useCallback, useContext } from 'react'
import { getCookOrders, updateCookOrderStatus } from '../../api/cook-portal.js'
import { StoreContext } from '../../context/StoreContext'
import { formatAddress, formatDateTime } from '../../utils/format.js'

// Clean, lightweight inline SVG icons to replace the emojis
const Icons = {
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  Phone: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>,
  MapPin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
};

const STATUS_ACTIONS = {
  pending: [
    { next: 'cancelled', label: 'Reject', type: 'danger' },
    { next: 'preparing', label: 'Mark Preparing', type: 'primary' },
  ],
  preparing: [
    { next: 'pending', label: 'Back to Pending', type: 'secondary' },
    { next: 'ready', label: 'Mark Ready', type: 'primary' },
  ],
  ready: [
    { next: 'preparing', label: 'Back to Preparing', type: 'secondary' },
  ],
};

const STATUS_COLORS = {
  pending: { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  preparing: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  ready: { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  cancelled: { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' }
};

const CookOrders = () => {
  const { showToast } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState({});

  const fetchOrders = useCallback(() => {
    getCookOrders('active')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.orders || []);
        setOrders(list);
        setError('');
      })
      .catch((err) => {
        setError(err.message || 'Could not load order queue.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const id = setInterval(fetchOrders, 20_000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const handleStatus = async (orderId, status) => {
    setUpdating((prev) => ({ ...prev, [orderId]: true }));
    try {
      await updateCookOrderStatus(orderId, status);
      showToast(`Order updated to ${status}`, status === 'cancelled' ? 'warning' : 'success');
      fetchOrders();
    } catch (err) {
      showToast(err.message || 'Could not update order status.', 'error');
    } finally {
      setUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#111827', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Active Order Queue</h2>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '12px 16px', borderRadius: 8, marginBottom: 24, fontSize: 14 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: '#6B7280', textAlign: 'center', padding: '40px 0' }}>Loading your active orders…</div>
      ) : orders.length === 0 ? (
        <div style={{ color: '#6B7280', textAlign: 'center', padding: '40px 0', background: '#F9FAFB', borderRadius: 12, border: '1px dashed #E5E7EB' }}>
          No active orders right now. You're all caught up!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {orders.map((order) => {
            const actions = STATUS_ACTIONS[order.status] || [];
            const badgeStyle = STATUS_COLORS[order.status] || { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' };

            return (
              <div key={order.id} style={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: 16,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                overflow: 'hidden'
              }}>
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 700, color: '#111827' }}>
                      Order #{order.orderCode || order.id?.slice(0, 8)}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280' }}>
                      <Icons.Clock /> {formatDateTime(order.placedAt)}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    background: badgeStyle.bg,
                    color: badgeStyle.color,
                    border: `1px solid ${badgeStyle.border}`,
                    padding: '6px 12px',
                    borderRadius: 20
                  }}>
                    {order.statusLabel || order.status}
                  </span>
                </div>

                {/* Card Body */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, padding: 24 }}>

                  {/* Customer Info Column */}
                  <div>
                    <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 600, margin: '0 0 12px 0', letterSpacing: '0.05em' }}>Customer Details</h4>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#111827', fontSize: 15 }}>{order.contactName}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#4B5563', marginBottom: 8 }}>
                      <Icons.Phone /> {order.contactPhone}
                    </div>
                    {order.address && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: '#4B5563', lineHeight: 1.4 }}>
                        <div style={{ marginTop: 2 }}><Icons.MapPin /></div>
                        <span>{formatAddress(order.address)}</span>
                      </div>
                    )}
                    {order.notes && (
                      <div style={{ marginTop: 12, padding: '10px 14px', background: '#FEFCE8', borderLeft: '3px solid #FACC15', fontSize: 13, color: '#854D0E', borderRadius: '0 8px 8px 0' }}>
                        <strong>Note:</strong> {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Order Items Column */}
                  <div style={{ background: '#F9FAFB', padding: 16, borderRadius: 12 }}>
                    <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 600, margin: '0 0 12px 0', letterSpacing: '0.05em' }}>Order Summary</h4>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      {(order.items || []).map((item, idx) => (
                        <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#374151' }}>
                          <span><span style={{ fontWeight: 600 }}>{item.quantity}x</span> {item.name} <span style={{ color: '#9CA3AF' }}>({item.size})</span></span>
                        </li>
                      ))}
                    </ul>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: 12, fontWeight: 700, color: '#111827' }}>
                      <span>Total</span>
                      <span>₹{order.totalAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                {actions.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA' }}>
                    {actions.map(({ next, label, type }) => {
                      const isDanger = type === 'danger';
                      const isPrimary = type === 'primary';
                      return (
                        <button
                          key={next}
                          type="button"
                          onClick={() => handleStatus(order.id, next)}
                          disabled={updating[order.id]}
                          style={{
                            padding: '8px 18px',
                            borderRadius: 8,
                            border: isPrimary ? 'none' : `1px solid ${isDanger ? '#FECACA' : '#E5E7EB'}`,
                            background: isPrimary ? 'tomato' : isDanger ? '#FEF2F2' : '#FFFFFF',
                            color: isPrimary ? '#FFFFFF' : isDanger ? '#DC2626' : '#374151',
                            cursor: updating[order.id] ? 'not-allowed' : 'pointer',
                            fontSize: 14,
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            opacity: updating[order.id] ? 0.6 : 1,
                          }}
                        >
                          {updating[order.id] ? 'Updating...' : label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CookOrders;