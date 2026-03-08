import { C, M, Btn, FONT } from "./shared/tokens.jsx";

/**
 * LandingPage
 *
 * Props:
 *   setPage       (fn)  – navigate to another page by name
 *   user          (obj) – current user object or null
 *   onPreviewDuel (fn)  – open the demo duel modal
 */
export default function LandingPage({ setPage, user, onPreviewDuel }) {
    return (
        <div style={{ fontFamily: C.serif, background: C.bg0, minHeight: "100vh", color: C.text }}>
            <style>{FONT}</style>

            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: "clamp(32px,6vw,60px) clamp(16px,5vw,48px)",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* ── Background decoration ── */}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    {/* faint chessboard grid */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "grid",
                            gridTemplateColumns: "repeat(8,12.5%)",
                            gridTemplateRows: "repeat(8,12.5%)",
                            opacity: 0.03,
                        }}
                    >
                        {Array.from({ length: 64 }, (_, i) => (
                            <div
                                key={i}
                                style={{
                                    background: (Math.floor(i / 8) + i) % 2 === 0 ? C.gold : "transparent",
                                    border: `1px solid ${C.gold}`,
                                }}
                            />
                        ))}
                    </div>
                    {/* center glow */}
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%,-50%)",
                            width: "clamp(300px, 60vw, 600px)",
                            height: "clamp(300px, 60vw, 600px)",
                            borderRadius: "50%",
                            background: `radial-gradient(circle,#1a2a6e35 0%,transparent 65%)`,
                        }}
                    />
                </div>

                {/* ── Season label ── */}
                <M
                    s={10}
                    c={C.redBr}
                    sp={6}
                    style={{ display: "block", marginBottom: 20, animation: "fadeUp .5s .1s both" }}
                >
                    ♟ UTD ACADEMIC ARENA · SEASON 01
                </M>

                {/* ── Hero headline ── */}
                <h1
                    style={{
                        fontFamily: C.disp,
                        fontSize: "clamp(36px, 8vw, 90px)",
                        lineHeight: 1.06,
                        marginBottom: 18,
                        animation: "fadeUp .5s .25s both",
                    }}
                >
                    THINK.<br />
                    <span style={{ color: C.gold }}>MOVE.</span><br />
                    <span style={{ color: C.redBr }}>CONQUER.</span>
                </h1>

                {/* ── Tagline ── */}
                <p
                    style={{
                        fontFamily: C.mono,
                        fontSize: "clamp(10px, 2vw, 12px)",
                        letterSpacing: 1,
                        color: C.textMd,
                        maxWidth: 480,
                        lineHeight: 2,
                        marginBottom: 48,
                        animation: "fadeUp .5s .4s both",
                    }}
                >
                    Chess meets academic warfare. Every capture triggers a live trivia duel
                    from your actual course material.
                </p>

                {/* ── CTA buttons — responsive via className ── */}
                <div className="landing-cta" style={{ animation: "fadeUp .5s .55s both" }}>
                    <Btn
                        onClick={() => setPage(user ? "lobby" : "signin")}
                        style={{ padding: "14px 40px", fontSize: 12, letterSpacing: 3 }}
                    >
                        ⚔ ENTER THE ARENA
                    </Btn>
                    <Btn
                        variant="ghost"
                        onClick={onPreviewDuel}
                        style={{ padding: "14px 28px", fontSize: 12, letterSpacing: 3 }}
                    >
                        ▶ PREVIEW DUEL
                    </Btn>
                    <Btn
                        variant="muted"
                        onClick={() => setPage("leaderboard")}
                        style={{ padding: "14px 28px", fontSize: 12, letterSpacing: 3 }}
                    >
                        VIEW RANKINGS
                    </Btn>
                </div>

                {/* ── Stats bar ── */}
                <div
                    className="stats-bar"
                    style={{
                        marginTop: 60,
                        borderTop: `1px solid ${C.border}`,
                        paddingTop: 36,
                        animation: "fadeUp .5s .7s both",
                    }}
                >
                    {[
                        ["1,247", "Players"],
                        ["38",    "Live Now"],
                        ["24",    "Courses"],
                        ["9,400+","Questions"],
                    ].map(([n, l]) => (
                        <div key={l}>
                            <div style={{ fontFamily: C.disp, fontSize: "clamp(20px,4vw,26px)", color: C.gold }}>{n}</div>
                            <M s={9} c={C.textDim} style={{ display: "block", marginTop: 5 }}>{l}</M>
                        </div>
                    ))}
                </div>

                {/* ── Logged-in greeting ── */}
                {user && (
                    <div
                        style={{
                            marginTop: 28,
                            fontFamily: C.mono,
                            fontSize: 10,
                            color: C.textMd,
                            letterSpacing: 1,
                            animation: "fadeUp .4s both",
                        }}
                    >
                        WELCOME BACK,{" "}
                        <span style={{ color: C.gold }}>{user.name.toUpperCase()}</span>
                        {" "}· ELO{" "}
                        <span style={{ color: C.goldBr }}>{user.elo}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
