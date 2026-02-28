import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Codicon from '../components/Codicon';

export default function Attachments() {
  const { user, api } = useAuth();
  const [paths, setPaths] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    api.listAttachmentPaths(user.id).then(setPaths);
  }, [user, api]);

  const handleDelete = async (path: string) => {
    if (!confirm('Delete this attachment?')) return;
    await api.deleteAttachment(path);
    setPaths((prev) => prev.filter((p) => p !== path));
  };

  return (
    <div>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Codicon name="attach" size={24} /> Attachments
      </h1>
      {paths.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No attachments.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {paths.map((path) => (
            <li key={path} className="list-item">
              <span>{path.split('/').pop()}</span>
              <button type="button" className="secondary" onClick={() => handleDelete(path)}>
              <Codicon name="trash" size={16} /> Delete
            </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
