import { useState, useRef, useEffect } from "react";

import {
  UploadCloud,
  FileAudio,
  ArrowRight,
  Sparkles,
  Trash2
} from "lucide-react";
import { api } from "../api/client";

export default function UploadAudioPage({ onAudioReady, selectedLanguage = "English" }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);
  const audioUrlRef = useRef(null);

  const sampleAudioClips = [
    {
      id: "sample-1",
      title: "College Lecture - Computer Architecture",
      duration: "2:35",
      durationSeconds: 155,
      size: "2.4 MB",
      url: "https://actions.google.com/sounds/v1/speech/person_speaking.ogg",
      transcript:
        "In today's lecture on computer architecture, we covered the critical hazards in modern pipelined microprocessors: structural hazards, data hazards caused by read-after-write dependencies, and control hazards introduced by conditional branches."
    },
    {
      id: "sample-2",
      title: "Project Discussion - VoiceMind Sprint",
      duration: "4:12",
      durationSeconds: 252,
      size: "3.8 MB",
      url: "https://actions.google.com/sounds/v1/speech/person_speaking.ogg",
      transcript:
        "During the project sync, Krupa presented the UI components and design system for VoiceMind. The team agreed on the blue-purple gradient theme and verified all responsive breakpoints."
    },
    {
      id: "sample-3",
      title: "AI Concepts - Transformer Attention",
      duration: "3:28",
      durationSeconds: 208,
      size: "3.1 MB",
      url: "https://actions.google.com/sounds/v1/speech/person_speaking.ogg",
      transcript:
        "Analyzing multi-head self-attention mechanisms in Transformer models. Scaled dot-product attention queries and keys compute affinity weights."
    }
  ];

  const handleProcessFile = (file) => {
    setErrorMsg("");

    const validExtensions = [
      "mp3",
      "wav",
      "m4a",
      "ogg",
      "webm",
      "aac",
      "flac"
    ];

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (
      !validExtensions.includes(ext) &&
      !file.type.startsWith("audio/")
    ) {
      setErrorMsg(
        "Please select a supported audio file (.mp3, .wav, .m4a, .ogg, .webm, .aac)."
      );
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg("File size exceeds the 25MB limit.");
      return;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
    }

    const url = URL.createObjectURL(file);

    audioUrlRef.current = url;

    setSelectedFile(file);
    setAudioUrl(url);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];

    if (file) {
      handleProcessFile(file);
    }
  };

  const handleSelectSample = (sample) => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setSelectedFile({
      name: sample.title,
      size: 2.5 * 1024 * 1024,
      isSample: true,
      sampleData: sample
    });

    setAudioUrl(sample.url);
  };

  // ============================
  // UPLOAD TO FASTAPI
  // ============================
  const handleProceed = async () => {
  if (!selectedFile) {
    setErrorMsg("Please select an audio file.");
    return;
  }

  // Demo sample
  if (selectedFile.isSample) {
    onAudioReady({
      audioUrl: selectedFile.sampleData.url,
      duration: selectedFile.sampleData.duration,
      durationSeconds: selectedFile.sampleData.durationSeconds,
      title: selectedFile.sampleData.title,
      type: "uploaded",
      initialTranscript: selectedFile.sampleData.transcript,
    });

    return;
  }

  try {
    setErrorMsg("");
    setUploading(true);

    // Get logged-in user
    const storedUser = localStorage.getItem("voicemind_user");

    if (!storedUser) {
      setErrorMsg("Please login again.");
      return;
    }

    const user = JSON.parse(storedUser);

    if (!user.id) {
      setErrorMsg("User ID not found. Please login again.");
      return;
    }

    // Upload audio file to backend
    const uploadResult = await api.uploadVoiceNote(
      selectedFile,
      selectedFile.name,
      user.id
    );

    console.log("Upload result:", uploadResult);

    // Get database voice note ID
    const noteId = uploadResult.note_id;

    if (!noteId) {
      throw new Error(
        "Voice note ID was not returned by the backend."
      );
    }

    // Pass uploaded audio details to processing pipeline for real Whisper transcription
    onAudioReady({
      audioUrl: audioUrl,
      duration: "00:00",
      durationSeconds: 0,
      title: selectedFile.name.replace(/\.[^/.]+$/, ""),
      type: "uploaded",
      audioBlob: selectedFile,
      noteId: noteId,
      language: selectedLanguage,
    });

  } catch (error) {
    console.error(
      "Audio processing error:",
      error
    );

    setErrorMsg(
      error instanceof Error
        ? error.message
        : "Failed to process audio."
    );

  } finally {
    setUploading(false);
  }
};
  

  const clearSelectedFile = () => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setSelectedFile(null);
    setAudioUrl(null);
    setErrorMsg("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(2)) +
      " " +
      sizes[i]
    );
  };

  return (
    <div className="studio-container-card">

      <div className="studio-card-header">
        <div className="studio-header-icon-wrap upload-gradient-icon">
          <UploadCloud size={22} color="#FFFFFF" />
        </div>

        <div>
          <h2>Upload Audio File</h2>

          <p>
            Upload a meeting recording, lecture, or voice memo in MP3,
            WAV, or M4A format.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="error-alert-banner">
          <span>{errorMsg}</span>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.aac"
        style={{ display: "none" }}
      />

      {!audioUrl ? (
        <>
          <div
            className={`drag-drop-zone ${
              isDragging ? "drag-over" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="drop-icon-circle">
              <UploadCloud
                size={38}
                className="cloud-bounce-icon"
              />
            </div>

            <h3>Drag & Drop your audio file here</h3>

            <p className="drop-sub-text">
              or{" "}
              <span className="browse-text">
                browse from your computer
              </span>
            </p>

            <div className="supported-formats-pills">
              <span>MP3</span>
              <span>WAV</span>
              <span>M4A</span>
              <span>OGG</span>
              <span>WebM</span>
              <span>AAC</span>
              <span className="limit-pill">
                Max 25MB
              </span>
            </div>
          </div>

          <div className="quick-samples-section">

            <div className="samples-header">
              <Sparkles
                size={16}
                className="sparkle-gold"
              />

              <span>
                Or choose a demo audio sample to test instantly:
              </span>
            </div>

            <div className="samples-grid">

              {sampleAudioClips.map((sample) => (
                <div
                  key={sample.id}
                  className="sample-item-card"
                  onClick={() => handleSelectSample(sample)}
                >
                  <div className="sample-icon-wrap">
                    <FileAudio
                      size={20}
                      color="#3B82F6"
                    />
                  </div>

                  <div className="sample-info-wrap">
                    <h4>{sample.title}</h4>

                    <span className="sample-meta">
                      {sample.duration} • {sample.size}
                    </span>
                  </div>

                  <button className="sample-pick-btn">
                    Select
                  </button>
                </div>
              ))}

            </div>
          </div>
        </>
      ) : (

        <div className="file-selected-view">

          <div className="file-summary-card">

            <div className="file-meta-left">

              <div className="file-audio-icon-box">
                <FileAudio
                  size={24}
                  color="#6366F1"
                />
              </div>

              <div className="file-details">

                <h4>
                  {selectedFile?.name || "Audio Note"}
                </h4>

                <p>
                  {formatFileSize(selectedFile?.size)} •
                  Ready for AI processing
                </p>

              </div>
            </div>

            <button
              className="remove-file-btn"
              onClick={clearSelectedFile}
              title="Change audio file"
            >
              <Trash2 size={16} />
              <span>Change</span>
            </button>

          </div>

          <div className="upload-actions-row">

            <button
              className="secondary-studio-btn"
              onClick={clearSelectedFile}
              disabled={uploading}
            >
              Upload Different File
            </button>

            <button
              className="primary-studio-btn proceed-btn"
              onClick={handleProceed}
              disabled={uploading}
            >
              <span>
                {uploading
                  ? "Uploading..."
                  : "Convert Speech to Text"}
              </span>

              {!uploading && <ArrowRight size={18} />}
            </button>

          </div>

        </div>
      )}
    </div>
  );
}