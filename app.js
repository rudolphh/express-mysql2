const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

require('dotenv').config();

const port = process.env.PORT;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  // port: process.env.DB_PORT
}); 

app.use(async function(req, res, next) {
  try {
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    await req.db.query(`SET SESSION sql_mode = "TRADITIONAL"`);
    await req.db.query(`SET time_zone = '-8:00'`);

    await next();

    req.db.release();
  } catch (err) {
    console.log(err);

    if (req.db) req.db.release();
    throw err;
  }
});

app.use(cors());

app.use(express.json());

app.get('/cars', async function(req, res) {
  try {
    console.log('/cars');
    // simple query
    const [rows, fields] = await req.db.query('SELECT * FROM car');

    res.json(rows)

  } catch (err) {
    
  }
});

app.use(async function(req, res, next) {
  try {
    console.log('Middleware after the get /cars');
  
    await next();

  } catch (err) {

  }
});


app.post('/car', async function(req, res) {
  try {
    const { make, model, year } = req.body;
  
    const results = await req.db.query(
      `INSERT INTO car (make, model, year) 
       VALUES (:make, :model, :year)`,
      {
        make,
        model,
        year,
      }
    );
  
    res.json({ success: true, message: 'Car successfully created', data: results });
  } catch (err) {
    res.json({ success: false, message: err, data: null })
  }
});

app.delete('/car/:id', async function(req,res) {
  try {
    console.log('req.params /car/:id', req.params)

    const [results] = await req.db.query('UPDATE car SET `deleted_flag`=1 WHERE id=:id', { id: req.params.id });
    if(results["affectedRows"] === 0)
      throw new Error('Delete failed');
    res.json({ success: true, message: 'Car successfully deleted', data: results });
  } catch (err) {
    res.json({ success: false, message: 'Delete car failed', err: err.message })
  }
});

app.put('/car', async function(req,res) {
  try {
    const results = await req.db.query(
      'UPDATE `car` SET `make`=:make, `model`=:model, `year`=:year, `deleted_flag`=:deleted_flag WHERE `id`=:id',
      req.body); 

      res.json({ success: true, message: "update successful", data: results})
  } catch (err) {
    res.json({ success: false, message: err.message })
  }
});


app.listen(port, () => console.log(`212 API Example listening on http://localhost:${port}`));
