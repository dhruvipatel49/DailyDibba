import React, { useContext } from 'react'
import './Wishlist.css'
import { useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext' // NEW IMPORT

const Wishlist = () => {
  const navigate = useNavigate();
  
  // Bring in live data from context
  const { cooks_list, url } = useContext(StoreContext);
  
  // Simulating wishlisted cooks by grabbing the first two from your live database
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
                {/* Dynamically load the image from the backend */}
                <img src={cook.image.startsWith('http') ? cook.image : `${url}/images/${cook.image}`} alt={cook.name} />
                <div className={`diet-symbol ${cook.isVeg ? 'veg' : 'non-veg'}`}>
                  <span className="dot"></span>
                </div>
              </div>

              <div className="wishlist-info">
                <div className="wishlist-info-top">
                  <h3>{cook.name}</h3>
                  <span className="cook-rating">{cook.rating || 0} ★</span>
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

export default Wishlist;