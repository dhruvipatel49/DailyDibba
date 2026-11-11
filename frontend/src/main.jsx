import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import StoreContextProvider from './context/StoreContext.jsx' // Make sure this is imported

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <StoreContextProvider> {/* THIS MUST WRAP THE APP */}
      <App />
    </StoreContextProvider>
  </BrowserRouter>,
)