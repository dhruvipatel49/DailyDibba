import React, { useState, useContext } from 'react'
import './PickUp.css'
import { useNavigate } from 'react-router-dom'
import { pickup as apiPickup } from '../../api/orders.js'
import { StoreContext } from '../../context/StoreContext'

const PickUp = () => {
  const navigate = useNavigate();
  const { showToast, fetchNotifications } = useContext(StoreContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sender
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Pickup location
  const [flat, setFlat] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');

  // Schedule
  const [todayStr] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // Optional recipient
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');

  const hasAnyRecipient = Boolean(recipientName.trim() || recipientPhone.trim() || recipientAddress.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (hasAnyRecipient && (!recipientName.trim() || !recipientPhone.trim() || recipientAddress.trim().length < 5)) {
      setError('If providing recipient details, please fill recipient name, valid phone, and full address (min 5 characters).');
      return;
    }

    setLoading(true);
    try {
      const body = {
        sender: { firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() },
        pickup: {
          flat: flat.trim(),
          street: street.trim(),
          landmark: landmark.trim() || undefined,
          pincode: pincode.trim(),
        },
        date,
        timeSlot,
        instructions: instructions.trim() || undefined,
        paymentMethod,
      };

      if (hasAnyRecipient) {
        body.recipient = {
          name: recipientName.trim(),
          phone: recipientPhone.trim(),
          address: recipientAddress.trim(),
        };
      }

      await apiPickup(body);
      fetchNotifications();
      showToast('Home pick-up scheduled successfully!', 'success');
      navigate('/orders');
    } catch (err) {
      setError(err.message || 'Pickup request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='pickup-page'>
      <div className="pickup-header">
        <h2>Schedule a Home Pick Up</h2>
        <p>Like the traditional Dabbawalas, but digital. Enter your details below to schedule a time for our delivery partner to pick up a tiffin directly from your home.</p>
      </div>

      <div className="pickup-container">
        <form onSubmit={handleSubmit} className="pickup-form">

          <div className="form-section">
            <h3>Sender Details</h3>
            <div className="multi-fields">
              <input type="text" placeholder='First name' value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              <input type="text" placeholder='Last name' value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <input type="tel" placeholder='Phone Number' value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          <div className="form-section">
            <h3>Pick Up Location</h3>
            <input type="text" placeholder='Flat / House No. / Building Name' value={flat} onChange={(e) => setFlat(e.target.value)} required />
            <input type="text" placeholder='Street Address / Area' value={street} onChange={(e) => setStreet(e.target.value)} minLength={2} required />
            <div className="multi-fields">
              <input type="text" placeholder='Landmark' value={landmark} onChange={(e) => setLandmark(e.target.value)} />
              <input type="text" placeholder='Pincode (6 digits)' pattern="[0-9]{6}" value={pincode} onChange={(e) => setPincode(e.target.value)} required />
            </div>
          </div>

          <div className="form-section">
            <h3>Time &amp; Preferences</h3>
            <div className="multi-fields time-date-fields">
              <input
                type="date"
                value={date}
                min={todayStr}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} required>
                <option value="" disabled>Select Pick Up Time</option>
                <option value="morning">Morning (9:00 AM - 11:30 AM)</option>
                <option value="afternoon">Afternoon (12:00 PM - 2:30 PM)</option>
                <option value="evening">Evening (6:00 PM - 8:30 PM)</option>
              </select>
            </div>
            <textarea
              placeholder="Any special instructions for the delivery partner? (Optional)"
              rows="3"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          {/* Optional Recipient */}
          <div className="form-section">
            <h3>Recipient (Optional)</h3>
            <input type="text" placeholder='Recipient name' value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required={hasAnyRecipient} />
            <input type="tel" placeholder='Recipient phone' value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} required={hasAnyRecipient} />
            <input type="text" placeholder='Recipient address' value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} required={hasAnyRecipient} />
          </div>

          {/* Payment method */}
          <div className="form-section">
            <h3>Payment Method (Service Fee: ₹50)</h3>
            <div style={{ display: 'flex', gap: 16 }}>
              {['cod', 'online'].map((pm) => (
                <label key={pm} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={pm}
                    checked={paymentMethod === pm}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  {pm === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                </label>
              ))}
            </div>
          </div>

          {error && <p style={{ color: '#e53e3e', fontSize: 13 }}>{error}</p>}

          <button type="submit" className="pickup-btn" disabled={loading} style={{ opacity: loading ? 0.65 : 1 }}>
            {loading ? 'Submitting…' : 'Confirm & Proceed to Pay'}
          </button>
        </form>

        <div className="pickup-info-card">
          <h3>How Digital Pick Up Works</h3>
          <ul className="pickup-steps">
            <li>
              <b>1. Schedule</b>
              <p>Choose a convenient time slot and confirm your home address.</p>
            </li>
            <li>
              <b>2. Handover</b>
              <p>Our verified DailyDibba partner arrives to safely collect your packed tiffin.</p>
            </li>
            <li>
              <b>3. Delivery</b>
              <p>We deliver it fresh and on time to the specified recipient's location.</p>
            </li>
          </ul>
          <div className="pickup-note">
            <p>*Note: Please ensure the dibba is securely packed and ready 10 minutes prior to the start of your selected time slot.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickUp;
