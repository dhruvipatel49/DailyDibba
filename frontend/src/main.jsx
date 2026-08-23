import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import StoreContextProvider from './context/StoreContext.jsx' // 1. IMPORT THE PROVIDER

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    {/* 2. WRAP YOUR APP WITH THE PROVIDER */}
    <StoreContextProvider>
      <App />
    </StoreContextProvider>
  </BrowserRouter>
)