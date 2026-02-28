import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ObsidianLayout from './components/ObsidianLayout';
import Login from './pages/Login';
import Home from './pages/Home';
import NoteEditorObsidian from './pages/NoteEditorObsidian';
import Files from './pages/Files';
import FoldersList from './pages/FoldersList';
import FolderDetail from './pages/FolderDetail';
import Calendar from './pages/Calendar';
import Archive from './pages/Archive';
import Settings from './pages/Settings';
import Attachments from './pages/Attachments';
import ShareNote from './pages/ShareNote';

const UI_DEV_MODE = import.meta.env.VITE_UI_DEV_MODE === 'true';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="obsidian-loading">Loading...</div>;
  if (!user && !UI_DEV_MODE) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicShareRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/share/:token" element={<PublicShareRoute><ShareNote /></PublicShareRoute>} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <ObsidianLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="notes" element={<Navigate to="/notes/new" replace />} />
        <Route path="notes/new" element={<NoteEditorObsidian />} />
        <Route path="notes/:id" element={<NoteEditorObsidian />} />
        <Route path="files" element={<Files />} />
        <Route path="folders" element={<FoldersList />} />
        <Route path="folders/:id" element={<FolderDetail />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="archive" element={<Archive />} />
        <Route path="settings" element={<Settings />} />
        <Route path="attachments" element={<Attachments />} />
      </Route>
    </Routes>
  );
}
