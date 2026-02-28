import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Codicon from '../components/Codicon';

const UI_DEV_MODE = import.meta.env.VITE_UI_DEV_MODE === 'true';

export default function Login() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (user && !UI_DEV_MODE) return <Navigate to="/home" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (isSignUp) {
      const { error: err } = await signUp(email, password);
      if (err) setError(err);
      else setSuccess('Check your email to confirm sign up.');
    } else {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
      else navigate('/home');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: '1rem' }}>
      <h1>gopx-drive</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ width: '100%', marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            style={{ width: '100%', marginTop: 4 }}
          />
        </div>
        {error && <p style={{ color: 'crimson', marginBottom: '1rem' }}>{error}</p>}
        {success && <p style={{ color: 'green', marginBottom: '1rem' }}>{success}</p>}
        <button type="submit">
          {isSignUp ? <><Codicon name="person-add" size={16} /> Sign up</> : <><Codicon name="sign-in" size={16} /> Sign in</>}
        </button>
        <button type="button" className="secondary" onClick={() => setIsSignUp((v) => !v)} style={{ marginLeft: 8 }}>
          {isSignUp ? <><Codicon name="sign-in" size={16} /> Sign in instead</> : <><Codicon name="person-add" size={16} /> Sign up instead</>}
        </button>
      </form>
    </div>
  );
}
