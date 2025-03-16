import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [archive, setArchive] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (user?.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
    }
    
    return headers;
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://sportpass-clz0.onrender.com/tasks', {
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Fehler beim Abrufen der Aufgaben:', error);
      setError('Fehler beim Laden der Aufgaben');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!user?.token) {
      console.error('Kein Token verfügbar');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('https://sportpass-clz0.onrender.com/submissions', {
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error('Fehler beim Abrufen der Einsendungen:', error);
      setError('Fehler beim Laden der Einsendungen');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchive = async () => {
    if (!user?.token) {
      console.error('Kein Token verfügbar');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('https://sportpass-clz0.onrender.com/archive', {
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setArchive(data);
    } catch (error) {
      console.error('Fehler beim Abrufen des Archivs:', error);
      setError('Fehler beim Laden des Archivs');
      setArchive([]);
    } finally {
      setLoading(false);
    }
  };

  const submitTask = async (taskId, userEmail, file, details) => {
    if (!user?.token) {
      throw new Error('Nicht eingeloggt');
    }

    try {
      setLoading(true);
      setError(null);
      
      let file_url = null;
      if (file) {
        const reader = new FileReader();
        file_url = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }

      const response = await fetch('https://sportpass-clz0.onrender.com/submit-task', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ taskId, userEmail, details, file_url })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchSubmissions();
    } catch (error) {
      console.error('Fehler beim Einsenden der Aufgabe:', error);
      setError('Fehler beim Einsenden der Aufgabe');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSubmission = async (submissionId, adminComment = '') => {
    if (!user?.token) {
      throw new Error('Kein Token vorhanden');
    }

    try {
      console.log('Sende Approve-Request:', { submissionId, adminComment });
      const response = await axios.post('https://sportpass-clz0.onrender.com/approve-submission', 
        { submissionId, adminComment },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      console.log('Einsendung genehmigt:', response.data);
      
      // Aktualisiere die Listen
      await fetchSubmissions();
      await fetchArchive();
    } catch (error) {
      console.error('Fehler bei der Genehmigung:', error);
      setError(error.message || 'Fehler bei der Genehmigung');
    }
  };

  const handleRejectSubmission = async (submissionId, adminComment = '') => {
    if (!user?.token) {
      throw new Error('Kein Token vorhanden');
    }

    try {
      console.log('Sende Reject-Request:', { submissionId, adminComment });
      const response = await axios.post('https://sportpass-clz0.onrender.com/reject-submission',
        { submissionId, adminComment },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      console.log('Einsendung abgelehnt:', response.data);
      
      // Aktualisiere die Listen
      await fetchSubmissions();
      await fetchArchive();
    } catch (error) {
      console.error('Fehler bei der Ablehnung:', error);
      setError(error.message || 'Fehler bei der Ablehnung');
    }
  };

  const deleteSubmission = async (submissionId) => {
    if (!user?.token) {
      console.error('Nicht eingeloggt');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`https://sportpass-clz0.onrender.com/delete-submission/${submissionId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Einsendung erfolgreich gelöscht');
      await fetchSubmissions();
    } catch (error) {
      console.error('Fehler beim Löschen der Einsendung:', error);
      setError('Fehler beim Löschen der Einsendung');
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId) => {
    if (!user?.token) {
      setError('Nicht eingeloggt');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Versuche Aufgabe zu löschen. Task-ID:', taskId);
      const response = await axios.delete(`https://sportpass-clz0.onrender.com/delete-task/${taskId}`, {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      console.log('Server-Antwort:', response.data);
      await fetchTasks(); // Aktualisiere die Aufgabenliste
      await fetchSubmissions(); // Aktualisiere auch die Einsendungen
      setError(null); // Lösche eventuelle vorherige Fehler
    } catch (error) {
      console.error('Fehler beim Löschen der Aufgabe:', error);

      if (error.response?.status === 404) {
        setError('Aufgabe wurde nicht gefunden. Bitte aktualisieren Sie die Seite.');
      } else if (error.response?.status === 403) {
        setError('Keine Berechtigung zum Löschen der Aufgabe');
      } else if (error.response?.data?.message) {
        setError(`Fehler: ${error.response.data.message}`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten beim Löschen der Aufgabe');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      submissions,
      archive,
      loading,
      error,
      fetchTasks,
      fetchSubmissions,
      fetchArchive,
      submitTask,
      handleApproveSubmission,
      handleRejectSubmission,
      deleteSubmission,
      deleteTask,
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);