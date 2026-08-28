import React from 'react'
import './CustomerExploreMenu.css'
import { assets } from '../../../assets/assets'
import { useNavigate } from 'react-router-dom'

const CustomerExploreMenu = ({ category, setCategory }) => {
  const navigate = useNavigate();

  // Helper function to handle category clicks
  const handleCategoryClick = (cuisineName) => {
    // Navigates to the Cooks page and passes the cuisine in the URL!
    navigate(`/cooks?search=${cuisineName}`);
  };

  return (
    <div className='explore-menu' id='explore-menu'>
      
      <h1 
        onClick={() => navigate('/cooks')} 
        style={{ cursor: 'pointer', display: 'inline-block' }}
        title="View all cooks"
      >
        Explore our dibbas
      </h1>
      <p className='explore-menu-text'>Discover a variety of authentic, homemade meals crafted with love by local cooks in your neighborhood.</p>
      
      <div className="explore-menu-list">
        {/* Category 1: Gujarati */}
        <div 
          onClick={() => handleCategoryClick("Gujarati")} 
          className="explore-menu-list-item"
        >
            <img className={category === "Gujarati" ? "active" : ""} src={assets.food_1} alt="Gujarati Thali" />
            <p>Gujarati</p>
        </div>
        
        {/* Category 2: Punjabi */}
        <div 
          onClick={() => handleCategoryClick("Punjabi")} 
          className="explore-menu-list-item"
        >
            <img className={category === "Punjabi" ? "active" : ""} src={assets.food_2} alt="Punjabi" />
            <p>Punjabi</p>
        </div>
        
        {/* Category 3: Jain */}
        <div 
          onClick={() => handleCategoryClick("Jain")} 
          className="explore-menu-list-item"
        >
            <img className={category === "Jain" ? "active" : ""} src={assets.food_3} alt="Jain Food" />
            <p>Jain</p>
        </div>
        
        {/* Category 4: Healthy */}
        <div 
          onClick={() => handleCategoryClick("Healthy")} 
          className="explore-menu-list-item"
        >
            <img className={category === "Healthy" ? "active" : ""} src={assets.food_4} alt="Healthy/Diet" />
            <p>Healthy</p>
        </div>
      </div>
      
      <hr />
    </div>
  )
}

export default CustomerExploreMenu;