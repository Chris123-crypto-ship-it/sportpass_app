import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    points: 10,
    dynamic: false,
    multiplier: 1,
    category: "cardio",
    multiplayer: false
  });

  // Debugging - log user object to see if token exists
  useEffect(() => {
    console.log("User in AdminDashboard:", user);
  }, [user]);

  useEffect(() => {
    fetchTasks();
    
    // Only try to fetch users if user and token exist
    if (user && user.token) {
      fetchUsers();
    }
  }, [user]); // Add user as a dependency

  const fetchTasks = async () => {
    try {
      const response = await axios.get("https://sportpass-clz0.onrender.com/tasks");
      setTasks(response.data);
    } catch (error) {
      console.error("Fehler beim Laden der Aufgaben", error);
    }
  };

  const fetchUsers = async () => {
    if (!user || !user.token) {
      console.error("Benutzer nicht angemeldet oder Token fehlt");
      return;
    }
    
    try {
      console.log("Fetching users with token:", user.token);
      // Add authentication token to the request
      const response = await axios.get("https://sportpass-clz0.onrender.com/users", {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      console.log("Users response:", response.data);
      setUsers(response.data);
    } catch (error) {
      console.error("Fehler beim Laden der Benutzer", error);
    }
  };

  const handleTaskCreate = async () => {
    if (!newTask.title) {
      alert("Bitte einen Titel eingeben!");
      return;
    }

    if (!user || !user.token) {
      alert("Du musst angemeldet sein, um Aufgaben zu erstellen!");
      return;
    }

    try {
      console.log("Creating task with token:", user.token);
      // Add authentication token to the request without the "Bearer " prefix
      await axios.post("https://sportpass-clz0.onrender.com/add-task", newTask, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchTasks();
      setNewTask({
        title: "",
        points: 10,
        dynamic: false,
        multiplier: 1,
        category: "cardio",
        multiplayer: false
      });
    } catch (error) {
      console.error("Fehler beim Erstellen der Aufgabe", error);
    }
  };

  // Show a login message if user is not logged in or not an admin
  if (!user) {
    return <p>Bitte logge dich ein, um auf das Admin-Dashboard zuzugreifen.</p>;
  }
  
  if (user.role !== 'admin') {
    return <p>Du hast keine Berechtigung, auf dieses Dashboard zuzugreifen.</p>;
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <h2>Neue Aufgabe erstellen</h2>
      <input
        type="text"
        placeholder="Titel"
        value={newTask.title}
        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
      />
      <input
        type="number"
        placeholder="Punkte"
        value={newTask.points}
        onChange={(e) => setNewTask({ ...newTask, points: Number(e.target.value) })}
      />
      <select
        value={newTask.category}
        onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
      >
        <option value="cardio">Cardio</option>
        <option value="strength">Kraft</option>
        <option value="flexibility">Flexibilität</option>
      </select>
      <label>
        <input
          type="checkbox"
          checked={newTask.dynamic}
          onChange={(e) => setNewTask({ ...newTask, dynamic: e.target.checked })}
        />
        Dynamische Punkte (z.B. nach Zeit)
      </label>
      {newTask.dynamic && (
        <input
          type="number"
          placeholder="Multiplikator für dynamische Punkte"
          value={newTask.multiplier}
          onChange={(e) => setNewTask({ ...newTask, multiplier: Number(e.target.value) })}
        />
      )}
      <label>
        <input
          type="checkbox"
          checked={newTask.multiplayer}
          onChange={(e) => setNewTask({ ...newTask, multiplayer: e.target.checked })}
        />
        Multiplayer-Aufgabe
      </label>
      <button onClick={handleTaskCreate}>Aufgabe erstellen</button>

      <h2>Offene Aufgaben</h2>
      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            <strong>{task.title}</strong> - {task.points} Punkte - Kategorie: {task.category}
            {task.dynamic && <span> - Dynamische Punkte (Multiplikator: {task.multiplier})</span>}
            {task.multiplayer && <span> - Multiplayer-Aufgabe</span>}
          </li>
        ))}
      </ul>

      <h2>Benutzer</h2>
      {users.length === 0 ? (
        <p>Keine Benutzer gefunden oder Daten werden geladen...</p>
      ) : (
        <ul>
          {users.map(user => (
            <li key={user.id}>
              {user.name} ({user.email}) - {user.role}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminDashboard;