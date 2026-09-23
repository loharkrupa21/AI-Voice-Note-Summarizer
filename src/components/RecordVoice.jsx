import { useState } from "react";

function RecordVoice() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, {
          type: "audio/webm",
        });

        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();

      setMediaRecorder(recorder);
      setRecording(true);
    } catch (error) {
      alert("Microphone permission is required.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  return (
    <div>
      {!recording ? (
        <button className="record-btn" onClick={startRecording}>
          🎙️ Start Recording
        </button>
      ) : (
        <button className="record-btn" onClick={stopRecording}>
          ⏹️ Stop Recording
        </button>
      )}

      {recording && <p>🔴 Recording...</p>}

      {audioURL && (
        <div>
          <p>Recording completed:</p>
          <audio controls src={audioURL}></audio>
        </div>
      )}
    </div>
  );
}

export default RecordVoice;