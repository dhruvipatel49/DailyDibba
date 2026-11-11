import React, { useState, useEffect, useCallback, useContext } from 'react'
import { Link } from 'react-router-dom'
import { getAdminStats, getAdminOrders, patchAdminOrderStatus, getDeliveryPartners, assignOrder } from '../../api/admin.js'
import { StoreContext } from '../../context/StoreContext'
import { formatDateTime } from '../../utils/format.js'
import AssignPartnerModal from './AssignPartnerModal.jsx'

const STATUSES = ['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

const AdminDashboard = () => {
  const { showToast } = useContext(StoreContext);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState({});
  const [assignTarget, setAssignTarget] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [s, o, p] = await Promise.all([
        getAdminStats(),
        getAdminOrders({ limit: 20 }),
        getDeliveryPartners(),
      ]);
      setStats(s);
      setOrders(Array.isArray(o) ? o : (o?.orders || []));
      setPartners(Array.isArray(p) ? p : (p?.partners || []));
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load admin dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleStatus = async (orderId, status) => {
    setUpdating((prev) => ({ ...prev, [orderId]: true }));
    try {
      await patchAdminOrderStatus(orderId, status);
      showToast(`Order status updated to ${status}`, 'success');
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Could not update status.', 'error');
    } finally {
      setUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleAssign = async (orderId, partnerId) => {
    try {
      await assignOrder(orderId, partnerId);
      setAssignTarget(null);
      showToast('Delivery partner offered the order!', 'success');
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Could not assign delivery partner.', 'error');
    }
  };

  const statCards = stats ? [
    { label: 'Total Orders', value: stats.orders?.total ?? 0 },
    { label: 'Active Orders', value: stats.orders?.active ?? 0 },
    { label: 'Orders Today', value: stats.orders?.ordersToday ?? 0 },
    { label: 'Revenue (Delivered)', value: `₹${stats.orders?.revenue ?? 0}` },
    { label: 'Approved Cooks', value: stats.cooks?.approved ?? 0 },
    { label: 'Pending Cook Approvals', value: stats.cooks?.pendingApproval ?? 0 },
    { label: 'Customers', value: stats.usersByRole?.customer ?? 0 },
    { label: 'Delivery Partners', value: stats.usersByRole?.delivery ?? 0 },
  ] : [];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <h2 style={{ color: '#49557e' }}>Admin Dashboard</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/admin/cooks" style={{ padding: '8px 18px', borderRadius: 50, background: '#fff4f2', color: 'tomato', border: '1px solid tomato', fontSize: 13, fontWeight: 600 }}>
            Cook Approvals {stats?.cooks?.pendingApproval ? `(${stats.cooks.pendingApproval})` : ''}
          </Link>
          <Link to="/admin/orders" style={{ padding: '8px 18px', borderRadius: 50, background: 'tomato', color: '#fff', fontSize: 13, fontWeight: 600 }}>
            All Orders
          </Link>
        </div>
      </div>

      {error && <p style={{ color: '#e53e3e', marginBottom: 16, fontSize: 14 }}>{error}</p>}

      {statCards.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 36 }}>
          {statCards.map((c) => (
            <div key={c.label} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: 26, fontWeight: 700, color: 'tomato' }}>{c.value}</p>
              <p style={{ fontSize: 12, color: '#808080', marginTop: 4 }}>{c.label}</p>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ color: '#49557e', marginBottom: 16 }}>Recent Orders</h3>
      {loading ? (
        <p style={{ color: '#808080' }}>Loading…</p>
      ) : orders.length === 0 ? (
        <p style={{ color: '#808080' }}>No orders yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                {['Order', 'Type', 'Cook / Kitchen', 'Customer', 'Partner', 'Amount', 'Status', 'Date', 'Actions'].map((h) => (
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
                    <td style={{ padding: '10px 12px' }}>
                      <select
                        value={o.status}
                        onChange={(e) => handleStatus(o.id, e.target.value)}
                        disabled={updating[o.id]}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', fontSize: 12, cursor: 'pointer' }}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#808080' }}>{formatDateTime(o.placedAt)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {!isTerminal && (
                        <button
                          type="button"
                          onClick={() => setAssignTarget(o)}
                          style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid #49557e', background: '#f0f4ff', color: '#49557e', cursor: 'pointer', fontSize: 12 }}
                        >
                          {o.deliveryPartnerName ? 'Reassign' : 'Assign Partner'}
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

export default AdminDashboard;
