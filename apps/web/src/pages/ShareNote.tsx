import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createSupabaseClient } from '@gopx-drive/core';
import { createSupabaseApi } from '@gopx-drive/core';
import Codicon from '../components/Codicon';
import type { Note } from '@gopx-drive/core';

export default function ShareNote() {
  const { token } = useParams<{ token: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const supabase = createSupabaseClient();
    const api = createSupabaseApi(supabase);
    api.getNoteByShareToken(token).then((n) => {
      setNote(n ?? null);
      setLoading(false);
    });
  }, [token]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (!note) return <div style={{ padding: '2rem' }}>Note not found or sharing is disabled.</div>;

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '1rem' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Codicon name="share" size={24} /> {note.title || 'Untitled'}
      </h1>
      <div
        style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}
        dangerouslySetInnerHTML={{ __html: note.content.replace(/\n/g, '<br/>') }}
      />
      <p style={{ marginTop: 24, color: 'var(--text-muted)', fontSize: 14 }}>
        Updated {new Date(note.updated_at).toLocaleString()}
      </p>
    </div>
  );
}
