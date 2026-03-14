# Simple Notes App (Node + Express)

This is a small but polished notes app built with Node.js and Express.  
No users, no login, no third‑party services — just a simple JSON file for storage and clean HTML rendered directly from the backend.

## How to run

1. Make sure you are in this folder in your terminal:
   ```bash
   cd "c:\\Development\\DEVOOPS\\JENKINS\\Demo project"
   ```

2. Install dependencies (only needed once, already done if you ran `npm install`):
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and go to:
   - `http://localhost:3000`
   - Health check (optional): `http://localhost:3000/health`

## What it does

- Shows a list of all notes on the home page.
- Lets you add a new note with a simple HTML form.
- Stores notes in a local `notes.json` file so they survive restarts.
- Lets you delete notes with a single click.
- Uses a more modern, dark UI with no frontend framework.

## Docker

You can also run it in Docker:

```bash
docker build -t simple-notes-app .
docker run -p 3000:3000 simple-notes-app
```

