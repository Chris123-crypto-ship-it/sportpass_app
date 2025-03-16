require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// Erhöhe das Limit für JSON-Payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://sportpass-app.onrender.com' // Ersetze dies mit deiner tatsächlichen Frontend-Domain in Produktion
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Authorization'],
  credentials: true
}));


// 🔹 Supabase Client
const supabase = createClient('https://nofjpujlhhpluvhxbpcq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZmpwdWpsaGhwbHV2aHhicGNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTUyMDQzMCwiZXhwIjoyMDU3MDk2NDMwfQ.0vfQYUoeP9rEwUtxzmPmJ3RFBOXuFABPQNSrrse2fYI');
const SECRET_KEY = process.env.SECRET_KEY || 'geheimes_token';

// 🔹 Auth Middleware (Admin-Zugriff sichern)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format

  if (!token) {
    console.log('Kein Token gefunden:', req.headers);
    return res.status(403).json({ message: 'Kein Token vorhanden' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    console.log('Token verifiziert für:', decoded);
    next();
  } catch (err) {
    console.log('Token ungültig:', err);
    return res.status(403).json({ message: 'Ungültiger Token' });
  }
};

// 🔹 Archivierte Einsendungen abrufen (nur akzeptierte oder abgelehnte)
app.get('/archive', async (req, res) => {
  const { data: archivedSubmissions, error } = await supabase
    .from('submissions')
    .select('*')
    .in('status', ['approved', 'rejected']); // Nur angenommene oder abgelehnte Einsendungen

  if (error) {
    return res.status(500).json({ message: 'Fehler beim Abrufen des Archivs' });
  }

  res.json(archivedSubmissions);
});

// 🔹 Registrierung
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();

  if (existingUser) return res.status(400).json({ message: 'E-Mail existiert bereits' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const { data: newUser, error } = await supabase
    .from('users')
    .insert([{ 
      name, 
      email, 
      password: hashedPassword, 
      role: 'user', 
      points: 0 
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ message: 'Fehler beim Speichern des Benutzers' });

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    SECRET_KEY,
    { expiresIn: '2h' }
  );

  res.status(201).json({
    message: 'Registrierung erfolgreich',
    user: {
      email: newUser.email,
      role: newUser.role,
      points: newUser.points,
      token: token
    }
  });
});

// 🔹 Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data: user } = await supabase.from('users').select('*').eq('email', email).single();

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Falsche Anmeldedaten' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    SECRET_KEY,
    { expiresIn: '2h' }
  );
  
  res.json({
    message: 'Login erfolgreich',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      points: user.points,
      token: token
    }
  });
});

// 🔹 Teilnehmerliste abrufen (nur Admins)
app.get('/api/participants', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Keine Admin-Rechte' });

  const { data: users, error } = await supabase.from('users').select('id, name, email');
  if (error) return res.status(500).json({ message: 'Fehler beim Abrufen der Teilnehmer' });

  res.json(users);
});

// 🔹 Alle Benutzer abrufen (nur für Admins)
app.get('/users', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Keine Admin-Rechte' });
  }

  const { data: users, error } = await supabase.from('users').select('id, name, email, role');
  
  if (error) {
    return res.status(500).json({ message: 'Fehler beim Abrufen der Benutzer' });
  }

  res.json(users);
});

// 🔹 Aufgabe hinzufügen (nur Admins)
app.post('/add-task', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Keine Admin-Rechte' });

  const { title, points, dynamic, multiplier, category, multiplayer } = req.body;

  // Überprüfen, ob alle erforderlichen Felder vorhanden sind
  if (!title || points === undefined || !category) {
    return res.status(400).json({ message: 'Alle Felder sind erforderlich!' });
  }

  try {
    // Aufgabe in der Datenbank speichern
    const { data, error } = await supabase.from('tasks').insert([
      { title, points, dynamic, multiplier, category, multiplayer }
    ]);

    if (error) {
	return res.status(500).json({ message: 'Fehler beim Hinzufügen der Aufgabe', error });
}

res.status(201).json({ message: 'Aufgabe erfolgreich hinzugefügt' });
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Aufgabe:', error);
    res.status(500).json({ message: 'Fehler beim Hinzufügen der Aufgabe' });
  }
});

