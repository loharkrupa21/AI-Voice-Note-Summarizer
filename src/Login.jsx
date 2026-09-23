import "./Login.css";

function Login({onLogin}) {
  return (
    <div className="login-page">

      {/* Left Side */}
      <div className="left-section">
        <div className="logo">🎙️</div>

        <h1>AI Voice Note<br />Summarizer</h1>

        <h3>Record. Transcribe. Summarize.</h3>

        <p>
          Turn your voice notes into clear, concise
          summaries with the power of AI.
        </p>

        <div className="features">
          <div>⚡ Fast<br />Processing</div>
          <div>🛡️ Accurate<br />Results</div>
          <div>☁️ Save<br />History</div>
        </div>
      </div>

      {/* Right Side */}
      <div className="right-section">

        <h2>Welcome Back 👋</h2>

        <p className="subtitle">
          Login to your account to continue
        </p>

        <label>Email</label>
        <input
          type="email"
          placeholder="name@company.com"
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="At least 8 characters"
        />

        <div className="forgot">
          Forgot Password?
        </div>

        <button className="login-button" onClick={onLogin}>
          Login
        </button>

        <div className="or">
          <span></span>
          or
          <span></span>
        </div>

        <button className="google-button">
          🌐 Continue with Google
        </button>

        <p className="signup">
          Don't have an account?
          <span> Sign Up</span>
        </p>

      </div>
    </div>
  );
}

export default Login;