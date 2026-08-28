import React, { useContext } from 'react';
import './Wishlist.css';
import { cooks_list } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';

const Wishlist = () => {
  const navigate = useNavigate();
  const { wishlistItems = {}, toggleWishlist } = useContext(StoreContext);

  // Filter cooks_list based on items saved in StoreContext
  const wishlistedCooks = cooks_list.filter((cook) => {
    const cookId = String(cook._id || cook.id);
    return Boolean(wishlistItems[cookId]);
  });

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
          {wishlistedCooks.map((cook) => {
            const cookId = cook._id || cook.id;

            return (
              <div key={cookId} className="wishlist-card">
                
                <div className="wishlist-img-container" onClick={() => navigate(`/cook/${cookId}`)}>
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
                      onClick={() => navigate(`/cook/${cookId}`)}
                    >
                      View Menu
                    </button>
                    <button 
                      className="remove-btn"
                      onClick={() => toggleWishlist(cookId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;