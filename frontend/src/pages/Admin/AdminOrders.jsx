// AdminOrders.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react'
import { getAdminOrders, patchAdminOrderStatus, getDeliveryPartners, assignOrder } from '../../api/admin.js'
import { StoreContext } from '../../context/StoreContext'
import { formatDateTime } from '../../utils/format.js'
import AssignPartnerModal from './AssignPartnerModal.jsx'

const STATUSES = ['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
const STATUS_LABEL = {
  pending: 'Order Placed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const AdminOrders = () => {
  const { showToast } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [assignTarget, setAssignTarget] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const [ordRes, partRes] = await Promise.all([
        getAdminOrders(params),
        getDeliveryPartners(),
      ]);
      setOrders(Array.isArray(ordRes) ? ordRes : (ordRes?.orders || []));
      setPartners(Array.isArray(partRes) ? partRes : (partRes?.partners || []));
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatus = async (orderId, status) => {
    setUpdating((prev) => ({ ...prev, [orderId]: true }));
    try {
      await patchAdminOrderStatus(orderId, status);
      showToast(
        `Order status updated to ${STATUS_LABEL[status] || status}`,
        status === 'cancelled' ? 'warning' : 'success',
      );
      fetchOrders();
    } catch (err) {
      showToast(err.message || 'Could not update order status.', 'error');
    } finally {
      setUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleAssign = async (orderId, partnerId) => {
    try {
      await assignOrder(orderId, partnerId);
      setAssignTarget(null);
      showToast('Delivery partner assigned successfully.', 'success');
      fetchOrders();
    } catch (err) {
      showToast(err.message || 'Could not assign delivery partner.', 'error');
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <h2 style={{ color: '#111827', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>All Global Orders</h2>

        {/* Custom Styled Select Dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 40px 10px 16px',
              borderRadius: 8,
              border: '1px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              appearance: 'none',
              outline: 'none'
            }}
          >
            <option value="">Filter by Status: All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          {/* Custom Dropdown Chevron */}
          <svg style={{ position: 'absolute', right: 14, top: 12, pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '12px 16px', borderRadius: 8, marginBottom: 24, fontSize: 14 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: '#6B7280', textAlign: 'center', padding: '40px 0' }}>Loading system orders…</div>
      ) : orders.length === 0 ? (
        <div style={{ color: '#6B7280', textAlign: 'center', padding: '40px 0', background: '#F9FAFB', borderRadius: 12, border: '1px dashed #E5E7EB' }}>
          No orders found matching this filter.
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {['Order ID', 'Type', 'Entity', 'Partner', 'Amount', 'Date', 'Status', 'Override', 'Assign'].map((h) => (
                    <th key={h} style={{ padding: '14px 16px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const isTerminal = o.status === 'delivered' || o.status === 'cancelled';
                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid #F3F4F6', ':hover': { backgroundColor: '#F9FAFB' } }}>

                      <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
                        #{o.orderCode || o.id?.slice(0, 8)}
                      </td>

                      <td style={{ padding: '16px' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em',
                          background: o.type === 'pickup' ? '#FFFBEB' : '#F3F4F6',
                          color: o.type === 'pickup' ? '#B45309' : '#4B5563',
                          padding: '4px 8px', borderRadius: 6
                        }}>
                          {o.type}
                        </span>
                      </td>

                      {/* Combined Cook & Customer column to save space */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 2 }}>{o.cookName || '—'}</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>To: {o.contactName || '—'}</div>
                      </td>

                      <td style={{ padding: '16px', fontSize: 14, color: o.deliveryPartnerName ? '#374151' : '#9CA3AF' }}>
                        {o.deliveryPartnerName || 'Unassigned'}
                      </td>

                      <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
                        ₹{o.totalAmount}
                      </td>

                      <td style={{ padding: '16px', fontSize: 13, color: '#6B7280' }}>
                        {formatDateTime(o.placedAt).replace(', ', '\n')}
                      </td>

                      <td style={{ padding: '16px' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          background: isTerminal ? '#F3F4F6' : '#FEF2F2',
                          color: isTerminal ? '#6B7280' : '#DC2626',
                          padding: '4px 10px', borderRadius: 20
                        }}>
                          {STATUS_LABEL[o.status] || o.status}
                        </span>
                      </td>

                      <td style={{ padding: '16px' }}>
                        <select
                          value=""
                          onChange={(e) => { if (e.target.value) handleStatus(o.id, e.target.value); }}
                          disabled={updating[o.id]}
                          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, cursor: 'pointer', backgroundColor: '#F9FAFB' }}
                        >
                          <option value="">Override...</option>
                          {STATUSES.filter((s) => s !== o.status).map((s) => (
                            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                          ))}
                        </select>
                      </td>

                      <td style={{ padding: '16px' }}>
                        {!isTerminal && (
                          <button
                            type="button"
                            onClick={() => setAssignTarget(o)}
                            style={{
                              padding: '6px 12px', borderRadius: 6,
                              border: o.deliveryPartnerName ? '1px solid #D1D5DB' : 'none',
                              background: o.deliveryPartnerName ? '#FFFFFF' : '#111827',
                              color: o.deliveryPartnerName ? '#374151' : '#FFFFFF',
                              cursor: 'pointer', fontSize: 13, fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {o.deliveryPartnerName ? 'Reassign' : 'Assign'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AssignPartnerModal
        order={assignTarget}
        partners={partners}
        onAssign={handleAssign}
        onClose={() => setAssignTarget(null)}
      />
    </div>
  );
};

export default AdminOrders;