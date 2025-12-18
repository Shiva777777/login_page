const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// DB pool (Docker me DATABASE_URL set hoga; local me defaults use honge)
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
} else {
  pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'postgres',
    port: Number(process.env.PGPORT) || 5432,
  });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Root: serve login/register page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Register API
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ ok: false, message: 'Saari fields required hain.' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ ok: false, message: 'Email pehle se registered hai.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)',
      [name, email, passwordHash]
    );

    res.json({ ok: true, message: 'Registration successful!' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// Login API
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email aur password required hain.' });
    }

    const { rows } = await pool.query('SELECT id, password_hash, name FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ ok: false, message: 'Galat email ya password.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ ok: false, message: 'Galat email ya password.' });
    }

    res.json({ ok: true, message: `Login successful! Swagat hai, ${user.name}.` });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} par chal raha hai`);
});