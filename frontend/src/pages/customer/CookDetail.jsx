import React, { useState, useContext } from 'react';
import './CookDetail.css';
import { useParams, useNavigate } from 'react-router-dom';
import { cooks_list } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';

const CookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 1. Global Context & Data
  const { addToCart, wishlistItems = {}, toggleWishlist, food_list = [] } = useContext(StoreContext);

  // Find cook index to establish a position-based fallback
  const cookIndex = cooks_list.findIndex(c => String(c._id || c.id) === String(id));
  const activeCookIndex = cookIndex !== -1 ? cookIndex : 0;
  const cook = cooks_list[activeCookIndex] || cooks_list[0];

  const isWishlisted = wishlistItems[cook._id || cook.id] || false;

  // DYNAMIC FIX: Match by cookId OR fallback to the exact corresponding index in food_list
  const relatedFood = food_list.find(item => 
    String(item.cookId) === String(cook._id || cook.id) || 
    String(item._id || item.id) === String(cook._id || cook.id)
  ) || food_list[activeCookIndex] || food_list[0];

  // Extract the exact _id string used by food_list
  const validCartId = String(relatedFood?._id || relatedFood?.id || "1");

  // 2. Local Customization State
  const [tiffinSize, setTiffinSize] = useState('Standard');
  const [duration, setDuration] = useState(1);
  const [mealSlot, setMealSlot] = useState('Lunch');
  const [showToast, setShowToast] = useState(false);

  // 3. Dynamic Pricing
  const basePrice = tiffinSize === 'Mini' ? 120 : tiffinSize === 'Jumbo' ? 200 : 150;
  const slotMultiplier = mealSlot === 'Both' ? 2 : 1;
  const totalPrice = basePrice * slotMultiplier * duration;

  // 4. Action Handlers
  const handleAddToCart = () => {
    addToCart(validCartId);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleProceedToPay = () => {
    addToCart(validCartId);
    navigate('/cart');
  };

  return (
    <div className='cook-detail-page'>
      
      {showToast && (
        <div className="cart-toast" style={{
          position: 'fixed', top: '20px', right: '20px', backgroundColor: '#4CAF50', 
          color: '#fff', padding: '12px 24px', borderRadius: '8px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, fontWeight: 'bold'
        }}>
          Added {relatedFood?.name || 'Item'} to cart! 🛒
        </div>
      )}

      {/* Hero Section */}
      <div className="cook-hero">
        <img src={cook.image} alt={cook.cook_name} className="cook-hero-img" />
        <button 
          className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
          onClick={() => toggleWishlist && toggleWishlist(cook._id || cook.id)}
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

      {/* Customization Options */}
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

      {/* Sticky Bottom Order Bar */}
      <div className="order-bottom-bar">
        <div className="price-breakdown">
          <span>Total for {duration} Day(s)</span>
          <strong>₹{totalPrice}</strong>
        </div>
        <div className="action-buttons">
          <button className="add-cart-btn" onClick={handleAddToCart}>Add to Cart</button>
          <button className="pay-now-btn" onClick={handleProceedToPay}>Proceed to Pay</button>
        </div>
      </div>
    </div>
  );
};

export default CookDetail;