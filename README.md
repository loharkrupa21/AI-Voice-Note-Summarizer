# AI Voice Note Summarizer

React and Vite frontend for recording or uploading voice notes, reviewing transcripts, generating summaries, and managing saved notes.

## Run the frontend without the backend

The active frontend app is standalone and does not require the backend server or API keys:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (by default, `http://localhost:5173`). Login is a frontend demo flow. Notes, login state, and the selected language are stored in browser storage. Live speech recognition uses the browser Web Speech API when available; otherwise, enter or paste the transcript manually. Summaries, key points, and action items are generated locally from the transcript.

Microphone recording requires browser microphone permission and a secure context (`localhost` is supported). Browser speech recognition availability depends on the browser and may require an internet connection. Audio recording, manual transcript editing, summary generation, and saved note history do not require the backend. Audio recordings themselves are kept for the current browser session; note text and summaries persist across sessions.

## Optional backend

The separate backend can be started for API development, but it is not needed to launch or use the active frontend demo.