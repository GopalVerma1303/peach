import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Codicon from '../components/Codicon';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Codicon name="settings-gear" size={24} /> Settings
      </h1>
      <section className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Codicon name="paintcan" size={18} /> Theme
        </h2>
        <select value={theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </section>
      <section className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Codicon name="link" size={18} /> Links
        </h2>
        <p>
          <Link to="/archive" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Codicon name="archive" size={16} /> Archive
          </Link>
        </p>
        <p>
          <Link to="/attachments" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Codicon name="attach" size={16} /> Attachments
          </Link>
        </p>
      </section>
      <section className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Account</h2>
        {user && <p style={{ color: 'var(--text-muted)' }}>{user.email ?? user.id}</p>}
        <button type="button" onClick={() => signOut()}>
          <Codicon name="sign-out" size={16} /> Sign out
        </button>
      </section>
    </div>
  );
}
