const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors()); // To allow requests from your React frontend
app.use(express.json());

// Setup MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to MySQL database.');
});

// API route for general search across multiple columns (with location)
app.get('/api/search', (req, res) => {
  const { floor, unit, description, area, price, project_id, type, balcony, lanai, location } = req.query;

  // Update the SQL query to join the projects table
  let sqlQuery = `
    SELECT all_list_units.*, projects.location 
    FROM all_list_units 
    JOIN projects ON all_list_units.project_id = projects.project_id 
    WHERE all_list_units.Status = "Available"
  `; 
  const queryParams = [];

  if (floor) {
    sqlQuery += ' AND all_list_units.Floor = ?';
    queryParams.push(floor);
  }
  if (unit) {
    sqlQuery += ' AND all_list_units.Unit LIKE ?';
    queryParams.push(`%${unit}%`);
  }
  if (description) {
    sqlQuery += ' AND LOWER(all_list_units.Description) LIKE ?';
    queryParams.push(`%${description.toLowerCase()}%`);
  }
  if (area) {
    sqlQuery += ' AND all_list_units.Area = ?';
    queryParams.push(area);
  }
  if (price) {
    sqlQuery += ' AND all_list_units.Price = ?';
    queryParams.push(price);
  }
  if (project_id) {
    sqlQuery += ' AND LOWER(all_list_units.project_id) LIKE ?';
    queryParams.push(`%${project_id.toLowerCase()}%`);
  }
  if (type) {
    sqlQuery += ' AND LOWER(all_list_units.Type) LIKE ?';
    queryParams.push(`%${type.toLowerCase()}%`);
  }
  if (balcony !== undefined) {
    sqlQuery += ' AND all_list_units.Balcony = ?';
    queryParams.push(balcony === 'true');
  }
  if (lanai !== undefined) {
    sqlQuery += ' AND all_list_units.Lanai = ?';
    queryParams.push(lanai === 'true');
  }
  if (location) {
    sqlQuery += ' AND LOWER(projects.location) LIKE ?'; // Search in projects table
    queryParams.push(`%${location.toLowerCase()}%`);
  }

  db.query(sqlQuery, queryParams, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    res.json(results);
  });
});


// Start server on port 5001
app.listen(5001, () => {
  console.log('Server is running on port 5001');
});
