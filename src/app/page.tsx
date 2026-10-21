// "use client";

// import { useEffect, useState } from "react";
// import { CalendarDays, CalendarPlus, CheckCircle2, Clock3, Sparkles } from "lucide-react";

// type Slot = { start: string; end: string; label: string };
// type AiResult = { title: string; durationMinutes: number; summary: string };

// function todayLocal() {
//   const now = new Date();
//   const offset = now.getTimezoneOffset();
//   return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
// }

// export default function HomePage() {
//   const [connected, setConnected] = useState(false);
//   const [request, setRequest] = useState("Schedule a 30-minute project planning meeting");
//   const [title, setTitle] = useState("Project planning meeting");
//   const [date, setDate] = useState(todayLocal());
//   const [duration, setDuration] = useState(30);
//   const [attendees, setAttendees] = useState("");
//   const [slots, setSlots] = useState<Slot[]>([]);
//   const [selected, setSelected] = useState("");
//   const [busy, setBusy] = useState(false);
//   const [status, setStatus] = useState("");
//   const [error, setError] = useState("");
//   const [eventLink, setEventLink] = useState("");
//   const [aiSummary, setAiSummary] = useState("");

//   async function refreshConnection() {
//     try {
//       const res = await fetch("/api/auth/status");
//       const data = await res.json();
//       setConnected(Boolean(data.connected));
//     } catch { setConnected(false); }
//   }

//   useEffect(() => { void refreshConnection(); }, []);

//   async function useAI() {
//     setBusy(true); setError(""); setStatus("Asking local Ollama to understand your request...");
//     try {
//       const res = await fetch("/api/ai", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ request })
//       });
//       const data = await res.json();
//       console.log("AI response:", data);
//       if (!res.ok) throw new Error(data.error || "AI request failed");
//       const result = data.result as AiResult;
//       setTitle(result.title);
//       setDuration(result.durationMinutes);
//       setAiSummary(result.summary || "");
//       setStatus("AI suggestion applied. Choose a date and find live availability.");
//     } catch (e) {
//       setError(e instanceof Error ? e.message : "AI request failed");
//       setStatus("");
//     } finally { setBusy(false); }
//   }

//   async function findSlots() {
//     setBusy(true); setError(""); setStatus("Checking Google Calendar availability...");
//     setSlots([]); setSelected(""); setEventLink("");
//     try {
//       const res = await fetch("/api/availability", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ date, durationMinutes: duration })
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Availability check failed");
//       setSlots(data.slots);
//       setStatus(data.slots.length ? `Found ${data.slots.length} available time slot(s). Select one below.` : "No available slots found on this date. Try another date.");
//     } catch (e) {
//       setError(e instanceof Error ? e.message : "Availability check failed");
//       setStatus("");
//     } finally { setBusy(false); }
//   }

//   async function createEvent() {
//     if (!selected) { setError("Please select an available time first."); return; }
//     setBusy(true); setError(""); setStatus("Rechecking availability and creating your Google Calendar event...");
//     try {
//       const res = await fetch("/api/events", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           title, description: request, date, durationMinutes: duration,
//           start: selected, attendees: attendees.split(",").map((s) => s.trim()).filter(Boolean)
//         })
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Could not create event");
//       setEventLink(data.event.htmlLink || "");
//       setStatus("Meeting created successfully in Google Calendar.");
//       setSlots([]);
//       setSelected("");
//     } catch (e) {
//       setError(e instanceof Error ? e.message : "Could not create event");
//       setStatus("");
//     } finally { setBusy(false); }
//   }

//   return (
//     <main className="scheduler">
//       <header className="hero">
//         <div className="eyebrow">Local AI · Live calendar</div>
//         <h1>AI Meeting Scheduler</h1>
//         <p className="subtitle">Describe your meeting, check actual Google Calendar availability, and create the event only after you confirm a free time. Ollama runs locally on your computer.</p>
//         <div className="actions">
//           {connected
//             ? <button className="secondary" onClick={refreshConnection}><CheckCircle2 size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 7 }} />Google Calendar connected</button>
//             : <a className="primary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }} href="/api/auth/google"><CalendarDays size={16} style={{ marginRight: 8 }} />Connect Google Calendar</a>}
//         </div>
//       </header>

//       <section className="panel">
//         <h2><Sparkles size={19} style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }} />1. Describe your meeting</h2>
//         <div className="field" style={{ marginTop: 16 }}>
//           <label htmlFor="request">Natural-language request</label>
//           <textarea id="request" rows={3} value={request} onChange={(e) => setRequest(e.target.value)} />
//         </div>
//         <div className="actions">
//           <button className="secondary" disabled={busy || !request.trim()} onClick={useAI}>Suggest details with Ollama</button>
//         </div>
//         {aiSummary && <p className="small">AI interpretation: {aiSummary}</p>}
//         <div className="grid" style={{ marginTop: 18 }}>
//           <div className="field">
//             <label htmlFor="title">Meeting title</label>
//             <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
//           </div>
//           <div className="field">
//             <label htmlFor="date">Date</label>
//             <input id="date" type="date" min={todayLocal()} value={date} onChange={(e) => { setDate(e.target.value); setSlots([]); setSelected(""); }} />
//           </div>
//           <div className="field">
//             <label htmlFor="duration">Duration</label>
//             <select id="duration" value={duration} onChange={(e) => { setDuration(Number(e.target.value)); setSlots([]); setSelected(""); }}>
//               <option value={15}>15 minutes</option>
//               <option value={30}>30 minutes</option>
//               <option value={45}>45 minutes</option>
//               <option value={60}>60 minutes</option>
//               <option value={90}>90 minutes</option>
//             </select>
//           </div>
//           <div className="field">
//             <label htmlFor="attendees">Attendee emails (optional, comma-separated)</label>
//             <input id="attendees" type="text" placeholder="person@example.com" value={attendees} onChange={(e) => setAttendees(e.target.value)} />
//           </div>
//         </div>
//         <div className="actions">
//           <button className="primary" disabled={busy || !connected || !title.trim()} onClick={findSlots}><Clock3 size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 7 }} />Find available times</button>
//         </div>
//         {!connected && <p className="small">Connect your Google account before checking availability. Your OAuth credentials stay on the server.</p>}
//       </section>

//       {slots.length > 0 && (
//         <section className="panel">
//           <h2>2. Select a free time</h2>
//           <p className="small">These slots were computed from your connected primary calendar. Availability can change; the server checks again when you create the event.</p>
//           <div className="slots">
//             {slots.map((slot) => (
//               <button key={slot.start} className={`slot ${selected === slot.start ? "selected" : ""}`} onClick={() => setSelected(slot.start)}>
//                 <strong>{slot.label}</strong>
//                 <span>{new Date(slot.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – {new Date(slot.end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
//               </button>
//             ))}
//           </div>
//           <div className="actions">
//             <button className="primary" disabled={busy || !selected} onClick={createEvent}><CalendarPlus size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 7 }} />Confirm & create event</button>
//             <button className="secondary" disabled={busy} onClick={findSlots}>Refresh availability</button>
//           </div>
//         </section>
//       )}

//       {(status || error) && <div className={`status ${error ? "error" : ""}`}>{error || status}</div>}
//       {eventLink && <section className="panel success"><strong>Meeting created!</strong><p>Your event is now in Google Calendar.</p><a href={eventLink} target="_blank" rel="noreferrer">Open event in Google Calendar</a></section>}
//       <p className="small" style={{ marginTop: 26 }}>Timezone: configured by the server. Local development starter; do not deploy publicly without production security review.</p>
//     </main>
//   );
// }




// "use client";

// import { useEffect, useState } from "react";
// import {
//   CalendarDays,
//   CalendarPlus,
//   CheckCircle2,
//   Clock3,
//   Sparkles,
// } from "lucide-react";

// type Slot = {
//   start: string;
//   end: string;
//   label: string;
// };

// type AiResult = {
//   title: string;
//   durationMinutes: number;
//   summary: string;
//   date?: string | null;
//   preferredStartTime?: string | null;
//   preferredEndTime?: string | null;
// };

// function todayLocal() {
//   const now = new Date();
//   const offset = now.getTimezoneOffset();

//   return new Date(now.getTime() - offset * 60_000)
//     .toISOString()
//     .slice(0, 10);
// }

// export default function HomePage() {
//   const [connected, setConnected] = useState(false);

//   const [request, setRequest] = useState(
//     "Schedule a 30-minute project planning meeting"
//   );

//   const [title, setTitle] = useState("Project planning meeting");
//   const [date, setDate] = useState(todayLocal());
//   const [duration, setDuration] = useState(30);
//   const [attendees, setAttendees] = useState("");

//   const [slots, setSlots] = useState<Slot[]>([]);
//   const [selected, setSelected] = useState("");

//   const [busy, setBusy] = useState(false);
//   const [status, setStatus] = useState("");
//   const [error, setError] = useState("");
//   const [eventLink, setEventLink] = useState("");
//   const [aiSummary, setAiSummary] = useState("");

//   const [preferredStartTime, setPreferredStartTime] =
//     useState<string | null>(null);

//   const [preferredEndTime, setPreferredEndTime] =
//     useState<string | null>(null);

//   async function refreshConnection() {
//     try {
//       const res = await fetch("/api/auth/status");
//       const data = await res.json();

//       setConnected(Boolean(data.connected));
//     } catch {
//       setConnected(false);
//     }
//   }

//   useEffect(() => {
//     void refreshConnection();
//   }, []);

//   function clearAvailability() {
//     setSlots([]);
//     setSelected("");
//     setEventLink("");
//   }

//   async function useAI() {
//     setBusy(true);
//     setError("");
//     setStatus("Asking local Ollama to understand your request...");

//     try {
//       const res = await fetch("/api/ai", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ request }),
//       });

//       const data = await res.json();

//       console.log("AI response:", data);

//       if (!res.ok) {
//         throw new Error(data.error || "AI request failed");
//       }

//       const result = data.result as AiResult;

//       setTitle(result.title);
//       setDuration(result.durationMinutes);
//       setAiSummary(result.summary || "");

//       // Apply the date returned by /api/ai.
//       if (result.date) {
//         setDate(result.date);
//       }

//       setPreferredStartTime(
//         result.preferredStartTime ?? null
//       );

//       setPreferredEndTime(
//         result.preferredEndTime ?? null
//       );

//       clearAvailability();

