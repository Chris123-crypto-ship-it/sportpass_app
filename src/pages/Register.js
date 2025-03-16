import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('https://sportpass-clz0.onrender.com/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Fehler bei der Registrierung');
      }

      setSuccess('Registrierung erfolgreich! Weiterleitung zum Login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2><FaUserPlus /> Registrieren</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label><FaUser /> Name:</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required />
        </div>
        <div>
          <label><FaEnvelope /> Email:</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required />
        </div>
        <div>
          <label><FaLock /> Passwort:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required />
        </div>
        <button type="submit">Registrieren</button>
      </form>
    </div>
  );
};

export default Register;
