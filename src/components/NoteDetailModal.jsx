import { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  Tag,
  Copy,
  Download,
  Check,
  FileText,
  Sparkles,
  Radio,
  Trash2,
} from "lucide-react";

export default function NoteDetailModal({
  note,
  onClose,
  onDelete,
}) {
  const [activeTab, setActiveTab] =
    useState("summary");

  const [copied, setCopied] =
    useState(false);

  const [actionItems, setActionItems] =
    useState(note?.actionItems || []);

  if (!note) return null;

  // =====================================================
  // SAFE VALUES
  // =====================================================

  const transcript =
    note.transcript ||
    note.transcript_text ||
    "";

  const summary =
    note.summary ||
    "";

  const title =
    note.title ||
    "Voice Note";

  const date =
    note.date ||
    note.created_at ||
    "N/A";

  const duration =
    note.duration ||
    "N/A";

  const category =
    note.category ||
    "Voice Note";

  const keyPoints =
    Array.isArray(note.keyPoints)
      ? note.keyPoints
      : [];

  const topics =
    Array.isArray(note.topics)
      ? note.topics
      : [];

  // =====================================================
  // ACTION ITEM
  // =====================================================

  const toggleActionItem = (index) => {
    setActionItems((previous) =>
      previous.map((item, idx) =>
        idx === index
          ? {
              ...item,
              done: !item.done,
            }
          : item
      )
    );
  };

  // =====================================================
  // COPY
  // =====================================================

  const handleCopySummary = async () => {
    const content = `Title: ${title}

Date: ${date}

Summary:
${summary || "No summary available."}

Key Points:
${
  keyPoints.length > 0
    ? keyPoints
        .map((point) => `• ${point}`)
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
        content
      );

      setCopied(true);

      setTimeout(
        () => setCopied(false),
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

  const handleDownload = (
    format = "txt"
  ) => {
    let content = "";

    let filename =
      title
        .toLowerCase()
        .replace(/\s+/g, "_") +
      "_summary";

    if (format === "txt") {
      content = `
========================================================
AI VOICE NOTE SUMMARIZER
========================================================

Title: ${title}
Date: ${date}
Duration: ${duration}
Category: ${category}

----------------- SUMMARY -----------------

${
  summary ||
  "No summary available."
}

----------------- KEY POINTS -----------------

${
  keyPoints.length > 0
    ? keyPoints
        .map(
          (point) => `* ${point}`
        )
        .join("\n")
    : "No key points available."
}

----------------- ACTION ITEMS -----------------

${
  actionItems.length > 0
    ? actionItems
        .map(
          (item) =>
            `[${item.done ? "X" : " "}] ${
              item.text
            }`
        )
        .join("\n")
    : "No action items."
}

----------------- FULL TRANSCRIPT -----------------

${
  transcript ||
  "No transcript available."
}

========================================================
`;

      filename += ".txt";
    }

    if (format === "md") {
      content = `# ${title}

- **Date:** ${date}
- **Duration:** ${duration}
- **Category:** ${category}

## Summary

${
  summary ||
  "No summary available."
}

## Key Points

${
  keyPoints.length > 0
    ? keyPoints
        .map(
          (point) => `- ${point}`
        )
        .join("\n")
    : "No key points available."
}

## Action Items

${
  actionItems.length > 0
    ? actionItems
        .map(
          (item) =>
            `- [${
              item.done ? "x" : " "
            }] ${item.text}`
        )
        .join("\n")
    : "No action items."
}

## Transcript

${
  transcript ||
  "No transcript available."
}
`;

      filename += ".md";
    }

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
    a.download = filename;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className="modal-backdrop-overlay"
      onClick={onClose}
    >
      <div
        className="note-modal-card"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="note-modal-header">

          <div className="modal-title-left">

            <span className="modal-category-badge">
              {category}
            </span>

            <h2>{title}</h2>

            <div className="modal-meta-row">

              <span className="meta-pill">
                <Calendar size={13} />
                {date}
              </span>

              <span className="meta-pill">
                <Clock size={13} />
                {duration}
              </span>

              <span className="meta-pill accuracy-pill">
                <Sparkles size={13} />
                {note.accuracy
                  ? `${note.accuracy}%`
                  : "AI"}{" "}
                summary
              </span>

            </div>

          </div>

          <button
            className="modal-close-btn"
            onClick={onClose}
            title="Close"
          >
            <X size={20} />
          </button>

        </div>

        {/* =================================================
            TABS
        ================================================= */}

        <div className="modal-tabs-bar">

          <div className="modal-tabs-group">

            <button
              className={`modal-tab-btn ${
                activeTab === "summary"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("summary")
              }
            >
              <Sparkles size={15} />
              <span>AI Summary</span>
            </button>

            <button
              className={`modal-tab-btn ${
                activeTab === "transcript"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("transcript")
              }
            >
              <FileText size={15} />
              <span>
                Full Transcript
              </span>
            </button>

            <button
              className={`modal-tab-btn ${
                activeTab === "both"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("both")
              }
            >
              <Radio size={15} />
              <span>
                Side-by-Side
              </span>
            </button>

          </div>

          <div className="modal-header-actions">

            <button
              className="action-pill-btn"
              onClick={
                handleCopySummary
              }
            >
              {copied ? (
                <Check
                  size={14}
                  color="#10B981"
                />
              ) : (
                <Copy size={14} />
              )}

              <span>
                {copied
                  ? "Copied!"
                  : "Copy"}
              </span>
            </button>

            <button
              className="action-pill-btn"
              onClick={() =>
                handleDownload("txt")
              }
            >
              <Download size={14} />
              <span>
                Download (.txt)
              </span>
            </button>

            <button
              className="action-pill-btn"
              onClick={() =>
                handleDownload("md")
              }
            >
              <Download size={14} />
              <span>
                Markdown (.md)
              </span>
            </button>

          </div>

        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <div className="modal-scroll-content">

          {/* =================================================
              SUMMARY
          ================================================= */}

          {(activeTab === "summary" ||
            activeTab === "both") && (

            <div
              className={`modal-summary-panel ${
                activeTab === "both"
                  ? "split-view"
                  : ""
              }`}
            >

              <div className="summary-section-box">

                <h4 className="section-label">
                  Executive Overview
                </h4>

                <p className="summary-prose">
                  {summary ||
                    "No summary available for this voice note."}
                </p>

              </div>

              {keyPoints.length > 0 && (

                <div className="summary-section-box">

                  <h4 className="section-label">
                    Key Discussion Points
                  </h4>

                  <ul className="key-points-list">

                    {keyPoints.map(
                      (point, index) => (

                        <li
                          key={index}
                          className="key-point-bullet"
                        >

                          <span className="bullet-indicator">
                            {index + 1}
                          </span>

                          <span>
                            {point}
                          </span>

                        </li>

                      )
                    )}

                  </ul>

                </div>

              )}

              {actionItems.length > 0 && (

                <div className="summary-section-box">

                  <h4 className="section-label">
                    Action Items &
                    Deliverables
                  </h4>

                  <div className="action-items-checklist">

                    {actionItems.map(
                      (item, index) => (

                        <label
                          key={index}
                          className={`action-item-row ${
                            item.done
                              ? "is-done"
                              : ""
                          }`}
                        >

                          <input
                            type="checkbox"
                            checked={
                              !!item.done
                            }
                            onChange={() =>
                              toggleActionItem(
                                index
                              )
                            }
                          />

                          <span className="action-item-text">
                            {item.text}
                          </span>

                        </label>

                      )
                    )}

                  </div>

                </div>

              )}

              {topics.length > 0 && (

                <div className="summary-topics-row">

                  <span className="topics-heading">
                    <Tag size={13} />
                    Topics:
                  </span>

                  {topics.map(
                    (topic, index) => (

                      <span
                        key={index}
                        className="topic-tag-chip"
                      >
                        {topic}
                      </span>

                    )
                  )}

                </div>

              )}

            </div>

          )}

          {/* =================================================
              TRANSCRIPT
          ================================================= */}

          {(activeTab === "transcript" ||
            activeTab === "both") && (

            <div
              className={`modal-transcript-panel ${
                activeTab === "both"
                  ? "split-view"
                  : ""
              }`}
            >

              <div className="transcript-box-wrapper">

                <div className="transcript-toolbar">

                  <h4 className="section-label">
                    Speech-to-Text
                    Transcript
                  </h4>

                  <span className="word-count-badge">

                    {transcript
                      ? transcript
                          .trim()
                          .split(
                            /\s+/
                          )
                          .filter(Boolean)
                          .length
                      : 0}{" "}
                    words

                  </span>

                </div>

                <div className="transcript-text-body">

                  {transcript ? (

                    <p>
                      {transcript}
                    </p>

                  ) : (

                    <p
                      style={{
                        opacity: 0.7,
                        fontStyle:
                          "italic",
                      }}
                    >
                      No transcript
                      available for
                      this voice note.
                    </p>

                  )}

                </div>

              </div>

            </div>

          )}

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="note-modal-footer">

          {onDelete && (

            <button
              className="delete-note-footer-btn"
              onClick={() => {

                if (
                  window.confirm(
                    `Are you sure you want to delete "${title}"?`
                  )
                ) {
                  onDelete(note.id);
                  onClose();
                }

              }}
            >
              <Trash2 size={15} />

              <span>
                Delete Note
              </span>

            </button>

          )}

          <button
            className="done-footer-btn"
            onClick={onClose}
          >
            Done
          </button>

        </div>

      </div>
    </div>
  );
}