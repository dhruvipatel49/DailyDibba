import React, { useState, useContext } from 'react';
import './CustomerCooks.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext'; 

const CustomerCooks = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  // 1. Destructure userLocation from Context
  const { cooks_list, url, userLocation } = useContext(StoreContext);
  
  // Filter States
  const [isPureVeg, setIsPureVeg] = useState(false);
  const [isunder100, setIsunder100] = useState(false);
  
  // Dropdown States
  const [isCuisineOpen, setIsCuisineOpen] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState(location.state?.cuisine || 'All');

  const cuisineOptions = ['All', 'Gujarati', 'Punjabi', 'Jain', 'North Indian', 'Healthy', 'South Indian'];

  // Combined filter logic
  const displayCooks = cooks_list.filter((cook) => {
    // 2. Location filter logic (checks if cook's address contains the chosen location)
    const matchesLocation = cook.address?.toLowerCase().includes(userLocation.toLowerCase());
    
    const matchesVeg = isPureVeg ? cook.isVeg === true : true;
    const matchesPrice = isunder100 ? (cook.price && cook.price < 100) : true;
    const matchesCuisine = selectedCuisine === 'All' 
        ? true 
        : cook.cuisine?.toLowerCase().includes(selectedCuisine.toLowerCase());

    // 3. Return matchesLocation along with all other filters
    return matchesLocation && matchesVeg && matchesPrice && matchesCuisine;
  });

  return (
    <div className='customer-cooks' id='customer-cooks'>
      {/* 4. Display the dynamic location in the header */}
      <h2>Popular Home Cooks Near You in {userLocation}</h2>
      
      {/* --- FILTER BAR --- */}
      <div className="filters-bar">
        <button className="filter-pill">Filters</button>
        <button className={`filter-pill ${isPureVeg ? 'active' : ''}`} onClick={() => setIsPureVeg(!isPureVeg)}>Pure Veg</button>
        <button className={`filter-pill ${isunder100 ? 'active' : ''}`} onClick={() => setIsunder100(!isunder100)}>Under ₹100</button>

        <div className="dropdown-container">
          <button className={`filter-pill ${selectedCuisine !== 'All' ? 'active' : ''}`} onClick={() => setIsCuisineOpen(!isCuisineOpen)}>
            {selectedCuisine !== 'All' ? selectedCuisine : 'Cuisines'} 
          </button>
          {isCuisineOpen && (
            <div className="dropdown-menu">
              {cuisineOptions.map((cuisine, index) => (
                <div key={index} className="dropdown-item" onClick={() => { setSelectedCuisine(cuisine); setIsCuisineOpen(false); }}>
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
            <h3>No cooks found in {userLocation}</h3>
            <p>Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          displayCooks.map((cook) => (
            <div key={cook._id} className="cook-card" onClick={() => navigate(`/cook/${cook._id}`)}>
              <div className="cook-img-container">
                <img 
                   src={cook.image.startsWith('http') ? cook.image : `${url}/images/${cook.image}`} 
                   alt={cook.name} 
                   className="cook-img" 
                />
                <div className={`diet-symbol ${cook.isVeg ? 'veg' : 'non-veg'}`}><span className="dot"></span></div>
              </div>
              <div className="cook-info">
                <div className="cook-header">
                  <h3>{cook.name}</h3>
                  <span className="cook-rating">{cook.rating || 0} ★</span>
                </div>
                <p className="cook-cuisine">{cook.cuisine}</p>
                <p className="cook-address">📍 {cook.address || "Local Kitchen"}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CustomerCooks;