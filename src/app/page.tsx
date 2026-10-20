"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CalendarPlus, CheckCircle2, Clock3, Sparkles } from "lucide-react";

type Slot = { start: string; end: string; label: string };
type AiResult = { title: string; durationMinutes: number; summary: string };

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export default function HomePage() {
  const [connected, setConnected] = useState(false);
  const [request, setRequest] = useState("Schedule a 30-minute project planning meeting");
  const [title, setTitle] = useState("Project planning meeting");
  const [date, setDate] = useState(todayLocal());
  const [duration, setDuration] = useState(30);
  const [attendees, setAttendees] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [eventLink, setEventLink] = useState("");
  const [aiSummary, setAiSummary] = useState("");

  async function refreshConnection() {
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      setConnected(Boolean(data.connected));
    } catch { setConnected(false); }
  }

  useEffect(() => { void refreshConnection(); }, []);

  async function useAI() {
    setBusy(true); setError(""); setStatus("Asking local Ollama to understand your request...");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      const result = data.result as AiResult;
      setTitle(result.title);
      setDuration(result.durationMinutes);
      setAiSummary(result.summary || "");
      setStatus("AI suggestion applied. Choose a date and find live availability.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI request failed");
      setStatus("");
    } finally { setBusy(false); }
  }

  async function findSlots() {
    setBusy(true); setError(""); setStatus("Checking Google Calendar availability...");
    setSlots([]); setSelected(""); setEventLink("");
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, durationMinutes: duration })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Availability check failed");
      setSlots(data.slots);
      setStatus(data.slots.length ? `Found ${data.slots.length} available time slot(s). Select one below.` : "No available slots found on this date. Try another date.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Availability check failed");
      setStatus("");
    } finally { setBusy(false); }
  }

  async function createEvent() {
    if (!selected) { setError("Please select an available time first."); return; }
    setBusy(true); setError(""); setStatus("Rechecking availability and creating your Google Calendar event...");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description: request, date, durationMinutes: duration,
          start: selected, attendees: attendees.split(",").map((s) => s.trim()).filter(Boolean)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create event");
      setEventLink(data.event.htmlLink || "");
      setStatus("Meeting created successfully in Google Calendar.");
      setSlots([]);
      setSelected("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create event");
      setStatus("");
    } finally { setBusy(false); }
  }

  return (
    <main className="scheduler">
      <header className="hero">
        <div className="eyebrow">Local AI · Live calendar</div>
        <h1>AI Meeting Scheduler</h1>
        <p className="subtitle">Describe your meeting, check actual Google Calendar availability, and create the event only after you confirm a free time. Ollama runs locally on your computer.</p>
        <div className="actions">
          {connected
            ? <button className="secondary" onClick={refreshConnection}><CheckCircle2 size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 7 }} />Google Calendar connected</button>
            : <a className="primary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }} href="/api/auth/google"><CalendarDays size={16} style={{ marginRight: 8 }} />Connect Google Calendar</a>}
        </div>
      </header>

      <section className="panel">
        <h2><Sparkles size={19} style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }} />1. Describe your meeting</h2>
        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor="request">Natural-language request</label>
          <textarea id="request" rows={3} value={request} onChange={(e) => setRequest(e.target.value)} />
        </div>
        <div className="actions">
          <button className="secondary" disabled={busy || !request.trim()} onClick={useAI}>Suggest details with Ollama</button>
        </div>
        {aiSummary && <p className="small">AI interpretation: {aiSummary}</p>}
        <div className="grid" style={{ marginTop: 18 }}>
          <div className="field">
            <label htmlFor="title">Meeting title</label>
            <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
          </div>
          <div className="field">
            <label htmlFor="date">Date</label>
            <input id="date" type="date" min={todayLocal()} value={date} onChange={(e) => { setDate(e.target.value); setSlots([]); setSelected(""); }} />
          </div>
          <div className="field">
            <label htmlFor="duration">Duration</label>
            <select id="duration" value={duration} onChange={(e) => { setDuration(Number(e.target.value)); setSlots([]); setSelected(""); }}>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="attendees">Attendee emails (optional, comma-separated)</label>
            <input id="attendees" type="text" placeholder="person@example.com" value={attendees} onChange={(e) => setAttendees(e.target.value)} />
          </div>
        </div>
        <div className="actions">
          <button className="primary" disabled={busy || !connected || !title.trim()} onClick={findSlots}><Clock3 size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 7 }} />Find available times</button>
        </div>
        {!connected && <p className="small">Connect your Google account before checking availability. Your OAuth credentials stay on the server.</p>}
      </section>

      {slots.length > 0 && (
        <section className="panel">
          <h2>2. Select a free time</h2>
          <p className="small">These slots were computed from your connected primary calendar. Availability can change; the server checks again when you create the event.</p>
          <div className="slots">
            {slots.map((slot) => (
              <button key={slot.start} className={`slot ${selected === slot.start ? "selected" : ""}`} onClick={() => setSelected(slot.start)}>
                <strong>{slot.label}</strong>
                <span>{new Date(slot.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – {new Date(slot.end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
              </button>
            ))}
          </div>
          <div className="actions">
            <button className="primary" disabled={busy || !selected} onClick={createEvent}><CalendarPlus size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 7 }} />Confirm & create event</button>
            <button className="secondary" disabled={busy} onClick={findSlots}>Refresh availability</button>
          </div>
        </section>
      )}

      {(status || error) && <div className={`status ${error ? "error" : ""}`}>{error || status}</div>}
      {eventLink && <section className="panel success"><strong>Meeting created!</strong><p>Your event is now in Google Calendar.</p><a href={eventLink} target="_blank" rel="noreferrer">Open event in Google Calendar</a></section>}
      <p className="small" style={{ marginTop: 26 }}>Timezone: configured by the server. Local development starter; do not deploy publicly without production security review.</p>
    </main>
  );
}
