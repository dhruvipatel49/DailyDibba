import React, { useState, useEffect, useCallback, useContext } from 'react'
import { getCookOrders, updateCookOrderStatus } from '../../api/cook-portal.js'
import { StoreContext } from '../../context/StoreContext'
import { formatAddress, formatDateTime } from '../../utils/format.js'

const STATUS_ACTIONS = {
  pending: [
    { next: 'preparing', label: 'Mark Preparing' },
    { next: 'cancelled', label: 'Reject' },
  ],
  preparing: [
    { next: 'ready', label: 'Mark Ready' },
    { next: 'pending', label: 'Back to Pending' },
  ],
  ready: [
    { next: 'preparing', label: 'Back to Preparing' },
  ],
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
      showToast(`Order updated to ${status}`, 'success');
      fetchOrders();
    } catch (err) {
      showToast(err.message || 'Could not update order status.', 'error');
    } finally {
      setUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 20px' }}>
      <h2 style={{ color: '#49557e', marginBottom: 24 }}>Active Order Queue</h2>

      {error && <p style={{ color: '#e53e3e', marginBottom: 16, fontSize: 14 }}>{error}</p>}

      {loading ? (
        <p style={{ color: '#808080' }}>Loading orders…</p>
      ) : orders.length === 0 ? (
        <p style={{ color: '#808080' }}>No active orders right now.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map((order) => {
            const actions = STATUS_ACTIONS[order.status] || [];
            return (
              <div key={order.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <p style={{ fontWeight: 700, color: '#49557e', marginBottom: 4 }}>
                      #{order.orderCode || order.id?.slice(0, 8)} • {order.contactName}
                    </p>
                    <p style={{ fontSize: 13, color: '#808080', marginBottom: 6 }}>
                      {formatDateTime(order.placedAt)} • 📞 {order.contactPhone}
                    </p>
                    <p style={{ fontSize: 14, color: '#333' }}>
                      {(order.items || []).map((i) => `${i.name} (${i.size}) × ${i.quantity}`).join(', ')}
                    </p>
                    {order.address && (
                      <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>📍 {formatAddress(order.address)}</p>
                    )}
                    {order.notes && (
                      <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Note: {order.notes}</p>
                    )}
                    <p style={{ marginTop: 6, fontWeight: 600, color: '#49557e' }}>Subtotal: ₹{order.subtotal} (Total: ₹{order.totalAmount})</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'tomato', background: '#fff4f2', padding: '4px 12px', borderRadius: 20 }}>
                      {order.statusLabel || order.status}
                    </span>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {actions.map(({ next, label }) => (
                        <button
                          key={next}
                          type="button"
                          onClick={() => handleStatus(order.id, next)}
                          disabled={updating[order.id]}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 20,
                            border: `1px solid ${next === 'cancelled' ? '#e53e3e' : 'tomato'}`,
                            background: next === 'cancelled' ? '#fff5f5' : '#fff4f2',
                            color: next === 'cancelled' ? '#e53e3e' : 'tomato',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {updating[order.id] ? '…' : label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CookOrders;
