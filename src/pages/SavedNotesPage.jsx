import { useState } from "react";
import {
  FolderClock,
  Search,
  Eye,
  Download,
  Trash2,
  Copy,
  Check,
  Calendar,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
  Plus,
} from "lucide-react";

export default function SavedNotesPage({
  notes = [],
  onViewNote,
  onDeleteNote,
  onCreateNewNote,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [copiedId, setCopiedId] = useState(null);

  const categories = [
    "All",
    "College",
    "Work",
    "Research",
    "Personal",
  ];

  const safeNotes = Array.isArray(notes)
    ? notes
    : [];

  const filteredNotes = safeNotes.filter(
    (note) => {
      const title =
        note.title || "Voice Note";

      const summary =
        note.summary || "";

      const transcript =
        note.transcript ||
        note.transcript_text ||
        "";

      const topics =
        Array.isArray(note.topics)
          ? note.topics
          : [];

      const category =
        note.category || "General";

      const term =
        searchTerm.toLowerCase();

      const matchesCategory =
        selectedCategory === "All" ||
        category === selectedCategory;

      const matchesSearch =
        title
          .toLowerCase()
          .includes(term) ||
        summary
          .toLowerCase()
          .includes(term) ||
        transcript
          .toLowerCase()
          .includes(term) ||
        topics.some((topic) =>
          String(topic)
            .toLowerCase()
            .includes(term)
        );

      return (
        matchesCategory &&
        matchesSearch
      );
    }
  );

  // =====================================================
  // COPY
  // =====================================================

  const handleCopyNote = async (note) => {
    const transcript =
      note.transcript ||
      note.transcript_text ||
      "";

    const text = `Title: ${
      note.title || "Voice Note"
    }

Date: ${
      note.date ||
      note.created_at ||
      "N/A"
    }

Summary:
${
  note.summary ||
  "No summary available."
}

Key Points:
${
  Array.isArray(note.keyPoints)
    ? note.keyPoints
        .map(
          (point) => `• ${point}`
        )
        .join("\n")
    : "No key points available."
}

Transcript:
${
  transcript ||
  "No transcript available."
}`;

    try {
      await navigator.clipboard.writeText(
        text
      );

      setCopiedId(note.id);

      setTimeout(
        () => setCopiedId(null),
        2000
      );
    } catch (error) {
      console.error(
        "Copy failed:",
        error
      );
    }
  };

  // =====================================================
  // DOWNLOAD
  // =====================================================

  const handleDownloadNote = (note) => {
    const transcript =
      note.transcript ||
      note.transcript_text ||
      "";

    const content = `Title: ${
      note.title || "Voice Note"
    }

Category: ${
      note.category || "Voice Note"
    }

Date: ${
      note.date ||
      note.created_at ||
      "N/A"
    }

Duration: ${
      note.duration || "N/A"
    }

AI Summary:
${
  note.summary ||
  "No summary available."
}

Key Points:
${
  Array.isArray(note.keyPoints)
    ? note.keyPoints
        .map(
          (point) => `* ${point}`
        )
        .join("\n")
    : "No key points available."
}

Transcript:
${
  transcript ||
  "No transcript available."
}`;

    const blob = new Blob(
      [content],
      {
        type:
          "text/plain;charset=utf-8",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download = `${
      (note.title || "voice_note")
        .toLowerCase()
        .replace(/\s+/g, "_")
    }_summary.txt`;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  // =====================================================
  // VIEW NOTE
  // =====================================================

  const handleViewNote = (note) => {
    const normalizedNote = {
      ...note,

      id: note.id,

      title:
        note.title ||
        "Voice Note",

      transcript:
        note.transcript ||
        note.transcript_text ||
        "",

      summary:
        note.summary ||
        "",

      date:
        note.date ||
        (
          note.created_at
            ? new Date(
                note.created_at
              ).toLocaleDateString()
            : "N/A"
        ),

      duration:
        note.duration ||
        "00:00",

      category:
        note.category ||
        "Voice Note",

      keyPoints:
        Array.isArray(
          note.keyPoints
        )
          ? note.keyPoints
          : [],

      actionItems:
        Array.isArray(
          note.actionItems
        )
          ? note.actionItems
          : [],

      topics:
        Array.isArray(
          note.topics
        )
          ? note.topics
          : [],

      accuracy:
        note.accuracy ||
        98,
    };

    console.log(
      "VIEWING NOTE:",
      normalizedNote
    );

    onViewNote(
      normalizedNote
    );
  };

  return (
    <div className="saved-notes-page-container">

      {/* HEADER */}

      <div className="saved-notes-header-row">

        <div className="title-and-badge">

          <div className="history-icon-circle">
            <FolderClock
              size={22}
              color="#FFFFFF"
            />
          </div>

          <div>
            <h2>
              Saved Voice Notes
            </h2>

            <p>
              Access your complete history
              of audio notes, summaries,
              and transcripts.
            </p>
          </div>

          <span className="total-notes-pill">
            {safeNotes.length} Total
          </span>

        </div>

        <button
          className="primary-studio-btn create-new-btn"
          onClick={
            onCreateNewNote
          }
        >
          <Plus size={18} />
          <span>
            Record New Note
          </span>
        </button>

      </div>

      {/* FILTER */}

      <div className="saved-notes-filter-bar">

        <div className="search-input-box">

          <Search
            size={18}
            className="search-bar-icon"
          />

          <input
            type="text"
            placeholder="Search notes by title, topic, or content..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
          />

        </div>

        <div className="category-pills-row">

          {categories.map(
            (category) => (

              <button
                key={category}
                className={`cat-pill-btn ${
                  selectedCategory ===
                  category
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setSelectedCategory(
                    category
                  )
                }
              >
                {category}
              </button>

            )
          )}

        </div>

        <div className="view-mode-toggle">

          <button
            className={`view-toggle-btn ${
              viewMode === "grid"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setViewMode("grid")
            }
          >
            <LayoutGrid size={16} />
          </button>

          <button
            className={`view-toggle-btn ${
              viewMode === "table"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setViewMode("table")
            }
          >
            <List size={16} />
          </button>

        </div>

      </div>

      {/* EMPTY */}

      {filteredNotes.length === 0 ? (

        <div className="saved-empty-state">

          <FolderClock
            size={48}
            className="empty-clock-icon"
          />

          <h3>
            No Voice Notes Found
          </h3>

          <p>
            Try searching for a different
            keyword or record your first
            voice note.
          </p>

          <button
            className="primary-studio-btn"
            onClick={
              onCreateNewNote
            }
          >
            <Plus size={16} />
            <span>
              Create New Voice Note
            </span>
          </button>

        </div>

      ) : viewMode === "grid" ? (

        <div className="notes-cards-grid">

          {filteredNotes.map(
            (note) => {

              const transcript =
                note.transcript ||
                note.transcript_text ||
                "";

              return (
                <div
                  key={note.id}
                  className="note-card-item"
                >

                  <div className="note-card-top">

                    <span className="card-category-badge">
                      {note.category ||
                        "General"}
                    </span>

                    <div className="card-top-actions">

                      <button
                        className="card-mini-btn"
                        onClick={() =>
                          handleCopyNote(
                            note
                          )
                        }
                      >
                        {copiedId ===
                        note.id ? (
                          <Check
                            size={14}
                            color="#10B981"
                          />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>

                      <button
                        className="card-mini-btn"
                        onClick={() =>
                          handleDownloadNote(
                            note
                          )
                        }
                      >
                        <Download
                          size={14}
                        />
                      </button>

                      <button
                        className="card-mini-btn delete-mini"
                        onClick={() =>
                          onDeleteNote(
                            note.id
                          )
                        }
                      >
                        <Trash2 size={14} />
                      </button>

                    </div>

                  </div>

                  <h3
                    className="card-title"
                    onClick={() =>
                      handleViewNote(
                        note
                      )
                    }
                  >
                    {note.title ||
                      "Voice Note"}
                  </h3>

                  <div className="card-meta-line">

                    <span className="card-meta-item">
                      <Calendar size={12} />
                      {note.date ||
                        note.created_at ||
                        "N/A"}
                    </span>

                    <span className="card-meta-item">
                      <Clock size={12} />
                      {note.duration ||
                        "00:00"}
                    </span>

                  </div>

                  <p className="card-summary-snippet">

                    {note.summary ||
                      (
                        transcript
                          ? transcript.substring(
                              0,
                              150
                            )
                          : "No summary available."
                      )}

                  </p>

                  {Array.isArray(
                    note.topics
                  ) &&
                    note.topics.length >
                      0 && (

                      <div className="card-topics-wrap">

                        {note.topics
                          .slice(
                            0,
                            3
                          )
                          .map(
                            (
                              topic,
                              index
                            ) => (

                              <span
                                key={index}
                                className="card-topic-tag"
                              >
                                #{topic}
                              </span>

                            )
                          )}

                      </div>

                    )}

                  <div className="card-bottom-bar">

                    <span className="card-accuracy-chip">
                      <Sparkles
                        size={12}
                      />
                      {note.accuracy ||
                        98}
                      % match
                    </span>

                    <button
                      className="card-view-btn"
                      onClick={() =>
                        handleViewNote(
                          note
                        )
                      }
                    >
                      <Eye size={14} />

                      <span>
                        View Details
                      </span>
                    </button>

                  </div>

                </div>
              );
            }
          )}

        </div>

      ) : (

        <div className="saved-table-wrapper">

          <table className="notes-table">

            <thead>

              <tr>

                <th>#</th>
                <th>Title</th>
                <th>Category</th>
                <th>Duration</th>
                <th>Date</th>
                <th>Accuracy</th>
                <th>
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredNotes.map(
                (note, index) => (

                  <tr
                    key={note.id}
                    className="note-row-item"
                  >

                    <td className="row-index">
                      {index + 1}
                    </td>

                    <td className="row-title">

                      <span
                        className="note-title-text"
                        onClick={() =>
                          handleViewNote(
                            note
                          )
                        }
                      >
                        {note.title ||
                          "Voice Note"}
                      </span>

                    </td>

                    <td>
                      <span className="table-cat-pill">
                        {note.category ||
                          "General"}
                      </span>
                    </td>

                    <td className="row-duration">
                      {note.duration ||
                        "00:00"}
                    </td>

                    <td className="row-date">
                      {note.date ||
                        note.created_at ||
                        "N/A"}
                    </td>

                    <td>

                      <span className="accuracy-pill-table">

                        <Sparkles
                          size={12}
                        />

                        {note.accuracy ||
                          98}
                        %

                      </span>

                    </td>

                    <td className="row-actions">

                      <div className="action-buttons-group">

                        <button
                          className="table-icon-btn view-btn"
                          onClick={() =>
                            handleViewNote(
                              note
                            )
                          }
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          className="table-icon-btn download-btn"
                          onClick={() =>
                            handleDownloadNote(
                              note
                            )
                          }
                        >
                          <Download
                            size={16}
                          />
                        </button>

                        <button
                          className="table-icon-btn delete-btn"
                          onClick={() =>
                            onDeleteNote(
                              note.id
                            )
                          }
                        >
                          <Trash2
                            size={16}
                          />
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}