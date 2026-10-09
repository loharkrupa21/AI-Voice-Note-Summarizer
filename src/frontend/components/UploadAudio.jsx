import { useState } from "react";
import { api } from "../api/client";

function UploadAudio({ onTranscriptReady }) {
  const [audioFile, setAudioFile] = useState(null);
  const [audioURL, setAudioURL] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const [transcript, setTranscript] = useState("");

  // -----------------------------
  // SELECT AUDIO FILE
  // -----------------------------

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const allowedExtensions = [
      "mp3",
      "wav",
      "m4a",
      "webm",
      "ogg"
    ];

    const extension = file.name
      .toLowerCase()
      .split(".")
      .pop();

    if (!allowedExtensions.includes(extension)) {
      setAudioFile(null);
      setAudioURL(null);

      setError(
        "Please select a valid audio file. MP3, WAV, M4A, WEBM or OGG."
      );

      setMessage("");
      return;
    }

    setAudioFile(file);
    setAudioURL(URL.createObjectURL(file));

    setMessage("");
    setError("");
    setTranscript("");
  };

  // -----------------------------
  // UPLOAD + WHISPER
  // -----------------------------

  const handleUpload = async () => {
    if (!audioFile) {
      setError("Please select an audio file first.");
      return;
    }

    try {
      setError("");
      setMessage("");

      // GET USER
      const storedUser = localStorage.getItem("voicemind_user");

      if (!storedUser) {
        setError("Please login again.");
        return;
      }

      const user = JSON.parse(storedUser);

      if (!user.id) {
        setError("User ID not found. Please login again.");
        return;
      }

      // -----------------------------
      // STEP 1: UPLOAD
      // -----------------------------

      setUploading(true);
      setMessage("Uploading voice note...");

      const uploadResult = await api.uploadVoiceNote(
        audioFile,
        audioFile.name,
        user.id
      );

      console.log("UPLOAD RESULT:", uploadResult);

      const noteId = uploadResult.note_id;

      // Save note ID
      localStorage.setItem(
        "voicenote_note_id",
        String(noteId)
      );

      // Save audio name
      localStorage.setItem(
        "voicenote_audio_name",
        audioFile.name
      );

      // -----------------------------
      // STEP 2: WHISPER
      // -----------------------------

      setUploading(false);
      setTranscribing(true);

      setMessage("🎙️ Transcribing with Whisper...");

      console.log(
        "Sending note ID to Whisper:",
        noteId
      );

      const transcriptResult =
        await api.transcribe(noteId);

      console.log(
        "WHISPER API RESPONSE:",
        transcriptResult
      );

      const whisperTranscript =
        transcriptResult.transcript?.trim();

      if (!whisperTranscript) {
        throw new Error(
          "Whisper did not return any transcript."
        );
      }

      // -----------------------------
      // SAVE TRANSCRIPT
      // -----------------------------

      setTranscript(whisperTranscript);

      localStorage.setItem(
        "voicenote_transcript",
        whisperTranscript
      );

      console.log(
        "WHISPER TRANSCRIPT:",
        whisperTranscript
      );

      // -----------------------------
      // SEND TO PARENT
      // -----------------------------

      if (onTranscriptReady) {
        onTranscriptReady(
          whisperTranscript,
          noteId
        );
      }

      setTranscribing(false);

      setMessage(
        "✅ Whisper transcription completed successfully!"
      );

    } catch (error) {

      console.error(
        "UPLOAD / TRANSCRIPTION ERROR:",
        error
      );

      setUploading(false);
      setTranscribing(false);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    }
  };

  // -----------------------------
  // UI
  // -----------------------------

  return (
    <div className="upload-section">

      <h2>📁 Upload Audio</h2>

      <input
        type="file"
        accept=".mp3,.wav,.m4a,.webm,.ogg,audio/*"
        onChange={handleFileChange}
      />

      {audioFile && (
        <div>

          <p>
            Selected:{" "}
            <strong>{audioFile.name}</strong>
          </p>

          <audio
            controls
            src={audioURL}
          />

          <br />
          <br />

          <button
            onClick={handleUpload}
            disabled={
              uploading ||
              transcribing
            }
          >
            {uploading
              ? "Uploading..."
              : transcribing
              ? "Transcribing with Whisper..."
              : "Upload Voice Note"}
          </button>

        </div>
      )}

      {message && (
        <p style={{ color: "green" }}>
          {message}
        </p>
      )}

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      {/* Whisper Transcript Preview */}
      {transcript && (
        <div className="transcript-section">

          <h3>📝 Whisper Transcript</h3>

          <p>
            {transcript}
          </p>

        </div>
      )}

    </div>
  );
}

export default UploadAudio;