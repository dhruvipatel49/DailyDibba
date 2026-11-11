import React, { useContext } from 'react'
import './FoodItem.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'
import { useNavigate } from 'react-router-dom'

const FoodItem = ({ id, name, price, description, image, cookId, quantityLeft }) => {
  const { getCartItemQuantity, addToCart, decrementFromCart, wishlistIds, toggleWishlist } =
    useContext(StoreContext);
  const navigate = useNavigate();

  // FoodItem uses "regular" size for quick-add from the home/wishlist display
  const qty = getCartItemQuantity(id, 'regular');
  const isSoldOut = quantityLeft === 0;

  const handleNavigateToCook = () => {
    if (cookId) navigate(`/cooks/${cookId}`);
  };

  return (
    <div className='food-item'>
      <div className="food-item-img-container">
        <img
          className='food-item-image'
          src={image}
          alt={name}
          onClick={handleNavigateToCook}
          style={{ cursor: cookId ? 'pointer' : 'default' }}
        />

        <div
          className={`wishlist-icon ${wishlistIds.has(id) ? 'active' : ''}`}
          onClick={() => toggleWishlist(id)}
        >
          {wishlistIds.has(id) ? '❤️' : '🤍'}
        </div>
      </div>

      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p
            onClick={handleNavigateToCook}
            className="clickable-food-title"
            style={{ cursor: cookId ? 'pointer' : 'default' }}
          >
            {name}
          </p>
          <img src={assets.rating_starts} alt="rating" />
        </div>
        <p className="food-item-desc">{description}</p>

        <div className="food-item-bottom">
          <p className="food-item-price">
            ₹{price}
            {isSoldOut && <span className="food-item-soldout">(Sold out)</span>}
          </p>

          {!isSoldOut && (
            qty === 0 ? (
              <button
                type="button"
                className="food-item-add-btn"
                onClick={() => addToCart(id, 'regular', 1)}
              >
                + Add
              </button>
            ) : (
              <div className='food-item-counter'>
                <button
                  type="button"
                  className="counter-step-btn"
                  onClick={() => decrementFromCart(id, 'regular')}
                  aria-label="Decrease quantity"
                >
                  <img src={assets.remove_icon_red} alt="remove" />
                </button>
                <p>{qty}</p>
                <button
                  type="button"
                  className="counter-step-btn"
                  onClick={() => addToCart(id, 'regular', 1)}
                  aria-label="Increase quantity"
                >
                  <img src={assets.add_icon_green} alt="add" />
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodItem;
