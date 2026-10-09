
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

// REGISTER API
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.trim().toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name.trim(), email.trim().toLowerCase(), hashedPassword]
    );

    res.status(201).json({
      message: "Registration successful",
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({
      message: "Registration failed"
    });
  }
});

// LOGIN API
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      message: "Login failed"
    });
  }
});

module.exports = router;