import { useState, useEffect } from "react";

import {
  FileText,
  Sparkles,
  Edit3,
  Check,
  Copy,
  Search,
  ArrowRight
} from "lucide-react";

import AudioPlayer from "../components/AudioPlayer";


export default function TranscriptPage({
  audioData,
  transcript,
  setTranscript,
  onGenerateSummary
}) {

  /* =================================================
     STATE
  ================================================= */

  const [isEditing, setIsEditing] =
    useState(false);

  const [editText, setEditText] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [copied, setCopied] =
    useState(false);


  /* =================================================
     WHISPER TRANSCRIPT RECEIVED
  ================================================= */

  useEffect(() => {

    const text =
      transcript || "";

    setEditText(text);

    /*
      जर Whisper transcript आला असेल
      तर Edit mode बंद.
    */

    if (
      text.trim() &&
      text !== "Transcribing with Whisper..."
    ) {

      setIsEditing(false);

      console.log(
        "TranscriptPage received Whisper transcript:",
        text
      );
    }

  }, [transcript]);


  /* =================================================
     CLEAN TRANSCRIPT
  ================================================= */

  const cleanTranscript =
    transcript ===
      "Transcribing with Whisper..."
      ? ""
      : transcript || "";


  /* =================================================
     WORD COUNT
  ================================================= */

  const words =
    cleanTranscript
      .trim()
      .split(/\s+/)
      .filter(Boolean);


  const wordCount =
    cleanTranscript.trim()
      ? words.length
      : 0;


  /* =================================================
     READING TIME
  ================================================= */

  const readingTimeMins =
    wordCount > 0
      ? Math.max(
          1,
          Math.ceil(
            wordCount / 200
          )
        )
      : 0;


  /* =================================================
     COPY
  ================================================= */

  const handleCopy = async () => {

    try {

      await navigator.clipboard.writeText(
        cleanTranscript
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);

    } catch (error) {

      console.error(
        "Copy failed:",
        error
      );
    }
  };


  /* =================================================
     SAVE EDIT
  ================================================= */

  const handleSaveEdit = () => {

    const newText =
      editText.trim();


    setTranscript(
      newText
    );


    localStorage.setItem(
      "voicenote_transcript",
      newText
    );


    setIsEditing(false);
  };


  /* =================================================
     EDIT
  ================================================= */

  const handleStartEditing = () => {

    setEditText(
      cleanTranscript
    );

    setIsEditing(true);
  };


  /* =================================================
     PARAGRAPHS
  ================================================= */

  const paragraphs =
    cleanTranscript
      ? cleanTranscript
          .split(
            /(?<=[.!?])\s+/
          )
          .filter(
            (sentence) =>
              sentence.trim()
          )
          .map(
            (
              sentence,
              index
            ) => {

              const startSec =
                index * 12;

              const mins =
                Math.floor(
                  startSec / 60
                );

              const secs =
                startSec % 60;

              const time =
                `${String(
                  mins
                ).padStart(2, "0")}:${String(
                  secs
                ).padStart(2, "0")}`;


              return {
                time,
                text:
                  sentence.trim()
              };
            }
          )
      : [];


  /* =================================================
     SEARCH
  ================================================= */

  const filteredParagraphs =
    paragraphs.filter(
      (paragraph) => {

        if (
          !searchTerm.trim()
        ) {

          return true;
        }


        return paragraph.text
          .toLowerCase()
          .includes(
            searchTerm
              .toLowerCase()
          );
      }
    );


  /* =================================================
     UI
  ================================================= */

  return (

    <div className="transcript-page-container">


      {/* =============================================
         AUDIO
      ============================================= */}

      <div className="transcript-audio-top-card">

        <AudioPlayer

          key={
            audioData?.audioUrl ||
            "transcript-audio"
          }

          audioUrl={
            audioData?.audioUrl
          }

          title={
            audioData?.title ||
            "Voice Note Recording"
          }

          duration={
            audioData?.duration ||
            "00:00"
          }

        />

      </div>


      {/* =============================================
         TRANSCRIPT CARD
      ============================================= */}

      <div className="transcript-viewer-card">


        {/* HEADER */}

        <div className="transcript-card-header">


          {/* TITLE */}

          <div className="transcript-title-group">

            <div className="transcript-icon-circle">

              <FileText
                size={20}
                color="#6366F1"
              />

            </div>


            <div>

              <h3>
                Voice Note Transcript
              </h3>


              {/* =====================================
                 IMPORTANT STATUS
              ===================================== */}

              <p className="transcript-meta-sub">


                <span className="meta-badge">

                  {wordCount}
                  {" "}
                  words

                </span>


                <span className="meta-bullet">
                  •
                </span>


                <span className="meta-badge">

                  ~
                  {readingTimeMins}
                  {" "}
                  min read

                </span>


                <span className="meta-bullet">
                  •
                </span>


                <span className="accuracy-green">

                  {
                    cleanTranscript.trim()
                      ? "Transcript Ready"
                      : transcript ===
                        "Transcribing with Whisper..."
                      ? "Transcribing with Whisper..."
                      : "Waiting for transcript"
                  }

                </span>


              </p>

            </div>

          </div>


          {/* =========================================
             TOOLBAR
          ========================================= */}

          <div className="transcript-actions-toolbar">


            {/* SEARCH */}

            <div className="transcript-search-wrap">

              <Search
                size={15}
                className="search-decor-icon"
              />

              <input

                type="text"

                placeholder="Search transcript..."

                value={
                  searchTerm
                }

                onChange={
                  (event) =>
                    setSearchTerm(
                      event.target.value
                    )
                }

              />

            </div>


            {/* COPY */}

            <button

              className="toolbar-btn"

              onClick={
                handleCopy
              }

              disabled={
                !cleanTranscript.trim()
              }

              title="Copy Transcript"

            >

              {
                copied
                  ? (
                    <Check
                      size={16}
                      color="#10B981"
                    />
                  )
                  : (
                    <Copy
                      size={16}
                    />
                  )
              }


              <span>

                {
                  copied
                    ? "Copied"
                    : "Copy"
                }

              </span>

            </button>


            {/* EDIT */}

            <button

              className={`toolbar-btn ${
                isEditing
                  ? "btn-save"
                  : ""
              }`}

              onClick={() => {

                if (
                  isEditing
                ) {

                  handleSaveEdit();

                } else {

                  handleStartEditing();

                }

              }}

            >

              {
                isEditing
                  ? (
                    <Check
                      size={16}
                    />
                  )
                  : (
                    <Edit3
                      size={16}
                    />
                  )
              }


              <span>

                {
                  isEditing
                    ? "Save Edits"
                    : "Edit Text"
                }

              </span>

            </button>


          </div>

        </div>


        {/* =========================================
           TRANSCRIPT CONTENT
        ========================================= */}

        <div className="transcript-scroll-area">


          {/* =======================================
             EDIT MODE
          ======================================= */}

          {isEditing ? (

            <textarea

              className="transcript-editor-textarea"

              value={
                editText
              }

              onChange={
                (event) =>
                  setEditText(
                    event.target.value
                  )
              }

              rows={12}

              placeholder="Edit your transcript here..."

            />

          ) : (

            /* =====================================
               VIEW MODE
            ===================================== */

            <div className="transcript-segments-list">


              {/* WHISPER LOADING */}

              {
                transcript ===
                "Transcribing with Whisper..." && (

                  <p className="segment-paragraph">

                    🎙️ Transcribing with Whisper...

                  </p>

                )
              }


              {/* WAITING */}

              {
                !cleanTranscript &&
                transcript !==
                  "Transcribing with Whisper..." && (

                  <p className="segment-paragraph">

                    Waiting for Whisper transcript...

                  </p>

                )
              }


              {/* TRANSCRIPT */}

              {
                filteredParagraphs.length > 0 &&
                filteredParagraphs.map(
                  (
                    segment,
                    index
                  ) => {

                    const isMatch =
                      searchTerm &&
                      segment.text
                        .toLowerCase()
                        .includes(
                          searchTerm
                            .toLowerCase()
                        );


                    return (

                      <div

                        key={index}

                        className={`transcript-segment-row ${
                          isMatch
                            ? "highlight-match"
                            : ""
                        }`}

                      >

                        <span className="segment-timestamp">

                          {
                            segment.time
                          }

                        </span>


                        <p className="segment-paragraph">

                          {
                            segment.text
                          }

                        </p>

                      </div>

                    );

                  }
                )
              }


            </div>

          )}

        </div>


        {/* =========================================
           FOOTER
        ========================================= */}

        <div className="transcript-footer-bar">


          <div className="footer-tip">

            <Sparkles
              size={16}
              className="sparkle-gold"
            />


            <span>

              {
                cleanTranscript.trim()

                  ? "Create key points and an executive summary from this transcript."

                  : "Waiting for Whisper transcript..."
              }

            </span>

          </div>


          {/* =======================================
             GENERATE SUMMARY
          ======================================= */}

          <button

            className="gradient-action-btn generate-summary-cta"

            onClick={
              onGenerateSummary
            }

            disabled={
              !cleanTranscript.trim()
            }

          >

            <Sparkles
              size={18}
            />

            <span>
              Generate Summary
            </span>

            <ArrowRight
              size={18}
            />

          </button>


        </div>


      </div>

    </div>
  );
}