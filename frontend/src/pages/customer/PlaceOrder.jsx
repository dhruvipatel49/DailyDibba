import React from 'react'
import './PlaceOrder.css'
import { orders_list } from '../../assets/assets'
import { Link } from 'react-router-dom'

const PlaceOrder = () => {
  // Separate active order vs past orders
  const activeOrder = orders_list.find(order => order.status !== "Delivered");
  const pastOrders = orders_list.filter(order => order.status === "Delivered");

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
                  <span key={idx}>{item.name} x {item.quantity}</span>
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
  )
}

export default PlaceOrder