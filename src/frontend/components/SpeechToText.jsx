import { useState } from "react";

function SpeechToText() {
  const [noteId, setNoteId] = useState("");
  const [language, setLanguage] = useState("English");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const convertToText = async () => {
    if (!noteId) {
      setError("Note ID is required.");
      return;
    }

    setLoading(true);
    setError("");
    setTranscript("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/transcription",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            note_id: Number(noteId),
            language: language,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Transcription failed");
      }

      setTranscript(data.transcript);
    } catch (err) {
      console.error("Transcription error:", err);
      setError(err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feature-card speech-card">
      <div className="icon">🗣️</div>

      <h2>Speech-to-Text</h2>

      <p>
        Convert your voice recording into text.
      </p>

      <input
        type="number"
        placeholder="Enter Note ID"
        value={noteId}
        onChange={(e) => setNoteId(e.target.value)}
      />

      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="English">English</option>
        <option value="Marathi">Marathi</option>
        <option value="Hindi">Hindi</option>
        <option value="Gujarati">Gujarati</option>
        <option value="Bengali">Bengali</option>
        <option value="Tamil">Tamil</option>
        <option value="Telugu">Telugu</option>
        <option value="Kannada">Kannada</option>
        <option value="Malayalam">Malayalam</option>
        <option value="Punjabi">Punjabi</option>
        <option value="Urdu">Urdu</option>
        <option value="French">French</option>
        <option value="German">German</option>
        <option value="Spanish">Spanish</option>
        <option value="Italian">Italian</option>
      </select>

      <button onClick={convertToText} disabled={loading}>
        {loading ? "Converting..." : "Convert Speech to Text"}
      </button>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      <div className="transcript-box">
        {transcript ? (
          <p>{transcript}</p>
        ) : (
          <p>Your converted transcript will appear here...</p>
        )}
      </div>
    </div>
  );
}

export default SpeechToText;