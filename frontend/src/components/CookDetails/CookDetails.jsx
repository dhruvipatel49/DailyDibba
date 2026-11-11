import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './CookDetails.css'
import { assets } from '../../assets/assets'
import { getCook } from '../../api/cooks.js'
import { imageUrl } from '../../api/client.js'
import TiffinCard from '../../components/TiffinCard/TiffinCard'

const CookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cook, setCook] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getCook(id)
      .then((data) => {
        if (!active) return;
        setCook(data.cook || data);
        setMenu(data.menu || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Could not load cook details.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="cook-details-page">
        <button className="back-btn" onClick={() => navigate('/cooks')}>← Back to Cooks</button>
        <p style={{ color: '#808080', padding: '24px 0' }}>Loading chef details…</p>
      </div>
    );
  }

  if (error || !cook) {
    return (
      <div className="cook-details-page">
        <button className="back-btn" onClick={() => navigate('/cooks')}>← Back to Cooks</button>
        <h2 style={{ color: '#e53e3e' }}>{error || 'Cook not found. Please try again.'}</h2>
      </div>
    );
  }

  const locationText = [cook.area, cook.address, cook.city].filter(Boolean).join(', ');
  const ratingDisplay = Number(cook.rating) > 0 ? cook.rating : 'New';

  return (
    <div className='cook-details-page'>
      <button className="back-btn" onClick={() => navigate('/cooks')}>← Back to Cooks</button>

      {/* Chef Profile Banner */}
      <div className="cook-banner">
        <img src={imageUrl(cook.image)} alt={cook.cookName} className="cook-banner-img" />
        <div className="cook-banner-info">
          <div className="title-row">
            <h2>{cook.cookName}</h2>
            {cook.isVeg && <span className="veg-badge">Pure Veg</span>}
            {cook.isOpen === false && (
              <span style={{ background: '#ffe5e5', color: '#c53030', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                Currently Closed
              </span>
            )}
          </div>
          <p className="cuisine">{cook.cuisine}</p>
          <p className="address">📍 {locationText || 'Ahmedabad'}</p>
          <div className="rating">
            <p>{ratingDisplay}</p>
            <img src={assets.rating_starts} alt="rating stars" />
          </div>
          {cook.bio && <p style={{ marginTop: 8, color: '#555', fontSize: 14 }}>{cook.bio}</p>}
        </div>
      </div>

      <hr className="divider" />

      {/* Menu Section */}
      <div className="cook-menu-section">
        <h3>Order Online</h3>

        {menu.length === 0 ? (
          <p style={{ color: '#808080' }}>Menu items are currently being updated for this chef.</p>
        ) : (
          <div className="menu-grid">
            {menu.map((item) => (
              <TiffinCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CookDetails;
