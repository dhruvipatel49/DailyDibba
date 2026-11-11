// DeliveryBoard.jsx
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

// Clean SVG Icons replacing emojis
const Icons = {
  MapPin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  User: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  Store: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Package: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
  Inbox: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
};

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
        showToast('Assignment declined.', 'neutral');
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
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h2 style={{ color: '#111827', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{title}</h2>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '12px 16px', borderRadius: 8, marginBottom: 24, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Assignment Offers */}
      {assignments.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#111827', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            <Icons.Inbox /> Assignment Offers
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {assignments.map((a) => (
              <div
                key={a.id}
                style={{
                  background: '#ffffffff',
                  border: '1px solid #d8d8d2ff',
                  borderRadius: 12,
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: '#111827' }}>#{a.orderCode || a.orderId?.slice(0, 8)}</span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: '#FFFBEB',
                      color: '#B45309',
                      border: '1px solid #FDE68A',
                      padding: '4px 10px',
                      borderRadius: 20
                    }}>
                      {a.type === 'pickup' ? 'Home Pickup' : 'Meal Delivery'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#4B5563' }}>
                    {a.cookName && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icons.Store /> From: {a.cookName} {a.cookArea ? `(${a.cookArea})` : ''}</span>
                    )}
                    {a.pickupAddress && (
                      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}><span style={{ marginTop: 2 }}><Icons.MapPin /></span> Pickup: {a.pickupAddress} ({a.pickupDate} - {a.timeSlot})</span>
                    )}
                    {a.dropAddress && (
                      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}><span style={{ marginTop: 2 }}><Icons.Package /></span> Drop: {a.dropAddress}</span>
                    )}
                    {a.address && (
                      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}><span style={{ marginTop: 2 }}><Icons.MapPin /></span> {formatAddress(a.address)}</span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icons.User /> {a.contactName} ({a.contactPhone})</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleAssignment(a.id, 'decline')}
                    disabled={updating[a.id]}
                    style={{ padding: '8px 16px', background: '#FFFFFF', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 8, cursor: updating[a.id] ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: updating[a.id] ? 0.6 : 1 }}
                  >
                    {updating[a.id] ? '...' : 'Decline'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssignment(a.id, 'accept')}
                    disabled={updating[a.id]}
                    style={{ padding: '8px 16px', background: '#111827', color: '#FFFFFF', border: 'none', borderRadius: 8, cursor: updating[a.id] ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: updating[a.id] ? 0.6 : 1 }}
                  >
                    {updating[a.id] ? '...' : 'Accept Assignment'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Orders List */}
      {loading ? (
        <div style={{ color: '#6B7280', textAlign: 'center', padding: '40px 0' }}>Loading deliveries…</div>
      ) : orders.length === 0 ? (
        <div style={{ color: '#6B7280', textAlign: 'center', padding: '40px 0', background: '#F9FAFB', borderRadius: 12, border: '1px dashed #E5E7EB' }}>
          {emptyMessage}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {orders.map((o) => (
            <div
              key={o.id}
              style={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: 16,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 700, color: '#111827' }}>
                    #{o.orderCode || o.id?.slice(0, 8)}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280' }}>
                    <Icons.Clock /> {formatDateTime(o.placedAt)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>₹{o.totalAmount}</div>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    background: o.status === 'out_for_delivery' ? '#EFF6FF' : '#F3F4F6',
                    color: o.status === 'out_for_delivery' ? '#1D4ED8' : '#374151',
                    border: `1px solid ${o.status === 'out_for_delivery' ? '#BFDBFE' : '#E5E7EB'}`,
                    padding: '4px 10px',
                    borderRadius: 20
                  }}>
                    {o.statusLabel || o.status}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, padding: '20px 24px' }}>

                {/* Section A: Pickup Info */}
                <div>
                  <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 600, margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
                    Pickup Details
                  </h4>
                  {kind === 'delivery' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#4B5563' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#111827', fontWeight: 600 }}><Icons.Store /> {o.cookName || '—'}</span>
                    </div>
                  ) : (
                    o.pickup && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: '#4B5563' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icons.User /> {o.pickup.senderName} ({o.pickup.senderPhone})</span>
                        <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4 }}>
                          <span style={{ marginTop: 2 }}><Icons.MapPin /></span>
                          <span>{o.pickup.pickupAddress}{o.pickup.landmark ? `, ${o.pickup.landmark}` : ''} — {o.pickup.pincode}</span>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icons.Clock /> Slot: {o.pickup.pickupDate} ({o.pickup.timeSlot})</span>
                      </div>
                    )
                  )}
                </div>

                {/* Section B: Dropoff Info */}
                <div>
                  <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 600, margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
                    Dropoff Details
                  </h4>
                  {kind === 'pickup' && o.pickup?.recipientName ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: '#4B5563' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icons.User /> {o.pickup.recipientName} ({o.pickup.recipientPhone})</span>
                      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4 }}>
                        <span style={{ marginTop: 2 }}><Icons.MapPin /></span>
                        <span>{o.pickup.dropAddress}</span>
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: '#4B5563' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icons.User /> {o.contactName} ({o.contactPhone})</span>
                      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4 }}>
                        <span style={{ marginTop: 2 }}><Icons.MapPin /></span>
                        <span>{formatAddress(o.address)}</span>
                      </span>
                    </div>
                  )}

                  {o.pickup?.instructions && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: '#F3F4F6', borderLeft: '3px solid #9CA3AF', fontSize: 13, color: '#374151', borderRadius: '0 8px 8px 0' }}>
                      <strong>Note:</strong> {o.pickup.instructions}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              {(o.status === pickupTriggerStatus || o.status === 'out_for_delivery') && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA' }}>
                  {o.status === pickupTriggerStatus && (
                    <button
                      type="button"
                      onClick={() => handleStatus(o.id, 'out_for_delivery')}
                      disabled={updating[o.id]}
                      style={{ padding: '8px 24px', background: 'tomato', color: '#fff', border: 'none', borderRadius: 8, cursor: updating[o.id] ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, opacity: updating[o.id] ? 0.6 : 1 }}
                    >
                      {updating[o.id] ? 'Updating...' : 'Mark Picked Up'}
                    </button>
                  )}
                  {o.status === 'out_for_delivery' && (
                    <button
                      type="button"
                      onClick={() => handleStatus(o.id, 'delivered')}
                      disabled={updating[o.id]}
                      style={{ padding: '8px 24px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, cursor: updating[o.id] ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, opacity: updating[o.id] ? 0.6 : 1 }}
                    >
                      {updating[o.id] ? 'Updating...' : 'Mark Delivered'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryBoard;