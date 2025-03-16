// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Seiten
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Tasks from './pages/Tasks';
import Stats from './pages/Stats';
import Archive from './pages/Archive';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Participants from './pages/Participants';

function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <Router>
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/participants" element={<Participants />} />
            </Routes>
          </div>
          <Footer />
          <ToastContainer position="top-right" autoClose={3000} />
        </Router>
      </TaskProvider>
    </AuthProvider>
  );
}

export default App;
