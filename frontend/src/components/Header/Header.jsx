import React from 'react'
import './Header.css'
import { assets } from '../../assets/assets' 
import { useNavigate } from 'react-router-dom' // 1. Import useNavigate

const Header = () => {
  const navigate = useNavigate(); // 2. Initialize the hook

  return (
    <div className='header' style={{ backgroundImage: `url(${assets.header_img})` }}>
      <div className="header-contents">
        <h2>Order your favourite home tiffin here</h2>
        <p>Choose from a diverse menu featuring a delectable array of home-cooked meals crafted by local home chefs. Satisfy your cravings with healthy and hygienic daily dibbas.</p>
        
        {/* 3. Add the onClick event to route to /cooks */}
        <button onClick={() => navigate('/cooks')}>View Cooks</button>
      </div>
    </div>
  )
}

export default Header