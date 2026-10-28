const express = require('express');
const cors = require('cors');
const db = require('./db');
const students = require('./routes/students');

const app = express();
app.use(cors());
app.use(express.json());

// Health check. Reports which database we are connected to, so Playwright
// can verify it is talking to the E2E backend and not the dev one.
app.get('/api/health', async (req, res) => {
  try {
    const { rows } = await db.raw('select current_database() as database');
    res.json({ status: 'ok', database: rows[0].database });
  } catch {
    res.status(503).json({ status: 'error' });
  }
});

app.use('/api/students', students);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Invalid ids like /api/students/abc raise a Postgres error (22P02) -> 404.
app.use((err, req, res, next) => {
  if (err.code === '22P02') return res.status(404).json({ error: 'Student not found' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
