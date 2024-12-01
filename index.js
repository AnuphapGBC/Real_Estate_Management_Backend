require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors()); // To allow requests from your React frontend
app.use(express.json());

// Setup MySQL connection using a pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // Adjust this depending on your workload
  queueLimit: 0,
});

// Optimized database connection logging
(async () => {
  try {
    await db.promise().getConnection();
    console.log('Connected to MySQL database.');
  } catch (err) {
    console.error('Database connection failed:', err.stack);
  }
})();

// Utility function to build dynamic WHERE clauses
function buildWhereClause(filters, queryParams) {
  let whereClause = ' WHERE all_list_units.Status = "Available"';

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') {
      switch (key) {
        case 'floor':
          whereClause += ' AND all_list_units.Floor = ?';
          queryParams.push(value);
          break;
        case 'unit':
          whereClause += ' AND all_list_units.Unit LIKE ?';
          queryParams.push(`%${value}%`);
          break;
        case 'description':
          whereClause += ' AND LOWER(all_list_units.Description) LIKE ?';
          queryParams.push(`%${value.toLowerCase()}%`);
          break;
        case 'area':
          whereClause += ' AND all_list_units.Area = ?';
          queryParams.push(value);
          break;
        case 'price':
          whereClause += ' AND all_list_units.Price = ?';
          queryParams.push(value);
          break;
        case 'project_id':
          whereClause += ' AND LOWER(all_list_units.project_id) LIKE ?';
          queryParams.push(`%${value.toLowerCase()}%`);
          break;
        case 'type':
          whereClause += ' AND LOWER(all_list_units.Type) LIKE ?';
          queryParams.push(`%${value.toLowerCase()}%`);
          break;
        case 'balcony':
          whereClause += ' AND all_list_units.Balcony = ?';
          queryParams.push(value === 'true');
          break;
        case 'lanai':
          whereClause += ' AND all_list_units.Lanai = ?';
          queryParams.push(value === 'true');
          break;
        case 'location':
          whereClause += ' AND LOWER(projects.location) LIKE ?';
          queryParams.push(`%${value.toLowerCase()}%`);
          break;
      }
    }
  }

  return whereClause;
}

// API route for general search across multiple columns (with location)
app.get('/api/search', async (req, res) => {
  const filters = req.query;
  const queryParams = [];

  let sqlQuery = `
    SELECT all_list_units.*, projects.location 
    FROM all_list_units 
    JOIN projects ON all_list_units.project_id = projects.project_id
  `;

  sqlQuery += buildWhereClause(filters, queryParams);

  try {
    const [results] = await db.promise().query(sqlQuery, queryParams);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Start server on port 5001
app.listen(5001, () => {
  console.log('Server is running on port 5001');
});
