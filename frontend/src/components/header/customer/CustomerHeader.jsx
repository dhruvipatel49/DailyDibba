import React from 'react'
import './CustomerHeader.css'
import { useNavigate } from 'react-router-dom' // 1. Import the navigation hook

const CustomerHeader = () => {
  // 2. Initialize the navigate function
  const navigate = useNavigate(); 

  return (
    <div className='customer-header'>
      <div className="header-contents">
        <h2>Discover the best homemade tiffins in Your City</h2>
        <p>Craving the taste of home? Choose from our diverse network of local home-cooks offering fresh, hygienic, and authentic meals delivered straight to your doorstep.</p>
        
        {/* 3. Add the onClick event to trigger navigation to the Cooks page */}
        <button onClick={() => navigate('/cooks')}>View Menu</button>
        
      </div>
    </div>
  )
}

export default CustomerHeader;