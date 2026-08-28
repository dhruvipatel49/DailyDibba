import React, { useState } from 'react'
import './CustomerNavbar.css'
import { assets } from '../../../assets/assets'
import { Link, useNavigate } from 'react-router-dom'

const CustomerNavbar = () => {
  const [menu, setMenu] = useState("home"); 
  const [location, setLocation] = useState("Ahmedabad");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  
  const availableCities = ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar'];
  const navigate = useNavigate();

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim() !== "") {
      // 1. Pass the search query into the URL parameters
      navigate(`/cooks?search=${encodeURIComponent(searchQuery.trim())}`); 
      setMenu("cooks");   
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    // Optional: If they clear the search, send them back to the unfiltered cooks page
    if (window.location.pathname === '/cooks') {
        navigate('/cooks');
    }
  };

  const handleCitySelect = (city) => {
    setLocation(city);
    setIsLocationOpen(false); 
  };

  return (
    <div className="customer-navbar">
        {/* Left: Logo */}
        <Link to='/' onClick={() => setMenu("home")}>
            <img src={assets.logo_1} alt="dailyDibba logo" className="logo" />
        </Link>
        
        {/* Center: Search Bar */}
        <div className="search-container">
            
            <div className="location-section">
                <span className="location-icon"> 
                    <img src={assets.location_1} alt="location" className='location-icon' />
                </span>
                
                <input 
                    type="text" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)}
                    onClick={() => setIsLocationOpen(true)}
                    className="location-input" 
                />
                
                <span 
                    className="caret-icon" 
                    onClick={() => setIsLocationOpen(!isLocationOpen)}
                    style={{ cursor: 'pointer', transform: isLocationOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s', display: 'inline-block' }}
                >
                    ▼
                </span>

                {isLocationOpen && (
                    <div className="location-dropdown-menu">
                        <div className="location-dropdown-item detect-location">
                            <span style={{ color: '#e23744', marginRight: '8px' }}><img src={assets.location_1} alt="location" className='location-icon' /></span> 
                            Detect current location
                        </div>
                        <div className="location-dropdown-divider"></div>
                        
                        {availableCities.map((city, index) => (
                            <div 
                                key={index} 
                                className={`location-dropdown-item ${location === city ? 'selected' : ''}`}
                                onClick={() => handleCitySelect(city)}
                            >
                                {city}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="divider"></div>
            
            <div className="search-section">
                <img src={assets.search_icon} alt="search" className="search-icon" />
                <input 
                    type="text" 
                    placeholder="Search thalis, cuisines..." 
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyPress}
                />
                {searchQuery && (
                    <span className="clear-search" onClick={clearSearch} style={{cursor: 'pointer', color: '#888', marginLeft: '8px', fontSize: '14px', fontWeight: 'bold'}}>
                        ✕
                    </span>
                )}
            </div>
        </div>

        {/* Middle-Right: Menu Links */}
        <ul className="customer-navbar-menu">
            <Link to='/' onClick={() => setMenu("home")} className={menu === "home" ? "active" : ""}><li>Home</li></Link>
            <Link to='/cooks' onClick={() => setMenu("cooks")} className={menu === "cooks" ? "active" : ""}><li>Cooks</li></Link>
            <Link to='/orders' onClick={() => setMenu("orders")} className={menu === "orders" ? "active" : ""}><li>Orders</li></Link>
            <Link to="/wishlist" onClick={() => setMenu("wishlist")} className={menu === "wishlist" ? "active" : ""}><li>Wishlist</li></Link>
        </ul>

        <div className="customer-navbar-right">
            <span className="nav-link">Log in</span>
            <span className="nav-link">Sign up</span>
            <Link to='/cart' className="cart-container" onClick={() => setMenu("")}>
                <img src={assets.basket_icon} alt="cart" />
                <div className="dot"></div>
            </Link>
        </div>
    </div>
  )
}

export default CustomerNavbar;