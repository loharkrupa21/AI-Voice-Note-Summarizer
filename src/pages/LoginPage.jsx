import { useState } from 'react';
import {
  Mic,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  Shield
} from 'lucide-react';

import { api } from '../api/client';

export default function LoginPage({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);

  const [name, setName] = useState('Krupa Lohar');
  const [email, setEmail] = useState('krupa@voicemind.ai');
  const [password, setPassword] = useState('password123');

  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignUp && !name.trim()) {
      setFormError('Enter your full name.');
      return;
    }

    if (!email.trim() || !password) {
      setFormError('Please enter email and password.');
      return;
    }

    setFormError('');
    setLoading(true);

    try {
      // =====================================================
      // SIGN UP
      // =====================================================

      if (isSignUp) {
        console.log('SIGNUP STARTED');

        const result = await api.register(
          name.trim(),
          email.trim(),
          password
        );

        console.log('SIGNUP RESPONSE:', result);

        /*
          Supported backend response:

          {
            message: "...",
            user_id: 3,
            name: "Krupa Lohar",
            email: "krupa@voicemind.ai"
          }

          OR:

          {
            message: "...",
            user: {
              id: 3,
              name: "Krupa Lohar",
              email: "krupa@voicemind.ai"
            }
          }
        */

        const userId =
          result?.user_id ??
          result?.user?.id ??
          result?.id;

        if (!userId) {
          console.error(
            'SIGNUP RESPONSE DOES NOT CONTAIN USER ID:',
            result
          );

          throw new Error(
            'Account created, but User ID was not returned by backend.'
          );
        }

        const user = {
          id: userId,
          name:
            result?.name ||
            result?.user?.name ||
            name.trim(),
          email:
            result?.email ||
            result?.user?.email ||
            email.trim()
        };

        localStorage.setItem(
          'voicemind_user',
          JSON.stringify(user)
        );

        console.log(
          'USER SAVED AFTER SIGNUP:',
          user
        );

        onLoginSuccess(user, rememberMe);
        return;
      }

      // =====================================================
      // LOGIN
      // =====================================================

      console.log('LOGIN STARTED');

      const result = await api.login(
        email.trim(),
        password
      );

      console.log('LOGIN RESPONSE:', result);

      /*
        Actual backend response:

        {
          message: "Login successful",
          user_id: 3,
          name: null,
          email: "krupa@voicemind.ai"
        }
      */

      // IMPORTANT:
      // Your backend returns user_id directly.
      // It does NOT return result.user.id.

      const userId =
        result?.user_id ??
        result?.user?.id ??
        result?.id;

      if (!userId) {
        console.error(
          'LOGIN RESPONSE DOES NOT CONTAIN USER ID:',
          result
        );

        throw new Error(
          'Login successful, but User ID was not returned by backend.'
        );
      }

      const user = {
        id: userId,
        name:
          result?.name ||
          result?.user?.name ||
          'Krupa Lohar',
        email:
          result?.email ||
          result?.user?.email ||
          email.trim()
      };

      // =====================================================
      // SAVE USER
      // =====================================================

      localStorage.setItem(
        'voicemind_user',
        JSON.stringify(user)
      );

      console.log(
        'USER SAVED AFTER LOGIN:',
        user
      );

      console.log(
        'LOGIN SUCCESS - USER ID:',
        user.id
      );

      onLoginSuccess(user, rememberMe);

    } catch (error) {
      console.error(
        'LOGIN / SIGNUP ERROR:',
        error
      );

      setFormError(
        error instanceof Error
          ? error.message
          : 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // QUICK LOGIN
  // =========================================================

  const handleQuickDemoLogin = async () => {
    setFormError('');
    setLoading(true);

    try {
      const result = await api.login(
        'krupa@voicemind.ai',
        'password123'
      );

      console.log(
        'QUICK LOGIN RESPONSE:',
        result
      );

      const userId =
        result?.user_id ??
        result?.user?.id ??
        result?.id;

      if (!userId) {
        console.error(
          'QUICK LOGIN RESPONSE DOES NOT CONTAIN USER ID:',
          result
        );

        throw new Error(
          'Quick Login failed because backend did not return User ID.'
        );
      }

      const user = {
        id: userId,
        name:
          result?.name ||
          result?.user?.name ||
          'Krupa Lohar',
        email:
          result?.email ||
          result?.user?.email ||
          'krupa@voicemind.ai'
      };

      localStorage.setItem(
        'voicemind_user',
        JSON.stringify(user)
      );

      console.log(
        'QUICK LOGIN USER:',
        user
      );

      onLoginSuccess(user, rememberMe);

    } catch (error) {
      console.error(
        'QUICK LOGIN ERROR:',
        error
      );

      setFormError(
        error instanceof Error
          ? error.message
          : 'Quick login failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="login-screen-wrapper">

      <div className="login-ambient-blob blob-1"></div>
      <div className="login-ambient-blob blob-2"></div>

      <div className="login-container-card">

        {/* BRAND */}

        <div className="login-card-brand">

          <div className="login-brand-logo-circle">
            <Mic
              size={28}
              className="brand-mic-icon"
            />
          </div>

          <div className="login-brand-titles">

            <h1
              className="login-brand-heading"
              style={{ fontSize: '20px' }}
            >
              <span className="brand-title-voice">
                AI Voice Note
              </span>{' '}

              <span className="brand-title-mind">
                Summarizer
              </span>
            </h1>

          </div>

        </div>

        {/* WELCOME */}

        <div className="login-welcome-banner">

          <h2>
            {isSignUp
              ? 'Create your account'
              : 'Welcome back, Krupa!'}
          </h2>

          <p>
            {isSignUp
              ? 'Start turning voice recordings into concise, actionable AI notes.'
              : 'Sign in to access your voice notes, transcripts, and smart summaries.'}
          </p>

        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="auth-form-body"
        >

          {/* NAME */}

          {isSignUp && (
            <div className="input-group-row">

              <label>Full Name</label>

              <div className="input-with-icon">

                <User
                  size={18}
                  className="input-adornment-icon"
                />

                <input
                  type="text"
                  placeholder="Enter your name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  required
                />

              </div>

            </div>
          )}

          {/* EMAIL */}

          <div className="input-group-row">

            <label>Email Address</label>

            <div className="input-with-icon">

              <Mail
                size={18}
                className="input-adornment-icon"
              />

              <input
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />

            </div>

          </div>

          {/* PASSWORD */}

          <div className="input-group-row">

            <div className="password-label-row">

              <label>Password</label>

              {!isSignUp && (
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();

                    alert(
                      'Enter the password you used during signup.'
                    );
                  }}
                  className="forgot-pass-link"
                >
                  Forgot?
                </a>
              )}

            </div>

            <div className="input-with-icon">

              <Lock
                size={18}
                className="input-adornment-icon"
              />

              <input
                type="password"
                placeholder={
                  isSignUp
                    ? 'At least 8 characters'
                    : '••••••••'
                }
                autoComplete={
                  isSignUp
                    ? 'new-password'
                    : 'current-password'
                }
                minLength={
                  isSignUp ? 8 : undefined
                }
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

            </div>

          </div>

          {/* ERROR */}

          {formError && (
            <p
              className="auth-form-error"
              role="alert"
            >
              {formError}
            </p>
          )}

          {/* REMEMBER */}

          <div className="remember-me-row">

            <label className="checkbox-custom-label">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
              />

              <span>
                Remember this session
              </span>

            </label>

          </div>

          {/* LOGIN / SIGNUP BUTTON */}

          <button
            type="submit"
            className="login-primary-gradient-btn"
            disabled={loading}
          >

            {loading ? (

              <span className="spinner-dot-loading">
                {isSignUp
                  ? 'Creating account...'
                  : 'Logging in...'}
              </span>

            ) : (

              <>
                <span>
                  {isSignUp
                    ? 'Sign Up'
                    : 'Log In'}
                </span>

                <ArrowRight size={18} />
              </>

            )}

          </button>

        </form>

        {/* QUICK LOGIN */}

        {!isSignUp && (
          <>

            <div className="quick-login-divider">
              <span>
                or sign in instantly
              </span>
            </div>

            <button
              type="button"
              className="demo-krupa-quick-btn"
              onClick={handleQuickDemoLogin}
              disabled={loading}
            >

              <div className="demo-avatar-chip">
                K
              </div>

              <span>
                Quick Login as Krupa Lohar
              </span>

              <Sparkles
                size={16}
                className="sparkle-gold"
              />

            </button>

          </>
        )}

        {/* SIGNUP / LOGIN TOGGLE */}

        <div className="auth-toggle-footer">

          <span>
            {isSignUp
              ? 'Already have an account?'
              : "Don't have an account yet?"}
          </span>

          <button
            type="button"
            className="toggle-link-btn"
            onClick={() => {

              setIsSignUp(!isSignUp);

              setName(
                !isSignUp
                  ? 'Krupa Lohar'
                  : ''
              );

              setEmail(
                !isSignUp
                  ? 'krupa@voicemind.ai'
                  : ''
              );

              setPassword(
                !isSignUp
                  ? 'password123'
                  : ''
              );

              setFormError('');

            }}
          >
            {isSignUp
              ? 'Sign In'
              : 'Create Account'}
          </button>

        </div>

        {/* SECURITY */}

        <div className="login-security-tag">

          <Shield
            size={14}
            color="#10B981"
          />

          <span>
            AES-256 Encrypted Voice Transcription & AI Storage
          </span>

        </div>

      </div>

    </div>
  );
}