import React from 'react'
import './Wishlist.css'
import { cooks_list } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'

const Wishlist = () => {
  const navigate = useNavigate();
  
  // Simulating wishlisted cooks by grabbing the first two from your assets
  const wishlistedCooks = cooks_list.slice(0, 2);

  return (
    <div className='wishlist-page'>
      <div className="wishlist-header">
        <h2>Your Wishlist ❤️</h2>
        <p>Save your favorite home cooks and order quickly next time.</p>
      </div>

      {wishlistedCooks.length === 0 ? (
        <div className="empty-wishlist">
          <h3>Your wishlist is empty!</h3>
          <p>Explore cooks and click the heart icon to save them here.</p>
          <button onClick={() => navigate('/cooks')}>Explore Cooks</button>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlistedCooks.map((cook) => (
            <div key={cook._id} className="wishlist-card">
              
              <div className="wishlist-img-container" onClick={() => navigate(`/cook/${cook._id}`)}>
                <img src={cook.image} alt={cook.cook_name} />
                <div className={`diet-symbol ${cook.isVeg ? 'veg' : 'non-veg'}`}>
                  <span className="dot"></span>
                </div>
              </div>

              <div className="wishlist-info">
                <div className="wishlist-info-top">
                  <h3>{cook.cook_name}</h3>
                  <span className="cook-rating">{cook.rating} ★</span>
                </div>
                <p className="cook-cuisine">{cook.cuisine}</p>
                
                <div className="wishlist-actions">
                  <button 
                    className="view-btn" 
                    onClick={() => navigate(`/cook/${cook._id}`)}
                  >
                    View Menu
                  </button>
                  <button className="remove-btn">Remove</button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Wishlist