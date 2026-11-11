import React, { useState, useEffect, useCallback, useContext } from 'react'
import {
  getDeliveries,
  updateDeliveryStatus,
  getAssignments,
  acceptAssignment,
  declineAssignment,
} from '../../api/delivery.js'
import { StoreContext } from '../../context/StoreContext'
import { formatAddress, formatDateTime } from '../../utils/format.js'

const actionBtn = (bg) => ({
  padding: '8px 20px',
  background: bg,
  color: '#fff',
  border: 'none',
  borderRadius: 20,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
});

const DeliveryBoard = ({ kind, title, emptyMessage }) => {
  const { showToast } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const [delivRes, assignRes] = await Promise.all([
        getDeliveries(kind, 'active'),
        getAssignments('offered'),
      ]);
      const dList = Array.isArray(delivRes) ? delivRes : (delivRes?.orders || delivRes?.deliveries || []);
      const aList = Array.isArray(assignRes) ? assignRes : (assignRes?.assignments || []);
      setOrders(dList);
      setAssignments(aList);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load delivery assignments.');
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const id = setInterval(fetchData, 20_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const handleStatus = async (orderId, status) => {
    setUpdating((prev) => ({ ...prev, [orderId]: true }));
    try {
      await updateDeliveryStatus(orderId, status);
      showToast(status === 'out_for_delivery' ? 'Marked as Picked up!' : 'Marked as Delivered!', 'success');
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Could not update status.', 'error');
    } finally {
      setUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleAssignment = async (assignmentId, action) => {
    setUpdating((prev) => ({ ...prev, [assignmentId]: true }));
    try {
      if (action === 'accept') {
        await acceptAssignment(assignmentId);
        showToast('Assignment accepted!', 'success');
      } else {
        await declineAssignment(assignmentId);
        showToast('Assignment declined.', 'success');
      }
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Could not respond to assignment.', 'error');
    } finally {
      setUpdating((prev) => ({ ...prev, [assignmentId]: false }));
    }
  };

  const pickupTriggerStatus = kind === 'pickup' ? 'pending' : 'ready';

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 20px' }}>
      <h2 style={{ color: '#49557e', marginBottom: 24 }}>{title}</h2>

      {error && <p style={{ color: '#e53e3e', marginBottom: 16, fontSize: 14 }}>{error}</p>}

      {/* Assignment offers */}
      {assignments.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ color: '#49557e', marginBottom: 12 }}>📬 Assignment Offers</h3>
          {assignments.map((a) => (
            <div
              key={a.id}
              style={{
                background: '#fff8f0',
                border: '1px solid #ffd580',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div>
                <p style={{ fontWeight: 600 }}>
                  #{a.orderCode || a.orderId?.slice(0, 8)} •{' '}
                  <span style={{ color: 'tomato', fontSize: 12, textTransform: 'uppercase' }}>
                    {a.type === 'pickup' ? 'Home Pickup' : 'Meal Delivery'}
                  </span>
                </p>
                {a.cookName && (
                  <p style={{ fontSize: 13, color: '#444', marginTop: 2 }}>
                    🍱 From: {a.cookName} {a.cookArea ? `(${a.cookArea})` : ''}
                  </p>
                )}
                {a.pickupAddress && (
                  <p style={{ fontSize: 13, color: '#444', marginTop: 2 }}>
                    🏠 Pickup: {a.pickupAddress} ({a.pickupDate} • {a.timeSlot})
                  </p>
                )}
                {a.dropAddress && (
                  <p style={{ fontSize: 13, color: '#444' }}>📦 Drop: {a.dropAddress}</p>
                )}
                {a.address && (
                  <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>📍 {formatAddress(a.address)}</p>
                )}
                <p style={{ fontSize: 12, color: '#808080', marginTop: 2 }}>
                  Contact: {a.contactName} ({a.contactPhone})
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleAssignment(a.id, 'accept')}
                  disabled={updating[a.id]}
                  style={{ padding: '6px 16px', background: '#38a169', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  {updating[a.id] ? '…' : 'Accept'}
                </button>
                <button
                  type="button"
                  onClick={() => handleAssignment(a.id, 'decline')}
                  disabled={updating[a.id]}
                  style={{ padding: '6px 16px', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  {updating[a.id] ? '…' : 'Decline'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#808080' }}>Loading…</p>
      ) : orders.length === 0 ? (
        <p style={{ color: '#808080' }}>{emptyMessage}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {orders.map((o) => (
            <div
              key={o.id}
              style={{
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: 12,
                padding: '16px 20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div>
                <p style={{ fontWeight: 700, color: '#49557e' }}>
                  #{o.orderCode || o.id?.slice(0, 8)} • ₹{o.totalAmount}
                </p>
                <p style={{ fontSize: 13, color: '#808080', marginTop: 2 }}>{formatDateTime(o.placedAt)}</p>
                {kind === 'delivery' && (
                  <p style={{ fontSize: 13, color: '#333', marginTop: 4 }}>🍱 {o.cookName || '—'}</p>
                )}
                {kind === 'pickup' && o.pickup && (
                  <div style={{ fontSize: 13, color: '#333', marginTop: 4 }}>
                    <p>👤 Sender: {o.pickup.senderName} ({o.pickup.senderPhone})</p>
                    <p>🏠 Pickup: {o.pickup.pickupAddress}{o.pickup.landmark ? `, ${o.pickup.landmark}` : ''} — {o.pickup.pincode}</p>
                    <p>🕒 Slot: {o.pickup.pickupDate} ({o.pickup.timeSlot})</p>
                    {o.pickup.recipientName && (
                      <p>📦 Recipient: {o.pickup.recipientName} ({o.pickup.recipientPhone}) — {o.pickup.dropAddress}</p>
                    )}
                    {o.pickup.instructions && <p style={{ color: '#666' }}>Note: {o.pickup.instructions}</p>}
                  </div>
                )}
                <p style={{ fontSize: 13, color: '#333', marginTop: 4 }}>
                  📍 {formatAddress(o.address)}
                </p>
                <p style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                  Customer: {o.contactName} ({o.contactPhone})
                </p>
                <p style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: 'tomato' }}>
                  {o.statusLabel || o.status}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {o.status === pickupTriggerStatus && (
                  <button
                    type="button"
                    onClick={() => handleStatus(o.id, 'out_for_delivery')}
                    disabled={updating[o.id]}
                    style={actionBtn('#49557e')}
                  >
                    {updating[o.id] ? '…' : 'Picked up'}
                  </button>
                )}
                {o.status === 'out_for_delivery' && (
                  <button
                    type="button"
                    onClick={() => handleStatus(o.id, 'delivered')}
                    disabled={updating[o.id]}
                    style={actionBtn('#38a169')}
                  >
                    {updating[o.id] ? '…' : 'Delivered'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryBoard;

