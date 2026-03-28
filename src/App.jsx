import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const DEFAULT_ACTIVITIES = [
  "Journaling",
  "Meditation",
  "Exercise",
  "Sleep 7+ hrs",
  "Socialising",
];

const LOCAL_KEY = "therapy-tracker-passkey";

// --- helpers ---

async function hashPassphrase(phrase) {
  const encoded = new TextEncoder().encode(phrase.trim().toLowerCase());
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getWeekDates(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + offset * 7);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isToday(d) {
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function isFuture(d) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const compare = new Date(d);
  compare.setHours(0, 0, 0, 0);
  return compare > now;
}

// --- themes ---

const themes = {
  light: {
    bg: "linear-gradient(170deg, #F5F0EB 0%, #EDE6DD 40%, #E8E0D4 100%)",
    text: "#3A3226", textStrong: "#2C2418", textMuted: "#8B7E6F",
    textFaint: "#B0A090", accent: "#8B7355", green: "#5C7A56",
    greenLight: "#7A9E72", sectionBg: "rgba(255,255,255,0.65)",
    sectionBorder: "rgba(0,0,0,0.05)", inputBg: "rgba(255,255,255,0.5)",
    inputBorder: "rgba(0,0,0,0.08)", inputBorderStrong: "rgba(0,0,0,0.12)",
    numberBg: "#3A3226", numberColor: "#F5F0EB", btnBg: "#3A3226",
    btnColor: "#F5F0EB", emptyCircleBorder: "rgba(0,0,0,0.1)",
    todayHighlight: "rgba(92,122,86,0.08)",
    todayCellHighlight: "rgba(92,122,86,0.04)",
    progressBg: "rgba(0,0,0,0.05)", summaryBorder: "rgba(0,0,0,0.06)",
    dashBorder: "rgba(0,0,0,0.12)", futureText: "#C0B8A8",
    hoverBg: "rgba(0,0,0,0.04)", loadingBg: "#F5F0EB",
    editInputBg: "white", toggleTrack: "#D0C8BC", toggleKnob: "#fff",
  },
  dark: {
    bg: "linear-gradient(170deg, #111010 0%, #181614 40%, #1A1816 100%)",
    text: "#D4C9BA", textStrong: "#EDE4D8", textMuted: "#8A7E6F",
    textFaint: "#5A5248", accent: "#B8A080", green: "#6B8F62",
    greenLight: "#8AB880", sectionBg: "rgba(255,255,255,0.04)",
    sectionBorder: "rgba(255,255,255,0.06)", inputBg: "rgba(255,255,255,0.05)",
    inputBorder: "rgba(255,255,255,0.08)",
    inputBorderStrong: "rgba(255,255,255,0.12)",
    numberBg: "#EDE4D8", numberColor: "#181614", btnBg: "#EDE4D8",
    btnColor: "#181614", emptyCircleBorder: "rgba(255,255,255,0.12)",
    todayHighlight: "rgba(107,143,98,0.12)",
    todayCellHighlight: "rgba(107,143,98,0.06)",
    progressBg: "rgba(255,255,255,0.06)", summaryBorder: "rgba(255,255,255,0.06)",
    dashBorder: "rgba(255,255,255,0.12)", futureText: "#4A4238",
    hoverBg: "rgba(255,255,255,0.06)", loadingBg: "#111010",
    editInputBg: "#242220", toggleTrack: "#6B8F62", toggleKnob: "#181614",
  },
};

// --- Passphrase screen ---

function PassphraseScreen({ onUnlock }) {
  const [phrase, setPhrase] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!phrase.trim()) return;
    setLoading(true);
    const hash = await hashPassphrase(phrase);
    localStorage.setItem(LOCAL_KEY, hash);
    onUnlock(hash);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(170deg, #F5F0EB 0%, #EDE6DD 40%, #E8E0D4 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(8px)",
          borderRadius: 16,
          padding: "40px 32px",
          maxWidth: 380,
          width: "100%",
          border: "1px solid rgba(0,0,0,0.05)",
          animation: "fadeIn 0.5s ease both",
        }}
      >
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 28,
            fontWeight: 400,
            color: "#2C2418",
            marginBottom: 8,
          }}
        >
          Therapy Tracker
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#8B7E6F",
            marginBottom: 28,
            lineHeight: 1.5,
            fontWeight: 300,
          }}
        >
          Enter a passphrase to access your tracker. Use the same passphrase on any device to sync your data.
        </p>
        <input
          type="password"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Your passphrase..."
          style={{
            width: "100%",
            border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 15,
            fontFamily: "'DM Sans', sans-serif",
            color: "#3A3226",
            background: "rgba(255,255,255,0.5)",
            marginBottom: 16,
            outline: "none",
          }}
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !phrase.trim()}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: "none",
            borderRadius: 10,
            background: "#3A3226",
            color: "#F5F0EB",
            fontSize: 14,
            fontWeight: 500,
            cursor: phrase.trim() ? "pointer" : "default",
            fontFamily: "'DM Sans', sans-serif",
            opacity: phrase.trim() ? 1 : 0.4,
            transition: "opacity 0.2s",
          }}
        >
          {loading ? "Loading..." : "Open Tracker"}
        </button>
      </div>
    </div>
  );
}

