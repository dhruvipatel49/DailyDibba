import React, { useState } from 'react'
import './CustomerCooks.css'
import { cooks_list } from '../../assets/assets'
import { useNavigate, useLocation } from 'react-router-dom' // 1. Import useLocation
  
const CustomerCooks = () => {
  const navigate = useNavigate();
  
  // 2. Extract the search query from the URL parameters
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlSearchQuery = searchParams.get('search') || ''; 

  // Filter States
  const [isPureVeg, setIsPureVeg] = useState(false);
  const [isunder100, setIsunder100] = useState(false);
  
  // Dropdown States
  const [isCuisineOpen, setIsCuisineOpen] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState('All');

  const cuisineOptions = ['All', 'Gujarati', 'Punjabi', 'Jain', 'North Indian', 'Healthy', 'South Indian'];

  // Combined filter logic
  const displayCooks = cooks_list.filter((cook) => {
    const matchesVeg = isPureVeg ? cook.isVeg === true : true;
    const matchesPrice = isunder100 ? (cook.price && cook.price < 100) : true;
    const matchesCuisine = selectedCuisine === 'All' 
        ? true 
        : cook.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase());

    // 3. New Search Filter Logic: Check if name OR cuisine includes the search keyword
    const matchesSearch = urlSearchQuery === '' 
        ? true 
        : cook.cook_name.toLowerCase().includes(urlSearchQuery.toLowerCase()) || 
          cook.cuisine.toLowerCase().includes(urlSearchQuery.toLowerCase());

    // 4. Return true only if ALL conditions match
    return matchesVeg && matchesPrice && matchesCuisine && matchesSearch;
  });

  return (
    <div className='customer-cooks' id='customer-cooks'>
      {/* 5. Optional: Show users what they searched for */}
      <h2>
        {urlSearchQuery ? `Search results for "${urlSearchQuery}"` : "Popular Home Cooks Near You"}
      </h2>
      
      {/* --- FILTER BAR --- */}
      <div className="filters-bar">
        <button className="filter-pill">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2h-11z"/>
          </svg>
          Filters
        </button>
        
        <button 
          className={`filter-pill ${isPureVeg ? 'active' : ''}`}
          onClick={() => setIsPureVeg(!isPureVeg)}
        >
          Pure Veg
        </button>
        
        <button 
          className={`filter-pill ${isunder100 ? 'active' : ''}`}
          onClick={() => setIsunder100(!isunder100)}
        >
          Under ₹100
        </button>

        <div className="dropdown-container">
          <button 
            className={`filter-pill ${selectedCuisine !== 'All' ? 'active' : ''}`}
            onClick={() => setIsCuisineOpen(!isCuisineOpen)}
          >
            {selectedCuisine !== 'All' ? selectedCuisine : 'Cuisines'} 
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" style={{ transform: isCuisineOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}>
              <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>

          {isCuisineOpen && (
            <div className="dropdown-menu">
              {cuisineOptions.map((cuisine, index) => (
                <div 
                  key={index}
                  className={`dropdown-item ${selectedCuisine === cuisine ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedCuisine(cuisine);
                    setIsCuisineOpen(false);
                  }}
                >
                  {cuisine}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="cooks-grid">
        {displayCooks.length === 0 ? (
          <div className="no-results">
            <h3>No cooks found</h3>
            <p>Try adjusting your filters or clearing your search to see more results.</p>
          </div>
        ) : (
          displayCooks.map((cook) => (
            <div 
              key={cook._id} 
              className="cook-card"
              onClick={() => navigate(`/cook/${cook._id}`)}
            >
              <div className="cook-img-container">
                <img src={cook.image} alt={cook.cook_name} className="cook-img" />
                <div className={`diet-symbol ${cook.isVeg ? 'veg' : 'non-veg'}`}>
                  <span className="dot"></span>
                </div>
              </div>
              <div className="cook-info">
                <div className="cook-header">
                  <h3>{cook.cook_name}</h3>
                  <span className="cook-rating">{cook.rating} ★</span>
                </div>
                <p className="cook-cuisine">{cook.cuisine}</p>
                <p className="cook-address">📍 {cook.address}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CustomerCooks;