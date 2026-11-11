// AdminDashboard.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react'
import { Link } from 'react-router-dom'
import { getAdminStats, getAdminOrders, patchAdminOrderStatus, getDeliveryPartners, assignOrder } from '../../api/admin.js'
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
        getAdminOrders({ limit: 20 }), // Fetching top 20 recent
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
      showToast(`Order status updated to ${STATUS_LABEL[status] || status}`, status === 'cancelled' ? 'warning' : 'success');
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
      showToast('Delivery partner assigned successfully.', 'success');
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Could not assign delivery partner.', 'error');
    }
  };

  const statCards = stats ? [
    { label: 'Total Orders', value: stats.orders?.total ?? 0, bg: '#F9FAFB' },
    { label: 'Active Orders', value: stats.orders?.active ?? 0, bg: '#FFF7ED', highlight: true },
    { label: 'Orders Today', value: stats.orders?.ordersToday ?? 0, bg: '#F9FAFB' },
    { label: 'Revenue (Delivered)', value: `₹${stats.orders?.revenue ?? 0}`, bg: '#ECFDF5' },
    { label: 'Approved Cooks', value: stats.cooks?.approved ?? 0, bg: '#F9FAFB' },
    { label: 'Pending Approvals', value: stats.cooks?.pendingApproval ?? 0, bg: stats.cooks?.pendingApproval > 0 ? '#FEF2F2' : '#F9FAFB' },
    { label: 'Customers', value: stats.usersByRole?.customer ?? 0, bg: '#F9FAFB' },
    { label: 'Delivery Partners', value: stats.usersByRole?.delivery ?? 0, bg: '#F9FAFB' },
  ] : [];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header & Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <h2 style={{ color: '#111827', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Admin Dashboard</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/admin/cooks" style={{
            padding: '10px 20px', borderRadius: 8, background: '#FFFFFF', color: '#111827',
            border: '1px solid #E5E7EB', fontSize: 14, fontWeight: 600, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            Cook Approvals
            {stats?.cooks?.pendingApproval > 0 && (
              <span style={{ background: '#DC2626', color: '#FFF', padding: '2px 8px', borderRadius: 20, fontSize: 12 }}>
                {stats.cooks.pendingApproval}
              </span>
            )}
          </Link>
          <Link to="/admin/orders" style={{
            padding: '10px 20px', borderRadius: 8, background: 'tomato', color: '#FFF',
            border: 'none', fontSize: 14, fontWeight: 600, textDecoration: 'none'
          }}>
            View All Orders
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '12px 16px', borderRadius: 8, marginBottom: 24, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* KPI Grid */}
      {statCards.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 48 }}>
          {statCards.map((c) => (
            <div key={c.label} style={{
              background: c.bg, border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column'
            }}>
              <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                {c.label}
              </span>
              <span style={{ fontSize: 32, fontWeight: 700, color: c.highlight ? 'tomato' : '#111827' }}>
                {c.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Recent Orders Summary */}
      <h3 style={{ color: '#111827', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Recent Orders</h3>

      {loading ? (
        <div style={{ color: '#6B7280', textAlign: 'center', padding: '40px 0' }}>Loading dashboard data…</div>
      ) : orders.length === 0 ? (
        <div style={{ color: '#6B7280', textAlign: 'center', padding: '40px 0', background: '#F9FAFB', borderRadius: 12, border: '1px dashed #E5E7EB' }}>
          No recent orders found.
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {['Order', 'Entity', 'Partner', 'Amount', 'Status', 'Date', 'Action'].map((h) => (
                    <th key={h} style={{ padding: '14px 16px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const isTerminal = o.status === 'delivered' || o.status === 'cancelled';
                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid #F3F4F6', ':hover': { backgroundColor: '#F9FAFB' } }}>

                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>#{o.orderCode || o.id?.slice(0, 8)}</div>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', background: o.type === 'pickup' ? '#FFFBEB' : '#F3F4F6', color: o.type === 'pickup' ? '#B45309' : '#4B5563', padding: '2px 6px', borderRadius: 4 }}>
                          {o.type}
                        </span>
                      </td>

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

                      <td style={{ padding: '16px' }}>
                        <select
                          value={o.status}
                          onChange={(e) => handleStatus(o.id, e.target.value)}
                          disabled={updating[o.id]}
                          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, cursor: 'pointer', backgroundColor: '#FFFFFF', color: '#111827', fontWeight: 500 }}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>)}
                        </select>
                      </td>

                      <td style={{ padding: '16px', fontSize: 13, color: '#6B7280' }}>
                        {formatDateTime(o.placedAt).replace(', ', '\n')}
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

export default AdminDashboard;