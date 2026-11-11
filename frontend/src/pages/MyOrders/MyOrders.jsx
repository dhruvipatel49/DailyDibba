import React, { useContext, useState, useEffect, useCallback } from 'react'
import './MyOrders.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'
import { getOrders, cancelOrder, reviewOrder, payOrder } from '../../api/orders.js'
import { formatAddress, formatDateTime } from '../../utils/format.js'

const STATUS_COLOR = {
  delivered: 'green',
  cancelled: 'red',
};

const StarRating = ({ rating, setRating }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <span
        key={s}
        style={{ cursor: 'pointer', fontSize: 22, color: s <= rating ? '#f6a623' : '#ccc' }}
        onClick={() => setRating(s)}
      >
        ★
      </span>
    ))}
  </div>
);

const MyOrders = () => {
  const { isLoggedIn, setShowLogin, showToast } = useContext(StoreContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [actionBusy, setActionBusy] = useState({});
  const [reviewForms, setReviewForms] = useState({});

  const fetchOrders = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const data = await getOrders();
      const list = Array.isArray(data) ? data : (data?.orders || []);
      setOrders(list);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Poll every 15 seconds while page is open
  useEffect(() => {
    if (!isLoggedIn) return;
    const id = setInterval(fetchOrders, 15_000);
    return () => clearInterval(id);
  }, [isLoggedIn, fetchOrders]);

  if (!isLoggedIn) {
    return (
      <div className='my-orders' style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ fontSize: 18, color: '#49557e', marginBottom: 16 }}>Please log in to view your orders.</p>
        <button
          onClick={() => setShowLogin(true)}
          style={{ padding: '10px 32px', background: 'tomato', color: '#fff', border: 'none', borderRadius: 50, cursor: 'pointer', fontSize: 16 }}
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleCancel = async (orderId) => {
    setActionBusy((prev) => ({ ...prev, [orderId]: true }));
    try {
      await cancelOrder(orderId);
      showToast('Order cancelled.', 'warning');
      await fetchOrders();
    } catch (err) {
      showToast(err.message || 'Could not cancel order.', 'error');
    } finally {
      setActionBusy((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handlePay = async (orderId) => {
    setActionBusy((prev) => ({ ...prev, [orderId]: true }));
    try {
      await payOrder(orderId);
      showToast('Payment completed!', 'success');
      await fetchOrders();
    } catch (err) {
      showToast(err.message || 'Payment failed.', 'error');
    } finally {
      setActionBusy((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const initReview = (orderId) => {
    setReviewForms((prev) => ({
      ...prev,
      [orderId]: { rating: 0, comment: '', submitted: false, loading: false, error: '' },
    }));
  };

  const submitReview = async (orderId) => {
    const form = reviewForms[orderId];
    if (!form || form.rating === 0) return;
    setReviewForms((prev) => ({ ...prev, [orderId]: { ...prev[orderId], loading: true, error: '' } }));
    try {
      await reviewOrder(orderId, { rating: form.rating, comment: form.comment.trim() || undefined });
      setReviewForms((prev) => ({ ...prev, [orderId]: { ...prev[orderId], submitted: true, loading: false } }));
      showToast('Thanks for rating the cook!', 'success');
    } catch (err) {
      setReviewForms((prev) => ({ ...prev, [orderId]: { ...prev[orderId], error: err.message, loading: false } }));
    }
  };

  const trackingOrder = trackingOrderId ? orders.find((o) => o.id === trackingOrderId) : null;

  return (
    <div className='my-orders'>
      <h2>My Orders</h2>

      {/* Conditional Tracking Map Section */}
      {trackingOrder && (
        <div className="tracking-map-section">
          <div className="tracking-header">
            <div>
              <h3>Live Tracking — #{trackingOrder.orderCode}</h3>
              <p className="tracking-tag">
                {trackingOrder.cookName} • {trackingOrder.statusLabel || trackingOrder.status} (Step {trackingOrder.step}/4)
              </p>
              {trackingOrder.address && (
                <p style={{ fontSize: 13, color: '#666', marginTop: 6 }}>
                  📍 {formatAddress(trackingOrder.address)}
                </p>
              )}
            </div>
            <button className="close-track-btn" onClick={() => setTrackingOrderId(null)}>
              Close Map ✖
            </button>
          </div>
          <div className="map-placeholder">
            <div className="map-route-line"></div>
            <div className="map-pin cook-pin">👨‍🍳 <span>Kitchen</span></div>
            <div className="map-pin delivery-pin">🛵 <span>{trackingOrder.statusLabel || 'On the way'}</span></div>
            <div className="map-pin home-pin">🏠 <span>Destination</span></div>
          </div>
        </div>
      )}

      {error && (
        <p style={{ color: '#e53e3e', marginBottom: 16, fontSize: 14 }}>{error}</p>
      )}

      <div className="container">
        {loading ? (
          <p style={{ color: '#808080', padding: '20px 0' }}>Loading your orders…</p>
        ) : orders.length === 0 ? (
          <p style={{ color: '#808080', padding: '20px 0' }}>You have no orders yet.</p>
        ) : (
          orders.map((order) => {
            const statusColor = STATUS_COLOR[order.status] || 'orange';
            const canTrack = order.status !== 'delivered' && order.status !== 'cancelled';
            const canCancel = order.status === 'pending';
            const canReview = order.status === 'delivered' && order.type !== 'pickup';
            const canPayOnline = order.paymentMethod === 'online' && order.paymentStatus === 'pending' && order.status !== 'cancelled';
            const rf = reviewForms[order.id];
            const addressStr = formatAddress(order.address);

            return (
              <div key={order.id} className="my-orders-order">
                <img src={assets.parcel_icon} alt="Parcel" />

                <div className="order-info">
                  <p className="cook-name">
                    {order.cookName}{' '}
                    {order.orderCode && <span style={{ fontSize: 12, color: '#888', fontWeight: 400 }}>#{order.orderCode}</span>}
                  </p>
                  <p className="order-items">
                    {(order.items || []).map((item, idx) => {
                      const label = `${item.name}${item.size && item.size !== 'regular' ? ` (${item.size})` : ''} × ${item.quantity} (₹${item.price})`;
                      return idx < order.items.length - 1 ? `${label}, ` : label;
                    })}
                  </p>
                  <p className="order-date">{formatDateTime(order.placedAt)}</p>
                  {addressStr && (
                    <p style={{ fontSize: 12, color: '#666' }}>📍 {addressStr}</p>
                  )}
                </div>

                <p className="order-amount">₹{order.totalAmount}</p>
                <p className="order-items-count">Items: {(order.items || []).length}</p>

                <p className="order-status">
                  <span className={`dot ${statusColor}`}>&#x25cf;</span>
                  <b>{order.statusLabel || order.status}</b>
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
                  {canTrack && (
                    <button type="button" onClick={() => setTrackingOrderId(order.id)}>
                      Track Order
                    </button>
                  )}

                  {canPayOnline && (
                    <button
                      type="button"
                      disabled={actionBusy[order.id]}
                      onClick={() => handlePay(order.id)}
                      style={{ background: '#38a169', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}
                    >
                      {actionBusy[order.id] ? 'Processing…' : 'Pay Now'}
                    </button>
                  )}

                  {canCancel && (
                    <button
                      type="button"
                      disabled={actionBusy[order.id]}
                      onClick={() => handleCancel(order.id)}
                      style={{ background: 'transparent', color: '#e53e3e', border: '1px solid #e53e3e', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}
                    >
                      {actionBusy[order.id] ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}

                  {canReview && !rf?.submitted && (
                    rf ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <StarRating
                          rating={rf.rating}
                          setRating={(r) => setReviewForms((prev) => ({ ...prev, [order.id]: { ...prev[order.id], rating: r } }))}
                        />
                        <textarea
                          placeholder="Leave a comment (optional)"
                          value={rf.comment}
                          rows={2}
                          onChange={(e) => setReviewForms((prev) => ({ ...prev, [order.id]: { ...prev[order.id], comment: e.target.value } }))}
                          style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #e0e0e0', fontSize: 12 }}
                        />
                        {rf.error && <p style={{ color: '#e53e3e', fontSize: 12 }}>{rf.error}</p>}
                        <button
                          type="button"
                          onClick={() => submitReview(order.id)}
                          disabled={rf.loading || rf.rating === 0}
                          style={{ padding: '6px 12px', background: 'tomato', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12 }}
                        >
                          {rf.loading ? 'Submitting…' : 'Submit Review'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => initReview(order.id)}
                        style={{ background: 'transparent', color: '#49557e', border: '1px solid #49557e', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}
                      >
                        ⭐ Rate Cook
                      </button>
                    )
                  )}

                  {canReview && rf?.submitted && (
                    <p style={{ color: '#28a745', fontSize: 13, fontWeight: 600 }}>✓ Rated</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyOrders;
