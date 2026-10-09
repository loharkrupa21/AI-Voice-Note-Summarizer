import "./Login.css";
import { useState } from "react";
import { api } from "../api/client";

function Login({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    // Basic validation
    if (isSignUp && !cleanName) {
      setError("Please enter your name.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email.");
      return;
    }

    if (!cleanPassword) {
      setError("Please enter your password.");
      return;
    }

    if (isSignUp && cleanPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      let response;

      if (isSignUp) {
        // SIGN UP
        response = await api.register(
          cleanName,
          cleanEmail,
          cleanPassword
        );
      } else {
        // LOGIN
        response = await api.login(
          cleanEmail,
          cleanPassword
        );
      }

      console.log("Authentication response:", response);

      // Get user information from backend response
      const user = response?.user || {
        id: response?.user_id,
        name: response?.name || cleanName || "Krupa Lohar",
        email: response?.email || cleanEmail,
      };

      // Make sure email exists
      if (!user.email) {
        user.email = cleanEmail;
      }

      // Save logged-in user
      localStorage.setItem(
        "voicemind_user",
        JSON.stringify(user)
      );

      localStorage.setItem(
        "voicemind_logged_in",
        "true"
      );

      // Send user object to App.jsx
      if (typeof onLogin === "function") {
        onLogin(user);
      }
    } catch (submitError) {
      console.error("Login/Signup error:", submitError);

      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp((current) => !current);
    setError("");
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="login-page">

      {/* LEFT SECTION */}
      <div className="left-section">
        <div className="logo">🎙️</div>

        <h1>
          AI Voice Note
          <br />
          Summarizer
        </h1>

        <h3>Record. Transcribe. Summarize.</h3>

        <p>
          Turn your voice notes into clear, concise
          summaries with the power of AI.
        </p>

        <div className="features">
          <div>
            ⚡
            <br />
            Fast
            <br />
            Processing
          </div>

          <div>
            🛡️
            <br />
            Accurate
            <br />
            Results
          </div>

          <div>
            ☁️
            <br />
            Save
            <br />
            History
          </div>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="right-section">

        <h2>
          {isSignUp
            ? "Create your account"
            : "Welcome Back 👋"}
        </h2>

        <p className="subtitle">
          {isSignUp
            ? "Sign up to start turning voice into smart notes"
            : "Login to your account to continue"}
        </p>

        <form onSubmit={handleSubmit}>

          {/* NAME - SIGNUP ONLY */}
          {isSignUp && (
            <>
              <label htmlFor="signup-name">
                Full Name
              </label>

              <input
                id="signup-name"
                type="text"
                placeholder="Enter your name"
                autoComplete="name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
              />
            </>
          )}

          {/* EMAIL */}
          <label htmlFor="login-email">
            Email
          </label>

          <input
            id="login-email"
            type="email"
            placeholder="name@company.com"
            autoComplete="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          {/* PASSWORD */}
          <label htmlFor="login-password">
            Password
          </label>

          <input
            id="login-password"
            type="password"
            placeholder={
              isSignUp
                ? "At least 8 characters"
                : "Password"
            }
            autoComplete={
              isSignUp
                ? "new-password"
                : "current-password"
            }
            minLength={isSignUp ? 8 : undefined}
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />

          {/* FORGOT PASSWORD */}
          {!isSignUp && (
            <div className="forgot">
              Forgot Password?
            </div>
          )}

          {/* ERROR MESSAGE */}
          {error && (
            <p
              role="alert"
              style={{
                color: "#dc2626",
                marginTop: "10px",
                marginBottom: "10px",
              }}
            >
              {error}
            </p>
          )}

          {/* SUBMIT BUTTON */}
          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isSignUp
              ? "Create Account"
              : "Login"}
          </button>
        </form>

        {/* GOOGLE LOGIN */}
        {!isSignUp && (
          <>
            <div className="or">
              <span></span>
              or
              <span></span>
            </div>

            <button
              className="google-button"
              type="button"
              onClick={() =>
                setError(
                  "Google login is not connected yet."
                )
              }
            >
              🌐 Continue with Google
            </button>
          </>
        )}

        {/* SIGNUP / LOGIN SWITCH */}
        <p className="signup">
          {isSignUp
            ? "Already have an account?"
            : "Don't have an account?"}{" "}

          <button
            type="button"
            onClick={switchMode}
          >
            {isSignUp ? "Login" : "Sign Up"}
          </button>
        </p>

      </div>
    </div>
  );
}

export default Login;