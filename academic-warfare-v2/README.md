# Academic Warfare — Auth Setup

## Architecture

```
Browser (React)  ──→  Express API (port 4000)  ──→  MongoDB comet_db @ 172.30.241.83:27017
```

---

## Backend

### Setup & Run

```bash
cd backend
npm install
npm run dev        # node --watch (auto-restarts on changes)
# or
npm start
```

### Environment (`backend/.env`)

```env
MONGO_URI=mongodb://comet_user:pAsSw0rDDB69420!@172.30.241.83:27017/comet_db?authSource=admin
MONGO_DB=comet_db
JWT_SECRET=change_this_to_a_long_random_secret_in_production
PORT=4000
```

### API Endpoints

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/auth/register` | `{ name, email, password, section }` | `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` |
| GET | `/api/auth/me` | — (Bearer token) | `{ user }` |
| GET | `/health` | — | `{ status, ts }` |

**Validation rules:**
- Email must end with `@utdallas.edu`
- Password minimum 6 characters
- Duplicate email returns 409
- Wrong credentials returns 401 (same message for both — no user enumeration)

---

## Frontend

### Setup

```bash
cd frontend
npm install       # if using Vite
```

### Environment (`frontend/.env`)

```env
VITE_API_URL=http://localhost:4000
```

### Files changed

| File | What changed |
|------|-------------|
| `src/pages/shared/tokens.jsx` | Added responsive CSS classes: `.auth-card`, `.landing-cta`, `.stats-bar` + `@keyframes spin` |
| `src/pages/SignInPage.jsx` | Replaced mock `go()` with real `apiLogin` / `apiRegister` calls; loading state; Enter key support; styled error box |
| `src/pages/LandingPage.jsx` | Responsive font sizes with `clamp()`; `.landing-cta` responsive class; logged-in greeting |
| `src/api.js` | **New** — fetch wrapper for all API calls; reads JWT from `localStorage` |

### JWT storage

The token is stored in `localStorage` under the key `aw_token`.  
On app boot you can restore session like this:

```jsx
// In your root App component
useEffect(() => {
  const token = localStorage.getItem("aw_token");
  if (token) {
    apiMe()
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem("aw_token"));
  }
}, []);
```

### Logout

```js
localStorage.removeItem("aw_token");
setUser(null);
setPage("landing");
```

---

## MongoDB Data Model

**Collection: `users`**

```json
{
  "_id": ObjectId,
  "name": "KnightRider_UTD",
  "email": "abc123456@utdallas.edu",
  "password": "<bcrypt hash>",
  "section": "CS 3345 - 001",
  "elo": 1200,
  "wins": 0,
  "losses": 0,
  "createdAt": ISODate
}
```

Index: `email` (unique)

---

## Responsive Breakpoints

| Breakpoint | Change |
|-----------|--------|
| ≤ 900px | Game/notes grids collapse to single column |
| ≤ 700px | Lobby sidebar hidden; mobile nav shown |
| ≤ 480px | Auth card full-width; CTA buttons stack vertically |
