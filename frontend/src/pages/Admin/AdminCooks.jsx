// AdminCooks.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react'
import { getAdminCooks, patchAdminCook } from '../../api/admin.js'
import { StoreContext } from '../../context/StoreContext'

// Icons
const Icons = {
  User: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  MapPin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Phone: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>,
  Mail: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
};

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
      showToast(approved ? 'Cook approved!' : 'Cook approval revoked.', approved ? 'success' : 'warning');
      fetchCooks();
    } catch (err) {
      showToast(err.message || 'Could not update approval.', 'error');
    } finally {
      setUpdating((prev) => ({ ...prev, [cookId]: false }));
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h2 style={{ color: '#111827', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Cook Approvals</h2>

        {/* Styled Toggle Switch for Show All */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer', color: '#4B5563', fontWeight: 600 }}>
          <div style={{ position: 'relative', width: 44, height: 24 }}>
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
            />
            <span style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: showAll ? 'tomato' : '#E5E7EB',
              borderRadius: 34, transition: '0.2s',
              display: 'flex', alignItems: 'center', padding: '0 4px'
            }}>
              <span style={{
                height: 16, width: 16, backgroundColor: 'white', borderRadius: '50%',
                transform: showAll ? 'translateX(20px)' : 'translateX(0)', transition: '0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }} />
            </span>
          </div>
          Show all cooks
        </label>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '12px 16px', borderRadius: 8, marginBottom: 24, fontSize: 14 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: '#6B7280', textAlign: 'center', padding: '40px 0' }}>Loading cooks…</div>
      ) : cooks.length === 0 ? (
        <div style={{ color: '#6B7280', textAlign: 'center', padding: '40px 0', background: '#F9FAFB', borderRadius: 12, border: '1px dashed #E5E7EB' }}>
          {showAll ? 'No cooks found on the platform.' : 'No cooks are currently pending approval. All caught up!'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {cooks.map((cook) => {
            const cuisinesText = Array.isArray(cook.cuisines) && cook.cuisines.length > 0
              ? cook.cuisines.join(', ')
              : 'No cuisines listed';
            const locationText = [cook.area, cook.city].filter(Boolean).join(', ');

            return (
              <div key={cook.id} style={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: 16,
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 24,
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <div style={{ flex: 1 }}>

                  {/* Top row: Name & Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: 18 }}>
                      {cook.kitchenName}
                    </h3>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: cook.isApproved ? '#ECFDF5' : '#FFF7ED',
                      color: cook.isApproved ? '#059669' : '#C2410C',
                      border: `1px solid ${cook.isApproved ? '#A7F3D0' : '#FED7AA'}`,
                      borderRadius: 20,
                      padding: '4px 10px'
                    }}>
                      {cook.isApproved ? 'Approved' : 'Pending'}
                    </span>
                    {cook.isVeg && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#047857', background: '#D1FAE5', padding: '4px 10px', borderRadius: 20, border: '1px solid #6EE7B7' }}>
                        Pure Veg
                      </span>
                    )}
                  </div>

                  {/* Middle row: Owner & Cuisines */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: 14, color: '#4B5563', marginBottom: 16 }}>
                    {cook.ownerName && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icons.User /> {cook.ownerName}</span>
                    )}
                    <span style={{ color: '#9CA3AF' }}>|</span>
                    <span style={{ fontWeight: 500 }}>{cuisinesText}</span>
                  </div>

                  {/* Bottom row: Contact & Location */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: 13, color: '#6B7280' }}>
                    {locationText && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icons.MapPin /> {locationText}</span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icons.Mail /> {cook.email}</span>
                    {cook.phone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icons.Phone /> {cook.phone}</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {!cook.isApproved ? (
                    <button
                      type="button"
                      onClick={() => handleApproval(cook.id, true)}
                      disabled={updating[cook.id]}
                      style={{ padding: '10px 24px', background: 'tomato', color: '#fff', border: 'none', borderRadius: 8, cursor: updating[cook.id] ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, opacity: updating[cook.id] ? 0.6 : 1, transition: '0.2s' }}
                    >
                      {updating[cook.id] ? '...' : 'Approve Cook'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApproval(cook.id, false)}
                      disabled={updating[cook.id]}
                      style={{ padding: '10px 24px', background: '#FFFFFF', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, cursor: updating[cook.id] ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, opacity: updating[cook.id] ? 0.6 : 1, transition: '0.2s' }}
                    >
                      {updating[cook.id] ? '...' : 'Revoke Approval'}
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