import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Codicon from '../components/Codicon';
import type { EventRecord } from '@gopx-drive/core';

export default function Calendar() {
  const { cache, api, user } = useAuth();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    cache.getEvents().then((e) => {
      if (!cancelled) setEvents(e);
    });
    return () => { cancelled = true; };
  }, [cache]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate || !user) return;
    setAdding(true);
    const payload = {
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      event_date: new Date(eventDate).toISOString(),
      repeat_interval: null,
    };
    const { data, error } = await api.createEvent(payload);
    if (data) {
      await cache.upsertEvent(data);
      setEvents((prev) => [data, ...prev]);
      setTitle('');
      setDescription('');
      setEventDate('');
    }
    if (error) await cache.addPendingOp({ type: 'event_create', payload });
    setAdding(false);
  };

  return (
    <div>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Codicon name="calendar" size={24} /> Calendar
      </h1>
      <form onSubmit={handleAdd} style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 8 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            required
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <input
            type="datetime-local"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={adding}>
          <Codicon name="add" size={16} /> Add event
        </button>
      </form>
      <h2>Events</h2>
      {events.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No events.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {events.map((ev) => (
            <li key={ev.id} className="list-item">
              <span>{ev.title}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                {new Date(ev.event_date).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