//       setStatus(
//         result.date
//           ? `AI suggestion applied. Date: ${result.date}. Find available times to continue.`
//           : "AI suggestion applied. Please review the date and find available times."
//       );
//     } catch (e) {
//       setError(
//         e instanceof Error ? e.message : "AI request failed"
//       );
//       setStatus("");
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function findSlots() {
//     setBusy(true);
//     setError("");
//     setStatus("Checking Google Calendar availability...");

//     setSlots([]);
//     setSelected("");
//     setEventLink("");

//     try {
//       const res = await fetch("/api/availability", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           date,
//           durationMinutes: duration,
//           preferredStartTime,
//           preferredEndTime,
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(
//           data.error || "Availability check failed"
//         );
//       }

//       const availableSlots: Slot[] = data.slots || [];

//       setSlots(availableSlots);

//       setStatus(
//         availableSlots.length
//           ? `Found ${availableSlots.length} available time slot(s). Select one below.`
//           : "No available slots found. Try another date or time."
//       );
//     } catch (e) {
//       setError(
//         e instanceof Error
//           ? e.message
//           : "Availability check failed"
//       );
//       setStatus("");
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function createEvent() {
//     if (!selected) {
//       setError("Please select an available time first.");
//       return;
//     }

//     setBusy(true);
//     setError("");

//     setStatus(
//       "Rechecking availability and creating your Google Calendar event..."
//     );

//     try {
//       const res = await fetch("/api/events", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           title,
//           description: request,
//           date,
//           durationMinutes: duration,
//           start: selected,
//           attendees: attendees
//             .split(",")
//             .map((email) => email.trim())
//             .filter(Boolean),
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(
//           data.error || "Could not create event"
//         );
//       }

//       setEventLink(data.event?.htmlLink || "");

//       setStatus(
//         "Meeting created successfully in Google Calendar."
//       );

//       setSlots([]);
//       setSelected("");
//     } catch (e) {
//       setError(
//         e instanceof Error
//           ? e.message
//           : "Could not create event"
//       );
//       setStatus("");
//     } finally {
//       setBusy(false);
//     }
//   }

//   return (
//     <main className="scheduler">
//       <header className="hero">
//         <div className="eyebrow">
//           Local AI · Live calendar
//         </div>

//         <h1>AI Meeting Scheduler</h1>

//         <p className="subtitle">
//           Describe your meeting, check actual Google Calendar
//           availability, and create the event only after you
//           confirm a free time. Ollama runs locally on your
//           computer.
//         </p>

//         <div className="actions">
//           {connected ? (
//             <button
//               className="secondary"
//               onClick={refreshConnection}
//             >
//               <CheckCircle2
//                 size={16}
//                 style={{
//                   display: "inline",
//                   verticalAlign: "middle",
//                   marginRight: 7,
//                 }}
//               />
//               Google Calendar connected
//             </button>
//           ) : (
//             <a
//               className="primary"
//               style={{
//                 textDecoration: "none",
//                 display: "inline-flex",
//                 alignItems: "center",
//               }}
//               href="/api/auth/google"
//             >
//               <CalendarDays
//                 size={16}
//                 style={{ marginRight: 8 }}
//               />
//               Connect Google Calendar
//             </a>
//           )}
//         </div>
//       </header>

//       <section className="panel">
//         <h2>
//           <Sparkles
//             size={19}
//             style={{
//               display: "inline",
//               verticalAlign: "middle",
//               marginRight: 8,
//             }}
//           />
//           1. Describe your meeting
//         </h2>

//         <div className="field" style={{ marginTop: 16 }}>
//           <label htmlFor="request">
//             Natural-language request
//           </label>

//           <textarea
//             id="request"
//             rows={3}
//             value={request}
//             onChange={(e) => setRequest(e.target.value)}
//           />
//         </div>

//         <div className="actions">
//           <button
//             className="secondary"
//             disabled={busy || !request.trim()}
//             onClick={useAI}
//           >
//             Suggest details with Ollama
//           </button>
//         </div>

//         {aiSummary && (
//           <p className="small">
//             AI interpretation: {aiSummary}
//           </p>
//         )}

//         <div className="grid" style={{ marginTop: 18 }}>
//           <div className="field">
//             <label htmlFor="title">Meeting title</label>

//             <input
//               id="title"
//               value={title}
//               onChange={(e) => {
//                 setTitle(e.target.value);
//                 clearAvailability();
//               }}
//               maxLength={150}
//             />
//           </div>

//           <div className="field">
//             <label htmlFor="date">Date</label>

//             <input
//               id="date"
//               type="date"
//               min={todayLocal()}
//               value={date}
//               onChange={(e) => {
//                 setDate(e.target.value);
//                 clearAvailability();
//               }}
//             />
//           </div>

//           <div className="field">
//             <label htmlFor="duration">Duration</label>

//             <select
//               id="duration"
//               value={duration}
//               onChange={(e) => {
//                 setDuration(Number(e.target.value));
//                 clearAvailability();
//               }}
//             >
//               <option value={15}>15 minutes</option>
//               <option value={30}>30 minutes</option>
//               <option value={45}>45 minutes</option>
//               <option value={60}>60 minutes</option>
//               <option value={90}>90 minutes</option>
//             </select>
//           </div>

//           <div className="field">
//             <label htmlFor="attendees">
//               Attendee emails (optional, comma-separated)
//             </label>

//             <input
//               id="attendees"
//               type="text"
//               placeholder="person@example.com"
//               value={attendees}
//               onChange={(e) => setAttendees(e.target.value)}
//             />
//           </div>
//         </div>

//         {preferredStartTime && preferredEndTime && (
//           <p className="small">
//             Preferred time: {preferredStartTime} –{" "}
//             {preferredEndTime}
//           </p>
//         )}

//         <div className="actions">
//           <button
//             className="primary"
//             disabled={
//               busy || !connected || !title.trim() || !date
//             }
//             onClick={findSlots}
//           >
//             <Clock3
//               size={16}
//               style={{
//                 display: "inline",
//                 verticalAlign: "middle",
//                 marginRight: 7,
//               }}
//             />
//             Find available times
//           </button>
//         </div>

//         {!connected && (
//           <p className="small">
//             Connect your Google account before checking
//             availability. Your OAuth credentials stay on
//             the server.
//           </p>
//         )}
//       </section>

//       {slots.length > 0 && (
//         <section className="panel">
//           <h2>2. Select a free time</h2>

//           <p className="small">
//             These slots were computed from your connected
//             primary calendar. Availability can change; the
//             server checks again when you create the event.
//           </p>

//           <div className="slots">
//             {slots.map((slot) => (
//               <button
//                 key={slot.start}
//                 className={`slot ${
//                   selected === slot.start ? "selected" : ""
//                 }`}
//                 onClick={() => setSelected(slot.start)}
//               >
//                 <strong>{slot.label}</strong>

//                 <span>
//                   {new Date(slot.start).toLocaleTimeString(
//                     [],
//                     {
//                       hour: "numeric",
//                       minute: "2-digit",
//                     }
//                   )}{" "}
//                   –{" "}
//                   {new Date(slot.end).toLocaleTimeString(
//                     [],
//                     {
//                       hour: "numeric",
//                       minute: "2-digit",
//                     }
//                   )}
//                 </span>
//               </button>
//             ))}
//           </div>

//           <div className="actions">
//             <button
//               className="primary"
//               disabled={busy || !selected}
//               onClick={createEvent}
//             >
//               <CalendarPlus
//                 size={16}
//                 style={{
//                   display: "inline",
//                   verticalAlign: "middle",
//                   marginRight: 7,
//                 }}
//               />
//               Confirm &amp; create event
//             </button>

//             <button
//               className="secondary"
//               disabled={busy}
//               onClick={findSlots}
//             >
//               Refresh availability
//             </button>
//           </div>
//         </section>
//       )}

//       {(status || error) && (
//         <div className={`status ${error ? "error" : ""}`}>
//           {error || status}
//         </div>
//       )}

//       {eventLink && (
//         <section className="panel success">
//           <strong>Meeting created!</strong>
//           <p>Your event is now in Google Calendar.</p>

//           <a
//             href={eventLink}
//             target="_blank"
//             rel="noreferrer"
//           >
//             Open event in Google Calendar
//           </a>
//         </section>
//       )}

//       <p className="small" style={{ marginTop: 26 }}>
//         Timezone: configured by the server. Local development
//         starter; do not deploy publicly without production
//         security review.
//       </p>
//     </main>
//   );
// }


// add voice note code 
// "use client";

// import { useEffect, useState } from "react";
// import {
//   CalendarDays,
//   CalendarPlus,
//   CheckCircle2,
//   Clock3,
//   Sparkles,
// } from "lucide-react";

// type Slot = {
//   start: string;
//   end: string;
//   label: string;
// };

// type AiResult = {
//   title: string;
//   durationMinutes: number;
//   summary: string;
//   date?: string | null;
//   preferredStartTime?: string | null;
//   preferredEndTime?: string | null;
// };

// // Voice recognition types
// type SpeechRecognitionAlternativeLike = {
//   transcript: string;
// };

// type SpeechRecognitionResultLike =
//   ArrayLike<SpeechRecognitionAlternativeLike>;

// type SpeechRecognitionEventLike = {
//   results: ArrayLike<SpeechRecognitionResultLike>;
//   resultIndex: number;
// };

// type SpeechRecognitionLike = {
//   lang: string;
//   continuous: boolean;
//   interimResults: boolean;
//   onresult:
//     | ((event: SpeechRecognitionEventLike) => void)
//     | null;
//   onerror: (() => void) | null;
//   onend: (() => void) | null;
//   start: () => void;
//   stop: () => void;
// };

// type SpeechWindow = Window & {
//   SpeechRecognition?: new () => SpeechRecognitionLike;
//   webkitSpeechRecognition?: new () => SpeechRecognitionLike;
// };

// function todayLocal() {
//   const now = new Date();
//   const offset = now.getTimezoneOffset();

//   return new Date(now.getTime() - offset * 60_000)
//     .toISOString()
//     .slice(0, 10);
// }

// export default function HomePage() {
//   const [connected, setConnected] = useState(false);

//   const [request, setRequest] = useState(
//     "Schedule a 30-minute project planning meeting"
//   );

//   // Voice-to-text state
//   const [listening, setListening] = useState(false);
//   const [voiceError, setVoiceError] = useState("");
//   const [speechSupported, setSpeechSupported] =
//     useState(false);

//   const [recognition, setRecognition] =
//     useState<SpeechRecognitionLike | null>(null);

//   const [title, setTitle] = useState(
//     "Project planning meeting"
//   );
//   const [date, setDate] = useState(todayLocal());
//   const [duration, setDuration] = useState(30);
//   const [attendees, setAttendees] = useState("");

//   const [slots, setSlots] = useState<Slot[]>([]);
//   const [selected, setSelected] = useState("");

//   const [busy, setBusy] = useState(false);
//   const [status, setStatus] = useState("");
//   const [error, setError] = useState("");
//   const [eventLink, setEventLink] = useState("");
//   const [aiSummary, setAiSummary] = useState("");

//   const [preferredStartTime, setPreferredStartTime] =
//     useState<string | null>(null);

//   const [preferredEndTime, setPreferredEndTime] =
//     useState<string | null>(null);

//   async function refreshConnection() {
//     try {
//       const res = await fetch("/api/auth/status");
//       const data = await res.json();

//       setConnected(Boolean(data.connected));
//     } catch {
//       setConnected(false);
//     }
//   }

//   useEffect(() => {
//     void refreshConnection();
//   }, []);

//   // Initialize browser voice recognition
//   useEffect(() => {
//     const speechWindow = window as SpeechWindow;

//     const SpeechRecognitionClass =
//       speechWindow.SpeechRecognition ??
//       speechWindow.webkitSpeechRecognition;

//     setSpeechSupported(Boolean(SpeechRecognitionClass));

//     if (!SpeechRecognitionClass) return;

//     const instance = new SpeechRecognitionClass();

//     instance.lang = "en-IN";
//     instance.continuous = false;
//     instance.interimResults = false;

//     instance.onresult = (event) => {
//       const transcript = Array.from(event.results)
//         .slice(event.resultIndex)
//         .map((result) => result[0]?.transcript ?? "")
//         .join(" ")
//         .trim();

//       if (transcript) {
//         // Replace the default example text on the first voice input.
//         setRequest((previous) => {
//           const defaultRequest =
//             "Schedule a 30-minute project planning meeting";

//           if (previous.trim() === defaultRequest) {
//             return transcript;
//           }

//           return previous.trim()
//             ? `${previous.trim()} ${transcript}`
//             : transcript;
//         });

//         setVoiceError("");
//         setSlots([]);
//         setSelected("");
//         setEventLink("");
//       }
//     };

//     instance.onerror = () => {
//       setVoiceError(
//         "Voice recognition failed. Check microphone permission and try again."
//       );
//       setListening(false);
//     };

//     instance.onend = () => {
//       setListening(false);
//     };

//     setRecognition(instance);

//     return () => {
//       instance.stop();
//     };
//   }, []);

//   function clearAvailability() {
//     setSlots([]);
//     setSelected("");
//     setEventLink("");
//   }

//   async function useAI() {
//     setBusy(true);
//     setError("");
//     setStatus(
//       "Asking local Ollama to understand your request..."
//     );

//     try {
//       const res = await fetch("/api/ai", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ request }),
//       });

//       const data = await res.json();

//       console.log("AI response:", data);

//       if (!res.ok) {
//         throw new Error(
//           data.error || "AI request failed"
//         );
//       }

//       const result = data.result as AiResult;

//       setTitle(result.title);
//       setDuration(result.durationMinutes);
//       setAiSummary(result.summary || "");

//       if (result.date) {
//         setDate(result.date);
//       }

//       setPreferredStartTime(
//         result.preferredStartTime ?? null
//       );

//       setPreferredEndTime(
//         result.preferredEndTime ?? null
//       );

//       clearAvailability();

//       setStatus(
//         result.date
//           ? `AI suggestion applied. Date: ${result.date}. Find available times to continue.`
//           : "AI suggestion applied. Please review the date and find available times."
//       );
//     } catch (e) {
//       setError(
//         e instanceof Error
//           ? e.message
//           : "AI request failed"
//       );
//       setStatus("");
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function findSlots() {
//     setBusy(true);
//     setError("");
//     setStatus(
//       "Checking Google Calendar availability..."
//     );

//     setSlots([]);
//     setSelected("");
//     setEventLink("");

//     try {
//       const res = await fetch("/api/availability", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           date,
//           durationMinutes: duration,
//           preferredStartTime,
//           preferredEndTime,
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(
//           data.error || "Availability check failed"
//         );
//       }

//       const availableSlots: Slot[] =
//         data.slots || [];

//       setSlots(availableSlots);

//       setStatus(
//         availableSlots.length
//           ? `Found ${availableSlots.length} available time slot(s). Select one below.`
//           : "No available slots found. Try another date or time."
//       );
//     } catch (e) {
//       setError(
//         e instanceof Error
//           ? e.message
//           : "Availability check failed"
//       );
//       setStatus("");
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function createEvent() {
//     if (!selected) {
//       setError(
//         "Please select an available time first."
//       );
//       return;
//     }

//     setBusy(true);
//     setError("");

//     setStatus(
//       "Rechecking availability and creating your Google Calendar event..."
//     );

//     try {
//       const res = await fetch("/api/events", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           title,
//           description: request,
//           date,
//           durationMinutes: duration,
//           start: selected,
//           attendees: attendees
//             .split(",")
//             .map((email) => email.trim())
//             .filter(Boolean),
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(
//           data.error || "Could not create event"
//         );
//       }

//       setEventLink(data.event?.htmlLink || "");

//       setStatus(
//         "Meeting created successfully in Google Calendar."
//       );

//       setSlots([]);
//       setSelected("");
//     } catch (e) {
//       setError(
//         e instanceof Error
//           ? e.message
//           : "Could not create event"
//       );
//       setStatus("");
//     } finally {
//       setBusy(false);
//     }
//   }

//   function toggleVoiceRecognition() {
//     if (!recognition) return;

//     setVoiceError("");

//     if (listening) {
//       recognition.stop();
//       setListening(false);
//       return;
//     }

//     try {
//       recognition.start();
//       setListening(true);
//     } catch {
//       setVoiceError(
//         "Microphone is already active. Please try again."
//       );
//     }
//   }

//   return (
//     <main className="scheduler">
//       <header className="hero">
//         <div className="eyebrow">
//           Local AI · Live calendar
//         </div>

//         <h1>AI Meeting Scheduler</h1>

//         <p className="subtitle">
//           Describe your meeting, check actual Google Calendar
//           availability, and create the event only after you
//           confirm a free time. Ollama runs locally on your
//           computer.
//         </p>

//         <div className="actions">
//           {connected ? (
//             <button
//               className="secondary"
//               onClick={refreshConnection}
//             >
//               <CheckCircle2
//                 size={16}
//                 style={{
//                   display: "inline",
//                   verticalAlign: "middle",
//                   marginRight: 7,
//                 }}
//               />
//               Google Calendar connected
//             </button>
//           ) : (
//             <a
//               className="primary"
//               style={{
//                 textDecoration: "none",
//                 display: "inline-flex",
//                 alignItems: "center",
//               }}
//               href="/api/auth/google"
//             >
//               <CalendarDays
//                 size={16}
//                 style={{ marginRight: 8 }}
//               />
//               Connect Google Calendar
//             </a>
//           )}
//         </div>
//       </header>

//       <section className="panel">
//         <h2>
//           <Sparkles
//             size={19}
//             style={{
//               display: "inline",
//               verticalAlign: "middle",
//               marginRight: 8,
//             }}
//           />
//           1. Describe your meeting
//         </h2>

//         <div
//           className="field"
//           style={{ marginTop: 16 }}
//         >
//           <label htmlFor="request">
//             Natural-language request
//           </label>

//           <textarea
//             id="request"
//             rows={3}
//             value={request}
//             onChange={(e) => {
//               setRequest(e.target.value);
//               clearAvailability();
//             }}
//             placeholder="Type your meeting request or use the microphone..."
//           />
//         </div>

//         {/* Voice-to-text controls */}
//         <div className="actions">
//           <button
//             type="button"
//             className="secondary"
//             disabled={
//               !speechSupported || !recognition || busy
//             }
//             onClick={toggleVoiceRecognition}
//           >
//             {listening
//               ? "⏹ Stop speaking"
//               : "🎙 Speak your meeting request"}
//           </button>

//           {listening && (
//             <span className="small">
//               Listening... Speak now.
//             </span>
//           )}
//         </div>

//         {voiceError && (
//           <p className="small" role="alert">
//             {voiceError}
//           </p>
//         )}

//         {!speechSupported && (
//           <p className="small">
//             Voice input is not supported in this browser.
//             Try Google Chrome and allow microphone access.
//           </p>
//         )}

//         <div className="actions">
//           <button
//             className="secondary"
//             disabled={busy || !request.trim()}
//             onClick={useAI}
//           >
//             Suggest details with Ollama
//           </button>
//         </div>

//         {aiSummary && (
//           <p className="small">
//             AI interpretation: {aiSummary}
//           </p>
//         )}

//         <div
//           className="grid"
//           style={{ marginTop: 18 }}
//         >
//           <div className="field">
//             <label htmlFor="title">
//               Meeting title
//             </label>

//             <input
//               id="title"
//               value={title}
//               onChange={(e) => {
//                 setTitle(e.target.value);
//                 clearAvailability();
//               }}
//               maxLength={150}
//             />
//           </div>

//           <div className="field">
//             <label htmlFor="date">Date</label>

//             <input
//               id="date"
//               type="date"
//               min={todayLocal()}
//               value={date}
//               onChange={(e) => {
//                 setDate(e.target.value);
//                 clearAvailability();
//               }}
//             />
//           </div>

//           <div className="field">
//             <label htmlFor="duration">
//               Duration
//             </label>

//             <select
//               id="duration"
//               value={duration}
//               onChange={(e) => {
//                 setDuration(Number(e.target.value));
//                 clearAvailability();
//               }}
//             >
//               <option value={15}>15 minutes</option>
//               <option value={30}>30 minutes</option>
//               <option value={45}>45 minutes</option>
//               <option value={60}>60 minutes</option>
//               <option value={90}>90 minutes</option>
//             </select>
//           </div>

//           <div className="field">
//             <label htmlFor="attendees">
//               Attendee emails (optional, comma-separated)
//             </label>

//             <input
//               id="attendees"
//               type="text"
//               placeholder="person@example.com"
//               value={attendees}
//               onChange={(e) =>
//                 setAttendees(e.target.value)
//               }
//             />
//           </div>
//         </div>

//         {preferredStartTime && preferredEndTime && (
//           <p className="small">
//             Preferred time: {preferredStartTime} –{" "}
//             {preferredEndTime}
//           </p>
//         )}

//         <div className="actions">
//           <button
//             className="primary"
//             disabled={
//               busy ||
//               !connected ||
//               !title.trim() ||
//               !date
//             }
//             onClick={findSlots}
//           >
//             <Clock3
//               size={16}
//               style={{
//                 display: "inline",
//                 verticalAlign: "middle",
//                 marginRight: 7,
//               }}
//             />
//             Find available times
//           </button>
//         </div>

//         {!connected && (
//           <p className="small">
//             Connect your Google account before checking
//             availability. Your OAuth credentials stay on
//             the server.
//           </p>
//         )}
//       </section>

//       {slots.length > 0 && (
//         <section className="panel">
//           <h2>2. Select a free time</h2>

//           <p className="small">
//             These slots were computed from your connected
//             primary calendar. Availability can change; the
//             server checks again when you create the event.
//           </p>

//           <div className="slots">
//             {slots.map((slot) => (
//               <button
//                 key={slot.start}
//                 className={`slot ${
//                   selected === slot.start
//                     ? "selected"
//                     : ""
//                 }`}
//                 onClick={() => setSelected(slot.start)}
//               >
//                 <strong>{slot.label}</strong>

//                 <span>
//                   {new Date(
//                     slot.start
//                   ).toLocaleTimeString([], {
//                     hour: "numeric",
//                     minute: "2-digit",
//                   })}{" "}
//                   –{" "}
//                   {new Date(
//                     slot.end
//                   ).toLocaleTimeString([], {
//                     hour: "numeric",
//                     minute: "2-digit",
//                   })}
//                 </span>
//               </button>
//             ))}
//           </div>

//           <div className="actions">
//             <button
//               className="primary"
//               disabled={busy || !selected}
//               onClick={createEvent}
//             >
//               <CalendarPlus
//                 size={16}
//                 style={{
//                   display: "inline",
//                   verticalAlign: "middle",
//                   marginRight: 7,
//                 }}
//               />
//               Confirm &amp; create event
//             </button>

//             <button
//               className="secondary"
//               disabled={busy}
//               onClick={findSlots}
//             >
//               Refresh availability
//             </button>
//           </div>
//         </section>
//       )}

//       {(status || error) && (
//         <div
//           className={`status ${error ? "error" : ""}`}
//         >
//           {error || status}
//         </div>
//       )}

//       {eventLink && (
//         <section className="panel success">
//           <strong>Meeting created!</strong>
//           <p>
//             Your event is now in Google Calendar.
//           </p>

//           <a
//             href={eventLink}
//             target="_blank"
//             rel="noreferrer"
//           >
//             Open event in Google Calendar
//           </a>
//         </section>
//       )}

//       <p
//         className="small"
//         style={{ marginTop: 26 }}
//       >
//         Timezone: configured by the server. Local development
//         starter; do not deploy publicly without production
//         security review.
//       </p>
//     </main>
//   );
// }


// automatic run code

// src/app/page.tsx

// "use client";

// import {
//   FormEvent,
//   KeyboardEvent,
//   useCallback,
//   useEffect,
//   useRef,
//   useState,
// } from "react";

// type MeetingDetails = {
//   title: string;
//   description: string;
//   date: string;
//   durationMinutes: number;
//   preferredStartTime: string;
//   preferredEndTime: string;
//   attendees: string[];
// };

// type MeetingSlot = {
//   start: string;
//   end: string;
// };

// type SpeechRecognitionAlternative = {
//   transcript: string;
// };

// type SpeechRecognitionResult = {
//   0: SpeechRecognitionAlternative;
//   isFinal: boolean;
// };

// type SpeechRecognitionResultList = {
//   length: number;
//   [index: number]: SpeechRecognitionResult;
// };

// type SpeechRecognitionEventLike = {
//   resultIndex: number;
//   results: SpeechRecognitionResultList;
// };

// type SpeechRecognitionLike = {
//   lang: string;
//   continuous: boolean;
//   interimResults: boolean;
//   onresult:
//     | ((event: SpeechRecognitionEventLike) => void)
//     | null;
//   onerror: ((event: { error?: string }) => void) | null;
//   onend: (() => void) | null;
//   start: () => void;
//   stop: () => void;
// };

// type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

// type WindowWithSpeechRecognition = Window & {
//   SpeechRecognition?: SpeechRecognitionConstructor;
//   webkitSpeechRecognition?: SpeechRecognitionConstructor;
// };

// function pad(value: number) {
//   return String(value).padStart(2, "0");
// }

// function formatDateForDisplay(dateString: string) {
//   const [year, month, day] = dateString.split("-").map(Number);
//   const date = new Date(year, month - 1, day);

//   return date.toLocaleDateString(undefined, {
//     weekday: "long",
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });
// }

// function formatTime(time: string) {
//   const [hours, minutes] = time.split(":").map(Number);
//   const date = new Date();
//   date.setHours(hours, minutes, 0, 0);

//   return date.toLocaleTimeString(undefined, {
//     hour: "numeric",
//     minute: "2-digit",
//   });
// }

// function getLocalTimeFromIso(value: string) {
//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     // Some APIs may return a bare "HH:mm" time.
//     const timeMatch = value.match(/(?:T|\s)(\d{2}:\d{2})/);
//     return timeMatch?.[1] ?? "";
//   }

//   return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
// }

// function getLocalIsoString(date: Date) {
//   // Produces a local-time ISO string with an explicit timezone offset.
//   const offsetMinutes = -date.getTimezoneOffset();
//   const sign = offsetMinutes >= 0 ? "+" : "-";
//   const absOffset = Math.abs(offsetMinutes);
//   const offset = `${sign}${pad(Math.floor(absOffset / 60))}:${pad(
//     absOffset % 60,
//   )}`;

//   return (
//     `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
//     `T${pad(date.getHours())}:${pad(date.getMinutes())}:00${offset}`
//   );
// }

// function buildStartDateTime(date: string, time: string) {
//   const [year, month, day] = date.split("-").map(Number);
//   const [hours, minutes] = time.split(":").map(Number);

//   const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

//   return getLocalIsoString(localDate);
// }

// function getErrorMessage(data: unknown, fallback: string) {
//   if (
//     data &&
//     typeof data === "object" &&
//     "error" in data &&
//     typeof data.error === "string"
//   ) {
//     return data.error;
//   }

//   if (
//     data &&
//     typeof data === "object" &&
//     "message" in data &&
//     typeof data.message === "string"
//   ) {
//     return data.message;
//   }

//   return fallback;
// }

// function normalizeSlots(data: unknown): MeetingSlot[] {
//   if (!data || typeof data !== "object") return [];

//   const record = data as Record<string, unknown>;
//   const possibleSlots =
//     Array.isArray(data)
//       ? data
//       : Array.isArray(record.slots)
//         ? record.slots
//         : Array.isArray(record.availableSlots)
//           ? record.availableSlots
//           : Array.isArray(record.available)
//             ? record.available
//             : [];

//   return possibleSlots
//     .map((item): MeetingSlot | null => {
//       if (typeof item === "string") {
//         return { start: item, end: "" };
//       }

//       if (!item || typeof item !== "object") return null;

//       const slot = item as Record<string, unknown>;
//       const start =
//         typeof slot.start === "string"
//           ? slot.start
//           : typeof slot.startTime === "string"
//             ? slot.startTime
//             : typeof slot.startDateTime === "string"
//               ? slot.startDateTime
//               : "";

//       const end =
//         typeof slot.end === "string"
//           ? slot.end
//           : typeof slot.endTime === "string"
//             ? slot.endTime
//             : typeof slot.endDateTime === "string"
//               ? slot.endDateTime
//               : "";

//       return start ? { start, end } : null;
//     })
//     .filter((slot): slot is MeetingSlot => slot !== null);
// }

// export default function MeetingSchedulerPage() {
//   const [requestText, setRequestText] = useState("");
//   const [details, setDetails] = useState<MeetingDetails | null>(null);
//   const [selectedSlot, setSelectedSlot] = useState<MeetingSlot | null>(null);
//   const [status, setStatus] = useState("");
//   const [error, setError] = useState("");
//   const [processing, setProcessing] = useState(false);
//   const [creating, setCreating] = useState(false);
//   const [created, setCreated] = useState(false);
//   const [listening, setListening] = useState(false);

//   const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
//   const processingRef = useRef(false);
//   const latestTranscriptRef = useRef("");
//   const mountedRef = useRef(true);

//   useEffect(() => {
//     return () => {
//       mountedRef.current = false;
//       recognitionRef.current?.stop();
//     };
//   }, []);

//   const resetPreviousResult = useCallback(() => {
//     setDetails(null);
//     setSelectedSlot(null);
//     setCreated(false);
//     setError("");
//     setStatus("");
//   }, []);

//   const processMeetingRequest = useCallback(
//     async (rawText: string) => {
//       const prompt = rawText.trim();

//       if (!prompt || processingRef.current) return;

//       processingRef.current = true;
//       setProcessing(true);
//       setCreating(false);
//       resetPreviousResult();
//       setStatus("Understanding your meeting request...");
//       setError("");

//       try {
//         // 1. Parse the natural-language request.
//         const aiResponse = await fetch("/api/ai", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ prompt }),
//         });

//         const aiData = (await aiResponse.json()) as
//           | MeetingDetails
//           | { error?: string; message?: string };

//         if (!aiResponse.ok) {
//           throw new Error(
//             getErrorMessage(aiData, "Could not understand the meeting request."),
//           );
//         }

//         const parsed = aiData as MeetingDetails;

//         if (
//           !parsed.date ||
//           !parsed.preferredStartTime ||
//           !parsed.durationMinutes
//         ) {
//           throw new Error(
//             "Please include the date, exact start time, and meeting duration.",
//           );
//         }

//         setDetails(parsed);
//         setStatus("Checking Google Calendar availability...");

//         // 2. Ask the existing availability API for slots in the requested window.
//         const params = new URLSearchParams({
//           date: parsed.date,
//           durationMinutes: String(parsed.durationMinutes),
//           preferredStartTime: parsed.preferredStartTime,
//           preferredEndTime: parsed.preferredEndTime,
//         });

//         const availabilityResponse = await fetch(
//           `/api/availability?${params.toString()}`,
//           { method: "GET", cache: "no-store" },
//         );

//         const availabilityData: unknown = await availabilityResponse.json();

//         if (!availabilityResponse.ok) {
//           throw new Error(
//             getErrorMessage(
//               availabilityData,
//               "Could not check Google Calendar availability.",
//             ),
//           );
//         }

//         const slots = normalizeSlots(availabilityData);

//         // Exact requested start time must match. Do not silently book a
//         // different time when the requested slot is unavailable.
//         const matchingSlot = slots.find((slot) => {
//           return getLocalTimeFromIso(slot.start) === parsed.preferredStartTime;
//         });

//         if (!matchingSlot) {
//           setSelectedSlot(null);
//           setStatus("");
//           setError(
//             `The requested time (${formatTime(parsed.preferredStartTime)}) is not available on ${formatDateForDisplay(parsed.date)}. No meeting was created. Please try another time.`,
//           );
//           return;
//         }

//         setSelectedSlot(matchingSlot);
//         setStatus("Time is available. Review the details and confirm.");
//       } catch (caught) {
//         const message =
//           caught instanceof Error
//             ? caught.message
//             : "Something went wrong while processing the request.";

//         setError(message);
//         setStatus("");
//       } finally {
//         processingRef.current = false;
//         setProcessing(false);
//       }
//     },
//     [resetPreviousResult],
//   );

//   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     await processMeetingRequest(requestText);
//   }

//   function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
//     if (event.key === "Enter" && !event.shiftKey) {
//       event.preventDefault();
//       void processMeetingRequest(requestText);
//     }
//   }

//   function startVoiceRecognition() {
//     setError("");

//     const speechWindow = window as WindowWithSpeechRecognition;
//     const SpeechRecognitionAPI =
//       speechWindow.SpeechRecognition ??
//       speechWindow.webkitSpeechRecognition;

//     if (!SpeechRecognitionAPI) {
//       setError(
//         "Voice recognition is not supported in this browser. Try the latest Chrome or type your request.",
//       );
//       return;
//     }

//     if (listening) {
//       recognitionRef.current?.stop();
//       return;
//     }

//     const recognition = new SpeechRecognitionAPI();
//     recognition.lang = "en-IN";
//     recognition.continuous = false;
//     recognition.interimResults = true;

//     latestTranscriptRef.current = requestText.trim();

//     recognition.onresult = (event) => {
//       let finalTranscript = "";
//       let interimTranscript = "";

//       for (let index = event.resultIndex; index < event.results.length; index++) {
//         const result = event.results[index];
//         const transcript = result[0]?.transcript ?? "";

//         if (result.isFinal) {
//           finalTranscript += transcript;
//         } else {
//           interimTranscript += transcript;
//         }
//       }

//       const previous = latestTranscriptRef.current;
//       const spokenText = `${previous} ${finalTranscript || interimTranscript}`
//         .trim()
//         .replace(/\s+/g, " ");

//       setRequestText(spokenText);

//       if (finalTranscript.trim()) {
//         latestTranscriptRef.current = `${previous} ${finalTranscript}`
//           .trim()
//           .replace(/\s+/g, " ");
//       }
//     };

//     recognition.onerror = (event) => {
//       setListening(false);

//       if (event.error !== "no-speech" && event.error !== "aborted") {
//         setError(`Voice recognition failed: ${event.error ?? "unknown error"}`);
//       }
//     };

//     recognition.onend = () => {
//       setListening(false);
//       recognitionRef.current = null;

//       // Once the user finishes speaking, automatically process the transcript.
//       const transcript = latestTranscriptRef.current.trim();

//       if (transcript) {
//         setRequestText(transcript);
//         void processMeetingRequest(transcript);
//       }
//     };

//     recognitionRef.current = recognition;

//     try {
//       setListening(true);
//       recognition.start();
//     } catch {
//       setListening(false);
//       setError("Could not start voice recognition. Please try again.");
//     }
//   }

//   async function confirmAndCreateMeeting() {
//     if (!details || !selectedSlot || creating || created) return;

//     setCreating(true);
//     setError("");
//     setStatus("Creating your Google Calendar meeting...");

//     try {
//       const start = buildStartDateTime(
//         details.date,
//         details.preferredStartTime,
//       );

//       // 3. Preserve the existing event-creation API flow.
//       // This is called only after the user clicks the confirmation button.
//       const response = await fetch("/api/events", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           title: details.title,
//           description: details.description,
//           date: details.date,
//           durationMinutes: details.durationMinutes,
//           start,
//           attendees: details.attendees,
//         }),
//       });

//       const data: unknown = await response.json();

//       if (!response.ok) {
//         throw new Error(
//           getErrorMessage(data, "Could not create the Google Calendar event."),
//         );
//       }

//       setCreated(true);
//       setStatus("Meeting created successfully in Google Calendar.");
//       setSelectedSlot(null);
//     } catch (caught) {
//       const message =
//         caught instanceof Error
//           ? caught.message
//           : "Could not create the meeting.";

//       setStatus("");
//       setError(message);
//     } finally {
//       setCreating(false);
//     }
//   }

//   const canConfirm = Boolean(details && selectedSlot && !created);

//   return (
//     <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6">
//       <div className="mx-auto max-w-2xl">
//         <header className="mb-8 text-center">
//           <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-2xl">
//             📅
//           </div>

//           <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
//             AI Meeting Scheduler
//           </h1>

//           <p className="mt-3 text-sm text-slate-400 sm:text-base">
//             Type or speak your request. We’ll check your calendar before you
//             confirm.
//           </p>
//         </header>

//         <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-7">
//           <form onSubmit={handleSubmit}>
//             <label
//               htmlFor="meeting-request"
//               className="mb-2 block text-sm font-medium text-slate-200"
//             >
//               What meeting would you like to schedule?
//             </label>

//             <textarea
//               id="meeting-request"
//               value={requestText}
//               onChange={(event) => setRequestText(event.target.value)}
//               onKeyDown={handleInputKeyDown}
//               placeholder="e.g. Please set up a meeting for next Wednesday at 11:30 AM for 30 minutes with sudheer@vanigamsoftware.com"
//               rows={4}
//               disabled={processing || creating}
//               className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
//             />

//             <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
//               <p className="text-xs text-slate-500">
//                 Press Enter to process · Shift+Enter for a new line
//               </p>

//               <button
//                 type="button"
//                 onClick={startVoiceRecognition}
//                 disabled={processing || creating}
//                 className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
//                   listening
//                     ? "border-red-400/50 bg-red-500/10 text-red-300"
//                     : "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
//                 }`}
//               >
//                 <span aria-hidden="true">{listening ? "■" : "🎙️"}</span>
//                 {listening ? "Stop listening" : "Speak"}
//               </button>
//             </div>

//             <button
//               type="submit"
//               disabled={!requestText.trim() || processing || creating}
//               className="sr-only"
//               aria-hidden="true"
//               tabIndex={-1}
//             >
//               Process request
//             </button>
//           </form>

//           {(processing || status) && (
//             <div
//               className="mt-5 flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200"
//               role="status"
//               aria-live="polite"
//             >
//               {processing && (
//                 <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300/30 border-t-indigo-300" />
//               )}
//               <span>{status}</span>
//             </div>
//           )}

//           {error && (
//             <div
//               className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
//               role="alert"
//             >
//               {error}
//             </div>
//           )}

//           {details && (
//             <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/70 p-5">
//               <div className="mb-4 flex items-center justify-between gap-3">
//                 <h2 className="text-lg font-semibold">Meeting details</h2>
//                 {selectedSlot && !created && (
//                   <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
//                     Time available
//                   </span>
//                 )}
//               </div>

//               <dl className="space-y-4 text-sm">
//                 <div>
//                   <dt className="text-slate-500">Title</dt>
//                   <dd className="mt-1 font-medium text-slate-100">
//                     {details.title}
//                   </dd>
//                 </div>

//                 <div>
//                   <dt className="text-slate-500">Date</dt>
//                   <dd className="mt-1 text-slate-200">
//                     {formatDateForDisplay(details.date)}
//                   </dd>
//                 </div>

//                 <div>
//                   <dt className="text-slate-500">Time</dt>
//                   <dd className="mt-1 text-slate-200">
//                     {formatTime(details.preferredStartTime)} –{" "}
//                     {formatTime(details.preferredEndTime)}
//                   </dd>
//                 </div>

//                 <div>
//                   <dt className="text-slate-500">Duration</dt>
//                   <dd className="mt-1 text-slate-200">
//                     {details.durationMinutes} minutes
//                   </dd>
//                 </div>

//                 <div>
//                   <dt className="text-slate-500">Attendees</dt>
//                   <dd className="mt-1 break-all text-slate-200">
//                     {details.attendees.length > 0
//                       ? details.attendees.join(", ")
//                       : "No attendee email detected"}
//                   </dd>
//                 </div>

//                 {details.description && (
//                   <div>
//                     <dt className="text-slate-500">Description</dt>
//                     <dd className="mt-1 whitespace-pre-wrap text-slate-300">
//                       {details.description}
//                     </dd>
//                   </div>
//                 )}
//               </dl>

//               {created ? (
//                 <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200">
//                   ✓ Meeting created. Check Google Calendar for the event and
//                   attendee invitation.
//                 </div>
//               ) : (
//                 <button
//                   type="button"
//                   onClick={confirmAndCreateMeeting}
//                   disabled={!canConfirm || creating}
//                   className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
//                 >
//                   {creating ? (
//                     <>
//                       <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
//                       Creating meeting...
//                     </>
//                   ) : (
//                     "Confirm & Create Meeting"
//                   )}
//                 </button>
//               )}

//               {!selectedSlot && !created && !processing && !error && (
//                 <p className="mt-3 text-xs text-slate-500">
//                   The confirmation button appears after the exact requested
//                   time is confirmed available.
//                 </p>
//               )}
//             </div>
//           )}
//         </section>

//         <p className="mt-5 text-center text-xs leading-5 text-slate-500">
//           Nothing is booked until you click Confirm &amp; Create Meeting.
//         </p>
//       </div>
//     </main>
//   );
// }





// "use client";

// import {
//   type FormEvent,
//   type KeyboardEvent,
//   useCallback,
//   useEffect,
//   useRef,
//   useState,
// } from "react";

// type MeetingDetails = {
//   title: string;
//   description: string;
//   date: string;
//   durationMinutes: number;
//   preferredStartTime: string;
//   preferredEndTime: string;
//   attendees: string[];
// };

// type MeetingSlot = {
//   start: string;
//   end: string;
//   startTime?: string;
//   endTime?: string;
//   label?: string;
// };

// type SpeechRecognitionAlternative = {
//   transcript: string;
// };

// type SpeechRecognitionResult = {
//   0: SpeechRecognitionAlternative;
//   isFinal: boolean;
// };

// type SpeechRecognitionResultList = {
//   length: number;
//   [index: number]: SpeechRecognitionResult;
// };

// type SpeechRecognitionEventLike = {
//   resultIndex: number;
//   results: SpeechRecognitionResultList;
// };

// type SpeechRecognitionLike = {
//   lang: string;
//   continuous: boolean;
//   interimResults: boolean;
//   onresult: ((event: SpeechRecognitionEventLike) => void) | null;
//   onerror: ((event: { error?: string }) => void) | null;
//   onend: (() => void) | null;
//   start: () => void;
//   stop: () => void;
// };

// type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

// type WindowWithSpeechRecognition = Window & {
//   SpeechRecognition?: SpeechRecognitionConstructor;
//   webkitSpeechRecognition?: SpeechRecognitionConstructor;
// };

// function pad(value: number): string {
//   return String(value).padStart(2, "0");
// }

// function formatDateForDisplay(dateString: string): string {
//   const [year, month, day] = dateString.split("-").map(Number);
//   const date = new Date(year, month - 1, day);

//   return date.toLocaleDateString(undefined, {
//     weekday: "long",
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });
// }

// function formatTime(time: string): string {
//   const [hours, minutes] = time.split(":").map(Number);
//   const date = new Date();

//   date.setHours(hours, minutes, 0, 0);

//   return date.toLocaleTimeString(undefined, {
//     hour: "numeric",
//     minute: "2-digit",
//   });
// }

// function getErrorMessage(data: unknown, fallback: string): string {
//   if (data && typeof data === "object") {
//     const record = data as Record<string, unknown>;

//     if (typeof record.error === "string") {
//       return record.error;
//     }

//     if (typeof record.message === "string") {
//       return record.message;
//     }
//   }

//   return fallback;
// }

// async function readJsonResponse(
//   response: Response,
//   fallback: string,
// ): Promise<unknown> {
//   const text = await response.text();

//   if (!text.trim()) {
//     if (!response.ok) {
//       throw new Error(`${fallback} (HTTP ${response.status})`);
//     }

//     throw new Error("The server returned an empty response.");
//   }

//   let data: unknown;

//   try {
//     data = JSON.parse(text);
//   } catch {
//     throw new Error(
//       `Invalid JSON response (HTTP ${response.status}). Check the API route and terminal logs.`,
//     );
//   }

//   if (!response.ok) {
//     throw new Error(
//       getErrorMessage(data, `${fallback} (HTTP ${response.status})`),
//     );
//   }

//   return data;
// }

// function normalizeSlots(data: unknown): MeetingSlot[] {
//   if (!data || typeof data !== "object") {
//     return [];
//   }

//   const record = data as Record<string, unknown>;

//   const possibleSlots = Array.isArray(record.slots)
//     ? record.slots
//     : Array.isArray(record.availableSlots)
//       ? record.availableSlots
//       : Array.isArray(record.available)
//         ? record.available
//         : [];

//   return possibleSlots
//     .map((item): MeetingSlot | null => {
//       if (!item || typeof item !== "object") {
//         return null;
//       }

//       const slot = item as Record<string, unknown>;

//       const start =
//         typeof slot.start === "string" ? slot.start : "";

//       const end =
//         typeof slot.end === "string" ? slot.end : "";

//       const startTime =
//         typeof slot.startTime === "string"
//           ? slot.startTime
//           : undefined;

//       const endTime =
//         typeof slot.endTime === "string"
//           ? slot.endTime
//           : undefined;

//       const label =
//         typeof slot.label === "string" ? slot.label : undefined;

//       if (!start) {
//         return null;
//       }

//       return {
//         start,
//         end,
//         startTime,
//         endTime,
//         label,
//       };
//     })
//     .filter((slot): slot is MeetingSlot => slot !== null);
// }

// function getLocalIsoString(date: Date): string {
//   const offsetMinutes = -date.getTimezoneOffset();
//   const sign = offsetMinutes >= 0 ? "+" : "-";
//   const absoluteOffset = Math.abs(offsetMinutes);

//   const offset =
//     `${sign}${pad(Math.floor(absoluteOffset / 60))}:` +
//     `${pad(absoluteOffset % 60)}`;

//   return (
//     `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
//     `T${pad(date.getHours())}:${pad(date.getMinutes())}:00${offset}`
//   );
// }

// function buildStartDateTime(date: string, time: string): string {
//   const [year, month, day] = date.split("-").map(Number);
//   const [hours, minutes] = time.split(":").map(Number);

//   const localDate = new Date(
//     year,
//     month - 1,
//     day,
//     hours,
//     minutes,
//     0,
//     0,
//   );

//   return getLocalIsoString(localDate);
// }

// export default function MeetingSchedulerPage() {
//   const [requestText, setRequestText] = useState("");
//   const [details, setDetails] = useState<MeetingDetails | null>(null);
//   const [selectedSlot, setSelectedSlot] = useState<MeetingSlot | null>(null);
//   const [status, setStatus] = useState("");
//   const [error, setError] = useState("");
//   const [processing, setProcessing] = useState(false);
//   const [creating, setCreating] = useState(false);
//   const [created, setCreated] = useState(false);
//   const [listening, setListening] = useState(false);

//   const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
//   const processingRef = useRef(false);
//   const creatingRef = useRef(false);
//   const latestTranscriptRef = useRef("");
//   const interimTranscriptRef = useRef("");
//   const autoProcessVoiceRef = useRef(false);

//   useEffect(() => {
//     return () => {
//       autoProcessVoiceRef.current = false;
//       recognitionRef.current?.stop();
//     };
//   }, []);

//   const resetPreviousResult = useCallback(() => {
//     setDetails(null);
//     setSelectedSlot(null);
//     setCreated(false);
//     setError("");
//     setStatus("");
//   }, []);

//   const processMeetingRequest = useCallback(
//     async (rawText: string) => {
//       const prompt = rawText.trim();

//       if (!prompt || processingRef.current || creatingRef.current) {
//         return;
//       }

//       processingRef.current = true;
//       setProcessing(true);
//       resetPreviousResult();
//       setStatus("Understanding your meeting request...");
//       setError("");

//       try {
//         // 1. Parse the natural-language request.
//         const aiResponse = await fetch("/api/ai", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ prompt }),
//         });

//         const aiData = await readJsonResponse(
//           aiResponse,
//           "Could not understand the meeting request.",
//         );

//         const parsed = aiData as MeetingDetails;

//         if (
//           !parsed ||
//           typeof parsed.title !== "string" ||
//           !parsed.date ||
//           !parsed.preferredStartTime ||
//           !parsed.preferredEndTime ||
//           !Number.isInteger(parsed.durationMinutes)
//         ) {
//           throw new Error(
//             "The request must include a date, exact start time, and duration.",
//           );
//         }

//         if (!Array.isArray(parsed.attendees)) {
//           parsed.attendees = [];
//         }

//         setDetails(parsed);
//         setStatus("Checking Google Calendar availability...");

//         // 2. IMPORTANT: availability route expects POST with a JSON body.
//         const availabilityResponse = await fetch("/api/availability", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           cache: "no-store",
//           body: JSON.stringify({
//             date: parsed.date,
//             durationMinutes: parsed.durationMinutes,
//             preferredStartTime: parsed.preferredStartTime,
//             preferredEndTime: parsed.preferredEndTime,
//           }),
//         });

//         const availabilityData = await readJsonResponse(
//           availabilityResponse,
//           "Could not check Google Calendar availability.",
//         );

//         const slots = normalizeSlots(availabilityData);

//         // 3. Match both exact times in the configured calendar timezone.
//         // The availability API returns startTime/endTime in that timezone.
//         const matchingSlot = slots.find((slot) => {
//           if (slot.startTime && slot.endTime) {
//             return (
//               slot.startTime === parsed.preferredStartTime &&
//               slot.endTime === parsed.preferredEndTime
//             );
//           }

//           // Fallback for APIs that don't return startTime/endTime.
//           // Use the browser's local time only as a fallback.
//           const startDate = new Date(slot.start);
//           const endDate = new Date(slot.end);

//           if (
//             Number.isNaN(startDate.getTime()) ||
//             Number.isNaN(endDate.getTime())
//           ) {
//             return false;
//           }

//           const localStart =
//             `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;
//           const localEnd =
//             `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;

//           return (
//             localStart === parsed.preferredStartTime &&
//             localEnd === parsed.preferredEndTime
//           );
//         });

//         if (!matchingSlot) {
//           setSelectedSlot(null);
//           setStatus("");

//           setError(
//             `The requested time (${formatTime(parsed.preferredStartTime)}–${formatTime(parsed.preferredEndTime)}) is not available on ${formatDateForDisplay(parsed.date)}. No meeting was created.`,
//           );

//           return;
//         }

//         setSelectedSlot(matchingSlot);
//         setStatus(
//           "The requested time is available. Review the details and confirm.",
//         );
//       } catch (caught) {
//         setStatus("");

//         setError(
//           caught instanceof Error
//             ? caught.message
//             : "Something went wrong while processing the meeting request.",
//         );
//       } finally {
//         processingRef.current = false;
//         setProcessing(false);
//       }
//     },
//     [resetPreviousResult],
//   );

//   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     await processMeetingRequest(requestText);
//   }

//   function handleInputKeyDown(
//     event: KeyboardEvent<HTMLTextAreaElement>,
//   ) {
//     if (event.key === "Enter" && !event.shiftKey) {
//       event.preventDefault();
//       void processMeetingRequest(requestText);
//     }
//   }

//   function startVoiceRecognition() {
//     setError("");

//     const speechWindow = window as WindowWithSpeechRecognition;

//     const SpeechRecognitionAPI =
//       speechWindow.SpeechRecognition ??
//       speechWindow.webkitSpeechRecognition;

//     if (!SpeechRecognitionAPI) {
//       setError(
//         "Voice recognition is not supported in this browser. Use Chrome or type your request.",
//       );
//       return;
//     }

//     if (listening) {
//       autoProcessVoiceRef.current = true;
//       recognitionRef.current?.stop();
//       return;
//     }

//     const recognition = new SpeechRecognitionAPI();

//     recognition.lang = "en-IN";
//     recognition.continuous = false;
//     recognition.interimResults = true;

//     // Start a fresh voice request instead of appending stale transcripts.
//     latestTranscriptRef.current = "";
//     interimTranscriptRef.current = "";
//     autoProcessVoiceRef.current = true;

//     recognition.onresult = (event) => {
//       let finalTranscript = "";
//       let interimTranscript = "";

//       for (
//         let index = event.resultIndex;
//         index < event.results.length;
//         index++
//       ) {
//         const result = event.results[index];
//         const transcript = result[0]?.transcript ?? "";

//         if (result.isFinal) {
//           finalTranscript += `${transcript} `;
//         } else {
//           interimTranscript += `${transcript} `;
//         }
//       }

//       if (finalTranscript.trim()) {
//         latestTranscriptRef.current =
//           `${latestTranscriptRef.current} ${finalTranscript}`
//             .trim()
//             .replace(/\s+/g, " ");

//         interimTranscriptRef.current = "";
//       } else if (interimTranscript.trim()) {
//         interimTranscriptRef.current = interimTranscript.trim();
//       }

//       const displayTranscript = [
//         latestTranscriptRef.current,
//         interimTranscriptRef.current,
//       ]
//         .filter(Boolean)
//         .join(" ")
//         .replace(/\s+/g, " ")
//         .trim();

//       setRequestText(displayTranscript);
//     };

//     recognition.onerror = (event) => {
//       setListening(false);

//       if (event.error !== "no-speech" && event.error !== "aborted") {
//         setError(
//           `Voice recognition failed: ${event.error ?? "unknown error"}`,
//         );
//       }
//     };

//     recognition.onend = () => {
//       setListening(false);
//       recognitionRef.current = null;

//       const shouldProcess = autoProcessVoiceRef.current;
//       autoProcessVoiceRef.current = false;

//       const transcript = [
//         latestTranscriptRef.current,
//         interimTranscriptRef.current,
//       ]
//         .filter(Boolean)
//         .join(" ")
//         .replace(/\s+/g, " ")
//         .trim();

//       if (!transcript) {
//         if (shouldProcess) {
//           setError("No speech was detected. Please try again.");
//         }
//         return;
//       }

//       setRequestText(transcript);

//       if (shouldProcess) {
//         void processMeetingRequest(transcript);
//       }
//     };

//     recognitionRef.current = recognition;

//     try {
//       setListening(true);
//       recognition.start();
//     } catch {
//       setListening(false);
//       autoProcessVoiceRef.current = false;
//       recognitionRef.current = null;
//       setError("Could not start voice recognition. Please try again.");
//     }
//   }

//   async function confirmAndCreateMeeting() {
//     if (
//       !details ||
//       !selectedSlot ||
//       creatingRef.current ||
//       processingRef.current ||
//       created
//     ) {
//       return;
//     }

//     creatingRef.current = true;
//     setCreating(true);
//     setError("");
//     setStatus("Creating your Google Calendar meeting...");

//     try {
//       // Use the exact slot returned by availability, not a newly calculated time.
//       const start = selectedSlot.start;

//       // This request is sent only after the user clicks Confirm.
//       const response = await fetch("/api/events", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           title: details.title,
//           description: details.description,
//           date: details.date,
//           durationMinutes: details.durationMinutes,
//           start,
//           attendees: details.attendees,
//         }),
//       });

//       await readJsonResponse(response, "Could not create the calendar event.");

//       setCreated(true);
//       setSelectedSlot(null);
//       setStatus("Meeting created successfully in Google Calendar.");
//     } catch (caught) {
//       setStatus("");

//       setError(
//         caught instanceof Error
//           ? caught.message
//           : "Could not create the meeting.",
//       );
//     } finally {
//       creatingRef.current = false;
//       setCreating(false);
//     }
//   }

//   const canConfirm = Boolean(
//     details && selectedSlot && !created && !processing && !creating,
//   );

//   return (
//     <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6">
//       <div className="mx-auto max-w-2xl">
//         <header className="mb-8 text-center">
//           <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-2xl">
//             📅
//           </div>

//           <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
//             AI Meeting Scheduler
//           </h1>

//           <p className="mt-3 text-sm text-slate-400 sm:text-base">
//             Type or speak your request. We will check your calendar before you
//             confirm.
//           </p>
//         </header>

//         <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-7">
//           <form onSubmit={handleSubmit}>
//             <label
//               htmlFor="meeting-request"
//               className="mb-2 block text-sm font-medium text-slate-200"
//             >
//               What meeting would you like to schedule?
//             </label>

//             <textarea
//               id="meeting-request"
//               value={requestText}
//               onChange={(event) => setRequestText(event.target.value)}
//               onKeyDown={handleInputKeyDown}
//               placeholder="Please set up a meeting for next Wednesday at 11:30 AM for 30 minutes with sudheer@vanigamsoftware.com"
//               rows={4}
//               disabled={processing || creating || listening}
//               className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
//             />

//             <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
//               <p className="text-xs text-slate-500">
//                 Press Enter to process · Shift+Enter for a new line
//               </p>

//               <button
//                 type="button"
//                 onClick={startVoiceRecognition}
//                 disabled={processing || creating}
//                 className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
//                   listening
//                     ? "border-red-400/50 bg-red-500/10 text-red-300"
//                     : "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
//                 }`}
//               >
//                 <span aria-hidden="true">
//                   {listening ? "■" : "🎙️"}
//                 </span>
//                 {listening ? "Stop listening" : "Speak"}
//               </button>
//             </div>

//             {/* Hidden submit lets the form use Enter without showing an extra button. */}
//             <button
//               type="submit"
//               disabled={!requestText.trim() || processing || creating}
//               className="hidden"
//               tabIndex={-1}
//               aria-hidden="true"
//             >
//               Process request
//             </button>
//           </form>

//           {(processing || status) && (
//             <div
//               className="mt-5 flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200"
//               role="status"
//               aria-live="polite"
//             >
//               {processing && (
//                 <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300/30 border-t-indigo-300" />
//               )}
//               <span>{status}</span>
//             </div>
//           )}

//           {error && (
//             <div
//               className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
//               role="alert"
//             >
//               {error}
//             </div>
//           )}

//           {details && (
//             <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/70 p-5">
//               <div className="mb-4 flex items-center justify-between gap-3">
//                 <h2 className="text-lg font-semibold">Meeting details</h2>

//                 {selectedSlot && !created && (
//                   <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
//                     Time available
//                   </span>
//                 )}
//               </div>

//               <dl className="space-y-4 text-sm">
//                 <div>
//                   <dt className="text-slate-500">Title</dt>
//                   <dd className="mt-1 font-medium text-slate-100">
//                     {details.title}
//                   </dd>
//                 </div>

//                 <div>
//                   <dt className="text-slate-500">Date</dt>
//                   <dd className="mt-1 text-slate-200">
//                     {formatDateForDisplay(details.date)}
//                   </dd>
//                 </div>

//                 <div>
//                   <dt className="text-slate-500">Time</dt>
//                   <dd className="mt-1 text-slate-200">
//                     {formatTime(details.preferredStartTime)} –{" "}
//                     {formatTime(details.preferredEndTime)}
//                   </dd>
//                 </div>

//                 <div>
//                   <dt className="text-slate-500">Duration</dt>
//                   <dd className="mt-1 text-slate-200">
//                     {details.durationMinutes} minutes
//                   </dd>
//                 </div>

//                 <div>
//                   <dt className="text-slate-500">Attendees</dt>
//                   <dd className="mt-1 break-all text-slate-200">
//                     {details.attendees.length > 0
//                       ? details.attendees.join(", ")
//                       : "No attendee email detected"}
//                   </dd>
//                 </div>

//                 {details.description && (
//                   <div>
//                     <dt className="text-slate-500">Description</dt>
//                     <dd className="mt-1 whitespace-pre-wrap text-slate-300">
//                       {details.description}
//                     </dd>
//                   </div>
//                 )}
//               </dl>

//               {created ? (
//                 <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200">
//                   ✓ Meeting created. Check Google Calendar for the event and
//                   attendee invitation.
//                 </div>
//               ) : (
//                 <button
//                   type="button"
//                   onClick={confirmAndCreateMeeting}
//                   disabled={!canConfirm}
//                   className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
//                 >
//                   {creating ? (
//                     <>
//                       <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
//                       Creating meeting...
//                     </>
//                   ) : (
//                     "Confirm & Create Meeting"
//                   )}
//                 </button>
//               )}

//               {!selectedSlot && !created && !processing && !error && (
//                 <p className="mt-3 text-xs text-slate-500">
//                   The confirmation button becomes available after the exact
//                   requested time is confirmed available.
//                 </p>
//               )}
//             </div>
//           )}
//         </section>

//         <p className="mt-5 text-center text-xs leading-5 text-slate-500">
//           Nothing is booked until you click Confirm &amp; Create Meeting.
//         </p>
//       </div>
//     </main>
//   );
// }


// button change
// -------------------------------------------------------------

// "use client";

// import {
//   type FormEvent,
//   type KeyboardEvent,
//   useCallback,
//   useEffect,
//   useRef,
//   useState,
// } from "react";

// type MeetingDetails = {
//   title: string;
//   description: string;
//   date: string;
//   durationMinutes: number;
//   preferredStartTime: string;
//   preferredEndTime: string;
//   attendees: string[];
// };

// type MeetingSlot = {
//   start: string;
//   end: string;
//   startTime?: string;
//   endTime?: string;
//   label?: string;
// };

// type CreatedCalendarEvent = {
//   id?: string;
//   htmlLink?: string | null;
//   summary?: string;
// };

// type SpeechAlternative = { transcript: string };
// type SpeechResult = {
//   0: SpeechAlternative;
//   isFinal: boolean;
// };
// type SpeechResults = {
//   length: number;
//   [index: number]: SpeechResult;
// };
// type SpeechEvent = {
//   resultIndex: number;
//   results: SpeechResults;
// };
// type SpeechRecognitionLike = {
//   lang: string;
//   continuous: boolean;
//   interimResults: boolean;
//   onresult: ((event: SpeechEvent) => void) | null;
//   onerror: ((event: { error?: string }) => void) | null;
//   onend: (() => void) | null;
//   start: () => void;
//   stop: () => void;
// };
// type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
// type SpeechWindow = Window & {
//   SpeechRecognition?: SpeechRecognitionConstructor;
//   webkitSpeechRecognition?: SpeechRecognitionConstructor;
// };

// function pad(value: number) {
//   return String(value).padStart(2, "0");
// }

// function formatDateForDisplay(value: string) {
//   const [year, month, day] = value.split("-").map(Number);

//   return new Date(year, month - 1, day).toLocaleDateString(undefined, {
//     weekday: "long",
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });
// }

// function formatTime(value: string) {
//   const [hours, minutes] = value.split(":").map(Number);
//   const date = new Date();

//   date.setHours(hours, minutes, 0, 0);

//   return date.toLocaleTimeString(undefined, {
//     hour: "numeric",
//     minute: "2-digit",
//   });
// }

// function getErrorMessage(data: unknown, fallback: string) {
//   if (data && typeof data === "object") {
//     const record = data as Record<string, unknown>;

//     if (typeof record.error === "string") return record.error;
//     if (typeof record.message === "string") return record.message;
//   }

//   return fallback;
// }

// async function readJsonResponse(
//   response: Response,
//   fallback: string,
// ): Promise<unknown> {
//   const text = await response.text();

//   if (!text.trim()) {
//     throw new Error(
//       response.ok
//         ? "The server returned an empty response."
//         : `${fallback} (HTTP ${response.status})`,
//     );
//   }

//   let data: unknown;

//   try {
//     data = JSON.parse(text);
//   } catch {
//     throw new Error(
//       `Invalid JSON response (HTTP ${response.status}). Check the API route and terminal logs.`,
//     );
//   }

//   if (!response.ok) {
//     throw new Error(
//       getErrorMessage(data, `${fallback} (HTTP ${response.status})`),
//     );
//   }

//   return data;
// }

// function normalizeSlots(data: unknown): MeetingSlot[] {
//   if (!data || typeof data !== "object") return [];

//   const record = data as Record<string, unknown>;
//   const values = Array.isArray(record.slots)
//     ? record.slots
//     : Array.isArray(record.availableSlots)
//       ? record.availableSlots
//       : Array.isArray(record.available)
//         ? record.available
//         : [];

//   return values.flatMap((item): MeetingSlot[] => {
//     if (!item || typeof item !== "object") return [];

//     const slot = item as Record<string, unknown>;

//     if (typeof slot.start !== "string" || typeof slot.end !== "string") {
//       return [];
//     }

//     return [{
//       start: slot.start,
//       end: slot.end,
//       startTime:
//         typeof slot.startTime === "string" ? slot.startTime : undefined,
//       endTime:
//         typeof slot.endTime === "string" ? slot.endTime : undefined,
//       label: typeof slot.label === "string" ? slot.label : undefined,
//     }];
//   });
// }

// function normalizeMeetingDetails(data: unknown): MeetingDetails {
//   if (!data || typeof data !== "object") {
//     throw new Error("The AI returned invalid meeting details.");
//   }

//   const record = data as Record<string, unknown>;
//   const value =
//     record.result && typeof record.result === "object"
//       ? record.result as Record<string, unknown>
//       : record;

//   if (
//     typeof value.title !== "string" ||
//     typeof value.date !== "string" ||
//     typeof value.preferredStartTime !== "string" ||
//     typeof value.preferredEndTime !== "string" ||
//     typeof value.durationMinutes !== "number" ||
//     !Number.isInteger(value.durationMinutes)
//   ) {
//     throw new Error(
//       "The request must include a date, start time, and duration. Please try again with an exact time.",
//     );
//   }

//   if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date)) {
//     throw new Error("The AI returned an invalid date. Please try again.");
//   }

//   const validTime = (time: string) =>
//     /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

//   if (
//     !validTime(value.preferredStartTime) ||
//     !validTime(value.preferredEndTime)
//   ) {
//     throw new Error("The AI returned an invalid meeting time.");
//   }

//   return {
//     title: value.title,
//     description:
//       typeof value.description === "string" ? value.description : "",
//     date: value.date,
//     durationMinutes: value.durationMinutes,
//     preferredStartTime: value.preferredStartTime,
//     preferredEndTime: value.preferredEndTime,
//     attendees: Array.isArray(value.attendees)
//       ? value.attendees.filter(
//           (email): email is string => typeof email === "string",
//         )
//       : [],
//   };
// }

// export default function MeetingSchedulerPage() {
//   const [requestText, setRequestText] = useState("");
//   const [details, setDetails] = useState<MeetingDetails | null>(null);
//   const [selectedSlot, setSelectedSlot] = useState<MeetingSlot | null>(null);
//   const [status, setStatus] = useState("");
//   const [error, setError] = useState("");
//   const [processing, setProcessing] = useState(false);
//   const [creating, setCreating] = useState(false);
//   const [created, setCreated] = useState(false);
//   const [listening, setListening] = useState(false);
//   const [calendarEventUrl, setCalendarEventUrl] = useState("");

//   const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
//   const processingRef = useRef(false);
//   const creatingRef = useRef(false);
//   const latestTranscriptRef = useRef("");
//   const interimTranscriptRef = useRef("");
//   const autoProcessVoiceRef = useRef(false);

//   useEffect(() => {
//     return () => {
//       autoProcessVoiceRef.current = false;
//       recognitionRef.current?.stop();
//     };
//   }, []);

//   const resetPreviousResult = useCallback(() => {
//     setDetails(null);
//     setSelectedSlot(null);
//     setCreated(false);
//     setCalendarEventUrl("");
//     setError("");
//     setStatus("");
//   }, []);

//   const processMeetingRequest = useCallback(async (rawText: string) => {
//     const prompt = rawText.trim();

//     if (!prompt || processingRef.current || creatingRef.current) return;

//     processingRef.current = true;
//     setProcessing(true);
//     resetPreviousResult();
//     setStatus("Understanding your meeting request...");
//     setError("");

//     try {
//       const aiResponse = await fetch("/api/ai", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         // Keep the request property used by your existing AI route.
//         body: JSON.stringify({ request: prompt }),
//       });

//       const aiData = await readJsonResponse(
//         aiResponse,
//         "Could not understand the meeting request.",
//       );

//       const parsed = normalizeMeetingDetails(aiData);
//       setDetails(parsed);
//       setStatus("Checking Google Calendar availability...");

//       const availabilityResponse = await fetch("/api/availability", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         cache: "no-store",
//         body: JSON.stringify({
//           date: parsed.date,
//           durationMinutes: parsed.durationMinutes,
//           preferredStartTime: parsed.preferredStartTime,
//           preferredEndTime: parsed.preferredEndTime,
//         }),
//       });

//       const availabilityData = await readJsonResponse(
//         availabilityResponse,
//         "Could not check Google Calendar availability.",
//       );

//       const slots = normalizeSlots(availabilityData);

//       const matchingSlot = slots.find((slot) => {
//         if (slot.startTime && slot.endTime) {
//           return (
//             slot.startTime === parsed.preferredStartTime &&
//             slot.endTime === parsed.preferredEndTime
//           );
//         }

//         // Fallback only. Prefer startTime/endTime from the API because
//         // browser timezone may differ from the configured calendar timezone.
//         const startDate = new Date(slot.start);
//         const endDate = new Date(slot.end);

//         if (
//           Number.isNaN(startDate.getTime()) ||
//           Number.isNaN(endDate.getTime())
//         ) return false;

//         return (
//           `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}` ===
//             parsed.preferredStartTime &&
//           `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}` ===
//             parsed.preferredEndTime
//         );
//       });

//       if (!matchingSlot) {
//         setSelectedSlot(null);
//         setStatus("");
//         setError(
//           `The requested time (${formatTime(parsed.preferredStartTime)}–${formatTime(parsed.preferredEndTime)}) is not available on ${formatDateForDisplay(parsed.date)}. No meeting was created.`,
//         );
//         return;
//       }

//       setSelectedSlot(matchingSlot);
//       setStatus("The requested time is available. Review the details and confirm.");
//     } catch (caught) {
//       setStatus("");
//       setError(
//         caught instanceof Error
//           ? caught.message
//           : "Something went wrong while processing the request.",
//       );
//     } finally {
//       processingRef.current = false;
//       setProcessing(false);
//     }
//   }, [resetPreviousResult]);

//   function handleSubmit(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     void processMeetingRequest(requestText);
//   }

//   function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
//     if (event.key === "Enter" && !event.shiftKey) {
//       event.preventDefault();
//       void processMeetingRequest(requestText);
//     }
//   }

//   function startVoiceRecognition() {
//     setError("");

//     const speechWindow = window as SpeechWindow;
//     const SpeechAPI =
//       speechWindow.SpeechRecognition ??
//       speechWindow.webkitSpeechRecognition;

//     if (!SpeechAPI) {
//       setError(
//         "Voice recognition is not supported in this browser. Use Chrome or type your request.",
//       );
//       return;
//     }

//     if (listening) {
//       autoProcessVoiceRef.current = true;
//       recognitionRef.current?.stop();
//       return;
//     }

//     const recognition = new SpeechAPI();
//     recognition.lang = "en-IN";
//     recognition.continuous = false;
//     recognition.interimResults = true;

//     latestTranscriptRef.current = "";
//     interimTranscriptRef.current = "";
//     autoProcessVoiceRef.current = true;

//     recognition.onresult = (event) => {
//       let finalText = "";
//       let interimText = "";

//       for (let i = event.resultIndex; i < event.results.length; i++) {
//         const result = event.results[i];
//         const transcript = result[0]?.transcript ?? "";

//         if (result.isFinal) finalText += `${transcript} `;
//         else interimText += `${transcript} `;
//       }

//       if (finalText.trim()) {
//         latestTranscriptRef.current =
//           `${latestTranscriptRef.current} ${finalText}`
//             .trim()
//             .replace(/\s+/g, " ");
//         interimTranscriptRef.current = "";
//       } else if (interimText.trim()) {
//         interimTranscriptRef.current = interimText.trim();
//       }

//       setRequestText(
//         [latestTranscriptRef.current, interimTranscriptRef.current]
//           .filter(Boolean)
//           .join(" ")
//           .replace(/\s+/g, " ")
//           .trim(),
//       );
//     };

//     recognition.onerror = (event) => {
//       setListening(false);

//       if (event.error !== "no-speech" && event.error !== "aborted") {
//         autoProcessVoiceRef.current = false;
//         setError(`Voice recognition failed: ${event.error ?? "unknown error"}`);
//       }
//     };

//     recognition.onend = () => {
//       setListening(false);
//       recognitionRef.current = null;

//       const shouldProcess = autoProcessVoiceRef.current;
//       autoProcessVoiceRef.current = false;

//       const transcript = [
//         latestTranscriptRef.current,
//         interimTranscriptRef.current,
//       ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

//       if (!transcript) {
//         if (shouldProcess) setError("No speech was detected. Please try again.");
//         return;
//       }

//       setRequestText(transcript);

//       if (shouldProcess) void processMeetingRequest(transcript);
//     };

//     recognitionRef.current = recognition;

//     try {
//       setListening(true);
//       recognition.start();
//     } catch {
//       setListening(false);
//       autoProcessVoiceRef.current = false;
//       recognitionRef.current = null;
//       setError("Could not start voice recognition. Please try again.");
//     }
//   }

//   async function confirmAndCreateMeeting() {
//     if (
//       !details ||
//       !selectedSlot ||
//       creatingRef.current ||
//       processingRef.current ||
//       created
//     ) return;

//     creatingRef.current = true;
//     setCreating(true);
//     setError("");
//     setCalendarEventUrl("");
//     setStatus("Creating your Google Calendar meeting...");

//     try {
//       const response = await fetch("/api/events", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           title: details.title,
//           description: details.description,
//           date: details.date,
//           durationMinutes: details.durationMinutes,
//           start: selectedSlot.start,
//           attendees: details.attendees,
//         }),
//       });

//       const data = await readJsonResponse(
//         response,
//         "Could not create the calendar event.",
//       );

//       if (!data || typeof data !== "object") {
//         throw new Error("The server returned invalid event details.");
//       }

//       const result = data as {
//         success?: boolean;
//         message?: string;
//         event?: CreatedCalendarEvent;
//       };

//       // Validate the link before rendering it as an external link.
//       const rawUrl = result.event?.htmlLink;
//       let safeUrl = "";

//       if (typeof rawUrl === "string") {
//         try {
//           const url = new URL(rawUrl);

//           if (
//             url.protocol === "https:" &&
//             url.hostname === "calendar.google.com"
//           ) {
//             safeUrl = url.toString();
//           }
//         } catch {
//           safeUrl = "";
//         }
//       }

//       setCalendarEventUrl(safeUrl);
//       setCreated(true);
//       setSelectedSlot(null);

//       setStatus(
//         safeUrl
//           ? "Meeting created successfully in Google Calendar."
//           : "Meeting created successfully, but Google Calendar did not return a direct event link.",
//       );
//     } catch (caught) {
//       setStatus("");
//       setError(
//         caught instanceof Error
//           ? caught.message
//           : "Could not create the meeting.",
//       );
//     } finally {
//       creatingRef.current = false;
//       setCreating(false);
//     }
//   }

//   const canConfirm = Boolean(
//     details && selectedSlot && !created && !processing && !creating,
//   );

//   return (
//     <main className="scheduler">
//       <header className="hero">
//         <div className="hero-icon" aria-hidden="true">📅</div>
//         <div className="eyebrow">AI-powered scheduling</div>
//         <h1>AI Meeting Scheduler</h1>
//         <p className="subtitle">
//           Describe your meeting in plain English. We will check your Google
//           Calendar before you confirm anything.
//         </p>
//       </header>

//       <section className="panel">
//         <form onSubmit={handleSubmit}>
//           <label className="field-label" htmlFor="meeting-request">
//             What meeting would you like to schedule?
//           </label>

//           <textarea
//             id="meeting-request"
//             className="request-box"
//             value={requestText}
//             onChange={(event) => setRequestText(event.target.value)}
//             onKeyDown={handleInputKeyDown}
//             placeholder="Schedule a project meeting tomorrow at 11:00 AM for 60 minutes with colleague@example.com"
//             rows={4}
//             disabled={processing || creating || listening}
//           />

//           <div className="actions">
//             <p className="hint">
//               Press Enter to process · Shift+Enter for a new line
//             </p>

//             <button
//               type="button"
//               className={`button ${listening ? "button-danger" : "button-secondary"}`}
//               onClick={startVoiceRecognition}
//               disabled={processing || creating}
//             >
//               {listening ? "■ Stop listening" : "🎙 Speak"}
//             </button>
//           </div>

//           <button
//             type="submit"
//             disabled={!requestText.trim() || processing || creating}
//             hidden
//           >
//             Process request
//           </button>
//         </form>

//         {(processing || status) && (
//           <div className="status-box" role="status" aria-live="polite">
//             {processing && <span className="spinner" />}
//             <span>{status}</span>
//           </div>
//         )}

//         {error && (
//           <div className="error-box" role="alert">
//             <span aria-hidden="true">⚠</span>
//             <span>{error}</span>
//           </div>
//         )}

//         {details && (
//           <section className="details-card">
//             <div className="details-header">
//               <h2 className="details-title">Meeting details</h2>

//               {selectedSlot && !created && (
//                 <span className="availability-badge">
//                   ✓ Time available
//                 </span>
//               )}
//             </div>

//             <div className="detail-row">
//               <div className="detail-label">Title</div>
//               <p className="detail-value">{details.title}</p>
//             </div>

//             <div className="detail-row">
//               <div className="detail-label">Date</div>
//               <p className="detail-value">
//                 {formatDateForDisplay(details.date)}
//               </p>
//             </div>

//             <div className="detail-row">
//               <div className="detail-label">Time</div>
//               <p className="detail-value">
//                 {formatTime(details.preferredStartTime)} –{" "}
//                 {formatTime(details.preferredEndTime)}
//               </p>
//             </div>

//             <div className="detail-row">
//               <div className="detail-label">Duration</div>
//               <p className="detail-value">
//                 {details.durationMinutes} minutes
//               </p>
//             </div>

//             <div className="detail-row">
//               <div className="detail-label">Attendees</div>
//               <p className="detail-value">
//                 {details.attendees.length
//                   ? details.attendees.join(", ")
//                   : "No attendee email detected"}
//               </p>
//             </div>

//             {details.description && (
//               <div className="detail-row">
//                 <div className="detail-label">Description</div>
//                 <p className="detail-value">{details.description}</p>
//               </div>
//             )}

//             {created ? (
//               <>
//                 <div className="success-box" role="status">
//                   ✓ Meeting created successfully in Google Calendar.
//                 </div>

//                 {calendarEventUrl ? (
//                   <a
//                     className="button button-calendar"
//                     href={calendarEventUrl}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                   >
//                     📅 View in Google Calendar ↗
//                   </a>
//                 ) : (
//                   <p className="warning-text">
//                     The event was created, but no direct event link was
//                     returned. Open Google Calendar and find the meeting by
//                     its title and date.
//                   </p>
//                 )}
//               </>
//             ) : (
//               <button
//                 type="button"
//                 className="button button-primary button-full"
//                 onClick={confirmAndCreateMeeting}
//                 disabled={!canConfirm}
//               >
//                 {creating ? (
//                   <>
//                     <span className="spinner" />
//                     Creating meeting...
//                   </>
//                 ) : (
//                   "Confirm & Create Meeting"
//                 )}
//               </button>
//             )}

//             {!selectedSlot && !created && !processing && !error && (
//               <p className="hint">
//                 The confirmation button becomes available when the exact
//                 requested time is confirmed available.
//               </p>
//             )}
//           </section>
//         )}
//       </section>

//       <p className="footer-note">
//         Your meeting is not created until you click Confirm &amp; Create Meeting.
//       </p>
//     </main>
//   );
// }







"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type MeetingDetails = {
  title: string;
  description: string;
  date: string;
  durationMinutes: number;
  preferredStartTime: string;
  preferredEndTime: string;
  attendees: string[];
};

type MeetingSlot = {
  start: string;
  end: string;
  startTime?: string;
  endTime?: string;
  label?: string;
};

type CreatedEvent = {
  id?: string;
  htmlLink?: string | null;
  isDirectEventLink?: boolean;
};

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionResult = {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDateForDisplay(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;

    if (typeof record.error === "string") {
      return record.error;
    }

    if (typeof record.message === "string") {
      return record.message;
    }
  }

  return fallback;
}

async function readJsonResponse(
  response: Response,
  fallback: string,
): Promise<unknown> {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      response.ok
        ? "The server returned an empty response."
        : `${fallback} (HTTP ${response.status})`,
    );
  }

  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Invalid JSON response (HTTP ${response.status}). Check the API route and terminal logs.`,
    );
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, `${fallback} (HTTP ${response.status})`),
    );
  }

  return data;
}

function normalizeSlots(data: unknown): MeetingSlot[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  const record = data as Record<string, unknown>;

  const possibleSlots = Array.isArray(record.slots)
    ? record.slots
    : Array.isArray(record.availableSlots)
      ? record.availableSlots
      : Array.isArray(record.available)
        ? record.available
        : [];

  return possibleSlots
    .map((item): MeetingSlot | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const slot = item as Record<string, unknown>;

      const start =
        typeof slot.start === "string" ? slot.start : "";

      const end =
        typeof slot.end === "string" ? slot.end : "";

      if (!start || !end) {
        return null;
      }

      return {
        start,
        end,
        startTime:
          typeof slot.startTime === "string"
            ? slot.startTime
            : undefined,
        endTime:
          typeof slot.endTime === "string"
            ? slot.endTime
            : undefined,
        label:
          typeof slot.label === "string"
            ? slot.label
            : undefined,
      };
    })
    .filter((slot): slot is MeetingSlot => slot !== null);
}

export default function MeetingSchedulerPage() {
  const [requestText, setRequestText] = useState("");
  const [details, setDetails] = useState<MeetingDetails | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<MeetingSlot | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [listening, setListening] = useState(false);
  const [calendarEvent, setCalendarEvent] = useState<CreatedEvent | null>(
    null,
  );

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const processingRef = useRef(false);
  const creatingRef = useRef(false);
  const latestTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  const autoProcessVoiceRef = useRef(false);

  useEffect(() => {
    return () => {
      autoProcessVoiceRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  const resetPreviousResult = useCallback(() => {
    setDetails(null);
    setSelectedSlot(null);
    setCreated(false);
    setCalendarEvent(null);
    setError("");
    setStatus("");
  }, []);

  const processMeetingRequest = useCallback(
    async (rawText: string) => {
      const prompt = rawText.trim();

      if (!prompt || processingRef.current || creatingRef.current) {
        return;
      }

      processingRef.current = true;
      setProcessing(true);
      resetPreviousResult();
      setStatus("Understanding your meeting request...");
      setError("");

      try {
        // The AI route in this project expects the "request" field.
        const aiResponse = await fetch("/api/ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ request: prompt }),
        });

        const aiData = await readJsonResponse(
          aiResponse,
          "Could not understand the meeting request.",
        );

        // Supports either { result: {...} } or a direct details object.
        const aiRecord = aiData as Record<string, unknown>;
        const parsed =
          (aiRecord.result ?? aiData) as MeetingDetails;

        if (
          !parsed ||
          typeof parsed.title !== "string" ||
          typeof parsed.date !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ||
          typeof parsed.preferredStartTime !== "string" ||
          typeof parsed.preferredEndTime !== "string" ||
          !Number.isInteger(parsed.durationMinutes)
        ) {
          throw new Error(
            "The AI response must include a valid date, start time, end time, and duration. Check src/app/api/ai/route.ts.",
          );
        }

        if (
          !/^\d{2}:\d{2}$/.test(parsed.preferredStartTime) ||
          !/^\d{2}:\d{2}$/.test(parsed.preferredEndTime)
        ) {
          throw new Error("The AI returned an invalid meeting time.");
        }

        const safeDetails: MeetingDetails = {
          title: parsed.title,
          description:
            typeof parsed.description === "string"
              ? parsed.description
              : "",
          date: parsed.date,
          durationMinutes: parsed.durationMinutes,
          preferredStartTime: parsed.preferredStartTime,
          preferredEndTime: parsed.preferredEndTime,
          attendees: Array.isArray(parsed.attendees)
            ? parsed.attendees.filter(
                (email): email is string =>
                  typeof email === "string",
              )
            : [],
        };

        setDetails(safeDetails);
        setStatus("Checking Google Calendar availability...");

        const availabilityResponse = await fetch("/api/availability", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            date: safeDetails.date,
            durationMinutes: safeDetails.durationMinutes,
            preferredStartTime: safeDetails.preferredStartTime,
            preferredEndTime: safeDetails.preferredEndTime,
          }),
        });

        const availabilityData = await readJsonResponse(
          availabilityResponse,
          "Could not check Google Calendar availability.",
        );

        const slots = normalizeSlots(availabilityData);

        const matchingSlot = slots.find((slot) => {
          if (slot.startTime && slot.endTime) {
            return (
              slot.startTime === safeDetails.preferredStartTime &&
              slot.endTime === safeDetails.preferredEndTime
            );
          }

          // Fallback for availability APIs that only return ISO dates.
          // This fallback assumes the browser timezone matches the
          // calendar timezone configured for this application.
          const startDate = new Date(slot.start);
          const endDate = new Date(slot.end);

          if (
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime())
          ) {
            return false;
          }

          const localStart =
            `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;

          const localEnd =
            `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;

          return (
            localStart === safeDetails.preferredStartTime &&
            localEnd === safeDetails.preferredEndTime
          );
        });

        if (!matchingSlot) {
          setSelectedSlot(null);
          setStatus("");
          setError(
            `The requested time (${formatTime(
              safeDetails.preferredStartTime,
            )}–${formatTime(
              safeDetails.preferredEndTime,
            )}) is not available on ${formatDateForDisplay(
              safeDetails.date,
            )}. No meeting was created.`,
          );
          return;
        }

        setSelectedSlot(matchingSlot);
        setStatus(
          "The requested time is available. Review the details and confirm.",
        );
      } catch (caught) {
        setStatus("");
        setError(
          caught instanceof Error
            ? caught.message
            : "Something went wrong while processing the meeting request.",
        );
      } finally {
        processingRef.current = false;
        setProcessing(false);
      }
    },
    [resetPreviousResult],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await processMeetingRequest(requestText);
  }

  function handleInputKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void processMeetingRequest(requestText);
    }
  }

  function startVoiceRecognition() {
    setError("");

    const speechWindow = window as WindowWithSpeechRecognition;

    const SpeechRecognitionAPI =
      speechWindow.SpeechRecognition ??
      speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError(
        "Voice recognition is not supported in this browser. Use Chrome or type your request.",
      );
      return;
    }

    if (listening) {
      autoProcessVoiceRef.current = true;
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionAPI();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    latestTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    autoProcessVoiceRef.current = true;

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index++
      ) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscript += `${transcript} `;
        } else {
          interimTranscript += `${transcript} `;
        }
      }

      if (finalTranscript.trim()) {
        latestTranscriptRef.current = [
          latestTranscriptRef.current,
          finalTranscript,
        ]
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        interimTranscriptRef.current = "";
      } else if (interimTranscript.trim()) {
        interimTranscriptRef.current = interimTranscript.trim();
      }

      setRequestText(
        [
          latestTranscriptRef.current,
          interimTranscriptRef.current,
        ]
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim(),
      );
    };

    recognition.onerror = (event) => {
      setListening(false);

      if (event.error !== "no-speech" && event.error !== "aborted") {
        autoProcessVoiceRef.current = false;
        setError(
          `Voice recognition failed: ${event.error ?? "unknown error"}`,
        );
      }
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;

      const shouldProcess = autoProcessVoiceRef.current;
      autoProcessVoiceRef.current = false;

      const transcript = [
        latestTranscriptRef.current,
        interimTranscriptRef.current,
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (!transcript) {
        if (shouldProcess) {
          setError("No speech was detected. Please try again.");
        }
        return;
      }

      setRequestText(transcript);

      if (shouldProcess) {
        void processMeetingRequest(transcript);
      }
    };

    recognitionRef.current = recognition;

    try {
      setListening(true);
      recognition.start();
    } catch {
      setListening(false);
      autoProcessVoiceRef.current = false;
      recognitionRef.current = null;
      setError("Could not start voice recognition. Please try again.");
    }
  }

  async function confirmAndCreateMeeting() {
    if (
      !details ||
      !selectedSlot ||
      creatingRef.current ||
      processingRef.current ||
      created
    ) {
      return;
    }

    creatingRef.current = true;
    setCreating(true);
    setError("");
    setStatus("Creating your Google Calendar meeting...");

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          title: details.title,
          description: details.description,
          date: details.date,
          durationMinutes: details.durationMinutes,
          start: selectedSlot.start,
          attendees: details.attendees,
        }),
      });

      const result = (await readJsonResponse(
        response,
        "Could not create the calendar event.",
      )) as {
        success?: boolean;
        message?: string;
        event?: CreatedEvent;
      };

      if (!result.success || !result.event?.htmlLink) {
        throw new Error(
          result.message ??
            "The server did not return the calendar event link.",
        );
      }

      setCalendarEvent(result.event);
      setCreated(true);
      setSelectedSlot(null);
      setStatus("Meeting created successfully in Google Calendar.");
    } catch (caught) {
      setStatus("");
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not create the meeting.",
      );
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  }

  const canConfirm = Boolean(
    details &&
      selectedSlot &&
      !created &&
      !processing &&
      !creating,
  );

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-2xl">
            📅
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            AI Real-Time Meeting Scheduler
          </h1>

          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Type or speak your request. We will check your Google Calendar
            before you confirm.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7">
          <form onSubmit={handleSubmit}>
            <label
              htmlFor="meeting-request"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              What meeting would you like to schedule?
            </label>

            <textarea
              id="meeting-request"
              value={requestText}
              onChange={(event) => setRequestText(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Please set up a meeting for tomorrow at 11:00 AM for 30 minutes with someone@example.com"
              rows={4}
              disabled={processing || creating || listening}
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Press Enter to process · Shift+Enter for a new line
              </p>

              <button
                type="button"
                onClick={startVoiceRecognition}
                disabled={processing || creating}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  listening
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span aria-hidden="true">
                  {listening ? "■" : "🎙️"}
                </span>
                {listening ? "Stop listening" : "Speak"}
              </button>
            </div>

            <button
              type="submit"
              disabled={!requestText.trim() || processing || creating}
              className="hidden"
              tabIndex={-1}
              aria-hidden="true"
            >
              Process request
            </button>
          </form>

          {(processing || status) && (
            <div
              className="mt-5 flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800"
              role="status"
              aria-live="polite"
            >
              {processing && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-700" />
              )}
              <span>{status}</span>
            </div>
          )}

          {error && (
            <div
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          )}

          {details && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold">Meeting details</h2>

                {selectedSlot && !created && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Time available
                  </span>
                )}
              </div>

              <dl className="divide-y divide-slate-200 text-sm">
                <div className="py-3">
                  <dt className="text-slate-500">Title</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {details.title}
                  </dd>
                </div>

                <div className="py-3">
                  <dt className="text-slate-500">Date</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {formatDateForDisplay(details.date)}
                  </dd>
                </div>

                <div className="py-3">
                  <dt className="text-slate-500">Time</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {formatTime(details.preferredStartTime)} –{" "}
                    {formatTime(details.preferredEndTime)}
                  </dd>
                </div>

                <div className="py-3">
                  <dt className="text-slate-500">Duration</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {details.durationMinutes} minutes
                  </dd>
                </div>

                <div className="py-3">
                  <dt className="text-slate-500">Attendees</dt>
                  <dd className="mt-1 break-all font-semibold text-slate-900">
                    {details.attendees.length > 0
                      ? details.attendees.join(", ")
                      : "No attendee email detected"}
                  </dd>
                </div>

                {details.description && (
                  <div className="py-3">
                    <dt className="text-slate-500">Description</dt>
                    <dd className="mt-1 whitespace-pre-wrap font-semibold text-slate-900">
                      {details.description}
                    </dd>
                  </div>
                )}
              </dl>

              {created ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-800">
                    ✓ Meeting created successfully in Google Calendar.
                  </div>

                  {calendarEvent?.htmlLink && (
                    <a
                      href={calendarEvent.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                    >
                      📅{" "}
                      {calendarEvent.isDirectEventLink
                        ? "View Event in Google Calendar"
                        : "Open Google Calendar"}
                      {" "}↗
                    </a>
                  )}

                  {calendarEvent?.isDirectEventLink === false && (
                    <p className="text-xs leading-5 text-slate-600">
                      Google did not return a direct event link. The button
                      opens Google Calendar on the meeting date. Find the
                      meeting there by its title and time.
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={confirmAndCreateMeeting}
                  disabled={!canConfirm}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating meeting...
                    </>
                  ) : (
                    "Confirm & Create Meeting"
                  )}
                </button>
              )}

              {!selectedSlot && !created && !processing && !error && (
                <p className="mt-3 text-xs text-slate-500">
                  The confirmation button becomes available after the exact
                  requested time is confirmed available.
                </p>
              )}
            </div>
          )}
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-slate-500">
          Nothing is booked until you click Confirm &amp; Create Meeting.
        </p>
      </div>
    </main>
  );
}
