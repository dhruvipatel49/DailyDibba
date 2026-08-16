import React from 'react'
import './CustomerExploreMenu.css'
// Assuming you have some category images in your assets
import { assets } from '../../../assets/assets'

const CustomerExploreMenu = () => {
  return (
    <div className='explore-menu' id='explore-menu'>
      <h1>Explore our dibbas</h1>
      <p className='explore-menu-text'>Discover a variety of authentic, homemade meals crafted with love by local cooks in your neighborhood.</p>
      
      <div className="explore-menu-list">
        {/* Category 1 */}
        <div className="explore-menu-list-item">
            <img src={assets.food_1} alt="Gujarati Thali" />
            <p>Gujarati</p>
        </div>
        
        {/* Category 2 */}
        <div className="explore-menu-list-item">
            <img src={assets.food_2} alt="Punjabi" />
            <p>Punjabi</p>
        </div>
        
        {/* Category 3 */}
        <div className="explore-menu-list-item">
            <img src={assets.food_3} alt="Jain Food" />
            <p>Jain</p>
        </div>
        
        {/* Category 4 */}
        <div className="explore-menu-list-item">
            <img src={assets.food_4} alt="Healthy/Diet" />
            <p>Healthy</p>
        </div>
      </div>
      
      <hr />
    </div>
  )
}

export default CustomerExploreMenu