import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Codicon from './Codicon';
import NotesFileList from './NotesFileList';
import FilesFileList from './FilesFileList';

const leftNavItems = [
  { to: '/notes', icon: 'file-text', label: 'Notes' },
  { to: '/files', icon: 'files', label: 'Files' },
  { to: '/calendar', icon: 'calendar', label: 'Calendar' },
  { to: '/settings', icon: 'settings-gear', label: 'Settings' },
];

const mobileNavItems = [
  { to: '/notes', icon: 'file-text', label: 'Notes' },
  { to: '/files', icon: 'files', label: 'Files' },
  { to: '/calendar', icon: 'calendar', label: 'Calendar' },
  { to: '/settings', icon: 'settings-gear', label: 'Settings' },
];

export default function ObsidianLayout() {
  const location = useLocation();
  const isNotesView = location.pathname.startsWith('/notes');
  const isFilesView = location.pathname.startsWith('/files');
  const showSubSidebar = isNotesView || isFilesView;
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

      {/* Icon-only sidebar */}
      <aside
        className={`obsidian-sidebar-icons ${mobileMenuOpen ? 'obsidian-sidebar-open' : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="obsidian-sidebar-nav">
          {leftNavItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/notes' ? false : to === '/files' ? false : true}
              className={({ isActive }) =>
                `obsidian-nav-item ${isActive || (to === '/notes' && isNotesView) || (to === '/files' && isFilesView) ? 'active' : ''}`
              }
              title={label}
              onClick={closeMobileMenu}
            >
              <Codicon name={icon} size={20} />
            </NavLink>
          ))}
        </div>
      </aside>

      {/* Sub-sidebar */}
      {showSubSidebar && (
        <aside className="obsidian-sub-sidebar">
          {isNotesView && <NotesFileList />}
          {isFilesView && <FilesFileList />}
        </aside>
      )}

      {/* Backdrop when mobile menu is open */}
      <div
        className={`obsidian-sidebar-backdrop ${mobileMenuOpen ? 'obsidian-backdrop-visible' : ''}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Main content */}
      <div className={`obsidian-main-wrapper ${showSubSidebar ? 'has-sub-sidebar' : ''}`}>
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
            end={to === '/notes' ? false : to === '/files' ? false : true}
            className={({ isActive }) =>
              `obsidian-bottom-nav-item ${isActive || (to === '/notes' && isNotesView) || (to === '/files' && isFilesView) ? 'active' : ''}`
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
