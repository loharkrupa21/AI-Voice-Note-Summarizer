const mysql = require("mysql2/promise");

require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || "ai_voice_note_summarizer",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "12345",

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();

    console.log("MySQL Connected Successfully!");

    connection.release();
  } catch (error) {
    console.error("MySQL Error:", error.message);
  }
}

testConnection();

module.exports = pool;