import React, { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import { getCookStats, getCookOrders, getCookProfile, updateCookProfile } from '../../api/cook-portal.js'
import { formatDateTime } from '../../utils/format.js'

const CookPortal = () => {
  const { user, showToast } = useContext(StoreContext);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingOpen, setTogglingOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      getCookStats(),
      getCookOrders('history'),
      getCookProfile(),
    ])
      .then(([s, ordersRes, profRes]) => {
        if (!active) return;
        setStats(s?.stats || s);
        const list = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.orders || []);
        setRecentOrders(list);
        setProfile(profRes?.profile || profRes);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Failed to load kitchen dashboard.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleToggleOpen = async () => {
    if (!profile) return;
    setTogglingOpen(true);
    try {
      const res = await updateCookProfile({ isOpen: !profile.isOpen });
      setProfile(res?.profile || { ...profile, isOpen: !profile.isOpen });
      showToast(profile.isOpen ? 'Kitchen marked closed' : 'Kitchen is now open for orders!', 'success');
    } catch (err) {
      showToast(err.message || 'Could not update kitchen status.', 'error');
    } finally {
      setTogglingOpen(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ color: '#49557e', marginBottom: 4 }}>
            {profile?.kitchenName || `Welcome, ${user?.name}`}
          </h2>
          <p style={{ color: '#808080', fontSize: 14 }}>Your kitchen dashboard</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {profile && (
            <button
              type="button"
              disabled={togglingOpen}
              onClick={handleToggleOpen}
              style={{
                padding: '8px 18px',
                borderRadius: 50,
                border: '1px solid #ddd',
                background: profile.isOpen ? '#e8f5e9' : '#fff5f5',
                color: profile.isOpen ? '#2e7d32' : '#c53030',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {togglingOpen ? 'Updating…' : profile.isOpen ? '● Open for Orders' : '● Closed'}
            </button>
          )}
          <Link
            to="/cook/menu"
            style={{ padding: '8px 18px', borderRadius: 50, background: 'tomato', color: '#fff', fontSize: 13, fontWeight: 600 }}
          >
            Manage Menu
          </Link>
          <Link
            to="/cook/orders"
            style={{ padding: '8px 18px', borderRadius: 50, border: '1px solid #49557e', color: '#49557e', fontSize: 13, fontWeight: 600 }}
          >
            Order Queue
          </Link>
        </div>
      </div>

      {profile && !profile.isApproved && (
        <div style={{ background: '#fff8e1', border: '1px solid #ffe082', color: '#8d6e00', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 14 }}>
          ⏳ Your kitchen is pending admin approval and is currently hidden from customers.
        </div>
      )}

      {error && <p style={{ color: '#e53e3e', marginBottom: 16, fontSize: 14 }}>{error}</p>}

      {loading ? (
        <p style={{ color: '#808080' }}>Loading stats…</p>
      ) : (
        <>
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 40 }}>
              {[
                { label: 'Active Orders', val: stats.activeOrders ?? 0 },
                { label: 'Delivered Today', val: stats.deliveredToday ?? 0 },
                { label: 'Total Delivered', val: stats.deliveredOrders ?? 0 },
                { label: 'Total Earnings', val: `₹${stats.earnings ?? 0}` },
              ].map((card) => (
                <div key={card.label} style={{ background: '#fff8f0', borderRadius: 12, padding: '20px 16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <p style={{ fontSize: 28, fontWeight: 700, color: 'tomato' }}>{card.val}</p>
                  <p style={{ fontSize: 13, color: '#808080', marginTop: 4 }}>{card.label}</p>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ color: '#49557e', marginBottom: 16 }}>Past Orders</h3>
          {recentOrders.length === 0 ? (
            <p style={{ color: '#808080' }}>No past orders yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Order</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Customer</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Items</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Amount</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>#{o.orderCode || o.id?.slice(0, 8)}</td>
                      <td style={{ padding: '10px' }}>{o.contactName || '—'}</td>
                      <td style={{ padding: '10px' }}>
                        {(o.items || []).map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                      </td>
                      <td style={{ padding: '10px' }}>₹{o.totalAmount}</td>
                      <td style={{ padding: '10px', color: '#808080' }}>{formatDateTime(o.placedAt)}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ color: o.status === 'delivered' ? '#28a745' : '#e53e3e', fontWeight: 600 }}>
                          {o.statusLabel || o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CookPortal;
