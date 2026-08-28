import React, { useContext } from 'react'
import './CustomerFoodDisplay.css'
import { assets, cooks_list } from '../../../assets/assets'
import { useNavigate } from 'react-router-dom'
import { StoreContext } from '../../../context/StoreContext'

const CustomerFoodDisplay = ({ category }) => {
  const navigate = useNavigate();
  const { food_list, cartItems, addToCart, removeFromCart } = useContext(StoreContext);

  return (
    <div className='food-display' id='food-display'>
      <h2>Top Homemade Tiffins Near You</h2>
      <div className="food-display-list">
        {food_list.map((item, index) => {
          if (category === "All" || category === item.category) {
            const itemId = item._id || item.id;
            const itemQuantity = cartItems[String(itemId)] || 0;

            // Route dynamically based on cookId or position index
            const associatedCook = cooks_list[index] || cooks_list[0];
            const targetCookId = item.cookId || associatedCook._id || associatedCook.id || `c${index + 1}`;

            return (
              <div key={itemId} className='food-item'>
                <div className="food-item-img-container">
                  <img 
                    className='food-item-image' 
                    src={item.image} 
                    alt={item.name} 
                    onClick={() => navigate(`/cook/${targetCookId}`)}
                    style={{ cursor: 'pointer' }}
                  />
                  
                  <div className="food-item-cart-action">
                    {itemQuantity === 0 ? (
                      <button 
                        className="add-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(itemId);
                        }}
                      >
                        ADD +
                      </button>
                    ) : (
                      <div className="counter-btn" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => removeFromCart(itemId)}>-</button>
                        <span>{itemQuantity}</span>
                        <button onClick={() => addToCart(itemId)}>+</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="food-item-info">
                  <div className="food-item-name-rating">
                    <p>{item.name}</p>
                    <img src={assets.rating_starts} alt="ratings" />
                  </div>
                  <p className="food-item-desc">{item.description}</p>
                  <p className="food-item-price">₹{item.price * 10}</p>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  )
}

export default CustomerFoodDisplay;