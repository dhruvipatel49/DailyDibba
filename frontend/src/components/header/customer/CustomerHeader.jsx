import React from 'react'
import './CustomerHeader.css'
import { useNavigate } from 'react-router-dom' // 1. Import useNavigate

const CustomerHeader = () => {
  const navigate = useNavigate(); // 2. Initialize navigate

  return (
    <div className='customer-header'>
      <div className="header-contents">
        <h2>Discover the best homemade tiffins in Ahmedabad</h2>
        <p>Craving the taste of home? Choose from our diverse network of local home-cooks offering fresh, hygienic, and authentic meals delivered straight to your doorstep.</p>
        
        {/* 3. Add the onClick event to the button */}
        <button onClick={() => navigate('/cooks')}>
          View Menu
        </button>
      </div>
    </div>
  )
}

export default CustomerHeader;