// --- Main tracker ---

export default function App() {
  const [userKey, setUserKey] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) {
      setUserKey(saved);
    }
    setChecking(false);
  }, []);

  if (checking) return null;

  if (!userKey) {
    return <PassphraseScreen onUnlock={setUserKey} />;
  }

  return <Tracker userKey={userKey} onLogout={() => { localStorage.removeItem(LOCAL_KEY); setUserKey(null); }} />;
}

function Tracker({ userKey, onLogout }) {
  const [focalAreas, setFocalAreas] = useState("");
  const [activities, setActivities] = useState(DEFAULT_ACTIVITIES);
  const [completions, setCompletions] = useState({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [newActivity, setNewActivity] = useState("");
  const [addingActivity, setAddingActivity] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [notes, setNotes] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const saveTimer = useRef(null);

  const t = darkMode ? themes.dark : themes.light;

  // --- Load from Supabase ---
  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from("tracker_data")
          .select("data")
          .eq("id", userKey)
          .single();

        if (data && data.data) {
          const d = data.data;
          if (d.focalAreas !== undefined) setFocalAreas(d.focalAreas);
          if (d.activities) setActivities(d.activities);
          if (d.completions) setCompletions(d.completions);
          if (d.notes !== undefined) setNotes(d.notes);
          if (d.darkMode !== undefined) setDarkMode(d.darkMode);
        }
      } catch (e) {
        console.log("No saved data found, starting fresh");
      }
      setLoaded(true);
    }
    load();
  }, [userKey]);

  // --- Save to Supabase (debounced) ---
  const save = useCallback(
    (fa, acts, comps, n, dm) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          const payload = {
            focalAreas: fa,
            activities: acts,
            completions: comps,
            notes: n,
            darkMode: dm,
          };
          const { error } = await supabase
            .from("tracker_data")
            .upsert({ id: userKey, data: payload, updated_at: new Date().toISOString() });

          if (error) throw error;
          setSaveError(false);
          setSaveFeedback(true);
          setTimeout(() => setSaveFeedback(false), 1200);
        } catch (e) {
          console.error("Save failed:", e);
          setSaveError(true);
        }
      }, 600);
    },
    [userKey]
  );

  const weekDates = getWeekDates(weekOffset);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  const toggleCompletion = (activity, date) => {
    if (isFuture(date)) return;
    const key = `${activity}::${dateKey(date)}`;
    const next = { ...completions };
    if (next[key]) { delete next[key]; } else { next[key] = true; }
    setCompletions(next);
    save(focalAreas, activities, next, notes, darkMode);
  };

  const addActivity = () => {
    const trimmed = newActivity.trim();
    if (trimmed && !activities.includes(trimmed)) {
      const next = [...activities, trimmed];
      setActivities(next);
      setNewActivity("");
      setAddingActivity(false);
      save(focalAreas, next, completions, notes, darkMode);
    }
  };

  const removeActivity = (idx) => {
    const next = activities.filter((_, i) => i !== idx);
    setActivities(next);
    save(focalAreas, next, completions, notes, darkMode);
  };

  const startEdit = (idx) => { setEditingIdx(idx); setEditValue(activities[idx]); };

  const confirmEdit = () => {
    if (editValue.trim()) {
      const next = [...activities];
      next[editingIdx] = editValue.trim();
      setActivities(next);
      save(focalAreas, next, completions, notes, darkMode);
    }
    setEditingIdx(null);
    setEditValue("");
  };

  const handleFocalSave = () => save(focalAreas, activities, completions, notes, darkMode);
  const handleNotesSave = () => save(focalAreas, activities, completions, notes, darkMode);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    save(focalAreas, activities, completions, notes, next);
  };

  const weeklyStats = activities.map((act) => {
    let count = 0;
    weekDates.forEach((d) => {
      if (!isFuture(d) && completions[`${act}::${dateKey(d)}`]) count++;
    });
    const pastDays = weekDates.filter((d) => !isFuture(d)).length;
    return { activity: act, count, total: pastDays };
  });

  const formatDateRange = () => {
    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${weekStart.getDate()} \u2013 ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
    }
    return `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()].slice(0, 3)} \u2013 ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()].slice(0, 3)} ${weekEnd.getFullYear()}`;
  };

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: t.loadingBg }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: t.accent, animation: "pulse 1.2s ease infinite" }} />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh", background: t.bg, fontFamily: "'DM Sans', sans-serif",
        color: t.text, padding: "24px 16px 48px",
        transition: "background 0.4s ease, color 0.4s ease",
      }}
    >
      <style>{`
        .week-nav:hover { background: ${t.hoverBg} !important; }
        textarea:focus, input:focus { border-color: ${t.accent} !important; }
        textarea::placeholder, input::placeholder { color: ${t.textMuted}; opacity: 0.7; }
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, animation: "fadeIn 0.5s ease both" }}>
          <div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 36, fontWeight: 400, color: t.textStrong, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Therapy Tracker
            </h1>
            <p style={{ fontSize: 14, color: t.textMuted, marginTop: 4, fontWeight: 300, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {MONTHS[new Date().getMonth()]} {new Date().getFullYear()}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: t.textMuted }}>{darkMode ? "Dark" : "Light"}</span>
              <button
                onClick={toggleDark}
                aria-label="Toggle dark mode"
                style={{ width: 40, height: 22, borderRadius: 11, cursor: "pointer", background: t.toggleTrack, position: "relative", transition: "background 0.3s ease", border: "none", padding: 0 }}
              >
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: t.toggleKnob, position: "absolute", top: 3, left: darkMode ? 21 : 3, transition: "left 0.25s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </button>
            </div>
            <div style={{ height: 24, display: "flex", alignItems: "center" }}>
              {saveFeedback && <span style={{ fontSize: 13, color: t.green, fontWeight: 500, animation: "savedPop 1.2s ease both" }}>saved ✓</span>}
              {saveError && <span style={{ fontSize: 13, color: "#C0392B", fontWeight: 500 }}>save failed</span>}
            </div>
          </div>
        </div>

        {/* Section 1: Focal Areas */}
        <div style={{ background: t.sectionBg, backdropFilter: "blur(8px)", borderRadius: 16, padding: "28px 28px 24px", marginBottom: 20, border: `1px solid ${t.sectionBorder}`, animation: "fadeIn 0.5s ease both", animationDelay: "0.1s", transition: "background 0.4s ease, border-color 0.4s ease" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, width: 32, height: 32, borderRadius: "50%", background: t.numberBg, color: t.numberColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, transition: "background 0.4s, color 0.4s" }}>1</div>
            <div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 400, color: t.textStrong, lineHeight: 1.2 }}>Current Focal Areas</h2>
              <p style={{ fontSize: 13, color: t.textMuted, marginTop: 2, fontWeight: 300 }}>What you're working on in therapy right now</p>
            </div>
          </div>
          <textarea
            style={{ width: "100%", minHeight: 140, border: `1px solid ${t.inputBorder}`, borderRadius: 10, padding: "14px 16px", fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: t.text, background: t.inputBg, resize: "vertical", lineHeight: 1.7, transition: "border-color 0.2s, background 0.4s, color 0.4s", outline: "none" }}
            value={focalAreas}
            onChange={(e) => setFocalAreas(e.target.value)}
            onBlur={handleFocalSave}
            placeholder={"Write your current focal areas here...\n\ne.g. Setting boundaries in relationships, managing anxiety around work deadlines, exploring childhood patterns..."}
            rows={6}
          />
        </div>

        {/* Section 2: Activity Tracker */}
        <div style={{ background: t.sectionBg, backdropFilter: "blur(8px)", borderRadius: 16, padding: "28px 28px 24px", marginBottom: 20, border: `1px solid ${t.sectionBorder}`, animation: "fadeIn 0.5s ease both", animationDelay: "0.2s", transition: "background 0.4s ease, border-color 0.4s ease" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, width: 32, height: 32, borderRadius: "50%", background: t.numberBg, color: t.numberColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, transition: "background 0.4s, color 0.4s" }}>2</div>
            <div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 400, color: t.textStrong, lineHeight: 1.2 }}>Activity Tracker</h2>
              <p style={{ fontSize: 13, color: t.textMuted, marginTop: 2, fontWeight: 300 }}>Track daily habits that support your progress</p>
            </div>
          </div>

          {/* Week nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <button className="week-nav" onClick={() => setWeekOffset(weekOffset - 1)} style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${t.inputBorder}`, background: "transparent", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: t.text }}>←</button>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: t.textStrong }}>{formatDateRange()}</span>
              {weekOffset !== 0 && (
                <button onClick={() => setWeekOffset(0)} style={{ fontSize: 11, color: t.accent, background: "none", border: `1px solid ${t.accent}`, borderRadius: 10, padding: "2px 10px", cursor: "pointer", fontWeight: 500 }}>Today</button>
              )}
            </div>
            <button className="week-nav" onClick={() => setWeekOffset(weekOffset + 1)} disabled={weekOffset >= 0} style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${t.inputBorder}`, background: "transparent", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: t.text }}>→</button>
          </div>

          {/* Grid */}
          <div style={{ overflowX: "auto", marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "140px repeat(7, 1fr)", gap: 2, minWidth: 500 }}>
              <div style={{ height: 48 }} />
              {weekDates.map((d, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6px 0", height: 48, ...(isToday(d) ? { background: t.todayHighlight, borderRadius: 8 } : {}) }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{DAYS[i]}</span>
                  <span style={{ fontSize: 16, fontWeight: 500, color: isToday(d) ? t.green : t.textStrong, marginTop: 1, ...(isToday(d) ? { fontWeight: 600 } : {}) }}>{d.getDate()}</span>
                </div>
              ))}

              {activities.map((act, actIdx) => (
                <React.Fragment key={actIdx}>
                  <div className="activity-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 4, height: 44 }}>
                    {editingIdx === actIdx ? (
                      <input style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", border: `1px solid ${t.inputBorderStrong}`, borderRadius: 6, padding: "4px 8px", width: 110, background: t.editInputBg, color: t.text, outline: "none" }} value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={confirmEdit} onKeyDown={(e) => e.key === "Enter" && confirmEdit()} autoFocus />
                    ) : (
                      <span style={{ fontSize: 13, fontWeight: 400, color: t.text, cursor: "default", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }} onDoubleClick={() => startEdit(actIdx)} title="Double-click to edit">{act}</span>
                    )}
                    <button className="remove-btn" onClick={() => removeActivity(actIdx)} title="Remove activity" style={{ opacity: 0, width: 20, height: 20, border: "none", background: "none", fontSize: 16, color: t.textFaint, cursor: "pointer", transition: "opacity 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                  </div>
                  {weekDates.map((d, dayIdx) => {
                    const done = completions[`${act}::${dateKey(d)}`];
                    const future = isFuture(d);
                    const today = isToday(d);
                    return (
                      <div key={dayIdx} className="cell-check" onClick={() => toggleCompletion(act, d)} style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, cursor: future ? "default" : "pointer", ...(today ? { background: t.todayCellHighlight } : {}), ...(future ? { opacity: 0.35 } : {}) }}>
                        {done && !future && (
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="9" fill={t.green} />
                            <path d="M6 10.5L8.5 13L14 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {!done && !future && <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${t.emptyCircleBorder}` }} />}
                        {future && <span style={{ color: t.futureText, fontSize: 18 }}>·</span>}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Add activity */}
          {addingActivity ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
              <input style={{ flex: 1, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: "8px 12px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", background: t.inputBg, color: t.text, outline: "none" }} placeholder="Activity name..." value={newActivity} onChange={(e) => setNewActivity(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addActivity()} autoFocus />
              <button onClick={addActivity} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: t.btnBg, color: t.btnColor, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Add</button>
              <button onClick={() => { setAddingActivity(false); setNewActivity(""); }} style={{ padding: "8px 12px", border: "none", borderRadius: 8, background: "transparent", color: t.textMuted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setAddingActivity(true)} style={{ border: `1px dashed ${t.dashBorder}`, borderRadius: 8, background: "none", padding: "10px 16px", fontSize: 13, color: t.accent, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, width: "100%", textAlign: "left" }}>+ Add activity</button>
          )}

          {/* Weekly summary */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${t.summaryBorder}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 500, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>This Week</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {weeklyStats.map((st, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: t.text }}>{st.activity}</span>
                    <span style={{ fontSize: 13, color: t.textMuted, fontWeight: 500 }}>{st.count}/{st.total}</span>
                  </div>
                  <div style={{ height: 5, background: t.progressBg, borderRadius: 4, overflow: "hidden" }}>
                    <div className="progress-fill" style={{ height: "100%", background: `linear-gradient(90deg, ${t.green}, ${t.greenLight})`, borderRadius: 4, width: st.total > 0 ? `${(st.count / st.total) * 100}%` : "0%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Notes */}
        <div style={{ background: t.sectionBg, backdropFilter: "blur(8px)", borderRadius: 16, padding: "28px 28px 24px", marginBottom: 20, border: `1px solid ${t.sectionBorder}`, animation: "fadeIn 0.5s ease both", animationDelay: "0.3s", transition: "background 0.4s ease, border-color 0.4s ease" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, width: 32, height: 32, borderRadius: "50%", background: t.numberBg, color: t.numberColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, transition: "background 0.4s, color 0.4s" }}>3</div>
            <div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 400, color: t.textStrong, lineHeight: 1.2 }}>Notes</h2>
              <p style={{ fontSize: 13, color: t.textMuted, marginTop: 2, fontWeight: 300 }}>Session reflections, breakthroughs, and things to revisit</p>
            </div>
          </div>
          <textarea
            style={{ width: "100%", minHeight: 180, border: `1px solid ${t.inputBorder}`, borderRadius: 10, padding: "14px 16px", fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: t.text, background: t.inputBg, resize: "vertical", lineHeight: 1.7, transition: "border-color 0.2s, background 0.4s, color 0.4s", outline: "none" }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesSave}
            placeholder={"Capture thoughts from sessions, insights between appointments, questions for next time...\n\nYou can use this as a running log or fresh each week \u2014 whatever works for you."}
            rows={8}
          />
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, padding: "0 4px", animation: "fadeIn 0.5s ease both", animationDelay: "0.4s" }}>
          <p style={{ fontSize: 12, color: t.textFaint, fontWeight: 300 }}>Syncs automatically across devices.</p>
          <div style={{ display: "flex", gap: 16 }}>
            <button onClick={onLogout} style={{ fontSize: 12, color: t.textFaint, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "'DM Sans', sans-serif" }}>Lock</button>
            <button
              onClick={async () => {
                if (window.confirm("Reset all data? This cannot be undone.")) {
                  setFocalAreas(""); setActivities(DEFAULT_ACTIVITIES);
                  setCompletions({}); setNotes(""); setDarkMode(false);
                  try {
                    await supabase.from("tracker_data").delete().eq("id", userKey);
                  } catch (e) {}
                }
              }}
              style={{ fontSize: 12, color: t.textFaint, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "'DM Sans', sans-serif" }}
            >
              Reset all data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
