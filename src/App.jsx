import { useState, useEffect, useRef } from "react";

import "./App.css";

import { api } from "./api/client";

import { INITIAL_NOTES } from "./data/initialNotes";

// Common components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import FlowBreadcrumbs from "./components/FlowBreadcrumbs";
import NoteDetailModal from "./components/NoteDetailModal";
import ProfileModal from "./components/ProfileModal";

// Pages
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import RecordVoicePage from "./pages/RecordVoicePage";
import UploadAudioPage from "./pages/UploadAudioPage";
import ProcessingPage from "./pages/ProcessingPage";
import TranscriptPage from "./pages/TranscriptPage";
import GenerateSummaryPage from "./pages/GenerateSummaryPage";
import SummaryTranscriptPage from "./pages/SummaryTranscriptPage";
import SavedNotesPage from "./pages/SavedNotesPage";

// =========================================================
// LOCAL STORAGE HELPERS
// =========================================================

const loadStoredValue = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);

    if (value === null) {
      return fallback;
    }

    return JSON.parse(value);
  } catch (error) {
    console.warn(`Storage error for ${key}:`, error);
    return fallback;
  }
};

const loadStoredString = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

const loadSavedNotes = () => {
  const notes = loadStoredValue(
    "voicemind_saved_notes",
    INITIAL_NOTES
  );

  return Array.isArray(notes)
    ? notes
    : INITIAL_NOTES;
};

// =========================================================
// APP
// =========================================================

