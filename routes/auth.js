const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

module.exports = (pool, JWT_SECRET) => {
  // Signup endpoint
  router.post('/signup', async (req, res) => {
    const { firstName, lastName, email, birthDate, password, role } = req.body;

    // Validate role
    if (!['organizer', 'attendee'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be organizer or attendee' });
    }

    try {
      const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (first_name, last_name, email, birth_date, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role',
        [firstName, lastName, email, birthDate, hashedPassword, role]
      );

      const user = result.rows[0];
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
        expiresIn: '1h',
      });

      res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Login endpoint
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
        expiresIn: '1h',
      });

      res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};