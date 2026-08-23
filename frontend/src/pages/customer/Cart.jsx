import React, { useContext } from 'react'
import './Cart.css'
import { useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext' // IMPORT CONTEXT

const Cart = () => {
  const navigate = useNavigate();

  // Bring in the live data and cart functions
  const { cartItems, food_list, removeFromCart, addToCart, url } = useContext(StoreContext);

  // Calculate the live subtotal based on items in the cart
  let subtotal = 0;
  for (const item in cartItems) {
    if (cartItems[item] > 0) {
      let itemInfo = food_list.find((product) => product._id === item);
      if (itemInfo) {
         subtotal += itemInfo.price * cartItems[item];
      }
    }
  }

  const deliveryFee = subtotal > 0 ? 30 : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className='cart'>
      <h2>Your Cart</h2>
      
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
        
        {/* Loop through all food items, but only show ones in the cart */}
        {food_list.map((item, index) => {
          if (cartItems[item._id] > 0) {
            return (
              <div key={item._id}>
                <div className='cart-items-title cart-items-item'>
                  <img src={`${url}/images/${item.image}`} alt={item.name} />
                  <p>{item.name}</p>
                  <p>₹{item.price}</p>
                  
                  {/* Live quantity controls! */}
                  <div className="cart-quantity-controls">
                    <button className="qty-btn" onClick={() => removeFromCart(item._id)}>-</button>
                    <span>{cartItems[item._id]}</span>
                    <button className="qty-btn" onClick={() => addToCart(item._id)}>+</button>
                  </div>
                  
                  <p>₹{item.price * cartItems[item._id]}</p>
                  <p className='cross' onClick={() => removeFromCart(item._id)}>✕</p>
                </div>
                <hr />
              </div>
            )
          }
          return null; // Don't render if not in cart
        })}
      </div>

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

export default Cart;