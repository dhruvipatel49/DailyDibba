import React, { useContext, useState, useEffect } from 'react'
import './Wishlist.css'
import { StoreContext } from '../../context/StoreContext'
import FoodItem from '../../components/FoodItem/FoodItem'
import { imageUrl } from '../../api/client.js'

const Wishlist = () => {
  const { isLoggedIn, wishlistItems, fetchWishlist, setShowLogin } = useContext(StoreContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchWishlist().finally(() => setLoading(false));
  }, [isLoggedIn, fetchWishlist]);

  if (!isLoggedIn) {
    return (
      <div className='wishlist-page' style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ fontSize: 18, color: '#49557e', marginBottom: 16 }}>Log in to view your saved dibbas.</p>
        <button
          onClick={() => setShowLogin(true)}
          style={{ padding: '10px 32px', background: 'tomato', color: '#fff', border: 'none', borderRadius: 50, cursor: 'pointer', fontSize: 16 }}
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className='wishlist-page'>
      <h2>My Saved Dibbas</h2>

      {loading && wishlistItems.length === 0 ? (
        <p style={{ color: '#808080' }}>Loading…</p>
      ) : wishlistItems.length === 0 ? (
        <div className="empty-wishlist">
          <p>You haven't saved any home-cooked meals yet!</p>
          <p>Go to the home page and click the heart icon on a dibba to save it for later.</p>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlistItems.map((item) => (
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

export default Wishlist;
