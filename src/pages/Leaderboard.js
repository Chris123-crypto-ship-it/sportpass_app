import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaTrophy, FaMedal, FaStar, FaChartLine } from 'react-icons/fa';
import './Leaderboard.css';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'month', 'week'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('https://sportpass-clz0.onrender.com/leaderboard');
        const data = await response.json();
        setLeaderboard(data);
      } catch (error) {
        console.error('Fehler beim Laden der Rangliste:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeRange]); // Neu laden wenn sich der Zeitraum ändert

  if (loading) {
    return (
      <div className="leaderboard-loading">
        <div className="loading-spinner"></div>
        <p>Lade Rangliste...</p>
      </div>
    );
  }

  // Berechne Statistiken für den Benutzer
  const userRank = leaderboard.findIndex(entry => entry.name === user?.name) + 1;
  const userStats = leaderboard.find(entry => entry.name === user?.name);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>🏆 Sportpass Rangliste</h1>
        <div className="time-range-selector">
          <button 
            className={timeRange === 'all' ? 'active' : ''} 
            onClick={() => setTimeRange('all')}
          >
            Gesamt
          </button>
          <button 
            className={timeRange === 'month' ? 'active' : ''} 
            onClick={() => setTimeRange('month')}
          >
            Dieser Monat
          </button>
          <button 
            className={timeRange === 'week' ? 'active' : ''} 
            onClick={() => setTimeRange('week')}
          >
            Diese Woche
          </button>
        </div>
      </div>

      {user && userStats && (
        <div className="user-stats">
          <div className="user-rank">
            <FaTrophy className="rank-icon" />
            <div className="rank-info">
              <h3>Dein Rang</h3>
              <p className="rank-value">#{userRank} von {leaderboard.length}</p>
            </div>
          </div>
          <div className="user-points">
            <FaMedal className="points-icon" />
            <div className="points-info">
              <h3>Deine Punkte</h3>
              <p className="points-value">{userStats.points}</p>
            </div>
          </div>
          <div className="next-rank">
            <FaChartLine className="next-rank-icon" />
            <div className="next-rank-info">
              <h3>Nächster Rang</h3>
              {userRank > 1 ? (
                <p className="next-rank-value">
                  Noch {leaderboard[userRank - 2].points - userStats.points} Punkte bis Rang {userRank - 1}
                </p>
              ) : (
                <p className="next-rank-value">Du bist auf Rang 1! 🎉</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="podium-section">
        {leaderboard.slice(0, 3).map((entry, index) => (
          <div 
            key={index} 
            className={`podium-place podium-${index + 1}`}
            style={{ order: index === 1 ? 0 : index === 0 ? 1 : 2 }}
          >
            <div className="podium-avatar">
              {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
            </div>
            <h3 className="podium-name">{entry.name}</h3>
            <p className="podium-points">{entry.points} Punkte</p>
            {entry.name === user?.name && <span className="podium-badge">Du!</span>}
          </div>
        ))}
      </div>

      <div className="leaderboard-table">
        <h2>Gesamtrangliste</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Rang</th>
                <th>Name</th>
                <th>Punkte</th>
                <th>Auszeichnungen</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr 
                  key={index}
                  className={entry.name === user?.name ? 'current-user' : ''}
                >
                  <td className="rank-cell">
                    {index + 1}
                    {index < 10 && <FaStar className="top-10-star" />}
                  </td>
                  <td className="name-cell">
                    {entry.name}
                    {entry.name === user?.name && ' (Du)'}
                  </td>
                  <td className="points-cell">{entry.points}</td>
                  <td className="achievements-cell">
                    {entry.points >= 1000 && <span title="Sportass">🌟</span>}
                    {entry.points >= 500 && <span title="Fortgeschritten">🎯</span>}
                    {entry.points >= 100 && <span title="Anfänger">🎮</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="achievements-legend">
        <h3>Auszeichnungen</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-icon">🌟</span>
            <span className="legend-text">Sportass (1000+ Punkte)</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🎯</span>
            <span className="legend-text">Fortgeschritten (500+ Punkte)</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🎮</span>
            <span className="legend-text">Anfänger (100+ Punkte)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
