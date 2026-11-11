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
      showToast(`Order status updated to ${STATUS_LABEL[status] || status}`, 'success');
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
      showToast('Delivery partner offered the order!', 'success');
      fetchOrders();
    } catch (err) {
      showToast(err.message || 'Could not assign delivery partner.', 'error');
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ color: '#49557e' }}>All Orders</h2>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ccc', fontSize: 14, cursor: 'pointer' }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      {error && <p style={{ color: '#e53e3e', marginBottom: 16, fontSize: 14 }}>{error}</p>}

      {loading ? (
        <p style={{ color: '#808080' }}>Loading orders…</p>
      ) : orders.length === 0 ? (
        <p style={{ color: '#808080' }}>No orders found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                {['Order', 'Type', 'Cook', 'Customer', 'Partner', 'Amount', 'Date', 'Status', 'Override', 'Assign'].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#49557e' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const isTerminal = o.status === 'delivered' || o.status === 'cancelled';
                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>#{o.orderCode || o.id?.slice(0, 8)}</td>
                    <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{o.type}</td>
                    <td style={{ padding: '10px 12px' }}>{o.cookName || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>{o.contactName || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>{o.deliveryPartnerName || 'Unassigned'}</td>
                    <td style={{ padding: '10px 12px' }}>₹{o.totalAmount}</td>
                    <td style={{ padding: '10px 12px', color: '#808080' }}>{formatDateTime(o.placedAt)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'tomato', background: '#fff4f2', padding: '3px 10px', borderRadius: 20 }}>
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <select
                        value=""
                        onChange={(e) => { if (e.target.value) handleStatus(o.id, e.target.value); }}
                        disabled={updating[o.id]}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', fontSize: 12, cursor: 'pointer' }}
                      >
                        <option value="">Change…</option>
                        {STATUSES.filter((s) => s !== o.status).map((s) => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {!isTerminal && (
                        <button
                          type="button"
                          onClick={() => setAssignTarget(o)}
                          style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid #49557e', background: '#f0f4ff', color: '#49557e', cursor: 'pointer', fontSize: 12 }}
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
