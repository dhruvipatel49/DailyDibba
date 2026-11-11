import React, { useContext, useState } from 'react'
import './TiffinCard.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'
import { imageUrl } from '../../api/client.js'

const TiffinCard = ({ item }) => {
  const { getCartItemQuantity, addToCart, decrementFromCart, wishlistIds, toggleWishlist } =
    useContext(StoreContext);

  const [size, setSize] = useState('regular');
  const [instructions, setInstructions] = useState('');

  // Display price based on selected size (small = -₹3, large = +₹5)
  const getPrice = () => {
    if (size === 'small') return Math.max(1, item.price - 3);
    if (size === 'large') return item.price + 5;
    return item.price;
  };

  const qty = getCartItemQuantity(item.id, size);
  const isSoldOut = item.quantityLeft === 0;

  const resolvedImage = item.image
    ? (item.image.startsWith('http') ? item.image : imageUrl(item.image))
    : '';

  return (
    <div className='tiffin-card'>
      <div className="tiffin-card-left">
        <div className="title-row">
          <h4>{item.name}</h4>
          <div
            className={`wishlist-icon ${wishlistIds.has(item.id) ? 'active' : ''}`}
            onClick={() => toggleWishlist(item.id)}
          >
            {wishlistIds.has(item.id) ? '❤️' : '🤍'}
          </div>
        </div>
        <p className="price">₹{getPrice()}</p>
        <p className="desc">{item.description}</p>

        {/* Size Selector */}
        <div className="size-selector">
          <p>Tiffin Size:</p>
          <div className="size-options" role="group" aria-label="Tiffin size">
            {['small', 'regular', 'large'].map((opt) => (
              <button
                key={opt}
                type="button"
                className={`size-option ${size === opt ? 'active' : ''}`}
                aria-pressed={size === opt}
                onClick={() => setSize(opt)}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Instructions */}
        <textarea
          className="instructions-input"
          placeholder="Any special instructions? (e.g., less spicy, extra roti)"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows="2"
        />
      </div>

      <div className="tiffin-card-right">
        <img src={resolvedImage} alt={item.name} className="food-img" />

        <div className="add-btn-container">
          {isSoldOut ? (
            <button className="add-btn" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
              SOLD OUT
            </button>
          ) : qty === 0 ? (
            <button
              className="add-btn"
              onClick={() => addToCart(item.id, size, 1, instructions.trim() || undefined)}
            >
              ADD
            </button>
          ) : (
            <div className='tiffin-counter'>
              <img onClick={() => decrementFromCart(item.id, size)} src={assets.remove_icon_red} alt="remove" />
              <p>{qty}</p>
              <img
                onClick={() => addToCart(item.id, size, 1, instructions.trim() || undefined)}
                src={assets.add_icon_green}
                alt="add"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TiffinCard;
