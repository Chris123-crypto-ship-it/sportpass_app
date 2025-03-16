import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { FaRunning, FaHeartbeat, FaDumbbell, FaMedal, FaFire, FaStar, 
         FaUpload, FaFileImage, FaVideo, FaTrash, FaClock, FaCheck, FaTimes } from 'react-icons/fa';
import './Tasks.css';

const Tasks = () => {
  const { user } = useAuth();
  const { tasks, submissions, fetchTasks, fetchSubmissions, submitTask, handleApproveSubmission, handleRejectSubmission, deleteTask, deleteSubmission } = useTasks();
  const [selectedFile, setSelectedFile] = useState(null);
  const [duration, setDuration] = useState('');
  const [message, setMessage] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [filter, setFilter] = useState('all');
  const [filteredTasks, setFilteredTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
    fetchSubmissions();
  }, []);

  useEffect(() => {
    if (!tasks) return;

    let filtered = [...tasks];
    
    if (filter !== 'all') {
      filtered = tasks.filter(task => task.category.toLowerCase() === filter.toLowerCase());
    }

    setFilteredTasks(filtered);
  }, [tasks, filter]);

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'running':
        return FaRunning;
      case 'cardio':
        return FaHeartbeat;
      case 'strength':
        return FaDumbbell;
      default:
        return FaFire;
    }
  };

  const getDifficultyDots = (difficulty) => {
    return Array(3).fill(0).map((_, index) => (
      <div 
        key={index}
        className={`difficulty-dot ${index < difficulty ? 'active' : ''}`}
      />
    ));
  };

  if (!user) {
    return <p>Bitte logge dich ein, um Aufgaben zu sehen.</p>;
  }

  const handleSubmit = async (taskId) => {
    await submitTask(taskId, user.email, selectedFile, { duration: Number(duration) });
    setDuration('');
    setSelectedFile(null);
    setMessage('Einsendung erfolgreich!');
    fetchSubmissions();
    setTimeout(() => setMessage(''), 3000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setSelectedFile(file);
      } else {
        alert('Bitte nur Bild- oder Videodateien hochladen.');
      }
    }
  };

  const renderTaskForm = (task) => {
    return (
      <>
        {task.dynamic && (
          <div className="duration-input">
            <label htmlFor={`duration-${task.id}`}>Trainingszeit (Minuten)</label>
            <input
              id={`duration-${task.id}`}
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="duration-input-field"
              placeholder="z.B. 30"
              min="1"
            />
          </div>
        )}

        <div className="file-upload">
          <label className="file-upload-label">
            <FaUpload className="file-upload-icon" />
            <span className="file-upload-text">
              Klicke hier, um ein Bild oder Video hochzuladen
            </span>
            <input
              type="file"
              onChange={handleFileSelect}
              accept="image/*,video/*"
            />
          </label>
          
          {selectedFile && (
            <div className="selected-file">
              {selectedFile.type.startsWith('image/') ? (
                <FaFileImage className="selected-file-icon" />
              ) : (
                <FaVideo className="selected-file-icon" />
              )}
              <span>{selectedFile.name}</span>
              <FaTrash 
                className="remove-file"
                onClick={() => setSelectedFile(null)}
              />
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <h1 className="tasks-title">Verfügbare Aufgaben</h1>
        <div className="filter-section">
          <button 
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Alle
          </button>
          <button 
            className={`filter-button ${filter === 'running' ? 'active' : ''}`}
            onClick={() => setFilter('running')}
          >
            Laufen
          </button>
          <button 
            className={`filter-button ${filter === 'cardio' ? 'active' : ''}`}
            onClick={() => setFilter('cardio')}
          >
            Cardio
          </button>
          <button 
            className={`filter-button ${filter === 'strength' ? 'active' : ''}`}
            onClick={() => setFilter('strength')}
          >
            Kraft
          </button>
        </div>
      </div>

      <div className="tasks-grid">
        {filteredTasks.map(task => {
          const Icon = getCategoryIcon(task.category);
          return (
            <div key={task.id} className="task-card">
              <div className="task-header">
                <div className="task-icon">
                  <Icon />
                </div>
                <div className="task-title-section">
                  <h2 className="task-title">{task.title}</h2>
                  <span className="task-category">{task.category}</span>
                </div>
              </div>

              <div className="task-content">
                <p className="task-description">{task.description}</p>
                <div className="task-points">
                  <FaStar className="task-points-icon" />
                  {task.points} Punkte
                </div>
              </div>

              {renderTaskForm(task)}

              <div className="task-footer">
                <div className="task-difficulty">
                  {getDifficultyDots(task.difficulty)}
                </div>
                <button 
                  className="task-button"
                  onClick={() => handleSubmit(task.id)}
                  disabled={!user || (task.dynamic && !duration) || !selectedFile}
                >
                  Aufgabe einreichen
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="submissions-section">
        <div className="submissions-header">
          <h2 className="submissions-title">Meine ausstehenden Einsendungen</h2>
        </div>
        
        <div className="submissions-grid">
          {submissions
            .filter(sub => sub.user_email === user.email && sub.status === 'pending')
            .map(sub => {
              const task = tasks.find(t => t.id === sub.task_id);
              return (
                <div key={sub.id} className="submission-card">
                  <div className="submission-header">
                    <div className="submission-title">
                      {task?.title || 'Unbekannte Aufgabe'}
                    </div>
                    <div className="submission-status pending">
                      <FaClock />
                      Ausstehend
                    </div>
                  </div>

                  <div className="submission-content">
                    {task?.dynamic && (
                      <div className="submission-duration">
                        <FaClock className="submission-duration-icon" />
                        {sub.details.duration} Minuten
                      </div>
                    )}

                    {sub.file_url && (
                      <div className="submission-attachment">
                        {sub.file_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                          <img src={sub.file_url} alt="Eingereicht" />
                        ) : (
                          <video controls>
                            <source src={sub.file_url} type="video/mp4" />
                            Dein Browser unterstützt keine Videowiedergabe.
                          </video>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="submission-actions">
                    <button 
                      className="submission-button delete-button"
                      onClick={() => deleteSubmission(sub.id)}
                    >
                      <FaTrash /> Löschen
                    </button>
                  </div>
                </div>
              );
            })}
            {submissions.filter(sub => sub.user_email === user.email && sub.status === 'pending').length === 0 && (
              <p className="no-submissions">Keine ausstehenden Einsendungen vorhanden.</p>
            )}
        </div>
      </div>

      {/* Admin section with updated styling */}
      {user.role === 'admin' && (
        <div className="admin-section">
          <div className="submissions-header">
            <h2 className="submissions-title">Aufgabenüberprüfung</h2>
          </div>
          
          {submissions.filter(s => s.status === 'pending').length === 0 ? (
            <p>Keine ausstehenden Einsendungen.</p>
          ) : (
            <div className="submissions-grid">
              {submissions
                .filter(s => s.status === 'pending')
                .map(s => {
                  const task = tasks.find(t => t.id === s.task_id);
                  return (
                    <div key={s.id} className="submission-card">
                      <div className="submission-header">
                        <div className="submission-title">
                          {task?.title || 'Unbekannte Aufgabe'}
                        </div>
                        <div className="submission-user">
                          👤 {s.user_email}
                        </div>
                      </div>

                      <div className="submission-content">
                        {task?.dynamic && (
                          <div className="submission-duration">
                            <FaClock className="submission-duration-icon" />
                            {s.details.duration} Minuten
                          </div>
                        )}

                        {s.file_url && (
                          <div className="submission-attachment">
                            {s.file_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                              <img src={s.file_url} alt="Eingereicht" />
                            ) : (
                              <video controls>
                                <source src={s.file_url} type="video/mp4" />
                                Dein Browser unterstützt keine Videowiedergabe.
                              </video>
                            )}
                          </div>
                        )}

                        <textarea
                          placeholder="Anmerkungen für den Teilnehmer..."
                          value={adminComment}
                          onChange={(e) => setAdminComment(e.target.value)}
                          className="admin-comment"
                        />

                        <div className="admin-buttons">
                          <button 
                            className="submission-button approve-button"
                            onClick={() => {
                              handleApproveSubmission(s.id, adminComment);
                              setAdminComment('');
                            }}
                          >
                            <FaCheck /> Genehmigen
                          </button>
                          <button 
                            className="submission-button reject-button"
                            onClick={() => {
                              handleRejectSubmission(s.id, adminComment);
                              setAdminComment('');
                            }}
                          >
                            <FaTimes /> Ablehnen
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Tasks;
