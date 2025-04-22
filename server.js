const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_V56zLNDJUSiw@ep-restless-tree-a27zaj7b-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require',
});

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
const PORT = process.env.PORT || 5000;

// Mount auth routes
app.use('/api', authRoutes(pool, JWT_SECRET));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});