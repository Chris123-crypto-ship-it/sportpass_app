import React, { useEffect, useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import './Archive.css'; // Styles für das Archiv

const categoryIcons = {
  cardio: '🏃‍♂️',
  strength: '💪',
  flexibility: '🧘‍♂️',
};

const Archive = () => {
  const { archive, fetchArchive, tasks } = useTasks();
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState('status');

  useEffect(() => {
    fetchArchive();
  }, []);

  // ✅ Filter: Zeigt nur die archivierten Einsendungen des eingeloggten Nutzers mit Status "approved" oder "rejected"
  const userArchive = archive.filter(sub => 
    sub.user_email === user.email && ['approved', 'rejected'].includes(sub.status)
  );

  // ✅ Sortierlogik für Archiv
  const sortedArchive = [...userArchive].sort((a, b) => {
    if (sortBy === 'task') {
      const taskA = tasks.find(t => t.id === a.task_id)?.title || 'Unbekannte Aufgabe';
      const taskB = tasks.find(t => t.id === b.task_id)?.title || 'Unbekannte Aufgabe';
      return taskA.localeCompare(taskB);
    }
    if (sortBy === 'status') return a.status.localeCompare(b.status);
    return 0;
  });

  return (
    <div className="archive-container">
      <h2>📁 Dein Archiv</h2>
      {userArchive.length === 0 ? (
        <p>Du hast noch keine archivierten Einsendungen.</p>
      ) : (
        <>
          <label>Sortieren nach:</label>
          <select onChange={(e) => setSortBy(e.target.value)} value={sortBy}>
            <option value="status">Status</option>
            <option value="task">Aufgabe</option>
          </select>
          <ul>
            {sortedArchive.map(sub => {
              const task = tasks.find(t => t.id === sub.task_id);
              return (
                <li key={sub.id} className={`archive-item ${sub.status}`}>
                  <p><strong>Aufgabe:</strong> {task ? task.title : 'Unbekannte Aufgabe'} {task && categoryIcons[task.category]}</p>
                  <p><strong>Status:</strong> {sub.status === 'approved' ? '✅ Akzeptiert' : '❌ Abgelehnt'}</p>
                  {task?.dynamic && <p><strong>Dauer:</strong> {sub.details?.duration} Minuten</p>}
                  {sub.file_url && (
                    <div className="submission-attachment">
                      {sub.file_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img src={sub.file_url} alt="Eingereicht" className="archive-image" />
                      ) : (
                        <video controls className="archive-video">
                          <source src={sub.file_url} type="video/mp4" />
                          Dein Browser unterstützt keine Videowiedergabe.
                        </video>
                      )}
                    </div>
                  )}
                  {sub.adminComment && (
                    <div className="admin-feedback">
                      <p><strong>Anmerkung vom Trainer:</strong></p>
                      <p className="comment-text">{sub.adminComment}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};

export default Archive;
