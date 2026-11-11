import React, { useState, useEffect, useCallback, useContext } from 'react'
import { getAdminCooks, patchAdminCook } from '../../api/admin.js'
import { StoreContext } from '../../context/StoreContext'

const AdminCooks = () => {
  const { showToast } = useContext(StoreContext);
  const [cooks, setCooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState({});
  const [showAll, setShowAll] = useState(false);

  const fetchCooks = useCallback(() => {
    setLoading(true);
    setError('');
    const params = showAll ? {} : { approved: false };
    getAdminCooks(params)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.cooks || []);
        setCooks(list);
      })
      .catch((err) => {
        setError(err.message || 'Could not load cooks.');
        setCooks([]);
      })
      .finally(() => setLoading(false));
  }, [showAll]);

  useEffect(() => { fetchCooks(); }, [fetchCooks]);

  const handleApproval = async (cookId, approved) => {
    setUpdating((prev) => ({ ...prev, [cookId]: true }));
    try {
      await patchAdminCook(cookId, { approved });
      showToast(approved ? 'Cook approved!' : 'Cook approval revoked.', 'success');
      fetchCooks();
    } catch (err) {
      showToast(err.message || 'Could not update approval.', 'error');
    } finally {
      setUpdating((prev) => ({ ...prev, [cookId]: false }));
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#49557e' }}>Cook Approvals</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          Show all cooks
        </label>
      </div>

      {error && <p style={{ color: '#e53e3e', marginBottom: 16, fontSize: 14 }}>{error}</p>}

      {loading ? (
        <p style={{ color: '#808080' }}>Loading…</p>
      ) : cooks.length === 0 ? (
        <p style={{ color: '#808080' }}>
          {showAll ? 'No cooks found.' : 'No cooks pending approval.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {cooks.map((cook) => {
            const cuisinesText = Array.isArray(cook.cuisines) && cook.cuisines.length > 0
              ? cook.cuisines.join(', ')
              : 'No cuisines listed';
            const locationText = [cook.area, cook.city].filter(Boolean).join(', ');
            return (
              <div key={cook.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, color: '#49557e', marginBottom: 2 }}>
                    {cook.kitchenName} {cook.ownerName ? `(${cook.ownerName})` : ''}
                  </p>
                  <p style={{ fontSize: 13, color: '#808080' }}>
                    {cuisinesText} {locationText ? `• ${locationText}` : ''} {cook.isVeg ? '• Pure Veg' : ''}
                  </p>
                  <p style={{ fontSize: 12, color: '#aaa' }}>
                    {cook.email} {cook.phone ? `• ${cook.phone}` : ''}
                  </p>
                  <span style={{ fontSize: 11, background: cook.isApproved ? '#e8f5e9' : '#fff3e0', color: cook.isApproved ? '#388e3c' : '#e65100', borderRadius: 10, padding: '2px 10px', marginTop: 6, display: 'inline-block', fontWeight: 600 }}>
                    {cook.isApproved ? 'Approved' : 'Pending Approval'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {!cook.isApproved ? (
                    <button
                      type="button"
                      onClick={() => handleApproval(cook.id, true)}
                      disabled={updating[cook.id]}
                      style={{ padding: '8px 18px', background: '#38a169', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                    >
                      {updating[cook.id] ? '…' : 'Approve'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApproval(cook.id, false)}
                      disabled={updating[cook.id]}
                      style={{ padding: '8px 18px', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                    >
                      {updating[cook.id] ? '…' : 'Revoke'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCooks;
