import "./App.css";
import { useState } from "react";

import Navbar from "./components/Navbar";
import RecordVoice from "./components/RecordVoice";
import UploadAudio from "./components/UploadAudio";
import SpeechToText from "./components/SpeechToText";
import AISummary from "./components/AISummary";
import KeyPoints from "./components/KeyPoints";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = (email, password) => {
    if (email && password) {
      setLoggedIn(true);
    }
  };

  if (!loggedIn) {
    return (
      <Login onLogin={handleLogin} />
    );
  }

  return (
    <>
      <Navbar />

      <div className="home">
        <h1>AI Voice Note Summarizer</h1>

        <p className="subtitle">
          Convert your voice into smart notes with AI
        </p>

        <div className="buttons">
          <RecordVoice />
          <UploadAudio />
        </div>

        <div className="features">
          <SpeechToText />
          <AISummary />
          <KeyPoints />

          <div className="feature-card">
            <div className="icon">📚</div>
            <h2>History</h2>
            <p>
              View your previous voice notes and summaries.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>AI Voice Note Summarizer</h1>

        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;