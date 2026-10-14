require('dotenv').config();
const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`=========================================`);
  console.log(`PIM Backend running at http://localhost:${PORT}`);
  console.log(`WooCommerce target: ${process.env.WOO_BASE_URL || 'http://localhost:5001'}`);
  console.log(`=========================================`);

  try {
    await db.query('SELECT 1');
    console.log(`[DB] Connected to MySQL database (${process.env.DB_NAME || 'pim_db'})`);
  } catch (err) {
    console.warn(`[DB Warning] Could not connect to MySQL database: ${err.message}`);
    console.warn(`[DB Warning] Ensure MySQL is running in XAMPP and run: npm run init-db`);
  }
});

module.exports = server;
