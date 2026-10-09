// src/lib/transcribe.ts
export async function transcribeAudio(blob: Blob): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    // Fallback: use browser SpeechRecognition (limited, only works on live mic)
    throw new Error("OpenAI API key not configured. Transcription unavailable.");
  }

  const form = new FormData();
  form.append("file", blob, "audio.webm");
  form.append("model", "whisper-1");
  form.append("response_format", "text");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Transcription failed: ${response.status} ${err}`);
  }
  return await response.text();
}
