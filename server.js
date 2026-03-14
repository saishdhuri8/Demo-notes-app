const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Path to JSON file where notes are stored
const notesFilePath = path.join(__dirname, 'notes.json');

// Load notes from JSON file (or start with empty array)
let notes = [];
try {
  if (fs.existsSync(notesFilePath)) {
    const fileData = fs.readFileSync(notesFilePath, 'utf8');
    const parsed = JSON.parse(fileData);
    if (Array.isArray(parsed)) {
      notes = parsed
        .map((item, index) => {
          if (typeof item === 'string') {
            return {
              id: `migrated-${Date.now()}-${index}`,
              text: item,
              createdAt: new Date().toISOString(),
            };
          }
          if (item && typeof item === 'object' && typeof item.text === 'string') {
            return {
              id: item.id || `note-${Date.now()}-${index}`,
              text: item.text,
              createdAt: item.createdAt || new Date().toISOString(),
            };
          }
          return null;
        })
        .filter(Boolean);
    }
  }
} catch (err) {
  console.error('Could not read notes.json, starting with empty notes.', err);
  notes = [];
}

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

app.use(express.urlencoded({ extended: true }));

// Very small request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Home page - list notes and show form
app.get('/', (req, res) => {
  const notesList = notes
    .map((note, index) => {
      const created = note.createdAt ? new Date(note.createdAt) : null;
      const createdLabel = created
        ? created.toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Just now';

      return `
        <li>
          <div style="flex:1; display:flex; flex-direction:column; gap:2px;">
            <div style="font-size:0.8rem; text-transform:uppercase; letter-spacing:0.12em; color:rgba(148,163,184,0.95);">
              Note ${index + 1}
            </div>
            <div>${escapeHtml(note.text)}</div>
            <div style="font-size:0.7rem; color:rgba(148,163,184,0.9); margin-top:2px;">
              Saved at ${createdLabel}
            </div>
          </div>
          <form method="POST" action="/notes/${encodeURIComponent(note.id)}/delete" style="margin:0; display:flex; align-items:center;">
            <button type="submit" aria-label="Delete note ${index + 1}" style="padding:4px 10px; font-size:0.75rem; background:rgba(15,23,42,0.98); color:#fca5a5; border-radius:999px; border:1px solid rgba(248,113,113,0.6); box-shadow:none;">
              ✕
            </button>
          </form>
        </li>
      `;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Simple Notes App</title>
  <style>
    :root {
      --bg: #0f172a;
      --bg-card: #020617;
      --accent: #38bdf8;
      --accent-soft: rgba(56, 189, 248, 0.15);
      --accent-strong: #0284c7;
      --text-main: #e5e7eb;
      --text-muted: #9ca3af;
      --border-subtle: rgba(148, 163, 184, 0.4);
      --shadow-soft: 0 22px 45px rgba(15, 23, 42, 0.9);
      --radius-lg: 18px;
      --radius-pill: 999px;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: radial-gradient(circle at top left, #1d2032 0, #020617 40%, #000 100%);
      color: var(--text-main);
    }

    .app-shell {
      width: 100%;
      max-width: 960px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.94));
      border-radius: 24px;
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(148, 163, 184, 0.4);
      padding: 22px 24px 24px;
      position: relative;
      overflow: hidden;
    }

    .app-shell::before {
      content: "";
      position: absolute;
      inset: -40%;
      background:
        radial-gradient(circle at 0% 0%, rgba(56, 189, 248, 0.16) 0, transparent 55%),
        radial-gradient(circle at 120% 0%, rgba(129, 140, 248, 0.18) 0, transparent 50%);
      opacity: 0.9;
      pointer-events: none;
      z-index: 0;
    }

    .chrome-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
    }

    .dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: #f97373;
      box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.9);
    }

    .dot:nth-child(2) { background: #facc15; }
    .dot:nth-child(3) { background: #4ade80; }

    .app-body {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
      gap: 22px;
      position: relative;
      z-index: 1;
    }

    @media (max-width: 800px) {
      .app-shell {
        padding: 18px 16px 20px;
      }

      .app-body {
        grid-template-columns: minmax(0, 1fr);
      }
    }

    .header {
      margin-bottom: 10px;
    }

    .title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 4px;
    }

    h1 {
      font-size: 1.35rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .badge {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      padding: 4px 10px;
      border-radius: var(--radius-pill);
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(148, 163, 184, 0.5);
      color: var(--text-muted);
    }

    .accent-pill {
      font-size: 0.7rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: var(--radius-pill);
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.16), rgba(129, 140, 248, 0.18));
      border: 1px solid rgba(56, 189, 248, 0.7);
      color: var(--accent);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .accent-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: radial-gradient(circle at 30% 30%, #f9fafb 0, #38bdf8 40%, #0ea5e9 70%);
      box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.35);
    }

    .subtitle {
      margin: 2px 0 0;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .column {
      background: radial-gradient(circle at top left, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.96));
      border-radius: var(--radius-lg);
      padding: 14px 14px 16px;
      border: 1px solid rgba(148, 163, 184, 0.55);
      box-shadow: 0 14px 40px rgba(15, 23, 42, 0.9);
      position: relative;
      overflow: hidden;
    }

    .column::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at top right, rgba(56, 189, 248, 0.1), transparent 60%);
      opacity: 0.8;
      pointer-events: none;
    }

    .column-inner {
      position: relative;
      z-index: 1;
    }

    .column h2 {
      margin: 0 0 8px;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--text-muted);
    }

    .pill-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 8px;
    }

    .pill-row span {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 8px 0 0;
      max-height: 260px;
      overflow: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(148, 163, 184, 0.7) transparent;
    }

    ul::-webkit-scrollbar {
      width: 6px;
    }

    ul::-webkit-scrollbar-track {
      background: transparent;
    }

    ul::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.8);
      border-radius: 999px;
    }

    li {
      padding: 10px 10px 9px;
      border-radius: 11px;
      background: rgba(15, 23, 42, 0.96);
      border: 1px solid rgba(148, 163, 184, 0.6);
      margin-bottom: 7px;
      font-size: 0.85rem;
      line-height: 1.35;
      display: flex;
      gap: 8px;
    }

    li strong {
      font-size: 0.8rem;
      color: var(--accent);
      white-space: nowrap;
    }

    .empty-state {
      padding: 14px 12px;
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.96);
      border: 1px dashed rgba(148, 163, 184, 0.7);
      font-size: 0.85rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .empty-state span {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .spark {
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: radial-gradient(circle at 30% 25%, #f9fafb 0, #e5e7eb 16%, #22d3ee 40%, #0ea5e9 70%);
      box-shadow:
        0 0 12px rgba(56, 189, 248, 0.8),
        0 0 26px rgba(59, 130, 246, 0.8);
    }

    .form-note {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    form {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    textarea {
      width: 100%;
      min-height: 120px;
      resize: vertical;
      padding: 10px 11px;
      border-radius: 12px;
      border: 1px solid rgba(148, 163, 184, 0.7);
      background: rgba(15, 23, 42, 0.96);
      color: var(--text-main);
      font-size: 0.9rem;
      outline: none;
      box-shadow:
        0 0 0 1px rgba(8, 47, 73, 0.9),
        0 16px 32px rgba(15, 23, 42, 0.9);
      transition: border-color 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
    }

    textarea::placeholder {
      color: rgba(148, 163, 184, 0.9);
    }

    textarea:focus {
      border-color: var(--accent);
      box-shadow:
        0 0 0 1px rgba(56, 189, 248, 0.7),
        0 18px 40px rgba(15, 23, 42, 0.95);
      background: radial-gradient(circle at top, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.96));
    }

    .btn-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-top: 2px;
    }

    button {
      border: none;
      cursor: pointer;
      padding: 7px 18px;
      border-radius: var(--radius-pill);
      font-size: 0.85rem;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #0f172a;
      background: radial-gradient(circle at 0% 0%, #f9fafb 0, #e0f2fe 45%, #bae6fd 95%);
      box-shadow:
        0 10px 22px rgba(15, 23, 42, 0.95),
        0 0 0 1px rgba(15, 23, 42, 0.8);
      transition: transform 0.1s ease, box-shadow 0.1s ease, filter 0.1s ease;
    }

    button span {
      font-size: 1rem;
    }

    button:hover {
      transform: translateY(-1px);
      filter: brightness(1.05);
      box-shadow:
        0 14px 30px rgba(15, 23, 42, 0.96),
        0 0 0 1px rgba(15, 23, 42, 0.85);
    }

    button:active {
      transform: translateY(0);
      box-shadow:
        0 8px 18px rgba(15, 23, 42, 0.96),
        0 0 0 1px rgba(15, 23, 42, 0.9);
    }

    .hint {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="app-shell">
    <div class="chrome-bar">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>

    <div class="header">
      <div class="title-row">
        <h1>Simple Notes App</h1>
        <div class="accent-pill">
          <span class="accent-dot"></span>
          LIVE NOTES
        </div>
      </div>
      <p class="subtitle">No users. No login. Just fast little notes that stay on disk.</p>
    </div>

    <div class="app-body">
      <section class="column">
        <div class="column-inner">
          <div class="pill-row">
            <h2>Your Notes</h2>
            <span>${notes.length} active note${notes.length === 1 ? '' : 's'}</span>
          </div>

          ${
            notes.length
              ? `<ul>${notesList}</ul>`
              : `<div class="empty-state">
                  <span><span class="spark"></span>No notes yet. Capture your first thought for today.</span>
                  <span class="hint">They’re kept safely in notes.json</span>
                </div>`
          }
        </div>
      </section>

      <section class="column">
        <div class="column-inner">
          <div class="pill-row">
            <h2>New Note</h2>
            <span>Type → Save → Done</span>
          </div>
          <p class="form-note">Just type what’s on your mind and save. No titles, tags, or clutter.</p>

          <form method="POST" action="/notes">
            <textarea name="note" placeholder="Write a quick idea, reminder, or thought..." required></textarea>
            <div class="btn-row">
              <button type="submit">
                <span>✶</span>
                Save note
              </button>
              <span class="hint">Notes are stored in a simple JSON file on the server.</span>
            </div>
          </form>
        </div>
      </section>
    </div>
  </div>
</body>
</html>`;

  res.send(html);
});

// Handle new note submissions
app.post('/notes', (req, res) => {
  const { note } = req.body;
  if (note && note.trim()) {
    const trimmed = note.trim();
    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    notes.unshift(newNote);
    try {
      fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write to notes.json', err);
    }
  }
  res.redirect('/');
});

// Delete a note
app.post('/notes/:id/delete', (req, res) => {
  const { id } = req.params;
  if (id) {
    notes = notes.filter((note) => note.id !== id);
    try {
      fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write to notes.json after delete', err);
    }
  }
  res.redirect('/');
});

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Notes app listening at http://localhost:${PORT}`);
});

