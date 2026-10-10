-- =========================================================
-- AI Voice Note Summarizer - MySQL Database Schema
-- Compatible with Railway MySQL, Render, and Local MySQL 8.0
-- =========================================================

CREATE DATABASE IF NOT EXISTS ai_voice_note_summarizer;
USE ai_voice_note_summarizer;

-- ---------------------------------------------------------
-- Users Table
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Voice Notes Table
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS voice_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    upload_voice VARCHAR(500) DEFAULT NULL,
    recorded_voice VARCHAR(500) DEFAULT NULL,
    transcript LONGTEXT DEFAULT NULL,
    summary LONGTEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_note_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
