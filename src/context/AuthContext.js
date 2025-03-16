import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await fetch('https://sportpass-clz0.onrender.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      // Debug - log the login response data
      console.log("Login response data:", data);

      // Extrahiere die Benutzerdaten aus der korrekten Struktur
      setUser({ 
        id: data.user.id,
        email: data.user.email, 
        role: data.user.role, 
        name: data.user.name,
        points: data.user.points,
        token: data.user.token
      });
      
      console.log("User object after login:", { 
        id: data.user.id,
        email: data.user.email, 
        role: data.user.role, 
        name: data.user.name,
        points: data.user.points,
        token: data.user.token
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);