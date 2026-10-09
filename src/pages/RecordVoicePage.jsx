import { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  ArrowRight,
  CheckCircle,
  Info,
} from "lucide-react";

import VoiceVisualizer from "../components/VoiceVisualizer";
import { api } from "../api/client";

export default function RecordVoicePage({
  onAudioReady,
  selectedLanguage = "English",
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [seconds, setSeconds] = useState(0);

  const [recordedAudioUrl, setRecordedAudioUrl] =
    useState(null);

  const [audioBlob, setAudioBlob] =
    useState(null);

  const [mediaStream, setMediaStream] =
    useState(null);

  const [recordingError, setRecordingError] =
    useState("");

  const [isUploading, setIsUploading] =
    useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const timerRef = useRef(null);
  const elapsedBeforeRunRef = useRef(0);
  const segmentStartedAtRef = useRef(null);

  const recordedAudioUrlRef = useRef(null);

  // =====================================================
  // TIMER
  // =====================================================

  const startElapsedTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const segmentStartedAt = Date.now();

    segmentStartedAtRef.current =
      segmentStartedAt;

    timerRef.current = setInterval(() => {
      if (
        segmentStartedAtRef.current !== null
      ) {
        const currentSegment = Math.floor(
          (Date.now() - segmentStartedAt) / 1000
        );

        setSeconds(
          elapsedBeforeRunRef.current +
            currentSegment
        );
      }
    }, 200);
  };

  const pauseElapsedTimer = () => {
    if (
      segmentStartedAtRef.current !== null
    ) {
      elapsedBeforeRunRef.current +=
        Math.floor(
          (Date.now() -
            segmentStartedAtRef.current) /
            1000
        );

      segmentStartedAtRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setSeconds(
      elapsedBeforeRunRef.current
    );
  };

  const getElapsedSeconds = () => {
    if (
      segmentStartedAtRef.current === null
    ) {
      return elapsedBeforeRunRef.current;
    }

    return (
      elapsedBeforeRunRef.current +
      Math.floor(
        (Date.now() -
          segmentStartedAtRef.current) /
          1000
      )
    );
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;

    return `${String(mins).padStart(
      2,
      "0"
    )}:${String(rem).padStart(2, "0")}`;
  };

  // =====================================================
  // START RECORDING
  // =====================================================

  const startRecording = async () => {
    let stream = null;

    try {
      setRecordingError("");

      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      ) {
        throw new Error(
          "Audio recording is not supported by this browser."
        );
      }

      if (recordedAudioUrlRef.current) {
        URL.revokeObjectURL(
          recordedAudioUrlRef.current
        );

        recordedAudioUrlRef.current = null;
      }

      setRecordedAudioUrl(null);
      setAudioBlob(null);

      audioChunksRef.current = [];

      elapsedBeforeRunRef.current = 0;
      segmentStartedAtRef.current = null;

      // =================================================
      // MICROPHONE
      // =================================================

      stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      setMediaStream(stream);

      // =================================================
      // MEDIA RECORDER
      // =================================================

      let mimeType = "audio/webm";

      if (
        MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus"
        )
      ) {
        mimeType = "audio/webm;codecs=opus";
      }

      const recorder = new MediaRecorder(
        stream,
        {
          mimeType,
        }
      );

      mediaRecorderRef.current =
        recorder;

      recorder.ondataavailable = (
        event
      ) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstart = () => {
        setIsRecording(true);
        setIsPaused(false);

        startElapsedTimer();

        console.log(
          "RECORDING STARTED"
        );
      };

      // =================================================
      // RECORDING STOP
      // =================================================

      recorder.onstop = () => {
        try {
          const blob = new Blob(
            audioChunksRef.current,
            {
              type: mimeType,
            }
          );

          console.log(
            "RECORDED BLOB:",
            blob
          );

          console.log(
            "RECORDED BLOB SIZE:",
            blob.size
          );

          if (blob.size === 0) {
            setRecordingError(
              "No audio was captured. Please record again."
            );

            stream
              .getTracks()
              .forEach((track) =>
                track.stop()
              );

            return;
          }

          const url =
            URL.createObjectURL(blob);

          recordedAudioUrlRef.current =
            url;

          setAudioBlob(blob);
          setRecordedAudioUrl(url);

          stream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          setMediaStream(null);

          console.log(
            "RECORDED AUDIO READY"
          );

        } catch (error) {
          console.error(
            "RECORD STOP ERROR:",
            error
          );

          setRecordingError(
            "Unable to process recorded audio."
          );
        }
      };

      recorder.onerror = () => {
        setRecordingError(
          "Recording failed. Please try again."
        );

        pauseElapsedTimer();

        setIsRecording(false);
        setIsPaused(false);

        stream
          ?.getTracks()
          .forEach((track) =>
            track.stop()
          );
      };

      recorder.start(100);

      setSeconds(0);

    } catch (error) {
      console.error(
        "START RECORDING ERROR:",
        error
      );

      stream
        ?.getTracks()
        .forEach((track) =>
          track.stop()
        );

      setMediaStream(null);

      setRecordingError(
        error instanceof Error
          ? `${error.message} Check microphone permission.`
          : "Unable to access microphone."
      );

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = null;

      segmentStartedAtRef.current =
        null;

      elapsedBeforeRunRef.current = 0;

      setIsRecording(false);
      setIsPaused(false);
      setSeconds(0);
    }
  };

  // =====================================================
  // PAUSE / RESUME
  // =====================================================

  const togglePause = () => {
    if (!isRecording) return;

    const recorder =
      mediaRecorderRef.current;

    if (!recorder) return;

    if (isPaused) {
      if (
        recorder.state === "paused"
      ) {
        recorder.resume();
      }

      startElapsedTimer();

      setIsPaused(false);
    } else {
      if (
        recorder.state === "recording"
      ) {
        recorder.pause();
      }

      pauseElapsedTimer();

      setIsPaused(true);
    }
  };

  // =====================================================
  // STOP RECORDING
  // =====================================================

  const stopRecording = () => {
    const elapsedSeconds =
      getElapsedSeconds();

    pauseElapsedTimer();

    setSeconds(elapsedSeconds);

    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      recorder.stop();
    }

    setIsRecording(false);
    setIsPaused(false);
  };

  // =====================================================
  // RESET
  // =====================================================

  const handleReset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = null;

    elapsedBeforeRunRef.current = 0;

    segmentStartedAtRef.current = null;

    setRecordedAudioUrl(null);
    setAudioBlob(null);

    setSeconds(0);

    setIsRecording(false);
    setIsPaused(false);

    setRecordingError("");

    audioChunksRef.current = [];

    if (recordedAudioUrlRef.current) {
      URL.revokeObjectURL(
        recordedAudioUrlRef.current
      );

      recordedAudioUrlRef.current =
        null;
    }
  };

  // =====================================================
  // PROCEED
  // =====================================================

  const handleProceed = async () => {
    if (
      !audioBlob ||
      !recordedAudioUrl
    ) {
      setRecordingError(
        "Please record audio before continuing."
      );

      return;
    }

    try {
      setRecordingError("");
      setIsUploading(true);

      console.log(
        "UPLOADING RECORDED AUDIO TO BACKEND..."
      );

      // -----------------------------------------------
      // GET LOGGED-IN USER
      // -----------------------------------------------

      const storedUser =
        localStorage.getItem(
          "voicemind_user"
        );

      if (!storedUser) {
        throw new Error(
          "User not found. Please login again."
        );
      }

      const user =
        JSON.parse(storedUser);

      const userId =
        user?.id;

      if (!userId) {
        throw new Error(
          "User ID not found. Please login again."
        );
      }

      console.log(
        "RECORDING USER ID:",
        userId
      );

      // -----------------------------------------------
      // CREATE FILE
      // -----------------------------------------------

      const recordedFile =
        new File(
          [audioBlob],
          `recorded_voice_${Date.now()}.webm`,
          {
            type:
              audioBlob.type ||
              "audio/webm",
          }
        );

      console.log(
        "RECORDED FILE:",
        recordedFile
      );

      // -----------------------------------------------
      // UPLOAD RECORDING
      // -----------------------------------------------

      const uploadResult =
        await api.uploadVoiceNote(
          recordedFile,
          "Recorded Voice Note",
          userId
        );

      console.log(
        "RECORDED AUDIO UPLOAD RESULT:",
        uploadResult
      );

      const noteId =
        uploadResult?.note_id;

      if (!noteId) {
        throw new Error(
          "Backend did not return note_id."
        );
      }

      console.log(
        "RECORDED AUDIO NOTE ID:",
        noteId
      );

      // -----------------------------------------------
      // SAVE NOTE ID
      // -----------------------------------------------

      localStorage.setItem(
        "voicenote_note_id",
        String(noteId)
      );

      // -----------------------------------------------
      // SEND TO APP
      // -----------------------------------------------

      onAudioReady({
        audioUrl:
          recordedAudioUrl,

        audioBlob:
          audioBlob,

        duration:
          formatTime(seconds),

        durationSeconds:
          seconds,

        type:
          "recorded",

        title:
          "Recorded Voice Note",

        language:
          selectedLanguage,

        noteId:
          noteId,

        initialTranscript:
          "",
      });

      console.log(
        "RECORDED AUDIO SENT TO PROCESSING"
      );

    } catch (error) {
      console.error(
        "RECORDED AUDIO UPLOAD ERROR:",
        error
      );

      setRecordingError(
        error?.message ||
          "Could not upload recorded audio."
      );

    } finally {
      setIsUploading(false);
    }
  };

  // =====================================================
  // CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (mediaStream) {
        mediaStream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }

      if (recordedAudioUrlRef.current) {
        URL.revokeObjectURL(
          recordedAudioUrlRef.current
        );

        recordedAudioUrlRef.current = null;
      }
    };

    // IMPORTANT:
    // Do not run cleanup every time mediaStream changes.
    // Otherwise the recorded blob URL gets revoked immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="studio-container-card">

      <div className="studio-card-header">

        <div className="studio-header-icon-wrap">
          <Mic
            size={22}
            color="#FFFFFF"
          />
        </div>

        <div>
          <h2>
            Record Voice Note
          </h2>

          <p>
            Record your voice and convert
            the same recording into text
            using Whisper.
          </p>
        </div>

      </div>

      {recordingError && (
        <div className="permission-alert-banner">

          <Info size={16} />

          <span>
            {recordingError}
          </span>

        </div>
      )}

      <div className="recording-centerpiece">

        <div
          className={`record-mic-halo ${
            isRecording
              ? "recording-active"
              : ""
          } ${
            isPaused
              ? "recording-paused"
              : ""
          }`}
        >

          <div className="record-mic-inner">

            <Mic
              size={48}
              className="mic-halo-icon"
            />

          </div>

        </div>

        <VoiceVisualizer
          isRecording={
            isRecording && !isPaused
          }
          stream={mediaStream}
        />

        <div className="studio-timer-display">

          <span className="timer-digits">
            {formatTime(seconds)}
          </span>

          <span className="timer-status-text">

            {isRecording
              ? isPaused
                ? "Recording Paused"
                : "Recording..."
              : recordedAudioUrl
              ? "Audio Captured"
              : "Ready to record"}

          </span>

        </div>

        {isRecording && (
          <div className="live-speech-bubble">

            <span className="speech-caption-tag">
              🎙️ Recording
            </span>

            <p className="speech-words">
              Your voice is being recorded.
              Speech-to-text will be done
              after you stop recording.
            </p>

          </div>
        )}

        {!recordedAudioUrl ? (

          <div className="record-controls-row">

            {!isRecording ? (

              <button
                className="primary-studio-btn record-start-btn"
                onClick={
                  startRecording
                }
              >

                <Mic size={20} />

                <span>
                  Start Recording
                </span>

              </button>

            ) : (

              <>
                <button
                  className="secondary-studio-btn"
                  onClick={
                    togglePause
                  }
                  disabled={isUploading}
                >

                  {isPaused ? (
                    <Play size={18} />
                  ) : (
                    <Pause size={18} />
                  )}

                  <span>
                    {isPaused
                      ? "Resume"
                      : "Pause"}
                  </span>

                </button>

                <button
                  className="danger-studio-btn"
                  onClick={
                    stopRecording
                  }
                  disabled={isUploading}
                >

                  <Square
                    size={18}
                    fill="currentColor"
                  />

                  <span>
                    Stop Recording
                  </span>

                </button>
              </>

            )}

          </div>

        ) : (

          <div className="recorded-preview-state">

            <div className="preview-heading">

              <CheckCircle
                size={18}
                color="#10B981"
              />

              <span>
                Voice Note Recorded
                Successfully!
              </span>

            </div>

            <audio
              controls
              src={recordedAudioUrl}
              style={{
                width: "100%",
                marginTop: "15px",
              }}
            />

            <div className="recorded-actions-row">

              <button
                className="secondary-studio-btn"
                onClick={
                  handleReset
                }
                disabled={isUploading}
              >

                <RotateCcw size={18} />

                <span>
                  Record Again
                </span>

              </button>

              <button
                className="primary-studio-btn proceed-btn"
                onClick={
                  handleProceed
                }
                disabled={isUploading}
              >

                {isUploading ? (
                  <span>
                    Uploading Recording...
                  </span>
                ) : (
                  <>
                    <span>
                      Convert Speech to Text
                    </span>

                    <ArrowRight size={18} />
                  </>
                )}

              </button>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}