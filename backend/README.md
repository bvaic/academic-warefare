# Academic Warfare Chess - Backend

## 🎯 Project Overview

**Academic Warfare Chess** is a 24-hour hackathon project that transforms university syllabi into an educational trivia battle game. The TypeScript Node.js backend ingests syllabi via the Nebula API, generates trivia questions using the Gemini API, and stores them in MongoDB.

---

## 🏗️ Architecture Summary

### Tech Stack
- **Language**: TypeScript with ES Modules (NodeNext)
- **Runtime**: Node.js
- **Database**: MongoDB (running in Docker at `172.30.241.83:27017`)
- **AI**: Google Gemini API (`gemini-1.5-flash`) via `@google/generative-ai`
- **External APIs**: UTD Nebula API (for syllabus retrieval)

### Project Structure
```
backend/
├── src/
│   ├── db/
│   │   ├── connection.ts       # MongoDB connection utilities
│   │   └── models.ts           # Mongoose schemas (User, Course, Professor, UserNote, Question)
│   ├── scripts/
│   │   └── seed.ts             # Smart seeder with upsert logic
│   ├── services/
│   │   ├── ingestionService.ts # Nebula API → PDF download → Gemini upload
│   │   └── aiService.ts        # Gemini question generation & DB storage
│   ├── nebula.ts               # Nebula API client (getSyllabusUri)
│   └── server.ts               # Express server with MongoDB/Redis/Ollama
├── .env                        # Environment variables
├── package.json
└── tsconfig.json               # TypeScript config (NodeNext)
```

---

## 📊 Data Models (Mongoose Schemas)

### 1. **Professor**
```typescript
{
  _id: string                    // e.g., "prof_owens"
  first_name: string
  last_name: string
  course_prefix: string          // e.g., "ITSS"
  course_number: string          // e.g., "4330"
  syllabus_source_url: string | null     // PDF URL from Nebula
  syllabus_gemini_uri: string | null     // Gemini File API URI
  user_note_id: string[]         // References to UserNote
}
```

### 2. **Course**
```typescript
{
  _id: string                    // e.g., "ITSS4330"
  name: string
  leaderboard: any[]
  prof_id: string                // References Professor
}
```

### 3. **Question**
```typescript
{
  _id: string                    // UUID
  prof_id: string                // References Professor
  difficulty: "Easy" | "Medium" | "Hard"
  question_text: string
  options: string[]              // Exactly 4 options
  correct_answer: string         // Must match one option
  explanation: string
}
```

### 4. **User**
```typescript
{
  _id: string
  name: string
  pwd: string
  course_list: string[]          // Array of Course IDs
}
```

### 5. **UserNote**
```typescript
{
  _id: string
  content: string
}
```

---

## 🔄 Implementation Pipeline

### **Step 1: Database Setup** ✓
- `src/db/connection.ts`: Connection utilities (`connectDB()`, `disconnectDB()`)
- `src/db/models.ts`: All 5 Mongoose models with TypeScript interfaces
- `src/scripts/seed.ts`: Smart seeder using `findOneAndUpdate` with `{ upsert: true }`

**Run the seeder:**
```bash
npx tsx src/scripts/seed.ts
```

---

### **Step 2: Syllabus Ingestion** ✓
**File**: `src/services/ingestionService.ts`

**Function**: `ingestSyllabus(profId: string)`

**Flow**:
1. Query `Professor` by `prof_id`
2. Check if `syllabus_gemini_uri` exists → abort if already processed
3. Call `getSyllabusUri()` from `nebula.ts` using professor's details
4. Update `Professor.syllabus_source_url` with the returned URL
5. Download PDF to `./tmp/{profId}_syllabus.pdf` using streaming pipeline
6. Return local file path

**Key Dependencies**:
- `nebula.ts`: Existing function that queries Nebula API
- Node.js `fs/promises` and `stream/promises` for efficient downloads

---

### **Step 3: Gemini File Upload** ✓
**File**: `src/services/ingestionService.ts` (extended)

**Function**: `uploadToGemini(filePath: string, profId: string)`

**Flow**:
1. Use `GoogleAIFileManager` from `@google/generative-ai/server`
2. Upload the PDF with `mimeType: 'application/pdf'`
3. Retrieve the `fileUri` from the upload result
4. Update `Professor.syllabus_gemini_uri` in MongoDB
5. Delete the temporary PDF file using `fs/promises.unlink()`

**Environment**:
- API Key: `AIzaSyAEGO4pfcyesf8_Ee2j4ib9X4T0juPi2E4` (hardcoded fallback)
- Also reads from `process.env.GEMINI_API_KEY`

---

### **Step 4: AI Question Generation** ✓
**File**: `src/services/aiService.ts`

