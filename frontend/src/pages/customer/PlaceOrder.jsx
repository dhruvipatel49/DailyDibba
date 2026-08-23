import React, { useContext, useEffect, useState } from 'react'
import './PlaceOrder.css'
import { Link } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext' // NEW IMPORT
import axios from 'axios' // NEW IMPORT

const PlaceOrder = () => {
  const { url, token } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);

  // Fetch the user's real orders from the backend!
  const fetchOrders = async () => {
    if (token) {
      try {
        const response = await axios.post(url + "/api/order/userorders", {}, { headers: { token } });
        if (response.data.success) {
          setOrders(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    }
  }

  // Run this when the page loads or when the token changes
  useEffect(() => {
    fetchOrders();
  }, [token]);

  // Separate active order vs past orders based on backend status
  // "Order Placed", "Preparing", "Out for Delivery" are active. "Delivered" is past.
  const activeOrder = orders.find(order => order.status !== "Delivered");
  const pastOrders = orders.filter(order => order.status === "Delivered");

  return (
    <div className='orders-page'>
      
      <div className="orders-header">
        <div>
          <h2>Your Orders</h2>
          <p>Manage active deliveries & view past meal history</p>
        </div>
        <Link to='/cooks' className="new-order-btn">+ Place New Order</Link>
      </div>

      {/* 1. Track Current Active Order Section */}
      {activeOrder && (
        <div className="active-order-section">
          <div className="active-order-badge">Active Order</div>
          <div className="active-order-card">
            
            <div className="active-order-top">
              <div>
                <h3>Order from Cook ID: {activeOrder.cookId}</h3>
                <p className="order-id">ID: {activeOrder._id} • {new Date(activeOrder.date).toLocaleDateString()}</p>
              </div>
              <div className="est-time">
                <span>Status</span>
                <strong>{activeOrder.status}</strong>
              </div>
            </div>

            <div className="active-order-details">
              <div className="order-items-summary">
                {activeOrder.items.map((item, idx) => (
                  <span key={idx}>{item.name} x {item.quantity}{idx < activeOrder.items.length -1 ? ', ' : ''}</span>
                ))}
              </div>
              <p className="order-price">Total: ₹{activeOrder.amount}</p>
            </div>

          </div>
        </div>
      )}

      {/* 2. Past Orders History Section */}
      <div className="past-orders-section">
        <h3>Past Orders</h3>
        {pastOrders.length === 0 && !activeOrder ? (
            <p>You have no orders yet!</p>
        ) : (
          <div className="past-orders-list">
            {pastOrders.map((order) => (
              <div key={order._id} className="past-order-card">
                
                <div className="past-order-header">
                  <div>
                    <h4>Order ID: {order._id.substring(0, 8)}...</h4>
                    <p className="past-date">{new Date(order.date).toLocaleDateString()}</p>
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
                    <span className="past-price">₹{order.amount}</span>
                    <Link to='/cooks' className="reorder-btn">Reorder</Link>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default PlaceOrder;