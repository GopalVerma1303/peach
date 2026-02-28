import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Codicon from '../components/Codicon';
import type { EventRecord } from '@gopx-drive/core';
import type { RepeatInterval } from '@gopx-drive/core';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function toDateOnly(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getEventsForDay(events: EventRecord[], day: Date): EventRecord[] {
  return events.filter((e) => {
    const ed = new Date(e.event_date);
    return isSameDay(ed, day);
  }).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
}

function getMonthGrid(year: number, month: number): { date: Date; isCurrentMonth: boolean }[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const daysInMonth = last.getDate();
  const leading = startDay;
  const trailing = 42 - leading - daysInMonth;
  const out: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = 0; i < leading; i++) {
    const d = new Date(year, month, 1 - (leading - i));
    out.push({ date: d, isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    out.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  for (let i = 0; i < trailing; i++) {
    out.push({ date: new Date(year, month, daysInMonth + i + 1), isCurrentMonth: false });
  }
  return out;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return 'All day';
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  repeat_interval: RepeatInterval | null;
}

const defaultForm: EventFormData = {
  title: '',
  description: '',
  date: '',
  time: '09:00',
  repeat_interval: null,
};

export default function Calendar() {
  const { cache, api, user } = useAuth();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());
  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<EventFormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const grid = getMonthGrid(year, month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const loadEvents = useCallback(() => {
    cache.getEvents().then(setEvents);
  }, [cache]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const goPrevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  const goNextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1));
  const goToday = () => {
    const t = new Date();
    setViewDate(t);
    setSelectedDate(t);
  };

  const selectedEvents = selectedDate ? getEventsForDay(events, selectedDate) : [];
  const dayHasEvents = (day: Date) => getEventsForDay(events, day).length > 0;

  const openAddModal = (prefillDate?: Date) => {
    const d = prefillDate || selectedDate || new Date();
    setForm({
      ...defaultForm,
      date: toDateOnly(d),
      time: '09:00',
    });
    setEditingEvent(null);
    setShowAddModal(true);
  };

  const openEditModal = (ev: EventRecord) => {
    const d = new Date(ev.event_date);
    setForm({
      title: ev.title,
      description: ev.description ?? '',
      date: toDateOnly(d),
      time: d.getHours() === 0 && d.getMinutes() === 0 ? '00:00' : String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'),
      repeat_interval: ev.repeat_interval ?? null,
    });
    setEditingEvent(ev);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingEvent(null);
    setForm(defaultForm);
  };

  const saveEvent = async () => {
    if (!form.title.trim() || !user) return;
    setSaving(true);
    const [h, m] = form.time.split(':').map(Number);
    const eventDate = new Date(form.date + 'T00:00:00');
    eventDate.setHours(h, m, 0, 0);

    if (editingEvent) {
      await cache.upsertEvent({
        ...editingEvent,
        title: form.title.trim(),
        description: form.description.trim() || null,
        event_date: eventDate.toISOString(),
        repeat_interval: form.repeat_interval,
        updated_at: new Date().toISOString(),
      });
      await api.updateEvent(editingEvent.id, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        event_date: eventDate.toISOString(),
        repeat_interval: form.repeat_interval,
      });
    } else {
      const payload = {
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        event_date: eventDate.toISOString(),
        repeat_interval: form.repeat_interval,
      };
      const { data, error } = await api.createEvent(payload);
      if (data) {
        await cache.upsertEvent(data);
        setEvents((prev) => [data, ...prev]);
      }
      if (error) await cache.addPendingOp({ type: 'event_create', payload });
    }
    setSaving(false);
    closeModal();
    loadEvents();
  };

  const deleteEvent = async (ev: EventRecord) => {
    if (!confirm('Delete this event?')) return;
    await cache.deleteEvent(ev.id);
    await api.deleteEvent(ev.id);
    setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    closeModal();
  };

  return (
    <div className="calendar-widget">
      <header className="calendar-toolbar">
        <div className="calendar-toolbar-left">
          <button type="button" className="calendar-btn calendar-btn-icon" onClick={goToday} title="Today">
            Today
          </button>
          <button type="button" className="calendar-btn calendar-btn-icon" onClick={goPrevMonth} title="Previous month" aria-label="Previous month">
            <Codicon name="chevron-left" size={20} />
          </button>
          <button type="button" className="calendar-btn calendar-btn-icon" onClick={goNextMonth} title="Next month" aria-label="Next month">
            <Codicon name="chevron-right" size={20} />
          </button>
          <h1 className="calendar-title">
            {MONTHS[month]} {year}
          </h1>
        </div>
      </header>

      <div className="calendar-body">
        <div className="calendar-grid-wrap">
          <div className="calendar-weekdays">
            {WEEKDAYS.map((w) => (
              <div key={w} className="calendar-weekday">
                {w}
              </div>
            ))}
          </div>
          <div className="calendar-days">
            {grid.map(({ date, isCurrentMonth }, i) => {
              const isToday = isSameDay(date, today);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const hasEvents = dayHasEvents(date);
              return (
                <button
                  key={i}
                  type="button"
                  className={`calendar-day ${!isCurrentMonth ? 'calendar-day-other' : ''} ${isToday ? 'calendar-day-today' : ''} ${isSelected ? 'calendar-day-selected' : ''}`}
                  onClick={() => setSelectedDate(date)}
                >
                  <span className="calendar-day-num">{date.getDate()}</span>
                  {hasEvents && (
                    <span className="calendar-day-dots">
                      {getEventsForDay(events, date).slice(0, 3).map((e) => (
                        <span key={e.id} className="calendar-day-dot" style={{ backgroundColor: 'var(--accent)' }} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="calendar-sidebar">
          <div className="calendar-sidebar-header">
            <span className="calendar-sidebar-title">
              {selectedDate
                ? selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                : 'Select a day'}
            </span>
            <button type="button" className="calendar-btn calendar-btn-primary" onClick={() => openAddModal(selectedDate ?? undefined)}>
              <Codicon name="add" size={16} /> New event
            </button>
          </div>
          <div className="calendar-events-list">
            {selectedDate && selectedEvents.length === 0 && (
              <p className="calendar-no-events">No events. Click &quot;New event&quot; to add one.</p>
            )}
            {selectedDate &&
              selectedEvents.map((ev) => (
                <div key={ev.id} className="calendar-event-card" onClick={() => openEditModal(ev)}>
                  <div className="calendar-event-time">{formatTime(ev.event_date)}</div>
                  <div className="calendar-event-title">{ev.title}</div>
                  {ev.description && <div className="calendar-event-desc">{ev.description}</div>}
                  {ev.repeat_interval && ev.repeat_interval !== 'once' && (
                    <span className="calendar-event-repeat">{ev.repeat_interval}</span>
                  )}
                </div>
              ))}
          </div>
        </aside>
      </div>

      {showAddModal && (
        <div className="calendar-modal-backdrop" onClick={closeModal}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-modal-header">
              <h2>{editingEvent ? 'Edit event' : 'New event'}</h2>
              <button type="button" className="calendar-btn calendar-btn-icon" onClick={closeModal} aria-label="Close">
                <Codicon name="close" size={18} />
              </button>
            </div>
            <div className="calendar-modal-body">
              <label className="calendar-field">
                <span>Title</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Event title"
                  autoFocus
                />
              </label>
              <label className="calendar-field">
                <span>Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Add description"
                  rows={3}
                />
              </label>
              <div className="calendar-field-row">
                <label className="calendar-field">
                  <span>Date</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </label>
                <label className="calendar-field">
                  <span>Time</span>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  />
                </label>
              </div>
              <label className="calendar-field">
                <span>Repeat</span>
                <select
                  value={form.repeat_interval ?? 'once'}
                  onChange={(e) => setForm((f) => ({ ...f, repeat_interval: (e.target.value === 'once' ? null : e.target.value) as RepeatInterval }))}
                >
                  <option value="once">Never</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </label>
            </div>
            <div className="calendar-modal-footer">
              {editingEvent && (
                <button type="button" className="calendar-btn calendar-btn-danger" onClick={() => deleteEvent(editingEvent)}>
                  <Codicon name="trash" size={14} /> Delete
                </button>
              )}
              <div className="calendar-modal-footer-right">
                <button type="button" className="calendar-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="button" className="calendar-btn calendar-btn-primary" onClick={saveEvent} disabled={!form.title.trim() || saving}>
                  {saving ? 'Saving…' : editingEvent ? 'Save' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
