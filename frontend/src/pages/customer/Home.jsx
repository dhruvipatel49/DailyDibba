import React, { useState, useContext } from 'react'
import CustomerHeader from '../../components/header/customer/CustomerHeader'
import CustomerExploreMenu from '../../components/exploreMenu/customer/CustomerExploreMenu'
import CustomerFoodDisplay from '../../components/foodDisplay/customer/CustomerFoodDisplay'
import { StoreContext } from '../../context/StoreContext' // NEW IMPORT
import { useNavigate } from 'react-router-dom' // NEW IMPORT
import '../../pages/customer/CustomerCooks.css' // Import this to reuse cook card styles

const Home = () => {
  const [category, setCategory] = useState("All");
  
  // Bring in the needed data from context
  const { cooks_list, userLocation, url } = useContext(StoreContext);
  const navigate = useNavigate();

  // Filter for cooks in the selected location with rating > 4.0
  const topCooks = cooks_list.filter(cook => 
    cook.address?.toLowerCase().includes(userLocation.toLowerCase()) && 
    cook.rating > 4.0
  );

  return (
    <div>
      <CustomerHeader />
      <CustomerExploreMenu category={category} setCategory={setCategory} />
      
      {/* --- NEW SECTION: TOP RATED COOKS BY LOCATION --- */}
      <div style={{ padding: '20px 8vw' }}>
        <h2>Top Rated Cooks in {userLocation}</h2>
        
        {topCooks.length === 0 ? (
          <p>No top-rated cooks found in {userLocation} yet.</p>
        ) : (
          <div className="cooks-grid">
            {topCooks.map((cook) => (
              <div key={cook._id} className="cook-card" onClick={() => navigate(`/cook/${cook._id}`)}>
                <div className="cook-img-container">
                  <img 
                    src={cook.image.startsWith('http') ? cook.image : `${url}/images/${cook.image}`} 
                    alt={cook.name} 
                    className="cook-img" 
                  />
                  <div className={`diet-symbol ${cook.isVeg ? 'veg' : 'non-veg'}`}>
                    <span className="dot"></span>
                  </div>
                </div>
                <div className="cook-info">
                  <div className="cook-header">
                    <h3>{cook.name}</h3>
                    <span className="cook-rating">{cook.rating || 0} ★</span>
                  </div>
                  <p className="cook-cuisine">{cook.cuisine}</p>
                  <p className="cook-address">📍 {cook.address}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* ------------------------------------------------ */}

      <CustomerFoodDisplay category={category} />
    </div>
  )
}

export default Home;