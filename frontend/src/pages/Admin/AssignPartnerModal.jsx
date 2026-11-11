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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', minWidth: 340, maxWidth: 420 }}>
        <h3 style={{ color: '#49557e', marginBottom: 6 }}>Assign Delivery Partner</h3>
        <p style={{ fontSize: 13, color: '#808080', marginBottom: 16 }}>
          Order #{order.orderCode || order.id?.slice(0, 8)} • {order.type === 'pickup' ? 'Home Pickup' : order.cookName}
        </p>

        {partners.length === 0 ? (
          <p style={{ fontSize: 13, color: '#e53e3e', marginBottom: 16 }}>No active delivery partners found.</p>
        ) : (
          <select
            value={selectedPartner}
            onChange={(e) => setSelectedPartner(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ccc', marginBottom: 16, fontSize: 14 }}
          >
            <option value="">— Select partner —</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.vehicleType || 'any'} • {p.activeDeliveries ?? 0} active{p.isAvailable === false ? ', off duty' : ''})
              </option>
            ))}
          </select>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedPartner || submitting}
            style={{ flex: 1, padding: '10px', background: 'tomato', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, opacity: !selectedPartner || submitting ? 0.6 : 1 }}
          >
            {submitting ? 'Assigning…' : 'Assign'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{ flex: 1, padding: '10px', background: '#eee', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignPartnerModal;