**Function**: `generateQuestions(syllabusGeminiUri: string, profId: string)`

**Flow**:
1. Initialize `GoogleGenerativeAI` with `gemini-1.5-flash` model
2. Send the Gemini file URI with a **strict prompt**:
   - Generate exactly 30 questions (10 Easy, 10 Medium, 10 Hard)
   - Return **raw JSON only** (no markdown blocks)
   - Structure: `{ questions: [{ difficulty, question_text, options, correct_answer, explanation }] }`
3. Parse the JSON response
4. Map over questions and attach `prof_id` + UUID `_id`
5. Bulk insert using `Question.insertMany()`

**Error Handling**:
- JSON parse errors are caught and logged
- Validates the presence of `questions` array

---

## 🚀 Usage Example

```typescript
import { connectDB, disconnectDB } from './db/connection.js';
import { ingestSyllabus } from './services/ingestionService.js';
import { generateQuestions } from './services/aiService.js';
import { Professor } from './db/models.js';

async function processProf(profId: string) {
  await connectDB();

  // Step 1: Ingest syllabus (download + upload to Gemini)
  const geminiUri = await ingestSyllabus(profId);

  if (!geminiUri) {
    console.log('Already processed or failed');
    await disconnectDB();
    return;
  }

  // Step 2: Generate questions
  await generateQuestions(geminiUri, profId);

  await disconnectDB();
  console.log('✅ Complete pipeline finished!');
}

processProf('prof_owens');
```

---

## ⚠️ Possible Hiccups & Known Issues

### 1. **Mongoose Deprecation Warning**
```
Warning: the `new` option for `findOneAndUpdate()` is deprecated.
Use `returnDocument: 'after'` instead.
```
**Fix**: Update `seed.ts` to use `returnDocument: 'after'` instead of `new: true`:
```typescript
await Professor.findOneAndUpdate(
  { _id: 'prof_owens' },
  { /* ... */ },
  { upsert: true, returnDocument: 'after' }
);
```

### 2. **Gemini API Rate Limits**
- Free tier has rate limits (15 requests/min, 1500/day)
- Uploading large PDFs may hit file size limits (20MB max for free tier)
- **Mitigation**: Add retry logic or check file size before upload

### 3. **Nebula API Dependency**
- `getSyllabusUri()` assumes the professor exists in Nebula's database
- If no syllabus found, it returns `undefined` → will throw an error in `ingestSyllabus()`
- **Mitigation**: Add null checks and better error messages

### 4. **PDF Download Failures**
- Nebula might return a URL that's expired or inaccessible
- Network errors during streaming could leave partial files
- **Mitigation**: Add timeout handling and validate downloaded file size

### 5. **Gemini JSON Parsing**
- The AI might occasionally return markdown-wrapped JSON despite strict prompts
- **Mitigation**: Strip markdown code fences before parsing:
  ```typescript
  const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
  const parsedResponse = JSON.parse(cleanText);
  ```

### 6. **Environment Variables**
- `.env` file is not tracked in git (good!)
- Missing `NEBULA_API_KEY` or `GEMINI_API_KEY` will cause runtime errors
- **Required vars**: Add to `.env`:
  ```
  NEBULA_API_KEY=your_nebula_key
  GEMINI_API_KEY=AIzaSyAEGO4pfcyesf8_Ee2j4ib9X4T0juPi2E4
  ```

### 7. **Database Connection in `server.ts`**
- Currently uses legacy `mongoose.connect()` with `MONGO_URI` from `.env`
- New modules use `connectDB()` from `connection.ts` with hardcoded URI
- **Fix**: Unify to use the same connection module everywhere

### 8. **TypeScript `.js` Import Extensions**
- All imports must use `.js` extensions (e.g., `'../db/models.js'`)
- This is required by NodeNext module resolution
- Missing extensions will cause runtime errors

---

## 🔗 Frontend Integration Plan

### Current Backend Endpoints
The existing `server.ts` only has a health check endpoint (`GET /`). You'll need to add:

### **Recommended API Endpoints**

#### 1. **Syllabus Ingestion**
```typescript
POST /api/professor/:profId/ingest
```
**Purpose**: Trigger the full ingestion pipeline for a professor
**Flow**: `ingestSyllabus()` → `generateQuestions()`
**Response**: `{ success: true, questionsGenerated: 30 }`

#### 2. **Get Questions**
```typescript
GET /api/professor/:profId/questions?difficulty=Easy
```
**Purpose**: Fetch questions for trivia gameplay
**Query Params**: `difficulty`, `limit`, `offset`
**Response**: Array of `Question` objects

