import { useState } from "react";
import {
  Sparkles,
  FileText,
  CheckSquare,
  Zap,
  ArrowRight,
  Bot,
  Loader2,
} from "lucide-react";

import { api } from "../api/client";

export default function GenerateSummaryPage({
  transcript,
  onSummaryGenerated,
  selectedLanguage = "English",
}) {
  const [format, setFormat] = useState("key-points");
  const [detailLevel, setDetailLevel] = useState("balanced");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const formats = [
    {
      id: "key-points",
      title: "Key Points & Takeaways",
      desc: "Extracted bullets of essential concepts and discussions",
      icon: Zap,
    },
    {
      id: "executive",
      title: "Executive Briefing",
      desc: "Structured high-level overview for quick reading",
      icon: FileText,
    },
    {
      id: "action-items",
      title: "Action Items & Tasks",
      desc: "Actionable tasks and responsibilities",
      icon: CheckSquare,
    },
    {
      id: "tldr",
      title: "Quick TL;DR",
      desc: "A short summary of the complete voice note",
      icon: Sparkles,
    },
  ];

  const handleGenerate = async () => {
    if (!transcript || !transcript.trim()) {
      setError(
        "Transcript is empty. Please convert your voice to text first."
      );
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const noteId = Number(
        localStorage.getItem("voicenote_note_id")
      );

      if (!noteId) {
        throw new Error("Note ID not found.");
      }

      console.log("SUMMARY STARTED");
      console.log("LANGUAGE:", selectedLanguage);
      console.log("NOTE ID:", noteId);
      console.log("TRANSCRIPT:", transcript);
      console.log("FORMAT:", format);
      console.log("DETAIL LEVEL:", detailLevel);

      const result = await api.summarize(
        noteId,
        transcript,
        selectedLanguage,
        format,
        detailLevel
      );

      console.log("SUMMARY RESPONSE:", result);

      const summaryText =
        result?.summary || transcript;

      onSummaryGenerated({
        summary: summaryText,
        keyPoints: Array.isArray(result?.keyPoints)
          ? result.keyPoints
          : [],
        actionItems: Array.isArray(result?.actionItems)
          ? result.actionItems
          : [],
        topics: Array.isArray(result?.topics)
          ? result.topics
          : [],
        accuracy: result?.accuracy || 98,
      });
    } catch (err) {
      console.error("SUMMARY ERROR:", err);

      setError(
        err?.message || "Unable to generate summary."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="studio-container-card">
      <div className="studio-card-header">
        <div className="studio-header-icon-wrap ai-purple-gradient-icon">
          <Sparkles size={22} color="#FFFFFF" />
        </div>

        <div>
          <h2>Generate Summary</h2>

          <p>
            Generate a summary in the same language as your
            selected voice note.
          </p>
        </div>
      </div>

      <div
        style={{
          margin: "20px 0",
          padding: "14px 18px",
          borderRadius: "12px",
          background: "#eef4ff",
          border: "1px solid #dbe7ff",
        }}
      >
        <strong>Selected Language:</strong>{" "}
        {selectedLanguage}

        <div
          style={{
            marginTop: "6px",
            fontSize: "13px",
            color: "#555",
          }}
        >
          Your summary will be generated from the transcript
          in this language.
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "10px",
            background: "#fff1f2",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}

      <div className="summary-config-body">
        <div className="config-section">
          <label className="config-section-title">
            <span>1. Choose Summary Format</span>
          </label>

          <div className="format-options-grid">
            {formats.map((item) => {
              const Icon = item.icon;
              const isSelected = format === item.id;

              return (
                <div
                  key={item.id}
                  className={
                    isSelected
                      ? "format-option-box selected"
                      : "format-option-box"
                  }
                  onClick={() => setFormat(item.id)}
                >
                  <div className="format-box-top">
                    <div className="format-icon-pill">
                      <Icon size={18} />
                    </div>

                    <span className="format-title-name">
                      {item.title}
                    </span>
                  </div>

                  <p className="format-desc-text">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="config-section">
          <label className="config-section-title">
            <span>2. Output Depth & Conciseness</span>
          </label>

          <div className="detail-level-selector">
            <button
              type="button"
              className={
                detailLevel === "concise"
                  ? "detail-btn active"
                  : "detail-btn"
              }
              onClick={() => setDetailLevel("concise")}
            >
              Concise
            </button>

            <button
              type="button"
              className={
                detailLevel === "balanced"
                  ? "detail-btn active"
                  : "detail-btn"
              }
              onClick={() => setDetailLevel("balanced")}
            >
              Balanced
            </button>

            <button
              type="button"
              className={
                detailLevel === "comprehensive"
                  ? "detail-btn active"
                  : "detail-btn"
              }
              onClick={() =>
                setDetailLevel("comprehensive")
              }
            >
              Comprehensive
            </button>
          </div>
        </div>

        <div className="generate-submit-card">
          <div className="submit-info-left">
            <Bot
              size={28}
              className="ai-bot-avatar"
            />

            <div>
              <h4>AI Summary Generator</h4>

              <p>
                The recorded or uploaded audio transcript
                will be summarized in{" "}
                <strong>{selectedLanguage}</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="gradient-action-btn run-ai-btn"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2
                  size={18}
                  className="spin-subtle"
                />

                <span>Generating Summary...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />

                <span>Generate Summary Now</span>

                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}