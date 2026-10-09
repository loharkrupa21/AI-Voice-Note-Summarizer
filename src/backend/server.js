const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);
const voiceNotesRoutes = require("./routes/voiceNotes");
app.use("/api/voice-notes", voiceNotesRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "AI Voice Summarizer Backend is running!"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});