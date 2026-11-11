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

        {!isSoldOut && (
          qty === 0
            ? <img className='add' onClick={() => addToCart(id, 'regular', 1)} src={assets.add_icon_white} alt="add" />
            : (
              <div className='food-item-counter'>
                <img onClick={() => decrementFromCart(id, 'regular')} src={assets.remove_icon_red} alt="remove" />
                <p>{qty}</p>
                <img onClick={() => addToCart(id, 'regular', 1)} src={assets.add_icon_green} alt="add" />
              </div>
            )
        )}
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
        <p className="food-item-price">
          ₹{price}
          {isSoldOut && <span style={{ marginLeft: 8, fontSize: 12, color: '#808080' }}>(Sold out)</span>}
        </p>
      </div>
    </div>
  );
};

export default FoodItem;
