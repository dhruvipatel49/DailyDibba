import React, { useState, useContext } from 'react'
import './LoginPopup.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'
import { useNavigate } from 'react-router-dom'

const ROLE_REDIRECT = {
  customer: '/',
  cook: '/cook',
  delivery: '/delivery/pickups',
  admin: '/admin',
};

const LoginPopup = ({ setShowLogin }) => {
  const { login, register } = useContext(StoreContext);
  const navigate = useNavigate();

  const [currState, setCurrState] = useState('Login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Shared fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Cook-specific
  const [kitchenName, setKitchenName] = useState('');
  // Delivery-specific
  const [vehicleType, setVehicleType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let user;

      if (currState === 'Login') {
        user = await login(email, password);
      } else if (currState === 'Sign Up') {
        user = await register({ name, email, password, role: 'customer' });
      } else if (currState === 'Cook Sign Up') {
        if (!kitchenName.trim()) {
          setError('Kitchen name is required for cook registration.');
          setLoading(false);
          return;
        }
        user = await register({
          name,
          email,
          password,
          role: 'cook',
          kitchenName: kitchenName.trim(),
        });
      } else if (currState === 'Delivery Sign Up') {
        user = await register({
          name,
          email,
          password,
          role: 'delivery',
          vehicleType: vehicleType.trim() || undefined,
        });
      }

      setShowLogin(false);
      const dest = ROLE_REDIRECT[user?.role] || '/';
      navigate(dest);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isSignUp = currState !== 'Login';

  return (
    <div className='login-popup'>
      <form className="login-popup-container" onSubmit={handleSubmit}>
        <div className="login-popup-title">
          <h2>{currState}</h2>
          <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="close" />
        </div>

        <div className="login-popup-inputs">
          {isSignUp && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              required
            />
          )}
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder={isSignUp ? 'Password (min 8 characters)' : 'Password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isSignUp ? 8 : 1}
          />
          {currState === 'Cook Sign Up' && (
            <>
              <input
                type="text"
                placeholder="Kitchen / Tiffin service name (required)"
                value={kitchenName}
                onChange={(e) => setKitchenName(e.target.value)}
                minLength={2}
                required
              />
              <p style={{ fontSize: '12px', color: '#808080', marginTop: '-10px' }}>
                Note: New kitchens remain hidden from customers until approved by an admin.
              </p>
            </>
          )}
          {currState === 'Delivery Sign Up' && (
            <input
              type="text"
              placeholder="Vehicle type (e.g. Bike, Cycle) — optional"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            />
          )}
        </div>

        {error && (
          <p className="login-error" style={{ color: '#e53e3e', fontSize: '13px', marginTop: '-10px' }}>
            {error}
          </p>
        )}

        {isSignUp && (
          <div className="login-popup-condition">
            <input type="checkbox" required />
            <p>By continuing, I agree to the terms of use &amp; privacy policy.</p>
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading
            ? 'Loading…'
            : currState === 'Login'
            ? 'Login'
            : 'Create account'}
        </button>

        {currState === 'Login' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '-8px' }}>
            <p>
              New customer?{' '}
              <span onClick={() => { setCurrState('Sign Up'); setError(''); }}>Sign up</span>
            </p>
            <p>
              Cook / Tiffin service?{' '}
              <span onClick={() => { setCurrState('Cook Sign Up'); setError(''); }}>Register as cook</span>
            </p>
            <p>
              Delivery partner?{' '}
              <span onClick={() => { setCurrState('Delivery Sign Up'); setError(''); }}>Register as rider</span>
            </p>
          </div>
        ) : (
          <p>
            Already have an account?{' '}
            <span onClick={() => { setCurrState('Login'); setError(''); }}>Login here</span>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPopup;
