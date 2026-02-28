import { NavLink } from 'react-router-dom';
import Codicon from './Codicon';

const navItems = [
  { to: '/home', label: 'Home', icon: 'home' },
  { to: '/folders', label: 'Folders', icon: 'folder-opened' },
  { to: '/notes', label: 'Notes', icon: 'file-text' },
  { to: '/files', label: 'Files', icon: 'file' },
  { to: '/calendar', label: 'Calendar', icon: 'calendar' },
  { to: '/archive', label: 'Archive', icon: 'archive' },
  { to: '/settings', label: 'Settings', icon: 'settings-gear' },
];

export default function Layout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <nav>
          {navItems.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === '/home'} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Codicon name={icon} size={18} style={{ flexShrink: 0 }} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main">{children}</div>
      <nav className="bottom-nav">
        {navItems.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/home'}>
            <Codicon name={icon} size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
