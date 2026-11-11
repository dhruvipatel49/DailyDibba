import React, { useContext } from 'react'
import './Cart.css'
import { StoreContext } from '../../context/StoreContext'
import { useNavigate } from 'react-router-dom'
import { imageUrl } from '../../api/client.js'

const Cart = () => {
  const {
    cartData,
    cartLoading,
    addToCart,
    decrementFromCart,
    removeFromCart,
    clearCart,
    isLoggedIn,
    setShowLogin,
  } = useContext(StoreContext);
  const navigate = useNavigate();

  if (!isLoggedIn) {
    return (
      <div className='cart' style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ fontSize: 18, color: '#49557e', marginBottom: 16 }}>Please log in to view your cart.</p>
        <button
          onClick={() => setShowLogin(true)}
          style={{ padding: '10px 32px', background: 'tomato', color: '#fff', border: 'none', borderRadius: 50, cursor: 'pointer', fontSize: 16 }}
        >
          Sign In
        </button>
      </div>
    );
  }

  const items = cartData?.items || [];
  const subtotal = cartData?.subtotal ?? 0;
  const deliveryFee = cartData?.deliveryFee ?? 0;
  const total = cartData?.total ?? 0;
  const cookCount = cartData?.cookCount ?? 0;

  return (
    <div className='cart'>
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

        {cartLoading && items.length === 0 ? (
          <p style={{ color: '#808080', padding: '20px 0' }}>Loading your cart…</p>
        ) : items.length === 0 ? (
          <p style={{ color: '#808080', padding: '20px 0' }}>Your cart is empty.</p>
        ) : (
          items.map((item) => (
            <div key={`${item.menuItemId}-${item.size}`}>
              <div className='cart-items-title cart-items-item'>
                <img src={imageUrl(item.image)} alt={item.name} />
                <p>
                  {item.name}
                  <br />
                  <span style={{ fontSize: '12px', color: '#808080' }}>
                    ({item.size}){item.cookName ? ` • ${item.cookName}` : ''}
                  </span>
                  {item.instructions && (
                    <span style={{ display: 'block', fontSize: '11px', color: '#999', marginTop: 2 }}>
                      Note: {item.instructions}
                    </span>
                  )}
                </p>
                <p>₹{item.price}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => decrementFromCart(item.menuItemId, item.size)}
                    style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => addToCart(item.menuItemId, item.size, 1)}
                    style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>
                <p>₹{item.lineTotal}</p>
                <p
                  onClick={() => removeFromCart(item.menuItemId, item.size)}
                  className='cross'
                  style={{ cursor: 'pointer' }}
                  title="Remove item"
                >
                  x
                </p>
              </div>
              <hr />
            </div>
          ))
        )}

        {items.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              type="button"
              onClick={clearCart}
              style={{ background: 'transparent', border: '1px solid #ddd', borderRadius: 6, padding: '6px 14px', fontSize: 13, color: '#666', cursor: 'pointer' }}
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>

      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>₹{subtotal}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee{cookCount > 1 ? ` (${cookCount} cooks)` : ''}</p>
              <p>₹{deliveryFee}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>₹{total}</b>
            </div>
          </div>
          <button
            onClick={() => navigate('/order')}
            disabled={items.length === 0}
            style={{ opacity: items.length === 0 ? 0.6 : 1, cursor: items.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            PROCEED TO CHECKOUT
          </button>
        </div>

        <div className="cart-promocode">
          <div>
            <p>If you have a promo code, enter it here</p>
            <div className='cart-promocode-input'>
              <input type="text" placeholder='promo code' />
              <button type="button">Submit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
