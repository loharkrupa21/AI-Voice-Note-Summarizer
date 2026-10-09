import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (email && password) {
      alert("Login successful!");
    } else {
      alert("Please enter email and password.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>AI Voice Note Summarizer</h1>

        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;