// 🔹 Alle Aufgaben abrufen
app.get('/tasks', async (req, res) => {
  const { data: tasks, error } = await supabase.from('tasks').select('*');
  if (error) return res.status(500).json({ message: 'Fehler beim Abrufen der Aufgaben' });

  res.json(tasks);
});

// 🔹 Aufgabe einsenden
app.post('/submit-task', async (req, res) => {
  const { taskId, userEmail, details } = req.body;
  const { error } = await supabase.from('submissions').insert([{ task_id: taskId, user_email: userEmail, details, status: 'pending' }]);

  if (error) return res.status(500).json({ message: 'Fehler beim Speichern der Einsendung' });

  res.json({ message: 'Einsendung gespeichert' });
});

// 🔹 Einsendungen abrufen
app.get('/submissions', async (req, res) => {
  const { data: submissions, error } = await supabase.from('submissions').select('*');
  if (error) return res.status(500).json({ message: 'Fehler beim Abrufen' });

  res.json(submissions);
});

// 🔹 Einsendung löschen (nur wenn sie noch "pending" ist)
app.delete('/delete-submission/:id', async (req, res) => {
  const { id } = req.params;

  const { data: submission, error: fetchError } = await supabase.from('submissions').select('status').eq('id', id).single();
  if (!submission) return res.status(404).json({ message: 'Einsendung nicht gefunden' });

  if (submission.status !== 'pending') {
    return res.status(400).json({ message: 'Einsendung kann nicht mehr gelöscht werden' });
  }

  const { error } = await supabase.from('submissions').delete().eq('id', id);
  if (error) return res.status(500).json({ message: 'Fehler beim Löschen der Einsendung' });

  res.json({ message: 'Einsendung erfolgreich gelöscht' });
});

// 🔹 Genehmigung der Einsendung
app.post('/approve-submission', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Keine Admin-Rechte' });
  }

  const { submissionId, adminComment } = req.body;
  console.log('Approve Request:', { submissionId, adminComment });

  if (!submissionId) {
    return res.status(400).json({ message: 'Keine Submission ID angegeben' });
  }

  try {
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError) {
      console.error('Submission Error:', submissionError);
      return res.status(500).json({ message: 'Datenbankfehler bei der Suche nach der Einsendung' });
    }

    if (!submission) {
      return res.status(404).json({ message: 'Einsendung nicht gefunden' });
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', submission.task_id)
      .single();

    if (taskError) {
      console.error('Task Error:', taskError);
      return res.status(500).json({ message: 'Fehler beim Abrufen der Aufgabe' });
    }

    if (!task) {
      return res.status(404).json({ message: 'Zugehörige Aufgabe nicht gefunden' });
    }

    if (submission.status === 'approved') {
      return res.status(400).json({ message: 'Einsendung wurde bereits genehmigt' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('points')
      .eq('email', submission.user_email)
      .single();

    if (userError || !user) {
      console.error('User Error:', userError);
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    const earnedPoints = task.dynamic ? Math.floor((submission.details?.duration || 0) * (task.multiplier || 1)) : task.points;
    const newPoints = user.points + earnedPoints;

    const { error: updateUserError } = await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('email', submission.user_email);

    if (updateUserError) {
      console.error('Update User Error:', updateUserError);
      return res.status(500).json({ message: 'Fehler beim Aktualisieren der Punkte' });
    }

    const { error: updateSubmissionError } = await supabase
      .from('submissions')
      .update({ 
        status: 'approved',
        admin_comment: adminComment
      })
      .eq('id', submissionId);

    if (updateSubmissionError) {
      console.error('Update Submission Error:', updateSubmissionError);
      await supabase
        .from('users')
        .update({ points: user.points })
        .eq('email', submission.user_email);
      return res.status(500).json({ message: 'Fehler beim Aktualisieren des Status' });
    }

    res.json({ 
      message: 'Einsendung genehmigt, Punkte vergeben',
      earnedPoints,
      newTotalPoints: newPoints,
      submission: {
        ...submission,
        status: 'approved',
        admin_comment: adminComment,
        task: task
      }
    });
  } catch (error) {
    console.error('Fehler bei der Genehmigung:', error);
    res.status(500).json({ message: 'Fehler bei der Genehmigung der Einsendung' });
  }
});

// 🔹 Ablehnung der Einsendung
app.post('/reject-submission', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Keine Admin-Rechte' });
  }

  const { submissionId, adminComment } = req.body;
  console.log('Reject Request:', { submissionId, adminComment });

  if (!submissionId) {
    return res.status(400).json({ message: 'Keine Submission ID angegeben' });
  }

  try {
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError) {
      console.error('Submission Error:', submissionError);
      return res.status(500).json({ message: 'Datenbankfehler bei der Suche nach der Einsendung' });
    }

    if (!submission) {
      return res.status(404).json({ message: 'Einsendung nicht gefunden' });
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', submission.task_id)
      .single();

    if (taskError) {
      console.error('Task Error:', taskError);
      return res.status(500).json({ message: 'Fehler beim Abrufen der Aufgabe' });
    }

    if (!task) {
      return res.status(404).json({ message: 'Zugehörige Aufgabe nicht gefunden' });
    }

    if (submission.status === 'rejected') {
      return res.status(400).json({ message: 'Einsendung wurde bereits abgelehnt' });
    }

    const { error: updateError } = await supabase
      .from('submissions')
      .update({ 
        status: 'rejected',
        admin_comment: adminComment
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Update Error:', updateError);
      return res.status(500).json({ message: 'Fehler beim Ablehnen der Einsendung' });
    }

    res.json({ 
      message: 'Einsendung abgelehnt',
      submission: {
        ...submission,
        status: 'rejected',
        admin_comment: adminComment,
        task: task
      }
    });
  } catch (error) {
    console.error('Fehler bei der Ablehnung:', error);
    res.status(500).json({ message: 'Fehler bei der Ablehnung der Einsendung' });
  }
});

// 🔹 Leaderboard abrufen
app.get('/leaderboard', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('name, points')
      .order('points', { ascending: false });

    if (error) throw error;
    res.json(users || []);
  } catch (error) {
    console.error('Fehler beim Abrufen des Leaderboards:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Rangliste' });
  }
});

