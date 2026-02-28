import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Codicon from './Codicon';
import NotesFileList from './NotesFileList';

const leftNavItems = [
  { to: '/home', icon: 'graph', label: 'Graph' },
  { to: '/notes', icon: 'files', label: 'All notes' },
  { to: '/calendar', icon: 'calendar', label: 'Calendar' },
  { to: '/notes/new', icon: 'file-text', label: 'New note' },
  { to: '/folders', icon: 'folder-opened', label: 'Folders' },
  { to: '/archive', icon: 'archive', label: 'Archive' },
  { to: '/settings', icon: 'settings-gear', label: 'Settings' },
];

const mobileNavItems = [
  { to: '/home', icon: 'home', label: 'Home' },
  { to: '/notes', icon: 'files', label: 'Notes' },
  { to: '/notes/new', icon: 'add', label: 'New' },
  { to: '/folders', icon: 'folder-opened', label: 'Folders' },
  { to: '/settings', icon: 'settings-gear', label: 'Settings' },
];

export default function ObsidianLayout() {
  const location = useLocation();
  const isNotesView = location.pathname.startsWith('/notes');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="obsidian-layout">
      {/* Mobile header - hamburger + title */}
      <header className="obsidian-mobile-header">
        <button
          type="button"
          className="obsidian-icon-btn obsidian-hamburger"
          onClick={() => setMobileMenuOpen((o) => !o)}
          title="Menu"
          aria-label="Toggle menu"
        >
          <Codicon name={mobileMenuOpen ? 'close' : 'three-bars'} size={24} />
        </button>
        <span className="obsidian-mobile-title">Peach</span>
      </header>

      {/* Left sidebar - overlay on mobile when open */}
      <aside
        className={`obsidian-sidebar-left ${mobileMenuOpen ? 'obsidian-sidebar-open' : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="obsidian-sidebar-nav">
          {leftNavItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/notes' ? false : to === '/home'}
              className={({ isActive }) =>
                `obsidian-nav-item ${isActive || (to === '/notes' && isNotesView) ? 'active' : ''}`
              }
              title={label}
              onClick={closeMobileMenu}
            >
              <Codicon name={icon} size={20} />
              <span className="obsidian-nav-label">{label}</span>
            </NavLink>
          ))}
        </div>
        <div className="obsidian-sidebar-content">
          {isNotesView ? <NotesFileList /> : null}
        </div>
        <div className="obsidian-sidebar-footer">
          <span className="obsidian-vault-name">
            <Codicon name="repo" size={16} /> Obsidian Vault
          </span>
          <a href="#" className="obsidian-icon-btn" title="Help" onClick={(e) => e.preventDefault()}>
            <Codicon name="question" size={16} />
          </a>
          <NavLink to="/settings" className="obsidian-icon-btn" title="Settings" onClick={closeMobileMenu}>
            <Codicon name="settings-gear" size={16} />
          </NavLink>
        </div>
      </aside>

      {/* Backdrop when mobile menu is open */}
      <div
        className={`obsidian-sidebar-backdrop ${mobileMenuOpen ? 'obsidian-backdrop-visible' : ''}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Main content */}
      <div className="obsidian-main-wrapper">
        <main className="obsidian-main">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav - mobile only */}
      <nav className="obsidian-bottom-nav">
        {mobileNavItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/notes' ? false : to === '/home'}
            className={({ isActive }) =>
              `obsidian-bottom-nav-item ${isActive || (to === '/notes' && isNotesView) ? 'active' : ''}`
            }
            title={label}
            onClick={closeMobileMenu}
          >
            <Codicon name={icon} size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
