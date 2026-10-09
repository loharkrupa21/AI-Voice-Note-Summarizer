import { useEffect, useState } from "react";
import {
  Cpu,
  CheckCircle2,
  ArrowRight,
  Loader2
} from "lucide-react";

export default function ProcessingPage({ onComplete }) {
  const [progress, setProgress] = useState(15);
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [isDone, setIsDone] = useState(false);
  const [started, setStarted] = useState(false);

  const steps = [
    {
      title: "Audio Uploaded",
      desc: "Your voice note was uploaded successfully."
    },
    {
      title: "Whisper Transcription",
      desc: "Converting speech into text..."
    },
    {
      title: "Transcript Review",
      desc: "Review and edit your transcript."
    },
    {
      title: "Transcript Ready",
      desc: "Your transcript is ready to view."
    }
  ];

  useEffect(() => {
    let progressTimer;

    progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          setIsDone(true);
          setCurrentStepIndex(3);
          return 100;
        }

        const next = prev + 2;

        if (next >= 45) {
          setCurrentStepIndex(1);
        }

        if (next >= 75) {
          setCurrentStepIndex(2);
        }

        return next;
      });
    }, 80);

    return () => {
      clearInterval(progressTimer);
    };
  }, []);

  // Automatically start Whisper after processing animation
  useEffect(() => {
    if (isDone && !started) {
      setStarted(true);

      console.log(
        "PROCESSING COMPLETE → STARTING WHISPER"
      );

      onComplete();
    }
  }, [isDone, started, onComplete]);

  return (
    <div className="processing-pipeline-card">

      <div className="processing-hero-section">

        <div className="neural-core-orb">
          <div className="core-glow-aura"></div>

          <div className="core-icon-center">
            {isDone ? (
              <CheckCircle2
                size={44}
                className="core-check-icon"
              />
            ) : (
              <Cpu
                size={44}
                className="core-cpu-icon spin-subtle"
              />
            )}
          </div>
        </div>

        <h2 className="processing-main-title">
          {isDone
            ? "Transcription Complete!"
            : "Transcribing with Whisper..."}
        </h2>

        <p className="processing-main-sub">
          {isDone
            ? "Whisper transcription completed. Opening transcript..."
            : "Please wait while Whisper converts your voice into text."}
        </p>

        <div className="pipeline-progress-bar-wrap">

          <div className="progress-meta-row">
            <span className="pipeline-percent">
              {progress}%
            </span>

            <span className="pipeline-status-text">
              {isDone
                ? "Whisper transcription complete"
                : "Whisper is processing your audio"}
            </span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`
              }}
            />
          </div>

        </div>
      </div>

      <div className="pipeline-steps-container">

        {steps.map((step, index) => {

          const completed =
            index < currentStepIndex ||
            (isDone && index <= 3);

          const active =
            index === currentStepIndex &&
            !isDone;

          return (
            <div
              key={index}
              className={`pipeline-step-item ${
                completed ? "step-done" : ""
              } ${
                active ? "step-active" : ""
              }`}
            >

              <div className="step-status-icon">

                {completed ? (
                  <CheckCircle2
                    size={20}
                    color="#10B981"
                  />
                ) : active ? (
                  <Loader2
                    size={20}
                    className="step-spinner"
                    color="#6366F1"
                  />
                ) : (
                  <span className="step-circle-num">
                    {index + 1}
                  </span>
                )}

              </div>

              <div className="step-content-meta">

                <h4 className="step-title-text">
                  {step.title}
                </h4>

                <p className="step-desc-text">
                  {step.desc}
                </p>

              </div>

            </div>
          );
        })}

      </div>

      <div className="processing-footer-action">

        <button
          className="primary-studio-btn proceed-btn pulse-glow"
          disabled
        >
          <span>
            {isDone
              ? "Opening Transcript..."
              : "Waiting for Whisper..."}
          </span>

          {isDone ? (
            <ArrowRight size={18} />
          ) : (
            <Loader2
              size={18}
              className="step-spinner"
            />
          )}
        </button>

      </div>

    </div>
  );
}