// 🔹 Aufgabe löschen (nur Admins)
app.delete('/delete-task/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Keine Admin-Rechte' });
  }

  const { id } = req.params;
  console.log('Versuche Aufgabe zu löschen. Task-ID:', id);

  try {
    // Prüfe zuerst, ob die Aufgabe existiert
    const { data: task, error: checkError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (checkError) {
      console.error('Datenbankfehler bei der Suche:', checkError);
      return res.status(500).json({ 
        message: 'Datenbankfehler bei der Suche',
        error: checkError
      });
    }

    if (!task) {
      console.log('Aufgabe nicht gefunden. ID:', id);
      return res.status(404).json({ 
        message: 'Aufgabe nicht gefunden',
        taskId: id
      });
    }

    console.log('Aufgabe gefunden:', task);

    // Lösche zuerst alle verknüpften Einsendungen
    const { error: deleteSubmissionsError } = await supabase
      .from('submissions')
      .delete()
      .eq('task_id', id);

    if (deleteSubmissionsError) {
      console.error('Fehler beim Löschen der Einsendungen:', deleteSubmissionsError);
      return res.status(500).json({
        message: 'Fehler beim Löschen der verknüpften Einsendungen',
        error: deleteSubmissionsError
      });
    }

    // Lösche die Aufgabe
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Fehler beim Löschen der Aufgabe:', deleteError);
      return res.status(500).json({ 
        message: 'Fehler beim Löschen der Aufgabe',
        error: deleteError
      });
    }

    console.log('Aufgabe und verknüpfte Einsendungen erfolgreich gelöscht. ID:', id);
    res.json({ 
      message: 'Aufgabe und verknüpfte Einsendungen erfolgreich gelöscht',
      deletedTaskId: id
    });
  } catch (error) {
    console.error('Unerwarteter Fehler beim Löschen der Aufgabe:', error);
    res.status(500).json({ 
      message: 'Unerwarteter Fehler beim Löschen der Aufgabe',
      error: error.message
    });
  }
});

// 🔹 Teams abrufen
app.get('/teams', async (req, res) => {
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .order('points', { ascending: false });

    if (error) throw error;
    res.json(teams);
  } catch (error) {
    console.error('Fehler beim Abrufen der Teams:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Teams' });
  }
});

