// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      navigate(from, { replace: true });
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-primary">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg bg-white p-8 shadow-lg w-96"
      >
        <h2 className="mb-4 text-center text-2xl font-bold text-primary">
          Login
        </h2>
        {error && <p className="mb-2 text-center text-red-600">{error}</p>}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-primary px-4 py-2 text-white hover:bg-secondary"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
