import React, { useState } from 'react'
import './CookDetail.css'
import { useParams, useNavigate } from 'react-router-dom'
import { cooks_list } from '../../assets/assets'

const CookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find cook or fallback to first cook
  const cook = cooks_list.find(c => c._id === id) || cooks_list[0];

  // State management for order parameters
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [tiffinSize, setTiffinSize] = useState('Standard'); // Mini, Standard, Jumbo
  const [duration, setDuration] = useState(1); // 1 Day, 7 Days, 15 Days
  const [mealSlot, setMealSlot] = useState('Lunch'); // Lunch, Dinner, Both

  // Pricing calculations
  const basePrice = tiffinSize === 'Mini' ? 120 : tiffinSize === 'Jumbo' ? 200 : 150;
  const slotMultiplier = mealSlot === 'Both' ? 2 : 1;
  const totalPrice = basePrice * slotMultiplier * duration;

  return (
    <div className='cook-detail-page'>
      
      {/* Cook Hero & Details Banner */}
      <div className="cook-hero">
        <img src={cook.image} alt={cook.cook_name} className="cook-hero-img" />
        <button 
          className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
          onClick={() => setIsWishlisted(!isWishlisted)}
        >
          {isWishlisted ? '❤️ Wishlisted' : '🤍 Add to Wishlist'}
        </button>
      </div>

      <div className="cook-meta">
        <div className="cook-meta-header">
          <h2>{cook.cook_name}</h2>
          <span className="cook-rating-tag">{cook.rating} ★</span>
        </div>
        <p className="cook-cuisine-tag">{cook.cuisine}</p>
        <p className="cook-address-tag">📍 {cook.address}</p>
      </div>

      <hr className="divider-line" />

      {/* Subscription & Order Customization Section */}
      <div className="customization-container">
        <h3>Customize Your Dibba Plan</h3>

        {/* 1. Tiffin Size Options */}
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

        {/* 2. Booking Duration */}
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

        {/* 3. Meal Slot */}
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

      {/* Sticky Bottom Order Bar */}
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

export default CookDetail