// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaUpload, FaTrash, FaPlus, FaChartLine, FaEdit } from 'react-icons/fa';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState(null);
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');
  const [editingGoal, setEditingGoal] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [userName, setUserName] = useState(localStorage.getItem('userName') || user?.name || 'Sportpass Nutzer');

  useEffect(() => {
    // Lade gespeicherte Daten
    const savedImage = localStorage.getItem('profileImage');
    const savedGoals = JSON.parse(localStorage.getItem('goals') || '[]');
    const savedWeight = localStorage.getItem('weight');
    const savedHeight = localStorage.getItem('height');

    if (savedImage) setProfileImage(savedImage);
    if (savedGoals) setGoals(savedGoals);
    if (savedWeight) setWeight(savedWeight);
    if (savedHeight) setHeight(savedHeight);
  }, []);

  const handleNameChange = async (e) => {
    e.preventDefault();
    if (userName.trim()) {
      try {
        // Aktualisiere den Namen im Backend
        const response = await fetch(`https://sportpass-clz0.onrender.com/users/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({ name: userName.trim() })
        });

        if (!response.ok) {
          throw new Error('Fehler beim Speichern des Namens');
        }

        // Speichere lokal
        localStorage.setItem('userName', userName.trim());
        setIsEditingName(false);
      } catch (error) {
        console.error('Fehler beim Aktualisieren des Namens:', error);
        alert('Der Name konnte nicht gespeichert werden. Bitte versuchen Sie es später erneut.');
        // Bei einem Fehler setzen wir den Namen zurück
        setUserName(localStorage.getItem('userName') || user?.name || 'Sportpass Nutzer');
      }
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result;
        setProfileImage(imageData);
        localStorage.setItem('profileImage', imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (newGoal.trim()) {
      const newGoalItem = {
        id: Date.now(),
        text: newGoal,
        completed: false
      };
      const updatedGoals = [...goals, newGoalItem];
      setGoals(updatedGoals);
      localStorage.setItem('goals', JSON.stringify(updatedGoals));
      setNewGoal('');
    }
  };

  const toggleGoal = (id) => {
    const updatedGoals = goals.map(goal => 
      goal.id === id ? { ...goal, completed: !goal.completed } : goal
    );
    setGoals(updatedGoals);
    localStorage.setItem('goals', JSON.stringify(updatedGoals));
  };

  const deleteGoal = (id) => {
    const updatedGoals = goals.filter(goal => goal.id !== id);
    setGoals(updatedGoals);
    localStorage.setItem('goals', JSON.stringify(updatedGoals));
  };

  const startEditGoal = (goal) => {
    setEditingGoal(goal);
    setNewGoal(goal.text);
  };

  const saveEditGoal = () => {
    if (newGoal.trim() && editingGoal) {
      const updatedGoals = goals.map(goal =>
        goal.id === editingGoal.id ? { ...goal, text: newGoal } : goal
      );
      setGoals(updatedGoals);
      localStorage.setItem('goals', JSON.stringify(updatedGoals));
      setEditingGoal(null);
      setNewGoal('');
    }
  };

  const calculateBMI = () => {
    if (weight && height) {
      const heightInMeters = height / 100;
      const bmiValue = (weight / (heightInMeters * heightInMeters)).toFixed(1);
      setBmi(bmiValue);
      localStorage.setItem('weight', weight);
      localStorage.setItem('height', height);
    }
  };

  const getBMICategory = (bmiValue) => {
    if (bmiValue < 18.5) return 'Untergewicht';
    if (bmiValue < 25) return 'Normalgewicht';
    if (bmiValue < 30) return 'Übergewicht';
    return 'Adipositas';
  };

  if (!user) {
    return <p>Bitte logge dich ein, um dein Profil zu sehen.</p>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-image-section">
          <div className="profile-image-container">
            <img 
              src={profileImage || 'default-profile.jpg'} 
              alt="Profilbild"
              className="profile-image"
            />
            <label className="profile-image-upload">
              <FaUpload />
              <input
                type="file"
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        <div className="profile-info">
          {isEditingName ? (
            <form onSubmit={handleNameChange} className="name-edit-form">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="name-edit-input"
                placeholder="Name eingeben"
                autoFocus
              />
              <div className="name-edit-buttons">
                <button type="submit" className="name-save-btn">
                  Speichern
                </button>
                <button 
                  type="button" 
                  className="name-cancel-btn"
                  onClick={() => {
                    setIsEditingName(false);
                    setUserName(localStorage.getItem('userName') || user?.name || 'Sportpass Nutzer');
                  }}
                >
                  Abbrechen
                </button>
              </div>
            </form>
          ) : (
            <div className="name-display">
              <h1 className="profile-name">{userName}</h1>
              <button 
                onClick={() => setIsEditingName(true)} 
                className="name-edit-btn"
              >
                <FaEdit />
              </button>
            </div>
          )}
          <div className="profile-email">
            <FaEnvelope />
            {user.email}
          </div>
          <div className="profile-role">
            <FaUser />
            {user.role === 'admin' ? 'Administrator' : 'Mitglied'}
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="main-content">
          <div className="section-card">
            <h2 className="section-title">
              <FaPlus />
              Meine Ziele
            </h2>
            <form onSubmit={editingGoal ? saveEditGoal : handleAddGoal}>
              <div className="goal-item">
                <input
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Neues Ziel eingeben..."
                  className="goal-input"
                />
                <button type="submit" className="add-goal-button">
                  {editingGoal ? 'Speichern' : 'Hinzufügen'}
                </button>
                {editingGoal && (
                  <button
                    type="button"
                    className="add-goal-button"
                    onClick={() => {
                      setEditingGoal(null);
                      setNewGoal('');
                    }}
                  >
                    Abbrechen
                  </button>
                )}
              </div>
            </form>
            <div className="goals-list">
              {goals.map(goal => (
                <div key={goal.id} className="goal-item">
                  <input
                    type="checkbox"
                    checked={goal.completed}
                    onChange={() => toggleGoal(goal.id)}
                    className="goal-checkbox"
                  />
                  <span
                    style={{
                      textDecoration: goal.completed ? 'line-through' : 'none',
                      flex: 1
                    }}
                  >
                    {goal.text}
                  </span>
                  <div className="goal-actions">
                    <button
                      onClick={() => startEditGoal(goal)}
                      className="add-goal-button"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="goal-delete-btn"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section-card">
            <h2 className="section-title">
              <FaChartLine />
              BMI-Rechner
            </h2>
            <div className="bmi-calculator">
              <div className="bmi-inputs">
                <div className="input-group">
                  <label htmlFor="weight">Gewicht (kg)</label>
                  <input
                    id="weight"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="z.B. 70"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="height">Größe (cm)</label>
                  <input
                    id="height"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="z.B. 175"
                  />
                </div>
              </div>

              <button className="calculate-button" onClick={calculateBMI}>
                BMI berechnen
              </button>

              {bmi && (
                <div className="bmi-result">
                  <div className="bmi-value">{bmi}</div>
                  <div className="bmi-category">{getBMICategory(bmi)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
