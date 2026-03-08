import { useState } from "react";
import { C, M, Btn, FONT } from "./shared/tokens.jsx";

const SECTIONS = [
    "CS 3345 - 001",
    "CS 3345 - 002",
    "MATH 2414 - 501",
    "OPRE 3333 - 001",
    "CS 4349 - 001",
];

/**
 * SignInPage  (handles both Sign In and Sign Up modes)
 *
 * Props:
 *   setPage  (fn)  – navigate to another page by name
 *   setUser  (fn)  – set the logged-in user object in parent state
 *
 * TODO – Backend integration:
 *   Replace the `go()` function body with:
 *     POST /api/auth/login   { email, password }       → { token, user }
 *     POST /api/auth/register { name, email, password, section } → { token, user }
 *   Store the JWT: localStorage.setItem("token", token)
 *   Then call setUser(user) and setPage("lobby")
 */
export default function SignInPage({ setPage, setUser }) {
    const [mode, setMode] = useState("signin"); // "signin" | "signup"
    const [form, setForm] = useState({ name: "", email: "", pass: "", section: "" });
    const [error, setError] = useState("");

    /* ── Form submit handler ── */
    const go = async () => {
        if (!form.email || !form.pass) {
            setError("Email and password are required.");
            return;
        }
        if (mode === "signup" && (!form.name || !form.section)) {
            setError("Display name and course section are required.");
            return;
        }
        setError("");

        try {
            const endpoint = mode === "signin" ? "/api/auth/login" : "/api/auth/register";
            const payload = mode === "signin"
                ? { email: form.email, password: form.pass }
                : { name: form.name, email: form.email, password: form.pass, section: form.section };

            const BASE = import.meta.env?.VITE_API_URL ?? "http://localhost:4000";
            const res = await fetch(`${BASE}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Authentication failed");
                return;
            }

            localStorage.setItem("token", data.token);
            setUser(data.user);
            setPage("lobby");
        } catch (err) {
            console.error(err);
            setError("Cannot connect to server.");
        }
    };

    /* ── Shared input style ── */
    const inp = {
        width: "100%",
        background: C.bg1,
        border: `1px solid ${C.border}`,
        color: C.text,
        padding: "10px 14px",
        fontFamily: C.mono,
        fontSize: 12,
        outline: "none",
    };

    const label = (text) => (
        <M s={8} c={C.textDim} sp={3} style={{ display: "block", marginBottom: 5, textTransform: "uppercase" }}>
            {text}
        </M>
    );

    /* ── Corner bracket decoration ── */
    const corners = [
        [{ top: -1, left: -1 }, { borderTop: "2px solid", borderLeft: "2px solid" }],
        [{ top: -1, right: -1 }, { borderTop: "2px solid", borderRight: "2px solid" }],
        [{ bottom: -1, left: -1 }, { borderBottom: "2px solid", borderLeft: "2px solid" }],
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
                    padding: 40,
                }}
            >
                <div style={{ width: "100%", maxWidth: 660, position: "relative" }}>

                    {/* ── Corner brackets ── */}
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

                    {/* ── Card ── */}
                    <div style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: "36px 32px" }}>

                        {/* Logo */}
                        <div style={{ textAlign: "center", marginBottom: 28 }}>
                            <div style={{ fontFamily: C.disp, fontSize: 17, color: C.gold }}>
                                ACADEMIC<span style={{ color: C.redBr }}>⚔</span>WARFARE
                            </div>
                        </div>

                        {/* Mode toggle */}
                        <div style={{ display: "flex", marginBottom: 24, background: C.bg1, border: `1px solid ${C.border}` }}>
                            {["signin", "signup"].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    style={{
                                        flex: 1,
                                        padding: "9px",
                                        background: mode === m ? C.gold : "transparent",
                                        border: "none",
                                        color: mode === m ? C.bg0 : C.textMd,
                                        fontFamily: C.mono,
                                        fontSize: 9,
                                        letterSpacing: 3,
                                        cursor: "pointer",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {m === "signin" ? "Sign In" : "Sign Up"}
                                </button>
                            ))}
                        </div>

                        {/* Fields */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>

                            {mode === "signup" && (
                                <div>
                                    {label("Display Name")}
                                    <input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. KnightRider_UTD"
                                        style={inp}
                                    />
                                </div>
                            )}

                            <div>
                                {label("UTD Email")}
                                <input
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
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

                            <Btn onClick={go} style={{ width: "100%", padding: "12px", fontSize: 12, letterSpacing: 3, marginTop: 6 }}>
                                {mode === "signin" ? "ENTER ARENA" : "CREATE ACCOUNT"}
                            </Btn>

                            {error && (
                                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.redBr, textAlign: "center", marginTop: 6, letterSpacing: 0.5 }}>
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Toggle link */}
                        <div style={{ textAlign: "center", marginTop: 16 }}>
                            <M s={9} c={C.textDim}>
                                {mode === "signin" ? "No account? " : "Have one? "}
                            </M>
                            <span
                                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
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
