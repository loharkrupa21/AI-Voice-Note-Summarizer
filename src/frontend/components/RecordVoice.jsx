import { useState } from "react";

function RecordVoice({ onRecordingComplete }) {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const startRecording = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(
            audioChunks,
            {
              type: "audio/webm",
            }
          );

          const url =
            URL.createObjectURL(audioBlob);

          setAudioURL(url);

          console.log(
            "================================="
          );
          console.log(
            "RECORDED AUDIO CREATED"
          );
          console.log(
            "TYPE:",
            audioBlob.type
          );
          console.log(
            "SIZE:",
            audioBlob.size
          );
          console.log(
            "================================="
          );

          // Send recorded audio to App.jsx
          if (onRecordingComplete) {
            await onRecordingComplete(
              audioBlob,
              url
            );
          }

          // Stop microphone
          stream
            .getTracks()
            .forEach((track) => {
              track.stop();
            });
        } catch (error) {
          console.error(
            "RECORDING STOP ERROR:",
            error
          );
        }
      };

      recorder.start();

      setMediaRecorder(recorder);
      setRecording(true);

      console.log(
        "RECORDING STARTED"
      );
    } catch (error) {
      console.error(
        "MICROPHONE ERROR:",
        error
      );

      alert(
        "Microphone permission is required."
      );
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorder &&
      mediaRecorder.state !== "inactive"
    ) {
      console.log(
        "STOPPING RECORDING..."
      );

      mediaRecorder.stop();

      setRecording(false);
      setMediaRecorder(null);
    }
  };

  return (
    <div>
      {!recording ? (
        <button
          className="record-btn"
          onClick={startRecording}
        >
          🎙️ Start Recording
        </button>
      ) : (
        <button
          className="record-btn"
          onClick={stopRecording}
        >
          ⏹️ Stop Recording
        </button>
      )}

      {recording && (
        <p>🔴 Recording...</p>
      )}

      {audioURL && (
        <div>
          <p>
            Recording completed:
          </p>

          <audio
            controls
            src={audioURL}
          />

          <p>
            ✅ Recorded audio is ready
            for processing.
          </p>
        </div>
      )}
    </div>
  );
}

export default RecordVoice;