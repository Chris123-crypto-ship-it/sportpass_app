import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';

const Participants = () => {
  const { user } = useAuth();
  const { archive } = useTasks();
  const [leaderboard, setLeaderboard] = useState([]);
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
  }, []);

  if (loading) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px'
      }}>
        <div className="spinner" style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div className="participants-container" style={{ padding: '20px' }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .achievement {
            display: inline-block;
            margin: 0 5px;
            font-size: 20px;
          }

          .leaderboard-row {
            transition: transform 0.2s;
          }

          .leaderboard-row:hover {
            transform: scale(1.02);
          }
        `}
      </style>

      <h2>Sportpass Rangliste</h2>
      
      {/* Top 3 Podium */}
      <div className="podium" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: '40px',
        height: '200px'
      }}>
        {leaderboard.slice(0, 3).map((participant, index) => (
          <div key={index} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: '0 20px',
            padding: '10px',
            background: 'white',
            borderRadius: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            height: index === 0 ? '180px' : index === 1 ? '140px' : '100px',
            justifyContent: 'flex-end'
          }}>
            <div className="achievement">
              {index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'}
            </div>
            <h3 style={{ margin: '10px 0' }}>{participant.name}</h3>
            <p style={{ fontWeight: 'bold' }}>{participant.points} Punkte</p>
          </div>
        ))}
      </div>

      {/* Vollständige Rangliste */}
      <div className="leaderboard-list" style={{
        background: 'white',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>Gesamtrangliste</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '10px' }}>Rang</th>
                <th style={{ padding: '10px' }}>Name</th>
                <th style={{ padding: '10px' }}>Punkte</th>
                <th style={{ padding: '10px' }}>Auszeichnungen</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((participant, index) => (
                <tr key={index} className="leaderboard-row" style={{
                  borderBottom: '1px solid #eee',
                  background: participant.name === user?.name ? '#f8f9fa' : 'transparent'
                }}>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ padding: '10px' }}>
                    {participant.name}
                    {participant.name === user?.name && ' (Du)'}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{participant.points}</td>
                  <td style={{ padding: '10px' }}>
                    {participant.points >= 1000 && <span className="achievement">🌟</span>}
                    {participant.points >= 500 && <span className="achievement">🎯</span>}
                    {participant.points >= 100 && <span className="achievement">🎮</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legende für Auszeichnungen */}
      <div className="achievements-legend" style={{
        marginTop: '20px',
        background: 'white',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>Auszeichnungen</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span className="achievement">🌟</span> Sportass (1000+ Punkte)
          </div>
          <div>
            <span className="achievement">🎯</span> Fortgeschritten (500+ Punkte)
          </div>
          <div>
            <span className="achievement">🎮</span> Anfänger (100+ Punkte)
          </div>
        </div>
      </div>
    </div>
  );
};

export default Participants;
