import React from 'react'
import './Cart.css'
import { food_list } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'

const Cart = () => {
  const navigate = useNavigate();

  // Displays items from food_list for cart preview
  const cartItems = food_list.slice(0, 2); 

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * 10), 0);
  const deliveryFee = subtotal > 0 ? 30 : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className='cart'>
      <h2>Your Cart</h2>
      
      {/* Cart Items Table */}
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />
        
        {cartItems.map((item) => (
          <div key={item._id}>
            <div className='cart-items-title cart-items-item'>
              <img src={item.image} alt={item.name} />
              <p>{item.name}</p>
              <p>₹{item.price * 10}</p>
              <div className="cart-quantity-controls">
                <button className="qty-btn">-</button>
                <span>1</span>
                <button className="qty-btn">+</button>
              </div>
              <p>₹{item.price * 10}</p>
              <p className='cross'>✕</p>
            </div>
            <hr />
          </div>
        ))}
      </div>

      {/* Cart Summary & Promo Code Section */}
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Order Summary</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>₹{subtotal}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>₹{deliveryFee}</p>
            </div>
            <hr />
            <div className="cart-total-details total-row">
              <b>Total</b>
              <b>₹{total}</b>
            </div>
          </div>
          <button onClick={() => navigate('/order')}>PROCEED TO CHECKOUT</button>
        </div>

        <div className="cart-promocode">
          <div>
            <p>If you have a promo code, enter it here</p>
            <div className='cart-promocode-input'>
              <input type="text" placeholder='Promo code' />
              <button>Apply</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart