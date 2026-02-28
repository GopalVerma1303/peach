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

export default function ObsidianLayout() {
  const location = useLocation();
  const isNotesView = location.pathname.startsWith('/notes');

  return (
    <div className="obsidian-layout">
      {/* Left sidebar */}
      <aside className="obsidian-sidebar-left">
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
            >
              <Codicon name={icon} size={20} />
            </NavLink>
          ))}
        </div>
        <div className="obsidian-sidebar-content">
          {isNotesView ? <NotesFileList /> : null}
        </div>
        <div className="obsidian-sidebar-footer">
          <span className="obsidian-vault-name">
            <Codicon name="repo" size={16} /> Vault
          </span>
          <a href="#" className="obsidian-icon-btn" title="Help" onClick={(e) => e.preventDefault()}>
            <Codicon name="question" size={16} />
          </a>
          <NavLink to="/settings" className="obsidian-icon-btn" title="Settings">
            <Codicon name="settings-gear" size={16} />
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <div className="obsidian-main-wrapper">
        <main className="obsidian-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
