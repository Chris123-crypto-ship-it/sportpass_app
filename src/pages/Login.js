// src/pages/Login.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const loggedInUser = login(email, password);
    // Wenn der Benutzer Admin ist, leite zum Admin-Dashboard, sonst zum normalen Dashboard
    if (loggedInUser.role === 'admin') {
      navigate('/admin-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Passwort:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit">Einloggen</button>
      </form>
    </div>
  );
};

export default Login;
