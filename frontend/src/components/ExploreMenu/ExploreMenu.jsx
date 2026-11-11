import React, { useState, useEffect } from 'react'
import './ExploreMenu.css'
import { getCategories } from '../../api/menu.js'
import { assets } from '../../assets/assets'

const CATEGORY_IMAGES = {
  Gujarati: assets.food_1,
  Punjabi: assets.food_2,
  'South Indian': assets.food_5,
  Jain: assets.food_3,
  'Diet Food': assets.food_4,
};

const ExploreMenu = ({ category, setCategory }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getCategories()
      .then((data) => {
        const raw = Array.isArray(data) ? data : (data?.categories || []);
        const list = raw.map((c) => (typeof c === 'string' ? c : c.name || c.category)).filter(Boolean);
        setCategories(list);
      })
      .catch((err) => {
        setError(err.message || 'Could not load categories');
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className='explore-menu' id='explore-menu'>
      <h1>Explore our dibbas</h1>
      <p className='explore-menu-text'>
        Choose from a diverse menu featuring a delectable array of home-cooked meals. Our mission is to satisfy
        your cravings with healthy and hygienic daily dibbas.
      </p>

      {loading ? (
        <p style={{ color: '#808080', padding: '16px 0' }}>Loading categories…</p>
      ) : error ? (
        <p style={{ color: '#e53e3e', padding: '16px 0', fontSize: '14px' }}>{error}</p>
      ) : categories.length === 0 ? (
        <p style={{ color: '#808080', padding: '16px 0' }}>No categories available.</p>
      ) : (
        <div className="explore-menu-list">
          {categories.map((name) => (
            <div
              key={name}
              onClick={() => setCategory((prev) => (prev === name ? 'All' : name))}
              className="explore-menu-list-item"
            >
              <img
                className={category === name ? 'active' : ''}
                src={CATEGORY_IMAGES[name] || assets.food_1}
                alt={name}
              />
              <p>{name}</p>
            </div>
          ))}
        </div>
      )}
      <hr />
    </div>
  );
};

export default ExploreMenu;
