import React from 'react'
import './CustomerFoodDisplay.css'
import { food_list, assets } from '../../../assets/assets'

const CustomerFoodDisplay = ({ category }) => {
  return (
    <div className='food-display' id='food-display'>
      <h2>Top Homemade Tiffins Near You</h2>
      <div className="food-display-list">
        {food_list.map((item, index) => {
          if (category === "All" || category === item.category) {
            return (
              <div key={index} className='food-item'>
                <div className="food-item-img-container">
                  <img className='food-item-image' src={item.image} alt={item.name} />
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
            )
          }
          return null;
        })}
      </div>
    </div>
  )
}

export default CustomerFoodDisplay