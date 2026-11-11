// AssignPartnerModal.jsx
import React, { useState } from 'react'

const AssignPartnerModal = ({ order, partners, onAssign, onClose }) => {
  const [selectedPartner, setSelectedPartner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!order) return null;

  const handleConfirm = async () => {
    if (!selectedPartner) return;
    setSubmitting(true);
    try {
      await onAssign(order.id, selectedPartner);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '32px', minWidth: 360, maxWidth: 550, width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>

        {/* Header */}
        <h3 style={{ color: '#111827', margin: '0 0 8px 0', fontSize: 20, fontWeight: 700 }}>Assign Delivery Partner</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
            #{order.orderCode || order.id?.slice(0, 8)}
          </span>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em', background: order.type === 'pickup' ? '#FFFBEB' : '#F3F4F6', color: order.type === 'pickup' ? '#B45309' : '#4B5563', padding: '4px 8px', borderRadius: 6 }}>
            {order.type === 'pickup' ? 'Home Pickup' : order.cookName}
          </span>
        </div>

        {/* Content */}
        {partners.length === 0 ? (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', marginBottom: 24 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#991B1B', fontWeight: 500 }}>No active delivery partners found.</p>
          </div>
        ) : (
          <div style={{ position: 'relative', marginBottom: 28 }}>
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 40px 12px 16px',
                borderRadius: 8,
                border: '1px solid #D1D5DB',
                backgroundColor: '#F9FAFB',
                fontSize: 14,
                color: '#111827',
                fontWeight: 500,
                appearance: 'none',
                outline: 'none',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
            >
              <option value="">— Select a partner —</option>
              {partners.map((p) => {
                const statusLabel = p.isAvailable === false ? ' (Off Duty)' : '';
                return (
                  <option key={p.id} value={p.id} disabled={p.isAvailable === false}>
                    {p.name} • {p.activeDeliveries ?? 0} active {statusLabel}
                  </option>
                );
              })}
            </select>
            {/* Custom dropdown arrow */}
            <svg style={{ position: 'absolute', right: 16, top: 14, pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              flex: 1, padding: '12px', background: '#FFFFFF', color: '#374151',
              border: '1px solid #D1D5DB', borderRadius: 8, cursor: 'pointer',
              fontWeight: 600, fontSize: 14, transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#F9FAFB'}
            onMouseOut={(e) => e.target.style.background = '#FFFFFF'}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedPartner || submitting}
            style={{
              flex: 1, padding: '12px', background: '#111827', color: '#fff',
              border: 'none', borderRadius: 8, cursor: !selectedPartner || submitting ? 'not-allowed' : 'pointer',
              fontWeight: 600, fontSize: 14, opacity: !selectedPartner || submitting ? 0.5 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {submitting ? 'Assigning…' : 'Assign Partner'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AssignPartnerModal;