#### 3. **Get Professor Details**
```typescript
GET /api/professor/:profId
```
**Purpose**: Fetch professor info (name, course, syllabus status)
**Response**: `Professor` object

#### 4. **List Courses**
```typescript
GET /api/courses
```
**Purpose**: Get all available courses for game selection
**Response**: Array of `Course` objects with populated `prof_id`

#### 5. **Submit Answer / Track Score**
```typescript
POST /api/game/answer
Body: { userId, questionId, answer }
```
**Purpose**: Validate answer, update leaderboard
**Response**: `{ correct: boolean, explanation: string, score: number }`

### **Frontend Implementation Notes**

#### State Management
- Use **React Context** or **Redux** to manage:
  - Current game session (selected course, difficulty, score)
  - User authentication state
  - Question queue for trivia rounds

#### Key UI Components Needed
1. **Course Selection Screen**
   - Fetch from `GET /api/courses`
   - Display course cards with professor names

2. **Difficulty Selector**
   - Buttons for Easy/Medium/Hard
   - Affects `GET /api/professor/:profId/questions` query

3. **Question Display**
   - Show `question_text` and 4 `options`
   - Submit answer → call `POST /api/game/answer`
   - Display `explanation` after submission

4. **Leaderboard**
   - Fetch from `Course.leaderboard` array
   - Real-time updates via **Socket.io** (already installed in backend!)

5. **Admin Panel** (Optional)
   - Trigger ingestion: `POST /api/professor/:profId/ingest`
   - View processing status

#### WebSocket Integration (Socket.io)
- Backend already has `socket.io` installed
- Use for:
  - Real-time leaderboard updates
  - Multiplayer trivia battles (future feature)
  - Live game session synchronization

#### Authentication Flow
- Use `User` model with `pwd` field
- Implement JWT tokens or session-based auth
- Endpoints: `POST /api/auth/login`, `POST /api/auth/register`

#### Recommended Libraries
- **Axios** or **Fetch API** for HTTP requests
- **React Router** for navigation (courses → game → leaderboard)
- **Socket.io-client** for real-time features
- **TailwindCSS** or **Material-UI** for styling

#### Data Flow Example
```
[Frontend] User selects "ITSS4330" → GET /api/courses
           ↓
[Backend]  Returns Course with prof_id = "prof_owens"
           ↓
[Frontend] User clicks "Easy Mode"
           ↓
[Frontend] GET /api/professor/prof_owens/questions?difficulty=Easy&limit=10
           ↓
[Backend]  Returns 10 Easy questions
           ↓
[Frontend] Display questions one-by-one
           ↓
[Frontend] User answers → POST /api/game/answer
           ↓
[Backend]  Validates, updates score, returns explanation
           ↓
[Frontend] Show feedback, move to next question
```

---

## 📦 Package Dependencies

All required packages are already installed in `package.json`:

### Runtime
- `@google/generative-ai`: Gemini API client + File Manager
- `mongoose`: MongoDB ODM with TypeScript support
- `express`: HTTP server
- `cors`: Cross-origin resource sharing
- `dotenv`: Environment variable management
- `socket.io`: Real-time WebSocket support

### Development
- `typescript`: TypeScript compiler
- `tsx`: TypeScript execution for Node.js
- `@types/node`, `@types/express`, `@types/cors`: Type definitions

---

## 🧪 Testing Checklist

- [x] Seeder creates Professor and Course
- [ ] `ingestSyllabus()` downloads PDF successfully
- [ ] PDF uploads to Gemini and returns URI
- [ ] `generateQuestions()` creates 30 questions in DB
- [ ] Questions have correct structure (4 options, valid difficulty)
- [ ] API endpoints return proper JSON responses
- [ ] Frontend can fetch and display questions

---

## 🎮 Next Steps

1. **Create API routes** in `server.ts` (use Express Router for organization)
2. **Add authentication** using JWT or sessions
3. **Implement game logic** (score tracking, time limits, streaks)
4. **Build frontend components** (question display, leaderboard, course selection)
5. **Connect Socket.io** for real-time multiplayer features
6. **Deploy** (containerize with Docker, deploy to cloud)

---

## 📝 Notes

- This was built in a **hackathon environment** → code is functional but may need refactoring for production
- **Security**: Passwords in `User` model should be hashed (use `bcrypt`)
- **Validation**: Add Zod schemas for API request validation (already installed)
- **Error Handling**: Add global Express error middleware
- **Logging**: Consider adding Winston or Pino for structured logs

---

## 🙏 Credits

- **Nebula API**: UTD's course data API
- **Gemini API**: Google's generative AI platform
- Built during **24-hour hackathon** using strict TypeScript and modular architecture

---

**Happy hacking! 🚀**
