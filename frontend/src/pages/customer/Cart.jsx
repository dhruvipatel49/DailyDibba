import React, { useContext } from 'react'
import './Cart.css'
import { useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'

const Cart = () => {
  const navigate = useNavigate();
  const { food_list, cartItems, addToCart, removeFromCart, deleteFromCart } = useContext(StoreContext);

  const getItemId = (item) => String(item._id || item.id);

  // Calculate dynamic subtotal
  const getSubtotal = () => {
    let total = 0;
    for (const itemId in cartItems) {
      if (cartItems[itemId] > 0) {
        const itemInfo = food_list.find((product) => getItemId(product) === String(itemId));
        if (itemInfo) {
          total += (itemInfo.price * 10) * cartItems[itemId];
        }
      }
    }
    return total;
  };

  const subtotal = getSubtotal();
  const deliveryFee = subtotal > 0 ? 30 : 0;
  const total = subtotal + deliveryFee;

  // Filter items that have quantity > 0
  const activeCartItems = food_list.filter((item) => {
    const id = getItemId(item);
    return (cartItems[id] || 0) > 0;
  });

  return (
    <div className='cart'>
      <h2>Your Cart</h2>

      {activeCartItems.length === 0 ? (
        <div className="cart-empty" style={{ textAlign: 'center', padding: '50px 0' }}>
          <h3>Your cart is empty 🛒</h3>
          <p style={{ color: '#777', margin: '10px 0 20px' }}>You haven't added any tiffins to your cart yet.</p>
          <button 
            onClick={() => navigate('/cooks')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#e23744',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Explore Tiffins & Cooks
          </button>
        </div>
      ) : (
        <>
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
            
            {activeCartItems.map((item) => {
              const id = getItemId(item);
              const quantity = cartItems[id];
              const unitPrice = item.price * 10;

              return (
                <div key={id}>
                  <div className='cart-items-title cart-items-item'>
                    <img src={item.image} alt={item.name} />
                    <p>{item.name}</p>
                    <p>₹{unitPrice}</p>
                    
                    <div className="cart-quantity-controls">
                      <button className="qty-btn" onClick={() => removeFromCart(id)}>-</button>
                      <span>{quantity}</span>
                      <button className="qty-btn" onClick={() => addToCart(id)}>+</button>
                    </div>

                    <p>₹{unitPrice * quantity}</p>
                    <p 
                      className='cross' 
                      onClick={() => deleteFromCart(id)}
                      style={{ cursor: 'pointer' }}
                    >
                      ✕
                    </p>
                  </div>
                  <hr />
                </div>
              );
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
        </>
      )}
    </div>
  )
}

export default Cart;