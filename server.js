const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Path to JSON file where notes are stored
const notesFilePath = path.join(__dirname, 'notes.json');

// Load notes from JSON file (or start with empty array)
let notes = [];
try {
  if (fs.existsSync(notesFilePath)) {
    const fileData = fs.readFileSync(notesFilePath, 'utf8');
    notes = JSON.parse(fileData);
    if (!Array.isArray(notes)) {
      notes = [];
    }
  }
} catch (err) {
  console.error('Could not read notes.json, starting with empty notes.', err);
  notes = [];
}

app.use(express.urlencoded({ extended: true }));

// Home page - list notes and show form
app.get('/', (req, res) => {
  const notesList = notes
    .map(
      (note, index) =>
        `<li><strong>Note ${index + 1}:</strong> ${note}</li>`
    )
    .join('') || '<li>No notes yet.</li>';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Simple Notes App</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; max-width: 800px; }
    h1 { margin-bottom: 0.5rem; }
    form { margin-top: 1.5rem; }
    textarea { width: 100%; height: 100px; padding: 8px; box-sizing: border-box; }
    button { margin-top: 0.5rem; padding: 8px 16px; cursor: pointer; }
    ul { padding-left: 1.25rem; }
    li { margin-bottom: 0.25rem; }
    .notes-box { margin-top: 1.5rem; padding: 1rem; background: #f7f7f7; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Simple Notes App</h1>
  <p>No users, no login. Just notes stored in memory.</p>

  <div class="notes-box">
    <h2>Existing Notes</h2>
    <ul>
      ${notesList}
    </ul>
  </div>

  <form method="POST" action="/notes">
    <h2>Add a New Note</h2>
    <textarea name="note" placeholder="Type your note here..." required></textarea>
    <br />
    <button type="submit">Save Note</button>
  </form>
</body>
</html>`;

  res.send(html);
});

// Handle new note submissions
app.post('/notes', (req, res) => {
  const { note } = req.body;
  if (note && note.trim()) {
    notes.push(note.trim());
    try {
      fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write to notes.json', err);
    }
  }
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Notes app listening at http://localhost:${port}`);
});