export default function App() {

  // =======================================================
  // LOGIN
  // =======================================================

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    return loadStoredValue("voicemind_user", {
      name: "Krupa Lohar",
      email: "krupa@voicemind.ai",
    });
  });

  // =======================================================
  // CURRENT PAGE
  // =======================================================

  const [currentView, setCurrentView] =
    useState("dashboard");

  // =======================================================
  // SELECTED LANGUAGE
  // =======================================================

  const [selectedLanguage, setSelectedLanguage] =
    useState(() => {
      return loadStoredString(
        "voicemind_language",
        "English"
      );
    });

  // =======================================================
  // SAVED NOTES
  // =======================================================

  const [savedNotes, setSavedNotes] =
    useState(loadSavedNotes);

  // =======================================================
  // ACTIVE AUDIO
  // =======================================================

  const [activeAudioData, setActiveAudioData] =
    useState({
      audioUrl: null,
      audioBlob: null,
      title: "Voice Note",
      duration: "00:00",
      durationSeconds: 0,
      type: "recorded",
      language: "English",
      noteId: null,
    });

  // =======================================================
  // TRANSCRIPT
  // =======================================================

  const [activeTranscript, setActiveTranscript] =
    useState("");

  // =======================================================
  // SUMMARY
  // =======================================================

  const [activeSummaryData, setActiveSummaryData] =
    useState({
      summary: "",
      keyPoints: [],
      actionItems: [],
      topics: [],
      accuracy: 98,
      language: "English",
    });

  // =======================================================
  // MODALS
  // =======================================================

  const [selectedNoteForModal, setSelectedNoteForModal] =
    useState(null);

  const [showProfileModal, setShowProfileModal] =
    useState(false);

  // =======================================================
  // TOAST
  // =======================================================

  const [toastMessage, setToastMessage] =
    useState("");

  // =======================================================
  // AUDIO URL REF
  // =======================================================

  const activeAudioUrlsRef =
    useRef(new Set());

  // =======================================================
  // SAVE NOTES
  // =======================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        "voicemind_saved_notes",
        JSON.stringify(savedNotes)
      );
    } catch (error) {
      console.error(
        "Could not save notes:",
        error
      );
    }
  }, [savedNotes]);

  // =======================================================
  // SAVE USER
  // =======================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        "voicemind_user",
        JSON.stringify(currentUser)
      );
    } catch (error) {
      console.error(
        "Could not save user:",
        error
      );
    }
  }, [currentUser]);

  // =======================================================
  // SAVE LANGUAGE
  // =======================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        "voicemind_language",
        selectedLanguage
      );
    } catch (error) {
      console.error(
        "Could not save language:",
        error
      );
    }
  }, [selectedLanguage]);

  // =======================================================
  // CLEANUP AUDIO URLS
  // =======================================================

  useEffect(() => {
    return () => {
      activeAudioUrlsRef.current.forEach(
        (url) => {
          try {
            URL.revokeObjectURL(url);
          } catch {
            // Ignore
          }
        }
      );
    };
  }, []);

  // =======================================================
  // TOAST
  // =======================================================

  const showToast = (message) => {
    setToastMessage(message);

    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  // =======================================================
  // GET USER ID
  // =======================================================

  const getUserId = () => {
    try {
      const directUserId =
        localStorage.getItem("user_id");

      if (directUserId) {
        return directUserId;
      }

      const storedUser =
        localStorage.getItem(
          "voicemind_user"
        );

      if (!storedUser) {
        return null;
      }

      const user =
        JSON.parse(storedUser);

      return (
        user?.id ||
        user?.user_id ||
        null
      );

    } catch (error) {
      console.error(
        "Could not get user ID:",
        error
      );

      return null;
    }
  };

  // =======================================================
  // SYNC NOTES FROM BACKEND
  // =======================================================

  const syncUserNotesFromBackend =
    async (userId) => {

      if (!userId) {
        return;
      }

      try {
        const data =
          await api.getSavedNotes(userId);

        if (
          Array.isArray(data?.notes) &&
          data.notes.length > 0
        ) {

          setSavedNotes(
            (previous) => {

              const existingIds =
                new Set(
                  previous.map(
                    (n) => n.id
                  )
                );

              const backendMapped =
                data.notes.map(
                  (bn) => {

                    const rawTitle =
                      bn.upload_voice ||
                      bn.recorded_voice ||
                      `Voice Note #${bn.id}`;

                    const cleanTitle =
                      String(rawTitle)
                        .split("\\")
                        .pop()
                        .split("/")
                        .pop()
                        .replace(
                          /^\d+_/,
                          ""
                        )
                        .replace(
                          /\.[^/.]+$/,
                          ""
                        ) ||
                      `Voice Note #${bn.id}`;

                    return {
                      id: bn.id,

                      title: cleanTitle,

                      date:
                        bn.created_at
                          ? new Date(
                              bn.created_at
                            ).toLocaleDateString()
                          : new Date().toLocaleDateString(),

                      duration: "00:00",

                      durationSeconds: 0,

                      category: "General",

                      transcript:
                        bn.transcript || "",

                      summary:
                        bn.summary || "",

                      keyPoints: [],

                      actionItems: [],

                      topics: [
                        "Voice Note",
                      ],
                    };
                  }
                );

              const newNotes =
                backendMapped.filter(
                  (n) =>
                    !existingIds.has(n.id)
                );

              return [
                ...newNotes,
                ...previous,
              ];
            }
          );
        }

      } catch (error) {
        console.warn(
          "Could not sync notes from backend:",
          error
        );
      }
    };

  // =======================================================
  // INITIAL BACKEND SYNC
  // =======================================================

  useEffect(() => {
    const userId = getUserId();

    if (userId) {
      syncUserNotesFromBackend(userId);
    }
  }, []);

  // =======================================================
  // LOGIN SUCCESS
  // =======================================================

  const handleLoginSuccess = (
    user,
    rememberMe = true
  ) => {

    setCurrentUser(user);

    setIsLoggedIn(true);

    setCurrentView("dashboard");

    if (user?.id) {
      syncUserNotesFromBackend(
        user.id
      );
    }

    try {

      localStorage.removeItem(
        "voicemind_logged_in"
      );

      sessionStorage.removeItem(
        "voicemind_logged_in"
      );

      const storage =
        rememberMe
          ? localStorage
          : sessionStorage;

      storage.setItem(
        "voicemind_logged_in",
        "true"
      );

    } catch (error) {
      console.warn(
        "Login storage error:",
        error
      );
    }

    showToast(
      `Welcome, ${user?.name || "Krupa"}!`
    );
  };

  // =======================================================
  // LOGOUT
  // =======================================================

  const handleLogout = () => {

    setIsLoggedIn(false);

    try {

      localStorage.removeItem(
        "voicemind_logged_in"
      );

      sessionStorage.removeItem(
        "voicemind_logged_in"
      );

    } catch {
      // Ignore
    }

    setCurrentView("dashboard");

    showToast(
      "Logged out successfully"
    );
  };

  // =======================================================
  // AUDIO READY
  // =======================================================

  const handleAudioReady =
    async (audioInfo) => {

      try {

        console.log(
          "================================"
        );

        console.log(
          "AUDIO READY"
        );

        console.log(
          "AUDIO INFO:",
          audioInfo
        );

        console.log(
          "FRONTEND AUDIO TYPE:",
          audioInfo?.type
        );

        console.log(
          "================================"
        );

        // -------------------------------------------------
        // AUDIO VALIDATION
        // -------------------------------------------------

        if (!audioInfo?.audioBlob) {

          showToast(
            "Audio file not found."
          );

          return;
        }

        // -------------------------------------------------
        // USER ID
        // -------------------------------------------------

        const userId =
          getUserId();

        if (!userId) {

          showToast(
            "User ID not found. Please login again."
          );

          return;
        }

        // -------------------------------------------------
        // LANGUAGE
        // -------------------------------------------------

        const language =
          audioInfo?.language ||
          selectedLanguage ||
          "English";

        // -------------------------------------------------
        // AUDIO URL
        // -------------------------------------------------

        let audioUrl =
          audioInfo?.audioUrl ||
          null;

        if (!audioUrl) {

          audioUrl =
            URL.createObjectURL(
              audioInfo.audioBlob
            );

          activeAudioUrlsRef.current.add(
            audioUrl
          );
        }

        // -------------------------------------------------
        // IMPORTANT
        //
        // RECORDING -> recorded
        // UPLOAD    -> upload
        // -------------------------------------------------

        const voiceType =
          audioInfo?.type ===
          "recorded"
            ? "recorded"
            : "upload";

        console.log(
          "================================"
        );

        console.log(
          "FINAL VOICE TYPE:",
          voiceType
        );

        console.log(
          "USER ID:",
          userId
        );

        console.log(
          "LANGUAGE:",
          language
        );

        console.log(
          "================================"
        );

        // -------------------------------------------------
        // SEND TO FASTAPI
        // -------------------------------------------------

        const uploadResult =
          await api.uploadVoiceNote(
            audioInfo.audioBlob,

            audioInfo.title ||
              "Voice Note",

            userId,

            voiceType
          );

        console.log(
          "BACKEND UPLOAD RESPONSE:",
          uploadResult
        );

        // -------------------------------------------------
        // NOTE ID
        // -------------------------------------------------

        const noteId =
          uploadResult?.note_id;

        if (!noteId) {

          throw new Error(
            "Backend did not return note ID."
          );
        }

        // -------------------------------------------------
        // SAVE NOTE ID
        // -------------------------------------------------

        localStorage.setItem(
          "voicenote_note_id",
          String(noteId)
        );

        // -------------------------------------------------
        // ACTIVE AUDIO
        // -------------------------------------------------

        setActiveAudioData({
          ...audioInfo,

          audioUrl,

          audioBlob:
            audioInfo.audioBlob,

          language,

          noteId,

          type: voiceType,
        });

        // -------------------------------------------------
        // CLEAR OLD TRANSCRIPT
        // -------------------------------------------------

        setActiveTranscript("");

        localStorage.removeItem(
          "voicenote_transcript"
        );

        // -------------------------------------------------
        // PROCESSING
        // -------------------------------------------------

        setCurrentView(
          "processing"
        );

        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        if (
          voiceType === "recorded"
        ) {

          showToast(
            "Recording saved successfully!"
          );

        } else {

          showToast(
            "Audio file saved successfully!"
          );
        }

      } catch (error) {

        console.error(
          "AUDIO READY ERROR:",
          error
        );

        showToast(
          error?.message ||
          "Could not process audio."
        );
      }
    };

  // =======================================================
  // PROCESSING COMPLETE
  // =======================================================

  const handleProcessingComplete =
    async () => {

      try {

        const storedNoteId =
          localStorage.getItem(
            "voicenote_note_id"
          );

        if (!storedNoteId) {

          showToast(
            "Note ID not found."
          );

          return;
        }

        const noteId =
          Number(storedNoteId);

        console.log(
          "================================"
        );

        console.log(
          "STARTING TRANSCRIPTION"
        );

        console.log(
          "NOTE ID:",
          noteId
        );

        console.log(
          "LANGUAGE:",
          selectedLanguage
        );

        console.log(
          "================================"
        );

        setCurrentView(
          "transcript"
        );

        const result =
          await api.transcribe(
            noteId,
            selectedLanguage
          );

        console.log(
          "TRANSCRIPTION RESPONSE:",
          result
        );

        const transcript =
          result?.transcript?.trim() ||
          "";

        if (!transcript) {

          showToast(
            "Whisper did not return transcript."
          );

          return;
        }

        setActiveTranscript(
          transcript
        );

        localStorage.setItem(
          "voicenote_transcript",
          transcript
        );

        setActiveAudioData(
          (previous) => ({
            ...previous,

            noteId,

            transcript,

            language:
              selectedLanguage,
          })
        );

        showToast(
          `${selectedLanguage} transcript generated successfully!`
        );

      } catch (error) {

        console.error(
          "TRANSCRIPTION ERROR:",
          error
        );

        showToast(
          error?.message ||
          "Transcription failed."
        );
      }
    };

  // =======================================================
  // GO TO SUMMARY
  // =======================================================

  const handleGoToGenerateSummary =
    () => {

      setCurrentView(
        "summary"
      );
    };

  // =======================================================
  // SUMMARY GENERATED
  // =======================================================

  const handleSummaryGenerated =
    (summaryResult) => {

      const summaryData = {

        summary:
          summaryResult?.summary ||
          "",

        keyPoints:
          Array.isArray(
            summaryResult?.keyPoints
          )
            ? summaryResult.keyPoints
            : [],

        actionItems:
          Array.isArray(
            summaryResult?.actionItems
          )
            ? summaryResult.actionItems
            : [],

        topics:
          Array.isArray(
            summaryResult?.topics
          )
            ? summaryResult.topics
            : [],

        accuracy:
          summaryResult?.accuracy ||
          98,

        language:
          summaryResult?.language ||
          selectedLanguage,
      };

      setActiveSummaryData(
        summaryData
      );

      setCurrentView(
        "summary-transcript"
      );

      showToast(
        `${selectedLanguage} summary generated successfully!`
      );
    };

  // =======================================================
  // SAVE NOTE
  // =======================================================

  const handleSaveNote =
    (newNote) => {

      const noteToSave = {

        ...newNote,

        transcript:
          newNote?.transcript ||
          activeTranscript ||
          "",

        summary:
          newNote?.summary ||
          activeSummaryData.summary ||
          "",

        keyPoints:
          Array.isArray(
            newNote?.keyPoints
          )
            ? newNote.keyPoints
            : activeSummaryData.keyPoints,

        actionItems:
          Array.isArray(
            newNote?.actionItems
          )
            ? newNote.actionItems
            : activeSummaryData.actionItems,

        topics:
          Array.isArray(
            newNote?.topics
          )
            ? newNote.topics
            : activeSummaryData.topics,

        accuracy:
          newNote?.accuracy ||
          activeSummaryData.accuracy ||
          98,

        duration:
          newNote?.duration ||
          activeAudioData.duration ||
          "00:00",

        language:
          newNote?.language ||
          selectedLanguage,

        date:
          newNote?.date ||
          new Date().toLocaleDateString(),
      };

      setSavedNotes(
        (previous) => [
          noteToSave,
          ...previous,
        ]
      );

      showToast(
        `"${noteToSave.title || "Voice Note"}" saved successfully!`
      );
    };

  // =======================================================
  // DELETE NOTE
  // =======================================================

  const handleDeleteNote =
    (noteId) => {

      setSavedNotes(
        (previous) =>
          previous.filter(
            (note) =>
              note.id !== noteId
          )
      );

      if (
        selectedNoteForModal?.id ===
        noteId
      ) {

        setSelectedNoteForModal(
          null
        );
      }

      if (
        noteId &&
        typeof noteId === "number"
      ) {

        api.deleteVoiceNote(
          noteId
        );
      }

      showToast(
        "Note deleted successfully"
      );
    };

  // =======================================================
  // VIEW NOTE
  // =======================================================

  const handleViewNote =
    (note) => {

      const fixedNote = {

        ...note,

        transcript:
          note?.transcript ||
          "",

        summary:
          note?.summary ||
          "",

        keyPoints:
          Array.isArray(
            note?.keyPoints
          )
            ? note.keyPoints
            : [],

        actionItems:
          Array.isArray(
            note?.actionItems
          )
            ? note.actionItems
            : [],

        topics:
          Array.isArray(
            note?.topics
          )
            ? note.topics
            : [],
      };

      setSelectedNoteForModal(
        fixedNote
      );
    };

  // =======================================================
  // NOT LOGGED IN
  // =======================================================

  if (!isLoggedIn) {

    return (
      <LoginPage
        onLoginSuccess={
          handleLoginSuccess
        }
      />
    );
  }

  // =======================================================
  // MAIN UI
  // =======================================================

  return (

    <div className="app-root-layout">

      {/* TOAST */}

      {toastMessage && (

        <div className="app-floating-toast">

          <span>
            {toastMessage}
          </span>

        </div>
      )}

      {/* SIDEBAR */}

      <Sidebar

        currentView={
          currentView
        }

        setCurrentView={(view) => {

          if (
            view === "new-note"
          ) {

            setCurrentView(
              "record"
            );

          } else if (
            view === "history"
          ) {

            setCurrentView(
              "saved-notes"
            );

          } else if (
            view === "profile"
          ) {

            setShowProfileModal(
              true
            );

          } else {

            setCurrentView(
              view
            );
          }
        }}

        onLogout={
          handleLogout
        }

        notesCount={
          savedNotes.length
        }
      />

      {/* MAIN */}

      <div className="app-main-viewport">

        {/* HEADER */}

        <Header

          user={
            currentUser
          }

          onLogout={
            handleLogout
          }

          onOpenProfile={() =>
            setShowProfileModal(
              true
            )
          }
        />

        {/* BREADCRUMBS */}

        <FlowBreadcrumbs

          currentStep={
            currentView
          }

          onSelectStep={(step) => {

            if (
              step === "new-note"
            ) {

              setCurrentView(
                "record"
              );

            } else {

              setCurrentView(
                step
              );
            }
          }}
        />

        {/* CONTENT */}

        <main className="app-content-body">

          {/* DASHBOARD */}

          {currentView ===
            "dashboard" && (

            <DashboardPage

              notes={
                savedNotes
              }

              selectedLanguage={
                selectedLanguage
              }

              onLanguageChange={
                setSelectedLanguage
              }

              onNavigate={(view) =>
                setCurrentView(
                  view
                )
              }

              onViewNote={
                handleViewNote
              }

              onDeleteNote={
                handleDeleteNote
              }

              onStartRecording={() =>
                setCurrentView(
                  "record"
                )
              }

              onFileUpload={(file) => {

                handleAudioReady({

                  audioBlob:
                    file,

                  title:
                    file.name.replace(
                      /\.[^/.]+$/,
                      ""
                    ),

                  type:
                    "uploaded",

                  language:
                    selectedLanguage,

                  duration:
                    "00:00",

                  durationSeconds:
                    0,

                  initialTranscript:
                    "",
                });
              }}
            />
          )}

          {/* RECORD */}

          {currentView ===
            "record" && (

            <RecordVoicePage

              onAudioReady={(audioInfo) =>

                handleAudioReady({

                  ...audioInfo,

                  // FORCE RECORDING
                  type:
                    "recorded",
                })
              }

              selectedLanguage={
                selectedLanguage
              }

              onCancel={() =>
                setCurrentView(
                  "dashboard"
                )
              }
            />
          )}

          {/* UPLOAD */}

          {currentView ===
            "upload" && (

            <UploadAudioPage

              onAudioReady={(audioInfo) =>

                handleAudioReady({

                  ...audioInfo,

                  // FORCE UPLOAD
                  type:
                    "uploaded",
                })
              }

              selectedLanguage={
                selectedLanguage
              }

              onTranscriptReady={(
                transcript,
                noteId
              ) => {

                const cleanTranscript =
                  transcript?.trim() ||
                  "";

                setActiveTranscript(
                  cleanTranscript
                );

                localStorage.setItem(
                  "voicenote_transcript",
                  cleanTranscript
                );

                if (noteId) {

                  localStorage.setItem(
                    "voicenote_note_id",
                    String(noteId)
                  );
                }

                setActiveAudioData(
                  (previous) => ({
                    ...previous,

                    noteId,

                    transcript:
                      cleanTranscript,

                    language:
                      selectedLanguage,
                  })
                );

                setCurrentView(
                  "transcript"
                );

                showToast(
                  `${selectedLanguage} transcript generated successfully!`
                );
              }}

              onCancel={() =>
                setCurrentView(
                  "dashboard"
                )
              }
            />
          )}

          {/* PROCESSING */}

          {currentView ===
            "processing" && (

            <ProcessingPage

              onComplete={
                handleProcessingComplete
              }

            />
          )}

          {/* TRANSCRIPT */}

          {currentView ===
            "transcript" && (

            <TranscriptPage

              audioData={
                activeAudioData
              }

              transcript={
                activeTranscript
              }

              setTranscript={
                setActiveTranscript
              }

              onGenerateSummary={
                handleGoToGenerateSummary
              }
            />
          )}

          {/* SUMMARY */}

          {currentView ===
            "summary" && (

            <GenerateSummaryPage

              transcript={
                activeTranscript
              }

              selectedLanguage={
                selectedLanguage
              }

              onSummaryGenerated={
                handleSummaryGenerated
              }
            />
          )}

          {/* SUMMARY + TRANSCRIPT */}

          {currentView ===
            "summary-transcript" && (

            <SummaryTranscriptPage

              audioData={
                activeAudioData
              }

              transcript={
                activeTranscript
              }

              summaryData={
                activeSummaryData
              }

              onSaveNote={
                handleSaveNote
              }

              onViewSavedNotes={() =>
                setCurrentView(
                  "saved-notes"
                )
              }
            />
          )}

          {/* SAVED NOTES */}

          {(
            currentView ===
              "saved-notes" ||
            currentView ===
              "history"
          ) && (

            <SavedNotesPage

              notes={
                savedNotes
              }

              onViewNote={
                handleViewNote
              }

              onDeleteNote={
                handleDeleteNote
              }

              onCreateNewNote={() =>
                setCurrentView(
                  "record"
                )
              }
            />
          )}

        </main>
      </div>

      {/* NOTE DETAIL MODAL */}

      {selectedNoteForModal && (

        <NoteDetailModal

          note={
            selectedNoteForModal
          }

          onClose={() =>
            setSelectedNoteForModal(
              null
            )
          }

          onDelete={(id) => {

            handleDeleteNote(id);

            setSelectedNoteForModal(
              null
            );
          }}
        />
      )}

      {/* PROFILE MODAL */}

      {showProfileModal && (

        <ProfileModal

          user={
            currentUser
          }

          notesCount={
            savedNotes.length
          }

          onClose={() =>
            setShowProfileModal(
              false
            )
          }
        />
      )}

    </div>
  );
}