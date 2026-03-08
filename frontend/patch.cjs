const fs = require('fs');
let code = fs.readFileSync('trivia-chess-v4.jsx', 'utf8');

// Insert imports at the top
code = code.replace(/import \{ Chess \} from "chess\.js";/, 'import { Chess } from "chess.js";\nimport Landing from "./src/pages/LandingPage.jsx";\nimport SignIn from "./src/pages/SignInPage.jsx";');

// Remove the inline Landing and SignIn definitions
// They span from /* ─── LANDING ... down to right before /* ─── LOBBY ...
code = code.replace(/\/\* ─── LANDING ────────────────────────────────────────────────── \*\/[\s\S]*?\/\* ─── LOBBY ──────────────────────────────────────────────────── \*\//, '/* ─── LOBBY ──────────────────────────────────────────────────── */');

fs.writeFileSync('trivia-chess-v4.jsx', code);
console.log('Patched trivia-chess-v4.jsx successfully.');
