import React from 'react';
import './PlaceOrder.css';
import { orders_list } from '../../assets/assets';
import { Link } from 'react-router-dom';
// Import Leaflet Map Components
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Create custom icons for the map markers
const createCustomIcon = (emoji) => {
  return new L.divIcon({
    className: 'custom-map-icon',
    html: `<span>${emoji}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const kitchenIcon = createCustomIcon('🍳');
const riderIcon = createCustomIcon('🛵');
const homeIcon = createCustomIcon('🏠');

const PlaceOrder = () => {
  // Separate active order vs past orders
  const activeOrderRaw = orders_list.find(order => order.status !== "Delivered");
  
  // Enhanced active order data with mock delivery partner details
  const activeOrder = activeOrderRaw ? {
    ...activeOrderRaw,
    deliveryPartner: activeOrderRaw.deliveryPartner || {
      name: "Ramesh Patel",
      phone: "+91 98250 12345",
      rating: "4.9",
      vehicle: "EV Scooter • GJ-01-AB-4210",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
    }
  } : null;

  const pastOrders = orders_list.filter(order => order.status === "Delivered");

  // Real Ahmedabad Coordinates for the demo
  const kitchenPos = [23.0300, 72.5600]; // Example: Navrangpura
  const riderPos = [23.0260, 72.5650];   // Moving somewhere in between
  const homePos = [23.0225, 72.5714];    // Example: Ellisbridge

  return (
    <div className='orders-page'>
      
      {/* Top Header & New Order Action */}
      <div className="orders-header">
        <div>
          <h2>Your Orders</h2>
          <p>Manage active deliveries & view past meal history</p>
        </div>
        <Link to='/' className="new-order-btn">+ Place New Order</Link>
      </div>

      {/* 1. Track Current Active Order Section */}
      {activeOrder && (
        <div className="active-order-section">
          <div className="active-order-badge">Active Order</div>
          <div className="active-order-card">
            
            <div className="active-order-top">
              <div>
                <h3>{activeOrder.cookName}</h3>
                <p className="order-id">ID: {activeOrder._id} • {activeOrder.date}</p>
              </div>
              <div className="est-time">
                <span>Estimated Delivery</span>
                <strong>{activeOrder.estimatedTime}</strong>
              </div>
            </div>

            {/* --- REAL INTERACTIVE MAP --- */}
            <div className="live-map-wrapper">
              <div className="map-badge-status" style={{ zIndex: 1000 }}>
                <span className="live-pulse"></span>
                <span>Live Location Tracking</span>
              </div>
              
              <MapContainer 
                center={riderPos} 
                zoom={14} 
                scrollWheelZoom={false} 
                style={{ height: '280px', width: '100%', zIndex: 1 }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                
                <Marker position={kitchenPos} icon={kitchenIcon}>
                  <Popup>{activeOrder.cookName}</Popup>
                </Marker>
                
                <Marker position={riderPos} icon={riderIcon}>
                  <Popup>{activeOrder.deliveryPartner.name} is on the way!</Popup>
                </Marker>
                
                <Marker position={homePos} icon={homeIcon}>
                  <Popup>Your Delivery Location</Popup>
                </Marker>
              </MapContainer>

              {/* Delivery Partner Details Card */}
              <div className="delivery-partner-card">
                <div className="partner-profile">
                  <img 
                    src={activeOrder.deliveryPartner.avatar} 
                    alt="Rider" 
                    className="partner-avatar" 
                  />
                  <div className="partner-info">
                    <div className="partner-name-row">
                      <h4>{activeOrder.deliveryPartner.name}</h4>
                      <span className="partner-rating">★ {activeOrder.deliveryPartner.rating}</span>
                    </div>
                    <p className="partner-vehicle">{activeOrder.deliveryPartner.vehicle}</p>
                  </div>
                </div>
                <a href={`tel:${activeOrder.deliveryPartner.phone}`} className="call-partner-btn">
                  📞 Call Partner
                </a>
              </div>
            </div>
            {/* --- END MAP --- */}

            {/* Visual Progress Bar Tracker */}
            <div className="tracker-bar-container">
              <div className="tracker-steps">
                <div className={`step ${activeOrder.step >= 1 ? 'completed' : ''}`}>
                  <span className="dot"></span>
                  <p>Order Placed</p>
                </div>
                <div className={`step ${activeOrder.step >= 2 ? 'completed' : ''}`}>
                  <span className="dot"></span>
                  <p>Preparing Food</p>
                </div>
                <div className={`step ${activeOrder.step >= 3 ? 'completed' : ''}`}>
                  <span className="dot"></span>
                  <p>Out for Delivery</p>
                </div>
                <div className={`step ${activeOrder.step >= 4 ? 'completed' : ''}`}>
                  <span className="dot"></span>
                  <p>Delivered</p>
                </div>
              </div>
            </div>

            {/* Order Items Summary */}
            <div className="active-order-details">
              <div className="order-items-summary">
                {activeOrder.items.map((item, idx) => (
                  <span key={idx}>{item.name} × {item.quantity}</span>
                ))}
              </div>
              <p className="order-price">Total: ₹{activeOrder.totalAmount}</p>
            </div>

          </div>
        </div>
      )}

      {/* 2. Past Orders History Section */}
      <div className="past-orders-section">
        <h3>Past Orders</h3>
        <div className="past-orders-list">
          {pastOrders.map((order) => (
            <div key={order._id} className="past-order-card">
              
              <div className="past-order-header">
                <div>
                  <h4>{order.cookName}</h4>
                  <p className="past-date">{order.date}</p>
                </div>
                <span className="status-delivered">✓ Delivered</span>
              </div>

              <div className="past-order-body">
                <div className="past-items">
                  {order.items.map((item, idx) => (
                    <p key={idx}>{item.name} × {item.quantity}</p>
                  ))}
                </div>
                <div className="past-order-right">
                  <span className="past-price">₹{order.totalAmount}</span>
                  <Link to='/' className="reorder-btn">Reorder</Link>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default PlaceOrder;