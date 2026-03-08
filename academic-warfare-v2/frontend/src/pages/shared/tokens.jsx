/* ─── Design Tokens & Global Styles ─────────────────────────── */

export const FONT = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-text-size-adjust: 100%; }
body { background: #080c18; overflow-x: hidden; }

@keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.35} }
@keyframes flashIn  { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
@keyframes shimmer  { 0%{opacity:.7} 50%{opacity:1} 100%{opacity:.7} }
@keyframes timerBar { from{width:100%} to{width:0%} }
@keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

input, select, textarea { -webkit-appearance: none; }
input::placeholder { color:#253050; }
::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-track { background:#080c18; }
::-webkit-scrollbar-thumb { background:#1e2d4a; border-radius:2px; }
select option { background:#0f1828; }

/* ── Layout helpers ── */
.hide-mobile { display:flex; }
.game-grid   { display:grid; grid-template-columns:260px 1fr 260px; min-height:calc(100vh - 52px); }
.notes-grid  { display:grid; grid-template-columns:1fr 350px;       min-height:calc(100vh - 52px); }
.lobby-grid  { display:grid; grid-template-columns:252px 1fr;       min-height:calc(100vh - 52px); }

/* ── Responsive breakpoints ── */
@media(max-width:900px) {
  .game-grid  { grid-template-columns:1fr !important; }
  .game-side  { display:none !important; }
  .notes-grid { grid-template-columns:1fr !important; }
  .notes-preview { display:none !important; }
}
@media(max-width:700px) {
  .hide-mobile   { display:none !important; }
  .lobby-grid    { grid-template-columns:1fr !important; }
  .lobby-sidebar { display:none !important; }
}

/* ── Sign-in card responsive ── */
.auth-card {
  width: 100%;
  max-width: 420px;
  position: relative;
}
@media(max-width:480px) {
  .auth-card { max-width: 100%; }
  .auth-card-inner { padding: 28px 20px !important; }
}

/* ── Landing CTA responsive ── */
.landing-cta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
@media(max-width:480px) {
  .landing-cta { flex-direction: column; align-items: stretch; }
  .landing-cta button { width: 100%; }
}

/* ── Stats bar responsive ── */
.stats-bar {
  display: flex;
  gap: clamp(24px,4vw,56px);
  flex-wrap: wrap;
  justify-content: center;
}
@media(max-width:480px) {
  .stats-bar { gap: 24px; }
}
`;

/* ─── Color Tokens ───────────────────────────────────────────── */
export const C = {
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

/* ─── Atom Components ────────────────────────────────────────── */

/** Monospaced label */
export const M = ({ c = C.textDim, s = 9, sp = 2.5, children, style }) => (
    <span style={{ fontFamily: C.mono, fontSize: s, letterSpacing: sp, color: c, ...style }}>{children}</span>
);

/** Small uppercase tag/badge */
export const Tag = ({ color = C.gold, children }) => (
    <span style={{ fontFamily: C.mono, fontSize: 8, letterSpacing: 2, color, border: `1px solid ${color}`, background: `${color}18`, padding: "2px 8px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</span>
);

/** Button with variants: "primary" | "ghost" | "muted" */
export const Btn = ({ onClick, variant = "primary", style = {}, children, disabled = false, type = "button" }) => {
    const v = {
        primary: { background: disabled ? C.goldDim : C.gold, color: C.bg0, border: "none" },
        ghost:   { background: "transparent", color: C.gold,   border: `1px solid ${C.goldDim}` },
        muted:   { background: "transparent", color: C.textMd, border: `1px solid ${C.border}` },
    }[variant];
    return (
        <button
            type={type}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            style={{
                padding: "9px 20px",
                fontFamily: C.serif,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "opacity .15s",
                opacity: disabled ? 0.6 : 1,
                ...v,
                ...style,
            }}
        >
            {children}
        </button>
    );
};
