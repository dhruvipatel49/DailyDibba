import React, { useState, useEffect } from 'react'
import './Cooks.css'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'
import { getCooks } from '../../api/cooks.js'
import { imageUrl } from '../../api/client.js'

const FILTER_CHIPS = ['All', 'Pure Veg', 'Gujarati', 'Punjabi', 'South Indian', 'Jain', 'Diet Food'];
const CUISINE_OPTIONS = ['Gujarati', 'Punjabi', 'South Indian', 'Jain', 'Diet Food', 'North Indian', 'Swaminarayan', 'Healthy'];

const Cooks = () => {
  const [vegFilter, setVegFilter] = useState('all'); // 'all' | 'veg' | 'nonveg'
  const [cuisine, setCuisine] = useState('');
  const [under100, setUnder100] = useState(false);

  const [cooks, setCooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    const params = {};
    if (vegFilter === 'veg') params.veg = true;
    if (vegFilter === 'nonveg') params.veg = false;
    if (cuisine) params.cuisine = cuisine;
    if (under100) params.maxPrice = 100;

    getCooks(params)
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : (data?.cooks || []);
        setCooks(list);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Could not load cooks.');
        setCooks([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [vegFilter, cuisine, under100]);

  const handleChipClick = (chip) => {
    if (chip === 'All') {
      setVegFilter('all');
      setCuisine('');
      setUnder100(false);
    } else if (chip === 'Pure Veg') {
      setVegFilter((prev) => (prev === 'veg' ? 'all' : 'veg'));
    } else {
      setCuisine((prev) => (prev === chip ? '' : chip));
    }
  };

  const isChipActive = (chip) => {
    if (chip === 'All') return vegFilter === 'all' && !cuisine && !under100;
    if (chip === 'Pure Veg') return vegFilter === 'veg';
    return cuisine === chip;
  };

  return (
    <div className='cooks-page'>
      <div className="cooks-header">
        <h2>Our Local Home Chefs</h2>
        <p>Discover the talented home cooks in your neighborhood crafting delicious, healthy, and hygienic daily dibbas.</p>
      </div>

      {/* Filter Chips */}
      <div className="cooks-filter-bar">
        {FILTER_CHIPS.map((filterName) => (
          <button
            key={filterName}
            type="button"
            className={`filter-chip ${isChipActive(filterName) ? 'active' : ''}`}
            onClick={() => handleChipClick(filterName)}
          >
            {filterName}
          </button>
        ))}
      </div>

      {/* Planned Extra Filters: Veg/Non-Veg toggle, Cuisine dropdown, Price under ₹100 */}
      <div className="cooks-extra-filters">
        <div className="cooks-veg-toggle" role="group" aria-label="Dietary preference">
          <button
            type="button"
            className={vegFilter === 'all' ? 'active' : ''}
            onClick={() => setVegFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={vegFilter === 'veg' ? 'active' : ''}
            onClick={() => setVegFilter('veg')}
          >
            Pure Veg
          </button>
          <button
            type="button"
            className={vegFilter === 'nonveg' ? 'active' : ''}
            onClick={() => setVegFilter('nonveg')}
          >
            Non-Veg
          </button>
        </div>

        <select
          className="cooks-select"
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          aria-label="Filter by cuisine"
        >
          <option value="">All Cuisines</option>
          {CUISINE_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button
          type="button"
          className={`filter-chip ${under100 ? 'active' : ''}`}
          onClick={() => setUnder100((v) => !v)}
        >
          Under ₹100
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#808080' }}>Loading chefs…</div>
      ) : error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#e53e3e' }}>{error}</div>
      ) : (
        <div className="cooks-grid">
          {cooks.map((cook) => {
            const locationText = [cook.area, cook.address, cook.city].filter(Boolean).join(', ');
            const ratingDisplay = Number(cook.rating) > 0 ? cook.rating : 'New';
            return (
              <div key={cook.id} className="cook-card">
                <div className="cook-img-container">
                  <img src={imageUrl(cook.image)} alt={cook.cookName} className="cook-img" />
                  {cook.isVeg && <span className="veg-badge">Pure Veg</span>}
                </div>

                <div className="cook-info">
                  <div className="cook-name-rating">
                    <h3>{cook.cookName}</h3>
                    <div className="rating">
                      <p>{ratingDisplay}</p>
                      <img src={assets.rating_starts} alt="rating stars" />
                    </div>
                  </div>
                  <p className="cook-cuisine">{cook.cuisine}</p>
                  <p className="cook-address">📍 {locationText || 'Ahmedabad'}</p>

                  <button onClick={() => navigate(`/cooks/${cook.id}`)} className="view-menu-btn">
                    View Menu
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && cooks.length === 0 && (
        <div className="no-cooks-found">
          <p>No chefs found for this filter. Check back soon!</p>
        </div>
      )}
    </div>
  );
};

export default Cooks;
