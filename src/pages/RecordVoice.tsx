// src/pages/RecordVoice.tsx
import React, { useState, useRef } from "react";
import { Mic, StopCircle } from "lucide-react";
import AudioPlayer from "../components/AudioPlayer";
import { transcribeAudio } from "../lib/transcribe";
import { summarizeText } from "../lib/summarize";
import { useNavigate } from "react-router-dom";

export default function RecordVoice() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Media devices not supported in this browser.");
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
    };
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const processAudio = async () => {
    if (!audioBlob) return;
    setLoading(true);
    try {
      const txt = await transcribeAudio(audioBlob);
      setTranscript(txt);
      const sum = await summarizeText(txt);
      setSummary(sum);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const saveNote = () => {
    const notes = JSON.parse(localStorage.getItem("voice_notes") || "[]");
    const newNote = {
      id: Date.now().toString(),
      title: "Voice Note " + new Date().toLocaleString(),
      createdAt: new Date().toISOString(),
      transcript,
      summary,
      durationSeconds: Math.round((audioBlob?.size || 0) / 1000), // approximate placeholder
    };
    notes.push(newNote);
    localStorage.setItem("voice_notes", JSON.stringify(notes));
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-xl w-full p-6 space-y-6">
        <h2 className="text-2xl font-bold text-center text-primary">Record Voice Note</h2>
        <div className="flex gap-4 justify-center">
          {recording ? (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              <StopCircle size={18} /> Stop
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-secondary"
            >
              <Mic size={18} /> Start Recording
            </button>
          )}
        </div>
        {audioBlob && (
          <div className="space-y-2">
            <AudioPlayer src={audioBlob} label="Recorded audio" />
            <button
              onClick={processAudio}
              disabled={loading}
              className="w-full px-4 py-2 bg-primary text-white rounded hover:bg-secondary"
            >
              {loading ? "Processing..." : "Generate Transcript & Summary"}
            </button>
          </div>
        )}
        {transcript && (
          <div className="mt-4">
            <h3 className="font-semibold text-gray-800">Transcript</h3>
            <p className="bg-gray-100 p-2 rounded mt-1 text-sm overflow-x-auto">{transcript}</p>
          </div>
        )}
        {summary && (
          <div className="mt-4">
            <h3 className="font-semibold text-gray-800">AI Summary</h3>
            <p className="bg-gray-100 p-2 rounded mt-1 text-sm">{summary}</p>
            <button
              onClick={saveNote}
              className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
