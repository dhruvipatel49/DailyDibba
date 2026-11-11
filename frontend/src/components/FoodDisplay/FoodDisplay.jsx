import React, { useContext } from 'react'
import './FoodDisplay.css'
import { StoreContext } from '../../context/StoreContext'
import FoodItem from '../FoodItem/FoodItem'
import { imageUrl } from '../../api/client.js'

const FoodDisplay = ({ loading, error }) => {
  const { foodList } = useContext(StoreContext);

  return (
    <div className='food-display' id='food-display'>
      <h2>Top Dibbas near you</h2>

      {loading ? (
        <p style={{ color: '#808080', padding: '20px 0' }}>Loading dibbas…</p>
      ) : error ? (
        <p style={{ color: '#e53e3e', padding: '20px 0', fontSize: '14px' }}>{error}</p>
      ) : foodList.length === 0 ? (
        <p style={{ color: '#808080', padding: '20px 0' }}>No dibbas found in this category.</p>
      ) : (
        <div className="food-display-list">
          {foodList.map((item) => (
            <FoodItem
              key={item.id}
              id={item.id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={imageUrl(item.image)}
              cookId={item.cookId}
              quantityLeft={item.quantityLeft}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodDisplay;
