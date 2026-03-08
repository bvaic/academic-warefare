# Academic Warfare

An online platform where users can join courses alongside their peers to compete in trivia battles to advance on the course leaderboard. The system ingests university syllabi and generates AI-powered trivia questions using Google Gemini.

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB
- **Cache**: Redis
- **AI**: Google Gemini API (with web search grounding)
- **Real-time**: Socket.io
- **External APIs**: UTD Nebula API

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript/JSX

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB instance (or Docker container)
- Redis instance (or Docker container)
- Google Gemini API key
- UTD Nebula API key

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd academic-warefare

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## 🔧 Backend Setup

### 1. Environment Configuration

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cp .env.example .env  # If example exists, otherwise create manually
```

Required environment variables:

```env
# Server Configuration
PORT=3001

# Database Connection
MONGO_URI=mongodb://user:password@host:port/database?authSource=admin

# Redis Cache
REDIS_URL=redis://host:port

# Ollama (Optional)
OLLAMA_HOST=http://host:port

# API Keys
NEBULA_API_KEY=your_nebula_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Database Seeding

Populate the database with initial data:

```bash
cd backend
npx tsx src/scripts/seed.ts
```

This creates:
- Sample professors
- Sample courses
- Database schema

### 3. Start Backend Server

**Development mode (with hot reload):**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
npm start
```

The server will start on `http://localhost:3001` (or your configured PORT).

### 4. Verify Backend

Visit `http://localhost:3001/` - you should see:

```json
{
  "message": "Academic Warfare API is online!",
  "databaseStatus": {
    "mongo": "connected",
    "redis": "connected",
    "ollamaTarget": "http://..."
  }
}
```

## ⚛️ Frontend Setup

### 1. Configure API Endpoint

Create a configuration file or update your Vite config to point to the backend:

**Option A: Environment Variables**

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
```

**Option B: Vite Proxy (Recommended for Development)**

Update `frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
```

### 2. Install Additional Dependencies (Recommended)

```bash
cd frontend
npm install axios react-router-dom socket.io-client
```

For styling (optional):
```bash
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. Start Frontend Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (Vite default).

### 4. Basic Frontend Integration Example

**src/api/client.ts:**
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default apiClient;
```

**Example component to fetch courses:**
```tsx
import { useEffect, useState } from 'react';
import apiClient from './api/client';

interface Course {
  _id: string;
  name: string;
  prof_id: string;
}

export function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    apiClient.get('/courses')
      .then(res => setCourses(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>Available Courses</h1>
      <ul>
        {courses.map(course => (
          <li key={course._id}>{course.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 📁 Project Structure

```
academic-warefare/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── connection.ts      # MongoDB connection
│   │   │   └── models.ts          # Mongoose schemas
│   │   ├── scripts/
│   │   │   ├── seed.ts            # Database seeder
│   │   │   └── testPipeline.ts    # Testing utilities
│   │   ├── services/
│   │   │   ├── aiService.ts       # Gemini AI integration
│   │   │   └── ingestionService.ts # Syllabus processing
│   │   ├── server.ts              # Express app entry point
│   │   └── nebula.ts              # Nebula API client
│   ├── tmp/                       # Temporary file storage
│   ├── .env                       # Environment variables
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.tsx                # Main app component
│   │   └── main.tsx               # React entry point
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 📡 API Documentation

### Current Endpoints

**Health Check**
```
GET /
Returns server status and database connections
```

### Recommended Endpoints to Implement

**Courses**
```
GET /api/courses              # List all courses
GET /api/courses/:id          # Get course details
```

**Professors**
```
GET /api/professors/:id       # Get professor info
POST /api/professors/:id/ingest  # Trigger syllabus ingestion
```

**Questions**
```
GET /api/questions?prof_id=&difficulty=  # Get questions
GET /api/questions/:id                    # Get single question
```

**Game**
```
POST /api/game/answer         # Submit answer
Body: { userId, questionId, answer }
```

**Authentication** (To be implemented)
```
POST /api/auth/register       # Create account
POST /api/auth/login          # Login
GET /api/auth/me              # Get current user
```

## 🧪 Testing

**Backend tests:**
```bash
cd backend
npm test  # When tests are added
```

**Run the complete ingestion pipeline:**
```bash
cd backend
npx tsx src/scripts/testPipeline.ts
```

## 🐛 Troubleshooting

**Backend won't start:**
- Check `.env` file exists with all required variables
- Verify MongoDB and Redis are running and accessible
- Check port 3001 isn't already in use

**Frontend can't connect to backend:**
- Ensure backend is running on http://localhost:3001
- Check CORS is enabled (already configured in server.ts)
- Verify proxy settings in vite.config.ts

**Database connection errors:**
- Confirm MongoDB URI is correct
- Check network connectivity to database host
- Verify authentication credentials

**Gemini API errors:**
- Validate GEMINI_API_KEY is correct
- Check API rate limits (free tier: 15 req/min)
- Ensure file size < 20MB for PDF uploads

## 📚 Additional Documentation

For detailed backend architecture and implementation details, see:
- [Backend README](./backend/README.md)
- [Test Plan](./backend/TEST_PLAN.md)
- [Test Results](./backend/TEST_RESULTS.md)

## 🤝 Contributing

This project was built during a 24-hour hackathon. Contributions are welcome!

## 📄 License

See [LICENSE](./LICENSE) file for details.
