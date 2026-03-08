import { useState, useCallback, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import Landing from "./src/pages/LandingPage.jsx";
import SignIn from "./src/pages/SignInPage.jsx";

/* ─── fonts ─────────────────────────────────────────────────── */
const FONT = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-text-size-adjust: 100%; }
body { background: #080c18; overflow-x: hidden; }
@keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.35} }
@keyframes flashIn  { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
@keyframes shimmer  { 0%{opacity:.7} 50%{opacity:1} 100%{opacity:.7} }
@keyframes timerBar { from{width:100%} to{width:0%} }
input, select, textarea { -webkit-appearance: none; }
input::placeholder { color:#253050; }
::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-track { background:#080c18; }
::-webkit-scrollbar-thumb { background:#1e2d4a; border-radius:2px; }
select option { background:#0f1828; }
/* responsive helpers */
.hide-mobile { display:flex; }
.game-grid { display:grid; grid-template-columns:260px 1fr 260px; min-height:calc(100vh - 52px); }
.notes-grid { display:grid; grid-template-columns:1fr 350px; min-height:calc(100vh - 52px); }
.lobby-grid { display:grid; grid-template-columns:252px 1fr; min-height:calc(100vh - 52px); }
@media(max-width:900px) {
  .game-grid { grid-template-columns:1fr !important; }
  .game-side { display:none !important; }
  .notes-grid { grid-template-columns:1fr !important; }
  .notes-preview { display:none !important; }
}
@media(max-width:700px) {
  .hide-mobile { display:none !important; }
  .lobby-grid { grid-template-columns:1fr !important; }
  .lobby-sidebar { display:none !important; }
}
`;

/* ─── tokens ─────────────────────────────────────────────────── */
const C = {
  bg0: "#080c18", bg1: "#0c1220", bg2: "#101828", bg3: "#141e2e",
  border: "#1a2840", border2: "#243560",
  gold: "#c8a840", goldBr: "#f0c840", goldDim: "#4a3c10",
  red: "#c03030", redBr: "#e84040",
  blue: "#1860c0", blueBr: "#50a8f8",
  green: "#22c55e",
  text: "#eaecf8", textMd: "#6878a8", textDim: "#283858",
  mono: "'IBM Plex Mono', monospace",
  serif: "'Cinzel', serif",
  disp: "'Cinzel Decorative', serif",
};

/* ─── tiny atoms ─────────────────────────────────────────────── */
const M = ({ c = C.textDim, s = 9, sp = 2.5, children, style }) => (
  <span style={{ fontFamily: C.mono, fontSize: s, letterSpacing: sp, color: c, ...style }}>{children}</span>
);
const Tag = ({ color = C.gold, children }) => (
  <span style={{ fontFamily: C.mono, fontSize: 8, letterSpacing: 2, color, border: `1px solid ${color}`, background: `${color}18`, padding: "2px 8px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</span>
);
const Btn = ({ onClick, variant = "primary", style = {}, children }) => {
  const v = {
    primary: { background: C.gold, color: C.bg0, border: "none" },
    ghost: { background: "transparent", color: C.gold, border: `1px solid ${C.goldDim}` },
    muted: { background: "transparent", color: C.textMd, border: `1px solid ${C.border}` },
  }[variant];
  return (
    <button onClick={onClick} style={{ padding: "9px 20px", fontFamily: C.serif, fontSize: 11, fontWeight: 700, letterSpacing: 2, cursor: "pointer", transition: "opacity .15s", ...v, ...style }}>
      {children}
    </button>
  );
};

/* ─── player banner ──────────────────────────────────────────── */
function PlayerBar({ name, elo, section, side, timeStr, urgent, boardWidth }) {
  return (
    <div style={{ width: boardWidth, maxWidth: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.bg2, border: `1px solid ${C.border}`, borderLeft: `3px solid ${side === "w" ? C.gold : C.blueBr}` }}>
      <div style={{ width: 36, height: 36, borderRadius: 4, background: side === "w" ? `linear-gradient(135deg,${C.goldDim},${C.gold})` : `linear-gradient(135deg,#1a2a6e,#2a40a0)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
        {side === "w" ? "♔" : "♚"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: "#f0f2ff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        <div style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: 1, color: "#8898c8", marginTop: 2 }}>{elo} · {section}</div>
      </div>
      <div style={{ fontFamily: C.disp, fontSize: 24, color: urgent ? C.redBr : C.gold, animation: urgent ? "pulse .7s infinite" : "none", minWidth: 60, textAlign: "right", letterSpacing: 1 }}>
        {timeStr}
      </div>
    </div>
  );
}

/* ─── NAV ────────────────────────────────────────────────────── */
function Nav({ page, setPage, user, setUser }) {
  return (
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(14px,3vw,32px)", height: 52, background: `${C.bg1}f0`, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 200, backdropFilter: "blur(16px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div onClick={() => setPage("landing")} style={{ fontFamily: C.disp, fontSize: 15, color: C.gold, letterSpacing: 1.5, cursor: "pointer", flexShrink: 0 }}>
          ACADEMIC<span style={{ color: C.redBr }}>⚔</span>WARFARE
        </div>
        {user && (
          <div className="hide-mobile" style={{ display: "flex", gap: 3 }}>
            {[["lobby", "LOBBY"], ["leaderboard", "RANKS"], ["notes", "NOTES"], ["insights", "INSIGHTS"], ["bank", "QUESTION BANK"]].map(([id, lbl]) => (
              <button key={id} onClick={() => setPage(id)} style={{ background: page === id ? `${C.gold}14` : "transparent", border: `1px solid ${page === id ? C.goldDim : C.border}`, color: page === id ? C.gold : C.textMd, padding: "5px 12px", fontFamily: C.mono, fontSize: 9, letterSpacing: 2, cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" }}>{lbl}</button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {user ? (
          <>
            <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 28, height: 28, borderRadius: 3, background: `linear-gradient(135deg,${C.goldDim},${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🎓</div>
              <div>
                <div style={{ fontFamily: C.serif, fontSize: 11, color: C.text }}>{user.name}</div>
                <M s={8} c={C.gold} style={{ display: "block" }}>ELO {user.elo}</M>
              </div>
            </div>
            <Btn variant="muted" onClick={() => { setUser(null); setPage("landing"); }} style={{ padding: "5px 13px", fontSize: 9, letterSpacing: 2 }}>SIGN OUT</Btn>
          </>
        ) : (
          <Btn onClick={() => setPage("signin")} style={{ padding: "8px 22px", fontSize: 11 }}>SIGN IN</Btn>
        )}
      </div>
    </nav>
  );
}

/* ─── LOBBY ──────────────────────────────────────────────────── */
function Lobby({ setPage, setRoom, user }) {
  const [sec, setSec] = useState(user?.section || "CS 3345 - 001");
  const ROOMS = {
    "CS 3345 - 001": [{ id: 1, name: "The Bishop's Gambit", live: true, move: 14, w: "KnightRider", b: "ByteSlayer" }, { id: 2, name: "Recursive Reckoning", live: false, w: "StackOverflow_UTD" }, { id: 3, name: "AVL Tree Arena", live: true, move: 7, w: "RedBlackKing", b: "HashMapHero" }],
    "MATH 2414 - 501": [{ id: 4, name: "Calculus of War", live: false, w: "IntegralIvan" }, { id: 5, name: "Infinite Series Siege", live: true, move: 22, w: "TaylorSeries", b: "LimitBreaker" }],
    "OPRE 3333 - 001": [{ id: 6, name: "OPRE Endgame", live: true, move: 31, w: "SimplexSam", b: "DualityDave" }],
    "CS 4349 - 001": [{ id: 7, name: "Algorithm Assault", live: false, w: "BigOBoss" }],
  };
  const cur = ROOMS[sec] || [];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "252px 1fr", minHeight: "calc(100vh - 52px)" }}>
      <div style={{ background: C.bg1, borderRight: `1px solid ${C.border}`, padding: "22px 16px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: 16 }}>
          <div style={{ display: "flex", gap: 11, alignItems: "center", marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 3, background: `linear-gradient(135deg,${C.goldDim},${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎓</div>
            <div>
              <div style={{ fontFamily: C.serif, fontSize: 12, fontWeight: 700, color: C.text }}>{user?.name}</div>
              <M s={9} c={C.gold} style={{ display: "block", marginTop: 2 }}>◆ GOLD II · ELO {user?.elo}</M>
            </div>
          </div>
          <M s={8} c={C.textDim} style={{ display: "block", marginBottom: 10 }}>📍 {user?.section}</M>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
            {[["47", "WINS", C.gold], ["72%", "DUELS", C.blueBr], ["18", "LOSS", C.redBr]].map(([v, l, a]) => (
              <div key={l} style={{ background: C.bg0, padding: "8px 4px", textAlign: "center" }}>
                <div style={{ fontFamily: C.disp, fontSize: 15, color: a }}>{v}</div>
                <M s={7} c={C.textDim} sp={1} style={{ display: "block", marginTop: 2 }}>{l}</M>
              </div>
            ))}
          </div>
        </div>
        <div>
          <M s={8} c={C.textDim} sp={3} style={{ display: "block", marginBottom: 8, textTransform: "uppercase" }}>Section Filter</M>
          {Object.keys(ROOMS).map(s => (
            <div key={s} onClick={() => setSec(s)} style={{ padding: "8px 11px", marginBottom: 3, background: sec === s ? `${C.gold}12` : "transparent", border: `1px solid ${sec === s ? C.goldDim : C.border}`, cursor: "pointer", transition: "all .15s" }}>
              <M s={10} c={sec === s ? C.gold : C.textMd} sp={0.5} style={{ display: "block" }}>{s}</M>
              <M s={8} c={C.textDim} sp={0.5} style={{ display: "block", marginTop: 2 }}>{(ROOMS[s] || []).filter(r => r.live).length} live · {(ROOMS[s] || []).filter(r => !r.live).length} open</M>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 7 }}>
          <Btn onClick={() => { setRoom({ section: sec }); setPage("game"); }}>⚔ QUICK MATCH</Btn>
          <Btn variant="muted" onClick={() => setPage("notes")} style={{ padding: "9px", fontSize: 9, letterSpacing: 2 }}>📄 UPLOAD NOTES</Btn>
        </div>
      </div>
      <div style={{ padding: "26px 30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
          <div>
            <M s={8} c={C.textDim} sp={4} style={{ display: "block", marginBottom: 4, textTransform: "uppercase" }}>Section Lobby</M>
            <h2 style={{ fontFamily: C.disp, fontSize: 20, color: C.text }}>{sec}</h2>
          </div>
          <Btn variant="ghost" onClick={() => { setRoom({ section: sec }); setPage("game"); }} style={{ padding: "8px 18px", fontSize: 9, letterSpacing: 2 }}>+ CREATE ROOM</Btn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(265px,1fr))", gap: 12 }}>
          {cur.map(r => (
            <div key={r.id} onClick={() => { if (!r.live) { setRoom(r); setPage("game"); } }}
              style={{ background: C.bg2, border: `1px solid ${C.border}`, borderLeft: `3px solid ${r.live ? C.redBr : C.blueBr}`, padding: 17, cursor: r.live ? "default" : "pointer", transition: "transform .15s" }}
              onMouseEnter={e => { if (!r.live) e.currentTarget.style.transform = "translateY(-2px)" }}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                <div style={{ fontFamily: C.serif, fontSize: 12, fontWeight: 700, color: C.text }}>{r.name}</div>
                <Tag color={r.live ? C.redBr : C.blueBr}>{r.live ? `● M${r.move}` : "◯ OPEN"}</Tag>
              </div>
              <M s={8} c={C.textDim} sp={0.5} style={{ display: "block", marginBottom: 13 }}>{sec}</M>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                  <M s={10} c={C.gold}>{r.w}</M>
                  {r.b && <><span style={{ color: C.redBr, fontFamily: C.disp, fontSize: 9 }}>VS</span><M s={10} c={C.blueBr}>{r.b}</M></>}
                  {!r.b && <M s={9} c={C.textDim}>waiting...</M>}
                </div>
                <M s={9} c={r.live ? C.textDim : C.blueBr}>{r.live ? "Spectate →" : "Join →"}</M>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── LEADERBOARD ────────────────────────────────────────────── */
function Leaderboard({ user }) {
  const [cls, setCls] = useState("CS 3345 - 001");
  const TABS = ["CS 3345 - 001", "MATH 2414 - 501", "OPRE 3333 - 001", "CS 4349 - 001", "🌐 GLOBAL"];
  const DATA = {
    "CS 3345 - 001": [
      { rank: 1, name: "ByteSlayer_99", elo: 1820, wins: 89, duel: "84%", streak: 7, badge: "👑" },
      { rank: 2, name: "RedBlackKing", elo: 1741, wins: 71, duel: "79%", streak: 3, badge: "⚔" },
      { rank: 3, name: "HashMapHero", elo: 1690, wins: 64, duel: "76%", streak: 0, badge: "🔥" },
      { rank: 4, name: "KnightRider_UTD", elo: 1482, wins: 47, duel: "72%", streak: 2, badge: "⭐", me: true },
      { rank: 5, name: "StackOverflow_UTD", elo: 1401, wins: 38, duel: "65%", streak: 0, badge: "" },
    ],
    "🌐 GLOBAL": [
      { rank: 1, name: "ByteSlayer_99", elo: 1820, wins: 89, duel: "84%", streak: 7, badge: "👑" },
      { rank: 2, name: "IntegralIvan", elo: 1750, wins: 77, duel: "81%", streak: 5, badge: "⚔" },
      { rank: 3, name: "RedBlackKing", elo: 1741, wins: 71, duel: "79%", streak: 3, badge: "🔥" },
      { rank: 4, name: "KnightRider_UTD", elo: 1482, wins: 47, duel: "72%", streak: 2, badge: "⭐", me: true },
    ],
  };
  const list = DATA[cls] || DATA["🌐 GLOBAL"];
  const rc = ["#f0c840", "#b0bcc8", "#c07830"];
  return (
    <div style={{ padding: "30px 38px", maxWidth: 940, margin: "0 auto" }}>
      <M s={8} c={C.textDim} sp={4} style={{ display: "block", marginBottom: 4, textTransform: "uppercase" }}>Rankings</M>
      <h2 style={{ fontFamily: C.disp, fontSize: 22, color: C.text, marginBottom: 24 }}>Leaderboard</h2>
      <div style={{ display: "flex", gap: 3, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setCls(t)} style={{ background: cls === t ? C.bg2 : "transparent", border: `1px solid ${cls === t ? C.border : "transparent"}`, borderBottom: `1px solid ${cls === t ? C.bg2 : C.border}`, color: cls === t ? C.gold : C.textMd, padding: "7px 14px", fontFamily: C.mono, fontSize: 9, letterSpacing: 2, cursor: "pointer", marginBottom: cls === t ? -1 : 0, position: "relative" }}>{t}</button>
        ))}
      </div>
      <div style={{ background: C.bg2, border: `1px solid ${C.border}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 80px 58px 68px 68px", padding: "9px 17px", borderBottom: `1px solid ${C.border}` }}>
          {["#", "PLAYER", "ELO", "WINS", "DUELS", "STREAK"].map(h => <M key={h} s={8} sp={3} c={C.textDim}>{h}</M>)}
        </div>
        {list.map((p, i) => (
          <div key={p.rank} style={{ display: "grid", gridTemplateColumns: "44px 1fr 80px 58px 68px 68px", padding: "12px 17px", background: p.me ? `${C.gold}08` : i % 2 === 0 ? "transparent" : C.bg1, borderBottom: i < list.length - 1 ? `1px solid ${C.border}` : "none", border: p.me ? `1px solid ${C.goldDim}` : "none" }}>
            <div style={{ fontFamily: C.disp, fontSize: 14, color: rc[p.rank - 1] || C.textDim, alignSelf: "center" }}>{p.rank}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontSize: 14 }}>{p.badge || "♟"}</span>
              <span style={{ fontFamily: C.serif, fontSize: 12, color: p.me ? C.gold : C.text }}>{p.name}{p.me ? " (you)" : ""}</span>
            </div>
            <M s={11} c={C.gold} style={{ alignSelf: "center" }}>{p.elo}</M>
            <M s={11} c={C.text} style={{ alignSelf: "center" }}>{p.wins}</M>
            <M s={11} c={C.blueBr} style={{ alignSelf: "center" }}>{p.duel}</M>
            <M s={11} c={p.streak > 0 ? C.green : C.textDim} style={{ alignSelf: "center" }}>{p.streak > 0 ? `🔥 ${p.streak}` : "-"}</M>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── NOTES ──────────────────────────────────────────────────── */
function Notes() {
  const [drag, setDrag] = useState(false);
  const [active, setActive] = useState(null);
  const FILES = [
    { name: "Week_3_Trees.pdf", size: "1.2 MB", status: "done", q: 42, sub: "CS 3345", date: "Mar 1" },
    { name: "Sorting_Algorithms.pdf", size: "0.8 MB", status: "done", q: 28, sub: "CS 3345", date: "Feb 28" },
    { name: "Lecture_12_Heaps.pdf", size: "2.1 MB", status: "processing", q: 0, sub: "CS 3345", date: "Mar 4" },
  ];
  const QS = [
    { q: "What is the time complexity of inserting into an AVL tree?", diff: "Medium", tags: ["Trees", "AVL"] },
    { q: "Which rotation handles a right-right imbalance?", diff: "Easy", tags: ["AVL", "Rotation"] },
    { q: "Max height of AVL tree with n nodes?", diff: "Hard", tags: ["AVL", "Height"] },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", minHeight: "calc(100vh - 52px)" }}>
      <div style={{ padding: "26px 30px" }}>
        <M s={8} c={C.textDim} sp={4} style={{ display: "block", marginBottom: 4, textTransform: "uppercase" }}>Study Materials</M>
        <h2 style={{ fontFamily: C.disp, fontSize: 20, color: C.text, marginBottom: 20 }}>Upload Notes</h2>
        <div onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false) }}
          style={{ border: `2px dashed ${drag ? C.gold : C.border}`, background: drag ? `${C.gold}07` : C.bg2, padding: "36px 24px", textAlign: "center", marginBottom: 22, transition: "all .2s", cursor: "pointer" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
          <div style={{ fontFamily: C.serif, fontSize: 13, color: C.text, marginBottom: 7 }}>Drop files here or click to browse</div>
          <M s={9} c={C.textDim} sp={1} style={{ display: "block", marginBottom: 16 }}>PDF, DOCX, TXT · Max 10MB</M>
          <Btn style={{ padding: "9px 26px", fontSize: 10 }}>BROWSE FILES</Btn>
        </div>
        <M s={8} c={C.textDim} sp={3} style={{ display: "block", marginBottom: 10, textTransform: "uppercase" }}>Your Uploads</M>
        {FILES.map((f, i) => (
          <div key={i} onClick={() => setActive(f.status === "done" ? f : null)}
            style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 15px", background: active === f ? `${C.gold}0e` : C.bg2, border: `1px solid ${active === f ? C.goldDim : C.border}`, marginBottom: 6, cursor: f.status === "done" ? "pointer" : "default", transition: "all .15s" }}>
            <div style={{ fontSize: 20, flexShrink: 0 }}>{f.status === "done" ? "📗" : "⏳"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: C.serif, fontSize: 12, color: C.text, marginBottom: 3 }}>{f.name}</div>
              <M s={8} c={C.textDim} sp={0.5} style={{ display: "block" }}>{f.sub} · {f.size} · {f.date}</M>
            </div>
            {f.status === "done" ? <Tag color={C.green}>{f.q} Questions</Tag> : <Tag color={C.gold}>Processing…</Tag>}
          </div>
        ))}
      </div>
      <div style={{ background: C.bg1, borderLeft: `1px solid ${C.border}`, padding: "26px 18px" }}>
        <M s={8} c={C.textDim} sp={3} style={{ display: "block", marginBottom: 14, textTransform: "uppercase" }}>{active ? `Preview: ${active.name}` : "Select a file"}</M>
        {active ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 4 }}>
              {[[active.q, "TOTAL", C.gold], ["18", "EASY", C.green], ["16", "MED", C.gold], ["8", "HARD", C.redBr]].map(([v, l, a]) => (
                <div key={l} style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: "9px", textAlign: "center" }}>
                  <div style={{ fontFamily: C.disp, fontSize: 17, color: a }}>{v}</div>
                  <M s={7} c={C.textDim} sp={1} style={{ display: "block", marginTop: 3 }}>{l}</M>
                </div>
              ))}
            </div>
            {QS.map((q, i) => (
              <div key={i} style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: 13 }}>
                <div style={{ fontFamily: C.serif, fontSize: 11, color: C.text, lineHeight: 1.7, marginBottom: 9 }}>{q.q}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <Tag color={q.diff === "Easy" ? C.green : q.diff === "Hard" ? C.redBr : C.gold}>{q.diff}</Tag>
                  {q.tags.map(t => <Tag key={t} c={C.textDim}>{t}</Tag>)}
                </div>
              </div>
            ))}
            <Btn variant="ghost" style={{ padding: "9px", fontSize: 9, letterSpacing: 2, width: "100%", marginTop: 4 }}>ADD ALL TO QUESTION BANK</Btn>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "50px 20px" }}>
            <div style={{ fontSize: 36, marginBottom: 14, opacity: .2 }}>📂</div>
            <M s={10} c={C.textDim} sp={0} style={{ display: "block", lineHeight: 1.9 }}>Select a processed file to preview generated questions</M>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── DUEL MODAL ─────────────────────────────────────────────── */
const PIECE_SYMBOLS = { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚", P: "♙", N: "♘", B: "♗", R: "♖", Q: "♕", K: "♔" };

const ALL_QS = [
  { q: "What is the time complexity of inserting into an AVL tree?", opts: ["O(1)", "O(log n)", "O(n)", "O(n²)"], a: 1, sub: "CS 3345", diff: "Medium" },
  { q: "Which property distinguishes a red-black tree from a standard BST?", opts: ["All leaves same depth", "Color rules on nodes", "Left subtree larger", "Keys only in leaves"], a: 1, sub: "CS 3345", diff: "Hard" },
  { q: "What rotation fixes a left-left AVL imbalance?", opts: ["Left rotation", "Right rotation", "Left-Right", "Right-Left"], a: 1, sub: "CS 3345", diff: "Easy" },
  { q: "Which traversal visits nodes in sorted order for a BST?", opts: ["Pre-order", "Post-order", "In-order", "Level-order"], a: 2, sub: "CS 3345", diff: "Easy" },
  { q: "What is the worst-case height of a red-black tree with n nodes?", opts: ["O(log n)", "O(2 log n)", "O(n)", "O(√n)"], a: 1, sub: "CS 3345", diff: "Hard" },
];

function DuelModal({ game, onClose, attackerPiece, defenderPiece, user }) {
  const TOTAL = 2; // 1 question per person
  const [timeLeft, setTimeLeft] = useState(30);
  const [answered, setAnswered] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [scores, setScores] = useState([0, 0]); // [attacker, defender]
  const [phase, setPhase] = useState("duel"); // "duel" | "result"
  const BOARD_SIZE = 280;

  const q = ALL_QS[qIdx % ALL_QS.length];
  const pct = timeLeft / 30 * 100;
  const tc = timeLeft <= 8 ? C.redBr : timeLeft <= 15 ? "#f0a030" : C.gold;

  useEffect(() => {
    if (phase !== "duel") return;
    if (answered !== null) return;
    if (timeLeft <= 0) { handleAnswer(-1); return; }
    const id = setTimeout(() => setTimeLeft(x => x - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, answered, phase]);

  function handleAnswer(i) {
    setAnswered(i);
    if (i === q.a) setScores(s => [s[0] + 1, s[1]]);
    else setScores(s => [s[0], s[1] + 1]);
  }

  function nextQ() {
    if (qIdx + 1 >= TOTAL) { setPhase("result"); return; }
    setQIdx(x => x + 1);
    setTimeLeft(30);
    setAnswered(null);
  }

  const oBorder = i => answered === null ? C.border : i === q.a ? C.green : i === answered ? C.redBr : C.border;
  const oBg = i => answered === null ? "transparent" : i === q.a ? `${C.green}18` : i === answered ? `${C.redBr}14` : "transparent";
  const oColor = i => answered === null ? C.textMd : i === q.a ? C.green : i === answered ? C.redBr : C.textDim;

  const attackWins = scores[0] > scores[1];
  const isDraw = scores[0] === scores[1];
  const atkSym = attackerPiece ? PIECE_SYMBOLS[attackerPiece] : "♙";
  const defSym = defenderPiece ? PIECE_SYMBOLS[defenderPiece] : "♞";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(4,6,14,.94)", zIndex: 600, backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ display: "flex", maxWidth: 960, width: "100%", background: C.bg2, border: `1px solid ${C.border2}`, boxShadow: `0 0 0 1px ${C.bg0}, 0 24px 80px rgba(0,0,0,.75)`, maxHeight: "92vh", overflow: "hidden", position: "relative", animation: "flashIn .3s ease" }}>
        {/* corner brackets */}
        {[{ top: -1, left: -1, borderTop: `2px solid ${C.gold}`, borderLeft: `2px solid ${C.gold}` }, { top: -1, right: -1, borderTop: `2px solid ${C.gold}`, borderRight: `2px solid ${C.gold}` }, { bottom: -1, left: -1, borderBottom: `2px solid ${C.gold}`, borderLeft: `2px solid ${C.gold}` }, { bottom: -1, right: -1, borderBottom: `2px solid ${C.gold}`, borderRight: `2px solid ${C.gold}` }].map((s, i) => (
          <div key={i} style={{ position: "absolute", width: 16, height: 16, zIndex: 10, ...s }} />
        ))}

        {/* LEFT — live mini board */}
        <div style={{ width: BOARD_SIZE + 28, flexShrink: 0, background: C.bg1, borderRight: `1px solid ${C.border}`, padding: "18px 12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <M s={8} c={C.gold} sp={4} style={{ display: "block", marginBottom: 4, textTransform: "uppercase" }}>Live Board</M>
          <div style={{ alignSelf: "stretch", display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: C.bg0, borderLeft: `2px solid ${C.blueBr}` }}>
            <span style={{ fontFamily: C.disp, fontSize: 13 }}>♚</span>
            <M s={9} c={C.textMd} style={{ flex: 1 }}>DragonKnight_99</M>
          </div>
          <Chessboard
            position={game.fen()}
            boardWidth={BOARD_SIZE}
            arePiecesDraggable={false}
            customBoardStyle={{ boxShadow: "0 4px 24px rgba(0,0,0,.6)" }}
            customDarkSquareStyle={{ backgroundColor: "#8b6340" }}
            customLightSquareStyle={{ backgroundColor: "#d4b896" }}
          />
          <div style={{ alignSelf: "stretch", display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: C.bg0, borderLeft: `2px solid ${C.gold}` }}>
            <span style={{ fontFamily: C.disp, fontSize: 13 }}>♔</span>
            <M s={9} c={C.textMd} style={{ flex: 1 }}>{user?.name || "KnightRider"}</M>
          </div>
          {/* score dots — left panel */}
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6, alignSelf: "stretch" }}>
            {[[C.gold, scores[0], user?.name || "Attacker"], [C.blueBr, scores[1], "Defender"]].map(([col, sc, lbl]) => (
              <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <M s={8} c={col} sp={0} style={{ width: 54, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lbl}</M>
                <div style={{ display: "flex", gap: 4 }}>
                  {[0, 1, 2, 3, 4].map(d => <div key={d} style={{ width: 8, height: 8, borderRadius: "50%", background: d < sc ? col : C.border, transition: "background .3s" }} />)}
                </div>
                <M s={10} c={col} sp={0}>{sc}</M>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {phase === "result" ? (
            /* ── RESULT SCREEN ── */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", gap: 20, textAlign: "center" }}>
              <div style={{ fontFamily: C.disp, fontSize: 38, animation: "flashIn .4s ease" }}>
                {isDraw ? "🤝" : attackWins ? "⚔" : "🛡"}
              </div>
              <div style={{ fontFamily: C.disp, fontSize: 22, color: isDraw ? C.gold : attackWins ? C.gold : C.blueBr }}>
                {isDraw ? "DRAW!" : attackWins ? "ATTACKER WINS" : "DEFENDER HOLDS!"}
              </div>
              <M s={10} c={C.textMd} sp={1} style={{ display: "block" }}>
                {isDraw ? "Piece stays — no capture" : attackWins ? `${atkSym} captures ${defSym}` : `${defSym} destroys ${atkSym}`}
              </M>
              <div style={{ display: "flex", gap: 32, marginTop: 8 }}>
                {[[C.gold, scores[0], user?.name || "Attacker"], [C.blueBr, scores[1], "Defender"]].map(([col, sc, lbl]) => (
                  <div key={lbl} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: C.disp, fontSize: 32, color: col }}>{sc}</div>
                    <M s={8} c={C.textDim} sp={2} style={{ display: "block", marginTop: 3 }}>{lbl}</M>
                  </div>
                ))}
              </div>
              <Btn onClick={onClose} style={{ marginTop: 12, padding: "12px 40px", fontSize: 11, letterSpacing: 3 }}>
                {attackWins ? "EXECUTE CAPTURE" : isDraw ? "NO CAPTURE" : "RETREAT"}
              </Btn>
            </div>
          ) : (
            /* ── QUESTION PANEL ── */
            <>
              <div style={{ padding: "13px 20px", background: `linear-gradient(90deg,#1a2a6ecc,${C.bg2})`, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: C.disp, fontSize: 13, letterSpacing: 2, color: C.text }}>⚔ TRIVIA DUEL</span>
                  <Tag color={C.redBr}>{atkSym} attacks {defSym}</Tag>
                  <Tag color={q.diff === "Hard" ? C.redBr : q.diff === "Medium" ? C.gold : C.green}>{q.diff}</Tag>
                </div>
                <div style={{ fontFamily: C.disp, fontSize: 26, color: tc, minWidth: 44, textAlign: "right", transition: "color .3s", animation: timeLeft <= 8 ? "pulse .5s infinite" : "none" }}>{timeLeft}</div>
              </div>
              <div style={{ height: 3, background: C.border, position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: tc, transition: "width 1s linear, background .3s" }} />
              </div>
              <div style={{ flex: 1, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <M s={10} c={C.textDim}>Question {qIdx + 1} of {TOTAL} <span style={{ color: qIdx === 0 ? C.gold : C.blueBr, marginLeft: 8 }}>{qIdx === 0 ? "▶ Attacker's Turn" : "▶ Defender's Turn"}</span></M>
                  <Tag color={C.blueBr}>{q.sub}</Tag>
                </div>
                <div style={{ background: C.bg1, border: `1px solid ${C.border}`, padding: "15px 18px", fontFamily: C.serif, fontSize: 14, color: C.text, lineHeight: 1.85 }}>{q.q}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                  {q.opts.map((opt, i) => (
                    <div key={i} onClick={() => answered === null && handleAnswer(i)}
                      style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "12px 14px", border: `1px solid ${oBorder(i)}`, background: oBg(i), cursor: answered === null ? "pointer" : "default", transition: "all .2s", borderRadius: 2 }}>
                      <div style={{ width: 25, height: 25, flexShrink: 0, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.mono, fontSize: 10, color: answered === null ? C.gold : i === q.a ? C.green : i === answered ? C.redBr : C.textDim, background: answered === null ? C.bg0 : i === q.a ? `${C.green}25` : i === answered ? `${C.redBr}22` : C.bg0, border: `1px solid ${oBorder(i)}`, transition: "all .2s" }}>{String.fromCharCode(65 + i)}</div>
                      <span style={{ fontFamily: C.mono, fontSize: 11, color: oColor(i), lineHeight: 1.55, transition: "color .2s" }}>{opt}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: "11px 22px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <M s={10} c={C.gold}>{user?.name || "You"}</M>
                  <span style={{ fontFamily: C.disp, fontSize: 10, color: C.redBr }}>VS</span>
                  <M s={10} c={C.blueBr}>DragonKnight_99</M>
                </div>
                <div style={{ display: "flex", gap: 7 }}>
                  {answered !== null && <Btn onClick={nextQ} style={{ padding: "7px 18px", fontSize: 10, letterSpacing: 2 }}>NEXT →</Btn>}
                  <Btn variant="muted" onClick={onClose} style={{ padding: "7px 14px", fontSize: 9, letterSpacing: 2 }}>✕</Btn>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── helpers ────────────────────────────────────────────────── */
const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/* ─── GAME ───────────────────────────────────────────────────── */
function Game({ setPage, room, user }) {
  const [game, setGame] = useState(new Chess());
  const [selectedSq, setSelectedSq] = useState(null);
  const [optionSquares, setOptionSquares] = useState({});
  const [duelPending, setDuelPending] = useState(null);
  const [duelOpen, setDuelOpen] = useState(false);
  const [wTime, setWTime] = useState(600);
  const [bTime, setBTime] = useState(600);

  const getBoardWidth = () => window.innerWidth < 900 ? window.innerWidth - 32 : Math.min(window.innerWidth * 0.35, window.innerHeight * 0.65);
  const [boardWidth, setBoardWidth] = useState(getBoardWidth());

  useEffect(() => {
    const handleResize = () => setBoardWidth(getBoardWidth());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const turn = game.turn();

  useEffect(() => {
    if (duelOpen) return;
    const id = setInterval(() => {
      if (turn === "w") setWTime(t => Math.max(0, t - 1));
      else setBTime(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [turn, duelOpen]);

  function onSquareClick(square) {
    if (duelOpen) return;
    if (selectedSq) {
      const moves = game.moves({ square: selectedSq, verbose: true });
      const move = moves.find(m => m.to === square);
      if (move) {
        if (move.flags.includes("c") || move.flags.includes("e")) {
          const atk = game.get(selectedSq);
          const def = game.get(square);
          setDuelPending({ from: selectedSq, to: square, attackerPiece: atk?.type, defenderPiece: def?.type });
          setDuelOpen(true);
          setSelectedSq(null);
          setOptionSquares({});
          return;
        }
        const g2 = new Chess(game.fen());
        g2.move(move);
        setGame(g2);
        setSelectedSq(null);
        setOptionSquares({});
        return;
      }
    }
    const piece = game.get(square);
    if (piece && piece.color === turn) {
      setSelectedSq(square);
      const moves = game.moves({ square, verbose: true });
      const opts = {};
      moves.forEach(m => {
        const isCapture = m.flags.includes("c") || m.flags.includes("e");
        opts[m.to] = {
          background: isCapture
            ? "radial-gradient(circle, rgba(220,60,60,.55) 60%, transparent 65%)"
            : "radial-gradient(circle, rgba(80,168,248,.45) 55%, transparent 60%)",
          borderRadius: "50%",
        };
      });
      setOptionSquares(opts);
    } else {
      setSelectedSq(null);
      setOptionSquares({});
    }
  }

  function onDuelClose(attackerWon) {
    if (duelPending && attackerWon !== false) {
      const g2 = new Chess(game.fen());
      g2.move({ from: duelPending.from, to: duelPending.to, promotion: "q" });
      setGame(g2);
    }
    setDuelPending(null);
    setDuelOpen(false);
  }

  const customSquareStyles = {
    ...(selectedSq ? { [selectedSq]: { backgroundColor: "rgba(255,200,0,.4)" } } : {}),
    ...optionSquares,
  };

  return (
    <div className="game-grid" style={{ minHeight: "calc(100vh - 52px)" }}>
      {/* left sidebar */}
      <div className="game-side" style={{ background: C.bg1, borderRight: `1px solid ${C.border}`, padding: "16px 13px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
        {[["SECTION", room?.section || "CS 3345 - 001"], ["SUBJECT", "Data Structures"]].map(([l, v]) => (
          <div key={l} style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: 11, textAlign: "center" }}>
            <M s={7} c={C.textDim} sp={3} style={{ display: "block", marginBottom: 3 }}>{l}</M>
            <div style={{ fontFamily: C.serif, fontSize: 11, color: C.gold }}>{v}</div>
          </div>
        ))}
        <div>
          <M s={7} c={C.textDim} sp={3} style={{ display: "block", marginBottom: 7, textTransform: "uppercase" }}>Captures</M>
          <div style={{ fontSize: 15, letterSpacing: 2, marginBottom: 4 }}>♟♟♝</div>
          <M s={8} c={C.textDim} style={{ display: "block", marginBottom: 8 }}>White</M>
          <div style={{ fontSize: 15, letterSpacing: 2, marginBottom: 4 }}>♙♘</div>
          <M s={8} c={C.textDim} style={{ display: "block" }}>Black</M>
        </div>
        <div style={{ background: C.bg0, border: `1px solid ${C.border}`, padding: 11 }}>
          <M s={7} c={C.gold} sp={2} style={{ display: "block", marginBottom: 7, textTransform: "uppercase" }}>Duel Record</M>
          <div style={{ fontFamily: C.mono, fontSize: 10, lineHeight: 2.1 }}>
            <div style={{ color: C.textMd }}>⚔ 3 fought</div>
            <div style={{ color: C.green }}>✓ White: 2</div>
            <div style={{ color: C.redBr }}>✗ Black: 1</div>
          </div>
        </div>
        <div style={{ background: C.bg0, border: `1px solid ${C.border}`, padding: "8px 11px" }}>
          <M s={7} c={C.textDim} sp={2} style={{ display: "block", marginBottom: 4, textTransform: "uppercase" }}>Turn</M>
          <div style={{ fontFamily: C.serif, fontSize: 11, color: turn === "w" ? C.gold : C.blueBr }}>
            {turn === "w" ? "♔ White" : "♚ Black"}
          </div>
        </div>
        <div style={{ marginTop: "auto" }}>
          <Btn variant="muted" onClick={() => setPage("lobby")} style={{ width: "100%", padding: "8px", fontSize: 8, letterSpacing: 2 }}>← LEAVE</Btn>
        </div>
      </div>

      {/* center */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 28px", gap: 8 }}>
        <PlayerBar name="DragonKnight_99" elo="ELO 1,561" section={room?.section || "CS 3345 - 001"} side="b" timeStr={fmtTime(bTime)} urgent={bTime <= 30} boardWidth={boardWidth} />

        <Chessboard
          position={game.fen()}
          onSquareClick={onSquareClick}
          boardWidth={boardWidth}
          customSquareStyles={customSquareStyles}
          customBoardStyle={{
            borderRadius: 0,
            boxShadow: `0 0 0 3px ${C.goldDim}, 0 12px 60px rgba(0,0,0,.7), 0 0 80px rgba(200,168,64,.07)`,
          }}
          customDarkSquareStyle={{ backgroundColor: "#8b6340" }}
          customLightSquareStyle={{ backgroundColor: "#d4b896" }}
          customPieces={{}}
        />

        <PlayerBar name={user?.name || "KnightRider_UTD"} elo={`ELO ${user?.elo || 1482}`} section={room?.section || "CS 3345 - 001"} side="w" timeStr={fmtTime(wTime)} urgent={wTime <= 30} boardWidth={boardWidth} />
        <M s={13} c={C.gold} sp={0.5} style={{ display: "block", marginTop: 12 }}>
          Click a piece to see moves · <span style={{ color: C.redBr, fontWeight: "bold" }}>red ring</span> = capture (triggers duel)
        </M>
      </div>

      {/* right — move log */}
      <div className="game-side" style={{ background: C.bg1, borderLeft: `1px solid ${C.border}`, padding: "16px 13px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <M s={7} c={C.textDim} sp={3} style={{ display: "block", marginBottom: 11, textTransform: "uppercase" }}>Move History</M>
        {game.history({ verbose: true }).reduce((acc, m, i) => {
          if (i % 2 === 0) acc.push([m]);
          else acc[acc.length - 1].push(m);
          return acc;
        }, []).map(([w, b], i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "22px 1fr 1fr", gap: 4, padding: "4px 0", borderBottom: `1px solid ${C.border}33`, fontFamily: C.mono, fontSize: 10 }}>
            <span style={{ color: C.textDim }}>{i + 1}</span>
            <span style={{ color: C.text }}>{w.san}</span>
            <span style={{ color: C.textMd }}>{b?.san || ""}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 12 }}>
          <M s={7} c={C.textDim} sp={3} style={{ display: "block", marginBottom: 8, textTransform: "uppercase" }}>Chat</M>
          {[{ u: "Dragon", m: "gg wp" }, { u: "Knight", m: "nice rook" }].map((c, i) => (
            <div key={i} style={{ marginBottom: 5 }}><M s={8} c={C.gold}>{c.u} </M><M s={10} c={C.textMd} sp={0}>{c.m}</M></div>
          ))}
          <input placeholder="say something..." style={{ width: "100%", marginTop: 7, background: C.bg0, border: `1px solid ${C.border}`, color: C.text, padding: "7px 9px", fontFamily: C.mono, fontSize: 10, outline: "none" }} />
        </div>
      </div>

      {duelOpen && <DuelModal game={game} onClose={onDuelClose} user={user} attackerPiece={duelPending?.attackerPiece} defenderPiece={duelPending?.defenderPiece} />}
    </div>
  );
}

/* ─── INSIGHTS ───────────────────────────────────────────────── */
const TOPIC_DATA = [
  { topic: "AVL Trees", correct: 14, total: 17, tags: ["CS 3345"] },
  { topic: "Red-Black Trees", correct: 6, total: 12, tags: ["CS 3345"] },
  { topic: "Heaps", correct: 10, total: 11, tags: ["CS 3345"] },
  { topic: "Sorting", correct: 8, total: 15, tags: ["CS 3345"] },
  { topic: "Graphs", correct: 4, total: 10, tags: ["CS 3345"] },
  { topic: "Hash Tables", correct: 12, total: 13, tags: ["CS 3345"] },
  { topic: "Tries", correct: 2, total: 7, tags: ["CS 3345"] },
  { topic: "Dynamic Prog.", correct: 3, total: 9, tags: ["CS 3345"] },
];
function Insights({ user }) {
  const [sort, setSort] = useState("weakest");
  const sorted = [...TOPIC_DATA].sort((a, b) => {
    const pa = a.correct / a.total, pb = b.correct / b.total;
    return sort === "weakest" ? pa - pb : pb - pa;
  });
  const overall = TOPIC_DATA.reduce((a, t) => a + t.correct, 0);
  const totalQ = TOPIC_DATA.reduce((a, t) => a + t.total, 0);
  const pctAll = Math.round(overall / totalQ * 100);
  const weak = sorted.filter(t => t.correct / t.total < 0.6);
  const bar = pct => pct >= 0.75 ? C.green : pct >= 0.5 ? "#f0a030" : C.redBr;
  return (
    <div style={{ padding: "30px clamp(16px,4vw,48px)", maxWidth: 860, margin: "0 auto" }}>
      <M s={8} c={C.textDim} sp={4} style={{ display: "block", marginBottom: 4, textTransform: "uppercase" }}>Performance</M>
      <h2 style={{ fontFamily: C.disp, fontSize: 22, color: C.text, marginBottom: 24 }}>Topic Insights</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 24 }}>
        {[[`${pctAll}%`, "Overall Accuracy", pctAll >= 75 ? C.green : pctAll >= 50 ? "#f0a030" : C.redBr], [totalQ, "Questions Answered", C.gold], [overall, "Correct Answers", C.green], [weak.length, "Weak Topics", C.redBr]].map(([v, l, a]) => (
          <div key={l} style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: "14px 16px", borderTop: `3px solid ${a}` }}>
            <div style={{ fontFamily: C.disp, fontSize: 26, color: a, marginBottom: 4 }}>{v}</div>
            <M s={8} c={C.textDim} sp={1} style={{ display: "block" }}>{l}</M>
          </div>
        ))}
      </div>
      {weak.length > 0 && (
        <div style={{ background: `${C.redBr}10`, border: `1px solid ${C.redBr}40`, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠</span>
          <div>
            <div style={{ fontFamily: C.serif, fontSize: 12, color: C.redBr, marginBottom: 4 }}>Focus Areas</div>
            <div style={{ fontFamily: C.mono, fontSize: 10, color: C.textMd, lineHeight: 1.9 }}>
              Below 60% on: <span style={{ color: C.text }}>{weak.map(t => t.topic).join(", ")}</span>. Upload notes for these topics to generate targeted practice questions.
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <M s={8} c={C.textDim} sp={3} style={{ textTransform: "uppercase" }}>Topic Breakdown</M>
        <div style={{ display: "flex", gap: 4 }}>
          {[["weakest", "Weakest First"], ["strongest", "Strongest First"]].map(([v, l]) => (
            <button key={v} onClick={() => setSort(v)} style={{ background: sort === v ? `${C.gold}18` : "transparent", border: `1px solid ${sort === v ? C.goldDim : C.border}`, color: sort === v ? C.gold : C.textMd, padding: "4px 11px", fontFamily: C.mono, fontSize: 8, letterSpacing: 2, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map(t => {
          const pct = t.correct / t.total; const col = bar(pct);
          return (
            <div key={t.topic} style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                <span style={{ fontFamily: C.serif, fontSize: 12, color: C.text }}>{t.topic}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <M s={9} c={C.textDim} sp={0}>{t.correct}/{t.total} correct</M>
                  <span style={{ fontFamily: C.disp, fontSize: 13, color: col }}>{Math.round(pct * 100)}%</span>
                </div>
              </div>
              <div style={{ height: 6, background: C.bg0, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct * 100}%`, background: col, borderRadius: 3, transition: "width .5s ease" }} />
              </div>
              {pct < 0.6 && <div style={{ fontFamily: C.mono, fontSize: 9, color: C.redBr, marginTop: 6 }}>↑ Study tip: Re-upload notes for {t.topic} to generate fresh practice questions.</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── QUESTION BANK ─────────────────────────────────────────── */
const BANK_QS = [
  { id: 1, q: "What is the time complexity of inserting into an AVL tree?", opts: ["O(1)", "O(log n)", "O(n)", "O(n²)"], a: 1, diff: "Medium", topic: "AVL Trees" },
  { id: 2, q: "Which property distinguishes a red-black tree from a standard BST?", opts: ["All leaves same depth", "Color rules on nodes", "Left subtree larger", "Keys only in leaves"], a: 1, diff: "Hard", topic: "Red-Black Trees" },
  { id: 3, q: "What rotation fixes a left-left AVL imbalance?", opts: ["Left rotation", "Right rotation", "Left-Right", "Right-Left"], a: 1, diff: "Easy", topic: "AVL Trees" },
  { id: 4, q: "Which traversal visits nodes in sorted order for a BST?", opts: ["Pre-order", "Post-order", "In-order", "Level-order"], a: 2, diff: "Easy", topic: "Sorting" },
  { id: 5, q: "Worst-case height of a red-black tree with n nodes?", opts: ["O(log n)", "O(2 log n)", "O(n)", "O(√n)"], a: 1, diff: "Hard", topic: "Red-Black Trees" },
  { id: 6, q: "Max number of children in a binary heap node?", opts: ["1", "2", "Any number", "Depends"], a: 1, diff: "Easy", topic: "Heaps" },
  { id: 7, q: "Which algorithm finds shortest paths from a single source in a weighted graph?", opts: ["BFS", "DFS", "Dijkstra's", "Prim's"], a: 2, diff: "Medium", topic: "Graphs" },
  { id: 8, q: "Worst-case time for searching in a hash table with chaining?", opts: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], a: 2, diff: "Medium", topic: "Hash Tables" },
  { id: 9, q: "Which data structure supports O(1) prefix search lookups?", opts: ["Hash table", "AVL tree", "Trie", "Heap"], a: 2, diff: "Medium", topic: "Tries" },
  { id: 10, q: "Average-case time complexity of Quicksort?", opts: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], a: 1, diff: "Easy", topic: "Sorting" },
];
const DC = { Easy: C.green, Medium: C.gold, Hard: C.redBr };
function QuestionBank({ user }) {
  const [diff, setDiff] = useState("All");
  const [topic, setTopic] = useState("All");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(null);
  const topics = ["All", ...Array.from(new Set(BANK_QS.map(q => q.topic)))];
  const vis = BANK_QS.filter(q => (diff === "All" || q.diff === diff) && (topic === "All" || q.topic === topic) && (!search || q.q.toLowerCase().includes(search.toLowerCase())));
  return (
    <div style={{ padding: "30px clamp(16px,4vw,48px)", maxWidth: 900, margin: "0 auto" }}>
      <M s={8} c={C.textDim} sp={4} style={{ display: "block", marginBottom: 4, textTransform: "uppercase" }}>Study Material</M>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontFamily: C.disp, fontSize: 22, color: C.text }}>Question Bank <span style={{ color: C.gold, fontSize: 14 }}>— {user?.section || "CS 3345 - 001"}</span></h2>
        <M s={9} c={C.textDim} sp={0}>{vis.length} / {BANK_QS.length} questions</M>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
        {[["Easy", C.green], ["Medium", C.gold], ["Hard", C.redBr]].map(([d, c]) => (
          <div key={d} onClick={() => setDiff(diff === d ? "All" : d)} style={{ background: C.bg2, border: `1px solid ${diff === d ? c : C.border}`, borderTop: `2px solid ${c}`, padding: "10px", textAlign: "center", cursor: "pointer", transition: "border .15s" }}>
            <div style={{ fontFamily: C.disp, fontSize: 20, color: c }}>{BANK_QS.filter(q => q.diff === d).length}</div>
            <M s={8} c={C.textDim} sp={1} style={{ display: "block", marginTop: 3 }}>{d}</M>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions..." style={{ flex: 1, minWidth: 160, background: C.bg1, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: C.mono, fontSize: 10, outline: "none" }} />
        <select value={topic} onChange={e => setTopic(e.target.value)} style={{ background: C.bg1, border: `1px solid ${C.border}`, color: C.text, padding: "6px 10px", fontFamily: C.mono, fontSize: 9, outline: "none", cursor: "pointer" }}>
          {topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {vis.map(q => {
          const isOpen = open === q.id;
          return (
            <div key={q.id} style={{ background: C.bg2, border: `1px solid ${isOpen ? C.goldDim : C.border}`, transition: "border .15s" }}>
              <div onClick={() => setOpen(isOpen ? null : q.id)} style={{ padding: "13px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                  <M s={9} c={C.textDim} sp={0} style={{ flexShrink: 0, marginTop: 2 }}>#{q.id}</M>
                  <span style={{ fontFamily: C.serif, fontSize: 12, color: C.text, lineHeight: 1.7 }}>{q.q}</span>
                </div>
                <div style={{ display: "flex", gap: 5, flexShrink: 0, alignItems: "center" }}>
                  <Tag color={DC[q.diff]}>{q.diff}</Tag>
                  <Tag color={C.blueBr}>{q.topic}</Tag>
                  <span style={{ fontFamily: C.mono, fontSize: 11, color: isOpen ? C.gold : C.textDim }}>{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>
              {isOpen && (
                <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                    {q.opts.map((opt, i) => (
                      <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "8px 11px", background: i === q.a ? `${C.green}12` : C.bg1, border: `1px solid ${i === q.a ? C.green : C.border}` }}>
                        <span style={{ fontFamily: C.mono, fontSize: 10, color: i === q.a ? C.green : C.textDim, flexShrink: 0 }}>{String.fromCharCode(65 + i)}</span>
                        <span style={{ fontFamily: C.mono, fontSize: 10, color: i === q.a ? C.green : C.textMd, lineHeight: 1.5 }}>{opt}</span>
                        {i === q.a && <span style={{ fontFamily: C.mono, fontSize: 8, color: C.green, marginLeft: "auto", flexShrink: 0 }}>✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {vis.length === 0 && <div style={{ textAlign: "center", padding: "50px 20px", color: C.textDim, fontFamily: C.mono, fontSize: 11 }}>No questions match your filters.</div>}
      </div>
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState("landing");
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const demoGame = new Chess();

  const PAGES = {
    landing: <Landing setPage={setPage} user={user} onPreviewDuel={() => setDemoOpen(true)} />,
    signin: <SignIn setPage={setPage} setUser={setUser} />,
    lobby: <Lobby setPage={setPage} setRoom={setRoom} user={user} />,
    leaderboard: <Leaderboard user={user} />,
    notes: <Notes />,
    insights: <Insights user={user} />,
    bank: <QuestionBank user={user} />,
    game: <Game setPage={setPage} room={room} user={user} />,
  };

  return (
    <div style={{ fontFamily: C.serif, background: C.bg0, minHeight: "100vh", color: C.text }}>
      <style>{FONT}</style>
      <Nav page={page} setPage={setPage} user={user} setUser={setUser} />
      {PAGES[page] ?? PAGES.landing}
      {demoOpen && <DuelModal game={demoGame} onClose={() => setDemoOpen(false)} user={user || { name: "You" }} attackerPiece="p" defenderPiece="n" />}
    </div>
  );
}
