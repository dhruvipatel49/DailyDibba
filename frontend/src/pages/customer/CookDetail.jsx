import React, { useState, useContext } from 'react'
import './CookDetail.css'
import { useParams, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext' // IMPORT CONTEXT

const CookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Grab live data from Context
  const { cooks_list, url } = useContext(StoreContext);

  // Find the specific cook using the ID from the URL
  const cook = cooks_list.find(c => c._id === id);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [tiffinSize, setTiffinSize] = useState('Standard'); 
  const [duration, setDuration] = useState(1); 
  const [mealSlot, setMealSlot] = useState('Lunch'); 

  // If the cook data hasn't loaded from the backend yet, show a loading message
  if (!cook) {
      return <div style={{textAlign: 'center', marginTop: '50px'}}>Loading Cook Details...</div>;
  }

  const basePrice = tiffinSize === 'Mini' ? 120 : tiffinSize === 'Jumbo' ? 200 : 150;
  const slotMultiplier = mealSlot === 'Both' ? 2 : 1;
  const totalPrice = basePrice * slotMultiplier * duration;

  return (
    <div className='cook-detail-page'>
      
      <div className="cook-hero">
        {/* Render the image properly using the backend URL */}
        <img 
            src={cook.image.startsWith('http') ? cook.image : `${url}/images/${cook.image}`} 
            alt={cook.name} 
            className="cook-hero-img" 
        />
        <button 
          className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
          onClick={() => setIsWishlisted(!isWishlisted)}
        >
          {isWishlisted ? '❤️ Wishlisted' : '🤍 Add to Wishlist'}
        </button>
      </div>

      <div className="cook-meta">
        <div className="cook-meta-header">
          <h2>{cook.name}</h2>
          <span className="cook-rating-tag">{cook.rating || 0} ★</span>
        </div>
        <p className="cook-cuisine-tag">{cook.cuisine}</p>
        <p className="cook-address-tag">📍 {cook.address || "Local Kitchen"}</p>
      </div>

      <hr className="divider-line" />

      <div className="customization-container">
        <h3>Customize Your Dibba Plan</h3>

        <div className="option-group">
          <label>Select Tiffin Size</label>
          <div className="chip-options">
            {['Mini', 'Standard', 'Jumbo'].map(size => (
              <button 
                key={size} 
                className={`chip ${tiffinSize === size ? 'selected' : ''}`}
                onClick={() => setTiffinSize(size)}
              >
                {size} {size === 'Mini' ? '(3 Roti + Sabzi)' : size === 'Jumbo' ? '(5 Roti + 2 Sabzi + Sweet)' : '(4 Roti + Sabzi + Rice)'}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <label>Select Booking Time (Subscription)</label>
          <div className="chip-options">
            {[
              { days: 1, label: '1 Day Trial' },
              { days: 7, label: '7 Days Weekly' },
              { days: 15, label: '15 Days Fortnightly' }
            ].map(plan => (
              <button 
                key={plan.days} 
                className={`chip ${duration === plan.days ? 'selected' : ''}`}
                onClick={() => setDuration(plan.days)}
              >
                {plan.label}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <label>Select Meal Slot</label>
          <div className="chip-options">
            {['Lunch', 'Dinner', 'Both'].map(slot => (
              <button 
                key={slot} 
                className={`chip ${mealSlot === slot ? 'selected' : ''}`}
                onClick={() => setMealSlot(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="order-bottom-bar">
        <div className="price-breakdown">
          <span>Total for {duration} Day(s)</span>
          <strong>₹{totalPrice}</strong>
        </div>
        <div className="action-buttons">
          <button className="add-cart-btn" onClick={() => navigate('/cart')}>Add to Cart</button>
          <button className="pay-now-btn" onClick={() => navigate('/order')}>Proceed to Pay</button>
        </div>
      </div>

    </div>
  )
}

export default CookDetail;