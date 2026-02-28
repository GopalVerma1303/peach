import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Codicon from '../components/Codicon';

type SettingsSection = 'general' | 'account';

const sections: { id: SettingsSection; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: 'settings-gear' },
  { id: 'account', label: 'Account', icon: 'person' },
];

export default function Settings() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [searchQuery, setSearchQuery] = useState('');

  const emailDisplay = user?.email ?? user?.id ?? '';
  const emailShort = emailDisplay.length > 20 ? `${emailDisplay.slice(0, 17)}...` : emailDisplay;

  return (
    <div className="settings-layout">
      {/* Left navigation sidebar */}
      <aside className="settings-sidebar">
        <div className="settings-profile">
          <div className="settings-avatar">
            {(user?.email?.[0] ?? user?.id?.[0] ?? '?').toUpperCase()}
          </div>
          <span className="settings-email" title={emailDisplay}>
            {emailShort}
          </span>
          <span className="settings-plan">Free</span>
        </div>
        <div className="settings-search-wrap">
          <Codicon name="search" size={14} className="settings-search-icon" />
          <input
            type="text"
            className="settings-search"
            placeholder="Search settings"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search settings"
          />
        </div>
        <nav className="settings-nav">
          {sections.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              className={`settings-nav-item ${activeSection === id ? 'active' : ''}`}
              onClick={() => setActiveSection(id)}
            >
              <Codicon name={icon} size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Right content area */}
      <main className="settings-content">
        {activeSection === 'general' && (
          <>
            <h1 className="settings-content-title">General</h1>

            <section className="settings-group">
              <h2 className="settings-group-heading">Preferences</h2>
              <div className="settings-item">
                <div className="settings-item-text">
                  <span className="settings-item-title">Theme</span>
                  <span className="settings-item-desc">Appearance: light, dark, or follow system</span>
                </div>
                <div className="settings-item-control">
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                    className="settings-select"
                    aria-label="Theme"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="settings-group">
              <h2 className="settings-group-heading">Links</h2>
              <div className="settings-item">
                <div className="settings-item-text">
                  <span className="settings-item-title">Archive</span>
                  <span className="settings-item-desc">View archived notes and files</span>
                </div>
                <div className="settings-item-control">
                  <Link to="/archive" className="settings-btn">
                    Open <Codicon name="link-external" size={12} />
                  </Link>
                </div>
              </div>
              <div className="settings-item">
                <div className="settings-item-text">
                  <span className="settings-item-title">Attachments</span>
                  <span className="settings-item-desc">Manage uploaded attachments</span>
                </div>
                <div className="settings-item-control">
                  <Link to="/attachments" className="settings-btn">
                    Open <Codicon name="link-external" size={12} />
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}

        {activeSection === 'account' && (
          <>
            <h1 className="settings-content-title">Account</h1>

            <section className="settings-group">
              <h2 className="settings-group-heading">Manage Account</h2>
              <div className="settings-item">
                <div className="settings-item-text">
                  <span className="settings-item-title">Email</span>
                  <span className="settings-item-desc">{emailDisplay || 'Not signed in'}</span>
                </div>
              </div>
              <div className="settings-item">
                <div className="settings-item-text">
                  <span className="settings-item-title">Sign out</span>
                  <span className="settings-item-desc">Sign out of your account on this device</span>
                </div>
                <div className="settings-item-control">
                  <button type="button" className="settings-btn secondary" onClick={() => signOut()}>
                    <Codicon name="sign-out" size={14} /> Sign out
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