// 🔹 Team erstellen
app.post('/teams', verifyToken, async (req, res) => {
  const { name } = req.body;
  
  try {
    const { data: team, error } = await supabase
      .from('teams')
      .insert([{ 
        name,
        created_by: req.user.id,
        points: 0
      }])
      .select()
      .single();

    if (error) throw error;

    // Ersteller als erstes Teammitglied hinzufügen
    await supabase
      .from('team_members')
      .insert([{
        team_id: team.id,
        user_id: req.user.id,
        role: 'leader'
      }]);

    res.status(201).json(team);
  } catch (error) {
    console.error('Fehler beim Erstellen des Teams:', error);
    res.status(500).json({ message: 'Fehler beim Erstellen des Teams' });
  }
});

// 🔹 Team beitreten
app.post('/teams/:teamId/join', verifyToken, async (req, res) => {
  const { teamId } = req.params;

  try {
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', req.user.id)
      .single();

    if (existingMember) {
      return res.status(400).json({ message: 'Du bist bereits Mitglied dieses Teams' });
    }

    const { error } = await supabase
      .from('team_members')
      .insert([{
        team_id: teamId,
        user_id: req.user.id,
        role: 'member'
      }]);

    if (error) throw error;

    res.json({ message: 'Erfolgreich dem Team beigetreten' });
  } catch (error) {
    console.error('Fehler beim Beitreten des Teams:', error);
    res.status(500).json({ message: 'Fehler beim Beitreten des Teams' });
  }
});

// 🔹 Aktive Challenges abrufen
app.get('/challenges', async (req, res) => {
  try {
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('*')
      .gt('end_date', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(challenges);
  } catch (error) {
    console.error('Fehler beim Abrufen der Challenges:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Challenges' });
  }
});

// 🔹 Challenge-Fortschritt aktualisieren
app.post('/challenges/:challengeId/progress', verifyToken, async (req, res) => {
  const { challengeId } = req.params;
  const { teamId, progress } = req.body;

  try {
    // Prüfen, ob der Benutzer Mitglied des Teams ist
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', req.user.id)
      .single();

    if (!teamMember) {
      return res.status(403).json({ message: 'Du bist kein Mitglied dieses Teams' });
    }

    // Challenge-Fortschritt aktualisieren
    const { error } = await supabase
      .from('challenge_progress')
      .upsert([{
        challenge_id: challengeId,
        team_id: teamId,
        progress: progress
      }]);

    if (error) throw error;

    res.json({ message: 'Fortschritt aktualisiert' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Fortschritts:', error);
    res.status(500).json({ message: 'Fehler beim Aktualisieren des Fortschritts' });
  }
});

// Benutzer-Profil Endpunkte
app.get('/users/:userId', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, goals, height, weight, profile_image, points, role')
      .eq('id', req.params.userId)
      .single();

    if (error) {
      console.error('Fehler beim Abrufen des Benutzerprofils:', error);
      throw error;
    }
    
    if (!data) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    res.json(data);
  } catch (error) {
    console.error('Fehler beim Abrufen des Benutzerprofils:', error);
    res.status(500).json({ message: error.message });
  }
});

app.put('/users/:userId', verifyToken, async (req, res) => {
  try {
    const { goals, height, weight, profile_image, name } = req.body;
    
    // Überprüfe, ob der Benutzer existiert
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', req.params.userId)
      .single();

    if (userError || !existingUser) {
      console.error('Benutzer nicht gefunden:', userError);
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    // Überprüfe, ob der authentifizierte Benutzer berechtigt ist
    if (req.user.id !== parseInt(req.params.userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Keine Berechtigung zum Bearbeiten dieses Profils' });
    }

    console.log('Aktualisiere Benutzerdaten:', {
      userId: req.params.userId,
      goals,
      height,
      weight,
      name,
      hasImage: !!profile_image
    });

    // Aktualisiere die Benutzerdaten
    const { data, error } = await supabase
      .from('users')
      .update({
        goals,
        height,
        weight,
        profile_image,
        name
      })
      .eq('id', req.params.userId)
      .select()
      .single();

    if (error) {
      console.error('Fehler beim Speichern:', error);
      throw error;
    }

    console.log('Erfolgreich gespeichert:', { 
      userId: data.id,
      name: data.name,
      hasImage: !!data.profile_image
    });
    
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Benutzerprofils:', error);
    res.status(500).json({ 
      message: 'Fehler beim Aktualisieren des Benutzerprofils',
      error: error.message 
    });
  }
});

// 🔹 Server starten
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});
