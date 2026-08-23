import React from 'react'
import CustomerNavbar from './components/navbar/customer/CustomerNavbar'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/customer/Home'
import Cart from './pages/customer/Cart'
import PlaceOrder from './pages/customer/PlaceOrder'
import CustomerCooks from './pages/customer/CustomerCooks'
import CookDetail from './pages/customer/CookDetail'

// 1. Import the new component
import Wishlist from './pages/customer/Wishlist'


const App = () => {
  return (
    <div className="app">
       <CustomerNavbar />
       <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/home' element={<Home />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/order' element={<PlaceOrder />} />
          <Route path='/orders' element={<PlaceOrder />} />
          <Route path='/cooks' element={<CustomerCooks />} />
          <Route path='/cook/:id' element={<CookDetail />} />
          
          {/* 2. Add the route here */}
          <Route path='/wishlist' element={<Wishlist />} />
       </Routes>
    </div>
  )
}

export default App