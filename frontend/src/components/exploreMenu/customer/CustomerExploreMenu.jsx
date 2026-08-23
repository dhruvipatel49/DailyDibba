import React from 'react'
import './CustomerExploreMenu.css'
import { assets } from '../../../assets/assets'
import { useNavigate } from 'react-router-dom' // 1. Import useNavigate

const CustomerExploreMenu = () => {
  const navigate = useNavigate(); // 2. Initialize it

  // Helper function to navigate and pass the cuisine name
  const handleCuisineClick = (cuisineName) => {
    navigate('/cooks', { state: { cuisine: cuisineName } });
  }

  return (
    <div className='explore-menu' id='explore-menu'>
      <h1>Explore our dibbas</h1>
      <p className='explore-menu-text'>Discover a variety of authentic, homemade meals crafted with love by local cooks in your neighborhood.</p>
      
      <div className="explore-menu-list">
        {/* 3. Add onClick to each item and pass the matching cuisine name */}
        <div className="explore-menu-list-item" onClick={() => handleCuisineClick('Gujarati')}>
            <img src={assets.food_1} alt="Gujarati Thali" />
            <p>Gujarati</p>
        </div>
        
        <div className="explore-menu-list-item" onClick={() => handleCuisineClick('Punjabi')}>
            <img src={assets.food_2} alt="Punjabi" />
            <p>Punjabi</p>
        </div>
        
        <div className="explore-menu-list-item" onClick={() => handleCuisineClick('Jain')}>
            <img src={assets.food_3} alt="Jain Food" />
            <p>Jain</p>
        </div>
        
        <div className="explore-menu-list-item" onClick={() => handleCuisineClick('Healthy')}>
            <img src={assets.food_4} alt="Healthy/Diet" />
            <p>Healthy</p>
        </div>
      </div>
      
      <hr />
    </div>
  )
}

export default CustomerExploreMenu;