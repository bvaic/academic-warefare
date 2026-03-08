import { useState } from "react";
import { C, M, Btn, FONT } from "./shared/tokens.jsx";
import { apiLogin, apiRegister } from "../api.js";

const SECTIONS = [
    "CS 3345 - 001",
    "CS 3345 - 002",
    "MATH 2414 - 501",
    "OPRE 3333 - 001",
    "CS 4349 - 001",
];

/**
 * SignInPage  (handles both Sign In and Sign Up)
 *
 * Props:
 *   setPage  (fn)  – navigate to another page by name
 *   setUser  (fn)  – set the logged-in user object in parent state
 */
export default function SignInPage({ setPage, setUser }) {
    const [mode, setMode]     = useState("signin");
    const [form, setForm]     = useState({ name: "", email: "", pass: "", section: "" });
    const [error, setError]   = useState("");
    const [loading, setLoad]  = useState(false);

    /* ── Form submit ── */
    const go = async () => {
        setError("");

        // Client-side validation
        if (!form.email || !form.pass) {
            setError("Email and password are required.");
            return;
        }
        if (mode === "signup") {
            if (!form.name || !form.section) {
                setError("Display name and course section are required.");
                return;
            }
            if (!form.email.endsWith("@utdallas.edu")) {
                setError("Must use a @utdallas.edu email address.");
                return;
            }
            if (form.pass.length < 6) {
                setError("Password must be at least 6 characters.");
                return;
            }
        }

        setLoad(true);
        try {
            let data;
            if (mode === "signin") {
                data = await apiLogin({ email: form.email, password: form.pass });
            } else {
                data = await apiRegister({
                    name: form.name,
                    email: form.email,
                    password: form.pass,
                    section: form.section,
                });
            }

            // Persist JWT
            localStorage.setItem("aw_token", data.token);
            setUser(data.user);
            setPage("lobby");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoad(false);
        }
    };

    // Allow Enter key to submit
    const onKey = (e) => { if (e.key === "Enter") go(); };

    /* ── Shared input style ── */
    const inp = {
        width: "100%",
        background: C.bg1,
        border: `1px solid ${C.border}`,
        color: C.text,
        padding: "11px 14px",
        fontFamily: C.mono,
        fontSize: 12,
        outline: "none",
        transition: "border-color .15s",
    };

    const label = (text) => (
        <M s={8} c={C.textDim} sp={3} style={{ display: "block", marginBottom: 6, textTransform: "uppercase" }}>
            {text}
        </M>
    );

    /* ── Corner bracket decoration ── */
    const corners = [
        [{ top: -1, left: -1 },  { borderTop: "2px solid", borderLeft: "2px solid" }],
        [{ top: -1, right: -1 }, { borderTop: "2px solid", borderRight: "2px solid" }],
        [{ bottom: -1, left: -1 },  { borderBottom: "2px solid", borderLeft: "2px solid" }],
        [{ bottom: -1, right: -1 }, { borderBottom: "2px solid", borderRight: "2px solid" }],
    ];

    return (
        <div style={{ fontFamily: C.serif, background: C.bg0, minHeight: "100vh", color: C.text }}>
            <style>{FONT}</style>

            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "clamp(16px, 4vw, 40px)",
                }}
            >
                {/* Responsive card wrapper */}
                <div className="auth-card">

                    {/* Corner brackets */}
                    {corners.map(([pos, border], i) => (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                width: 16,
                                height: 16,
                                borderColor: C.gold,
                                ...pos,
                                ...border,
                            }}
                        />
                    ))}

                    {/* Card */}
                    <div className="auth-card-inner" style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: "36px 32px" }}>

                        {/* Logo */}
                        <div style={{ textAlign: "center", marginBottom: 28 }}>
                            <div style={{ fontFamily: C.disp, fontSize: 17, color: C.gold }}>
                                ACADEMIC<span style={{ color: C.redBr }}>⚔</span>WARFARE
                            </div>
                            <M s={8} c={C.textDim} sp={2} style={{ display: "block", marginTop: 6 }}>
                                UTD ACADEMIC ARENA · SEASON 01
                            </M>
                        </div>

                        {/* Mode toggle */}
                        <div style={{ display: "flex", marginBottom: 24, background: C.bg1, border: `1px solid ${C.border}` }}>
                            {["signin", "signup"].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => { setMode(m); setError(""); }}
                                    style={{
                                        flex: 1,
                                        padding: "10px",
                                        background: mode === m ? C.gold : "transparent",
                                        border: "none",
                                        color: mode === m ? C.bg0 : C.textMd,
                                        fontFamily: C.mono,
                                        fontSize: 9,
                                        letterSpacing: 3,
                                        cursor: "pointer",
                                        textTransform: "uppercase",
                                        transition: "background .2s, color .2s",
                                    }}
                                >
                                    {m === "signin" ? "Sign In" : "Sign Up"}
                                </button>
                            ))}
                        </div>

                        {/* Fields */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                            {mode === "signup" && (
                                <div>
                                    {label("Display Name")}
                                    <input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        onKeyDown={onKey}
                                        placeholder="e.g. KnightRider_UTD"
                                        style={inp}
                                    />
                                </div>
                            )}

                            <div>
                                {label("UTD Email")}
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    onKeyDown={onKey}
                                    placeholder="netid@utdallas.edu"
                                    style={inp}
                                />
                            </div>

                            <div>
                                {label("Password")}
                                <input
                                    type="password"
                                    value={form.pass}
                                    onChange={(e) => setForm({ ...form, pass: e.target.value })}
                                    onKeyDown={onKey}
                                    placeholder="••••••••"
                                    style={inp}
                                />
                            </div>

                            {mode === "signup" && (
                                <div>
                                    {label("Course Section")}
                                    <select
                                        value={form.section}
                                        onChange={(e) => setForm({ ...form, section: e.target.value })}
                                        style={{ ...inp, cursor: "pointer" }}
                                    >
                                        <option value="">Select section...</option>
                                        {SECTIONS.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <Btn
                                onClick={go}
                                disabled={loading}
                                style={{ width: "100%", padding: "13px", fontSize: 12, letterSpacing: 3, marginTop: 6 }}
                            >
                                {loading
                                    ? "CONNECTING…"
                                    : mode === "signin" ? "ENTER ARENA" : "CREATE ACCOUNT"}
                            </Btn>

                            {error && (
                                <div style={{
                                    fontFamily: C.mono,
                                    fontSize: 10,
                                    color: C.redBr,
                                    textAlign: "center",
                                    padding: "10px 12px",
                                    background: `${C.red}15`,
                                    border: `1px solid ${C.red}40`,
                                    letterSpacing: 0.5,
                                }}>
                                    ⚠ {error}
                                </div>
                            )}
                        </div>

                        {/* Toggle link */}
                        <div style={{ textAlign: "center", marginTop: 18 }}>
                            <M s={9} c={C.textDim}>
                                {mode === "signin" ? "No account? " : "Have one? "}
                            </M>
                            <span
                                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
                                style={{ fontFamily: C.mono, fontSize: 9, color: C.gold, cursor: "pointer" }}
                            >
                                {mode === "signin" ? "Sign up" : "Sign in"}
                            </span>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
