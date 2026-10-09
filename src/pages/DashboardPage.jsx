import { useRef } from "react";

import {
  Mic,
  UploadCloud,
  ArrowRight,
  Eye,
  Download,
  Trash2,
  Zap,
  Clock,
  Calendar,
  Star,
} from "lucide-react";

export default function DashboardPage({
  notes = [],
  selectedLanguage = "English",
  onLanguageChange,
  onNavigate,
  onViewNote,
  onDeleteNote,
  onStartRecording,
  onFileUpload,
}) {
  const fileInputRef = useRef(null);

  // =========================
  // QUICK STATS
  // =========================

  const totalNotesCount = notes.length;

  const totalSeconds = notes.reduce((acc, note) => {
    if (note.durationSeconds) {
      return acc + note.durationSeconds;
    }

    if (note.duration) {
      const parts = note.duration.split(":").map(Number);

      if (parts.length === 2) {
        return acc + parts[0] * 60 + parts[1];
      }
    }

    return acc;
  }, 0);

  const totalMins = Math.floor(totalSeconds / 60);
  const totalRemSecs = totalSeconds % 60;

  const formattedTotalDuration = `${totalMins}:${String(
    totalRemSecs
  ).padStart(2, "0")}`;

  // =========================
  // OPEN FILE SELECTOR
  // =========================

  const translations = {
    English: {
      title: "Create New Voice Note",
      subtitle: "Record your voice or upload an audio file to get an AI summary.",
      languageLabel: "Language",
      languageHelp: "Choose the language for transcription and summary",
      recordTitle: "Record Voice",
      recordSubtitle: "Start recording your voice note",
      startRecording: "Start Recording",
      uploadTitle: "Upload Audio",
      uploadSubtitle: "Supports MP3, WAV, M4A, WEBM, OGG (max 50MB)",
      chooseFile: "Choose File",
    },
    Marathi: {
      title: "नवीन व्हॉइस नोट तयार करा",
      subtitle: "तुमचा आवाज रेकॉर्ड करा किंवा ऑडिओ अपलोड करा आणि AI सारांश मिळवा.",
      languageLabel: "भाषा",
      languageHelp: "ट्रान्सक्रिप्शन आणि सारांशासाठी भाषा निवडा",
      recordTitle: "आवाज रेकॉर्ड करा",
      recordSubtitle: "तुमची व्हॉइस नोट सुरू करा",
      startRecording: "रेकॉर्डिंग सुरू करा",
      uploadTitle: "ऑडिओ अपलोड करा",
      uploadSubtitle: "MP3, WAV, M4A, WEBM, OGG (कमाल 50MB) सपोर्ट करते",
      chooseFile: "फाइल निवडा",
    },
    Hindi: {
      title: "नई वॉइस नोट बनाएं",
      subtitle: "अपना आवाज रिकॉर्ड करें या ऑडियो अपलोड करें और AI सारांश प्राप्त करें।",
      languageLabel: "भाषा",
      languageHelp: "ट्रांसक्रिप्शन और सारांश के लिए भाषा चुनें",
      recordTitle: "आवाज़ रिकॉर्ड करें",
      recordSubtitle: "अपना वॉइस नोट शुरू करें",
      startRecording: "रिकॉर्डिंग शुरू करें",
      uploadTitle: "ऑडियो अपलोड करें",
      uploadSubtitle: "MP3, WAV, M4A, WEBM, OGG (अधिकतम 50MB) समर्थित",
      chooseFile: "फाइल चुनें",
    },
  };

  const text = translations[selectedLanguage] || translations.English;

  const handleChooseFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // =========================
  // FILE SELECTED
  // =========================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    console.log("Selected file:", file);

    const maxSize = 50 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("Audio file is too large. Maximum size is 50MB.");
      event.target.value = "";
      return;
    }

    const allowedExtensions = [
      ".mp3",
      ".wav",
      ".m4a",
      ".webm",
      ".ogg",
    ];

    const fileName = file.name.toLowerCase();

    const isAllowed = allowedExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

    if (!isAllowed) {
      alert(
        "Please select a valid audio file: MP3, WAV, M4A, WEBM or OGG."
      );

      event.target.value = "";
      return;
    }

    if (typeof onFileUpload === "function") {
      onFileUpload(file);
    } else {
      console.error("onFileUpload function is not available.");
    }
  };

  // =========================
  // DOWNLOAD NOTE
  // =========================

  const handleDownloadNote = (note) => {
    const content = `
Title: ${note.title || "Voice Note"}

Date: ${
      note.date ||
      (note.createdAt
        ? new Date(note.createdAt).toLocaleDateString()
        : "-")
    }

Duration: ${note.duration || "00:00"}

Summary:
${note.summary || ""}

Key Points:
${(note.keyPoints || []).join("\n• ")}

Transcript:
${note.transcript || ""}
`;

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `${(note.title || "voice_note")
      .toLowerCase()
      .replace(/\s+/g, "_")}_summary.txt`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================
  // DASHBOARD UI
  // =========================

  return (
    <div
      className="dashboard-content-layout"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 360px",
        gap: "24px",
        width: "100%",
        padding: "24px",
        boxSizing: "border-box",
        minHeight: "calc(100vh - 120px)",
        background: "#f8fafc",
      }}
    >
      {/* =========================
          HIDDEN FILE INPUT
      ========================= */}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".mp3,.wav,.m4a,.webm,.ogg,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/webm,audio/ogg"
        style={{ display: "none" }}
      />

      {/* =========================
          LEFT COLUMN
      ========================= */}

      <div
        className="dashboard-main-col"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          minWidth: 0,
        }}
      >
        {/* =========================
            CREATE NEW VOICE NOTE
        ========================= */}

        <section
          className="create-note-outer-card"
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "28px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 30px rgba(15,23,42,0.06)",
          }}
        >
          <div
            className="create-note-header"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "24px",
            }}
          >
            <div
              className="create-note-icon-circle"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg,#4f46e5,#7c3aed)",
              }}
            >
              <Mic size={22} color="#ffffff" />
            </div>

            <div>
              <h2
                className="create-note-title"
                style={{
                  margin: 0,
                  fontSize: "22px",
                  color: "#111827",
                }}
              >
                {text.title}
              </h2>

              <p
                className="create-note-subtitle"
                style={{
                  margin: "5px 0 0",
                  color: "#6b7280",
                }}
              >
                {text.subtitle}
              </p>
            </div>
          </div>

          <div
            className="language-selector-row"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "22px",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", letterSpacing: "0.02em" }}>
                {text.languageLabel}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {text.languageHelp}
              </div>
            </div>

            <select
              value={selectedLanguage}
              onChange={(event) => onLanguageChange?.(event.target.value)}
              style={{
                minWidth: "180px",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "10px 12px",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "14px",
                fontWeight: 500,
                outline: "none",
                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
              }}
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Marathi</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
              <option>Arabic</option>
              <option>Japanese</option>
              <option>Portuguese</option>
            </select>
          </div>

          {/* RECORD / UPLOAD */}

          <div
            className="input-options-dual-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "18px",
            }}
          >
            {/* RECORD VOICE */}

            <div
              className="input-action-card record-card"
              style={{
                padding: "24px",
                borderRadius: "16px",
                border: "1px solid #e5e7eb",
                background: "#fafafa",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(135deg,#4f46e5,#7c3aed)",
                }}
              >
                <Mic size={25} color="#ffffff" />
              </div>

              <h3
                style={{
                  margin: "18px 0 8px",
                  fontSize: "18px",
                  color: "#111827",
                }}
              >
                {text.recordTitle}
              </h3>

              <p
                style={{
                  margin: "0 0 18px",
                  color: "#6b7280",
                }}
              >
                {text.recordSubtitle}
              </p>

              <button
                type="button"
                onClick={onStartRecording}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 600,
                  background:
                    "linear-gradient(135deg,#4f46e5,#7c3aed)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Mic size={18} />
                {text.startRecording}
              </button>
            </div>

            {/* UPLOAD AUDIO */}

            <div
              className="input-action-card upload-card"
              style={{
                padding: "24px",
                borderRadius: "16px",
                border: "1px solid #e5e7eb",
                background: "#fafafa",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#eff6ff",
                }}
              >
                <UploadCloud
                  size={25}
                  color="#3b82f6"
                />
              </div>

              <h3
                style={{
                  margin: "18px 0 8px",
                  fontSize: "18px",
                  color: "#111827",
                }}
              >
                {text.uploadTitle}
              </h3>

              <p
                style={{
                  margin: "0 0 18px",
                  color: "#6b7280",
                }}
              >
                {text.uploadSubtitle}
              </p>

              <button
                type="button"
                onClick={handleChooseFileClick}
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  padding: "11px 16px",
                  cursor: "pointer",
                  fontWeight: 600,
                  background: "#ffffff",
                  color: "#2563eb",
                  border: "1px solid #3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <UploadCloud size={18} />
                {text.chooseFile}
              </button>
            </div>
          </div>
        </section>

        {/* =========================
            RECENT NOTES
        ========================= */}

        <section
          className="recent-notes-card"
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 30px rgba(15,23,42,0.05)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "22px 24px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "19px",
                color: "#111827",
              }}
            >
              Recent Notes
            </h3>

            <button
              type="button"
              onClick={() => onNavigate("saved-notes")}
              style={{
                border: "none",
                background: "transparent",
                color: "#4f46e5",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontWeight: 600,
              }}
            >
              View All
              <ArrowRight size={15} />
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "14px 20px" }}>
                    #
                  </th>

                  <th style={{ padding: "14px 20px" }}>
                    Title
                  </th>

                  <th style={{ padding: "14px 20px" }}>
                    Duration
                  </th>

                  <th style={{ padding: "14px 20px" }}>
                    Date
                  </th>

                  <th
                    style={{
                      padding: "14px 20px",
                      textAlign: "right",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {notes.slice(0, 4).map((note, index) => (
                  <tr
                    key={note.id || index}
                    style={{
                      borderTop:
                        "1px solid #f1f5f9",
                    }}
                  >
                    <td style={{ padding: "16px 20px" }}>
                      {index + 1}
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <button
                        type="button"
                        onClick={() =>
                          onViewNote(note)
                        }
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          cursor: "pointer",
                          color: "#111827",
                          fontWeight: 600,
                        }}
                      >
                        {note.title || "Voice Note"}
                      </button>
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      {note.duration || "00:00"}
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      {note.date ||
                        (note.createdAt
                          ? new Date(
                              note.createdAt
                            ).toLocaleDateString()
                          : "-")}
                    </td>

                    <td
                      style={{
                        padding: "16px 20px",
                        textAlign: "right",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "flex-end",
                          gap: "7px",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            onViewNote(note)
                          }
                          title="View"
                          style={{
                            border: "none",
                            background: "#eff6ff",
                            color: "#2563eb",
                            borderRadius: "8px",
                            padding: "8px",
                            cursor: "pointer",
                          }}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadNote(note)
                          }
                          title="Download"
                          style={{
                            border: "none",
                            background: "#f5f3ff",
                            color: "#7c3aed",
                            borderRadius: "8px",
                            padding: "8px",
                            cursor: "pointer",
                          }}
                        >
                          <Download size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDeleteNote(note.id)
                          }
                          title="Delete"
                          style={{
                            border: "none",
                            background: "#fef2f2",
                            color: "#ef4444",
                            borderRadius: "8px",
                            padding: "8px",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {notes.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      style={{
                        padding: "35px 20px",
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      No voice notes yet. Create your
                      first voice note above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* =========================
          RIGHT COLUMN
      ========================= */}

      <div
        className="dashboard-side-col"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* QUICK STATS */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "20px",
            border: "1px solid #e5e7eb",
            boxShadow:
              "0 8px 25px rgba(15,23,42,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <Zap size={18} color="#f59e0b" />

            <h3
              style={{
                margin: 0,
                color: "#111827",
              }}
            >
              Quick Stats
            </h3>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <div
              style={{
                padding: "14px",
                background: "#eff6ff",
                borderRadius: "12px",
              }}
            >
              <Mic size={18} color="#3b82f6" />

              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  marginTop: "6px",
                }}
              >
                Total Notes
              </div>

              <strong
                style={{
                  fontSize: "20px",
                  color: "#111827",
                }}
              >
                {totalNotesCount}
              </strong>
            </div>

            <div
              style={{
                padding: "14px",
                background: "#f5f3ff",
                borderRadius: "12px",
              }}
            >
              <Clock size={18} color="#8b5cf6" />

              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  marginTop: "6px",
                }}
              >
                Total Duration
              </div>

              <strong
                style={{
                  fontSize: "20px",
                  color: "#111827",
                }}
              >
                {formattedTotalDuration}
              </strong>
            </div>

            <div
              style={{
                padding: "14px",
                background: "#ecfdf5",
                borderRadius: "12px",
              }}
            >
              <Calendar
                size={18}
                color="#10b981"
              />

              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  marginTop: "6px",
                }}
              >
                This Week
              </div>

              <strong
                style={{
                  fontSize: "20px",
                  color: "#111827",
                }}
              >
                2
              </strong>
            </div>

            <div
              style={{
                padding: "14px",
                background: "#fffbeb",
                borderRadius: "12px",
              }}
            >
              <Star
                size={18}
                color="#f59e0b"
              />

              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  marginTop: "6px",
                }}
              >
                Best Summary
              </div>

              <strong
                style={{
                  fontSize: "20px",
                  color: "#111827",
                }}
              >
                98%
              </strong>
            </div>
          </div>
        </div>

        {/* YOUR SUMMARIES */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "20px",
            border: "1px solid #e5e7eb",
            boxShadow:
              "0 8px 25px rgba(15,23,42,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <Star
              size={18}
              color="#8b5cf6"
            />

            <h3
              style={{
                margin: 0,
                color: "#111827",
              }}
            >
              Your Summaries
            </h3>
          </div>

          <div
            onClick={() =>
              onNavigate("saved-notes")
            }
            style={{
              padding: "14px 0",
              borderBottom:
                "1px solid #f1f5f9",
              cursor: "pointer",
            }}
          >
            <strong style={{ color: "#111827" }}>
              Get key points
            </strong>

            <p
              style={{
                margin: "4px 0 0",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              Important points at a glance
            </p>
          </div>

          <div
            onClick={() =>
              onNavigate("saved-notes")
            }
            style={{
              padding: "14px 0",
              borderBottom:
                "1px solid #f1f5f9",
              cursor: "pointer",
            }}
          >
            <strong style={{ color: "#111827" }}>
              Quick & Accurate
            </strong>

            <p
              style={{
                margin: "4px 0 0",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              Smart AI summaries
            </p>
          </div>

          <div
            onClick={() =>
              onNavigate("saved-notes")
            }
            style={{
              padding: "14px 0",
              cursor: "pointer",
            }}
          >
            <strong style={{ color: "#111827" }}>
              Secure & Private
            </strong>

            <p
              style={{
                margin: "4px 0 0",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              Your data is safe with us
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}