import React, { useContext } from 'react';
import './CustomerFoodDisplay.css';
import { assets } from '../../../assets/assets'; // Keep assets for icons like rating stars
import { StoreContext } from '../../../context/StoreContext'; // IMPORTANT NEW IMPORT

const CustomerFoodDisplay = ({ category }) => {

  // Grab the live food_list and backend URL from Context!
  const { food_list, url } = useContext(StoreContext);

  return (
    <div className='food-display' id='food-display'>
      <h2>Top Homemade Tiffins Near You</h2>
      <div className="food-display-list">
        
        {food_list.map((item, index) => {
          if (category === "All" || category === item.category) {
            return (
              <div key={index} className='food-item'>
                <div className="food-item-img-container">
                  
                  {/* Notice we added the URL here so the backend image loads! */}
                  <img 
                    className='food-item-image' 
                    src={`${url}/images/${item.image}`} 
                    alt={item.name} 
                  />
                  
                </div>
                <div className="food-item-info">
                  <div className="food-item-name-rating">
                    <p>{item.name}</p>
                    <img src={assets.rating_starts} alt="ratings" />
                  </div>
                  <p className="food-item-desc">{item.description}</p>
                  <p className="food-item-price">₹{item.price}</p>
                </div>
              </div>
            )
          }
          return null;
        })}
        
      </div>
    </div>
  )
}

export default CustomerFoodDisplay;