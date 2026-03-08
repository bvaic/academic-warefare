# Academic Warfare Backend - Test Plan

## 🎯 Test Objectives

Validate the complete end-to-end pipeline from database seeding → Nebula API → PDF download → Gemini upload → AI question generation → database storage.

---

## 📋 Test Strategy

### Testing Approach: **End-to-End Integration Testing**
- **Why**: This is a hackathon project with tightly coupled services (Nebula API, Gemini API, MongoDB)
- **Focus**: Validate the complete data flow rather than isolated unit tests
- **Environment**: Uses real external APIs and database (not mocked)

---

## 🧪 Test Checklist

### Phase 1: Database & Seed Validation ✓
**Goal**: Ensure MongoDB connection and initial data seeding works

- [x] MongoDB connection establishes successfully
- [x] Professor `prof_owens` exists in database
- [x] Course `ITSS4330` exists and references `prof_owens`
- [x] Seeder is idempotent (can run multiple times without errors)

**Command**:
```bash
npx tsx src/scripts/seed.ts
```

**Expected Output**:
```
✓ Connected to MongoDB
🌱 Starting seed...
✓ Professor seeded: prof_owens
✓ Course seeded: ITSS4330
🎉 Seed completed successfully!
✓ Disconnected from MongoDB
```

**Validation**:
```bash
# Connect to MongoDB and verify
mongosh "mongodb://comet_user:pAsSw0rDDB69420!@172.30.241.83:27017/comet_db?authSource=admin"
> db.professors.findOne({ _id: "prof_owens" })
> db.courses.findOne({ _id: "ITSS4330" })
```

---

### Phase 2: Nebula API Integration
**Goal**: Verify Nebula API returns valid syllabus URL

**Test Cases**:
1. ✅ Valid professor → Returns syllabus URL
2. ⚠️ Invalid professor → Returns `undefined` (should handle gracefully)
3. ⚠️ Network error → Throws error with clear message

**Manual Test** (standalone):
```bash
npx tsx -e "
import { getSyllabusUri } from './src/nebula.js';
const url = await getSyllabusUri('ITSS', '4330', 'Dawn', 'Owens');
console.log('Syllabus URL:', url);
process.exit(0);
"
```

**Expected Output**:
```
Syllabus URL: https://...
```

**Success Criteria**:
- Returns a valid HTTPS URL
- URL points to a PDF file
- No errors thrown

**Known Issues**:
- Nebula API requires valid `NEBULA_API_KEY` in `.env`
- May return `undefined` if professor/course not found
- Syllabus URL might be expired or inaccessible

---

### Phase 3: PDF Download
**Goal**: Download PDF from Nebula URL to `./tmp`

**Test Cases**:
1. ✅ Valid URL → PDF downloaded successfully
2. ⚠️ Invalid URL → Throws error
3. ⚠️ Network timeout → Throws timeout error
4. ✅ Creates `./tmp` directory if missing

**Validation**:
- Check file exists: `ls -lh tmp/prof_owens_syllabus.pdf`
- Verify file size > 0 bytes
- File is a valid PDF (opens without errors)

**Success Criteria**:
- File created in `tmp/` directory
- File size > 10KB (reasonable PDF size)
- No truncated/corrupted files

---

### Phase 4: Gemini File Upload
**Goal**: Upload PDF to Gemini File API and retrieve URI

**Test Cases**:
1. ✅ Valid PDF → Returns Gemini URI (format: `https://generativelanguage.googleapis.com/v1beta/files/...`)
2. ⚠️ Invalid file → Throws error
3. ⚠️ Rate limit exceeded → Throws clear error
4. ⚠️ File too large (>20MB) → Throws error

**Environment Requirements**:
- Valid `GEMINI_API_KEY` in `.env`
- PDF file exists in `./tmp`

**Validation**:
- Gemini URI starts with `https://generativelanguage.googleapis.com`
- `Professor.syllabus_gemini_uri` updated in database
- Temporary PDF file cleaned up after upload

**Success Criteria**:
- Professor document updated with `syllabus_gemini_uri`
- Temporary file deleted from `./tmp`
- No API errors

---

### Phase 5: AI Question Generation
**Goal**: Generate 30 questions using Gemini and save to MongoDB

**Test Cases**:
1. ✅ Valid syllabus URI → Returns 30 questions
2. ⚠️ AI returns markdown JSON → Strip and parse correctly
3. ⚠️ AI returns malformed JSON → Throw clear error
4. ⚠️ Questions missing required fields → Validation error

**Validation Checks**:
- Exactly 30 questions generated
- Questions distributed: 10 Easy, 10 Medium, 10 Hard
- Each question has:
  - Valid `_id` (UUID format)
  - `prof_id` = "prof_owens"
  - 4 options in `options` array
  - `correct_answer` matches one of the options
  - Non-empty `explanation`

**Database Query**:
```bash
mongosh "mongodb://..."
> db.questions.countDocuments({ prof_id: "prof_owens" })  // Should be 30
> db.questions.aggregate([
    { $match: { prof_id: "prof_owens" } },
    { $group: { _id: "$difficulty", count: { $sum: 1 } } }
  ])
```

**Expected Output**:
```json
[
  { "_id": "Easy", "count": 10 },
  { "_id": "Medium", "count": 10 },
  { "_id": "Hard", "count": 10 }
]
```

**Success Criteria**:
- All 30 questions saved to database
- Difficulty distribution is correct
- All questions are valid and complete
- `prof_id` correctly references `prof_owens`

---

### Phase 6: End-to-End Pipeline Test
**Goal**: Run the complete pipeline from start to finish

**Test Flow**:
```
Seed DB → Ingest Syllabus → Generate Questions → Verify Database
```

**Test Script**: `src/scripts/testPipeline.ts` (to be created)

**Success Criteria**:
1. ✅ Database seeded successfully
2. ✅ Professor record exists with null `syllabus_gemini_uri` initially
3. ✅ Syllabus URL fetched from Nebula
4. ✅ PDF downloaded to `./tmp`
5. ✅ PDF uploaded to Gemini
6. ✅ `Professor.syllabus_gemini_uri` updated
7. ✅ Temporary PDF cleaned up
8. ✅ 30 questions generated and saved
9. ✅ All questions have valid structure
10. ✅ No errors or warnings (except expected Mongoose deprecation)

---

## 🚨 Error Scenarios to Test

### 1. **Missing Environment Variables**
```bash
# Test without NEBULA_API_KEY
unset NEBULA_API_KEY
npx tsx src/scripts/testPipeline.ts
```
**Expected**: Clear error message about missing API key

### 2. **Invalid Professor ID**
```typescript
await ingestSyllabus('prof_invalid');
```
**Expected**: `Error: Professor with ID prof_invalid not found`

### 3. **Already Processed Professor**
```typescript
// Run twice
await ingestSyllabus('prof_owens');
await ingestSyllabus('prof_owens');
```
**Expected**: Second run should skip and log "Syllabus already processed"

### 4. **Network Failures**
- Disconnect VPN and run test
**Expected**: Clear timeout/connection errors

### 5. **Gemini Rate Limit**
- Run pipeline 20+ times rapidly
**Expected**: `429 Too Many Requests` error with clear message

---

## 📊 Test Metrics

### Coverage Goals
- **Database Operations**: 100% (all models CRUD tested)
- **API Integrations**: 100% (Nebula + Gemini)
- **File Operations**: 100% (download, upload, cleanup)
- **Error Handling**: 80% (critical error paths)

### Performance Benchmarks
- **Seed**: < 2 seconds
- **Syllabus Ingestion**: < 30 seconds
- **Question Generation**: < 60 seconds (depends on Gemini API)
- **Total Pipeline**: < 90 seconds

---

## 🔍 Validation Queries

### Check All Data After Test
```bash
mongosh "mongodb://comet_user:pAsSw0rDDB69420!@172.30.241.83:27017/comet_db?authSource=admin"

# Check Professor
> db.professors.findOne({ _id: "prof_owens" })

# Should show:
# - syllabus_source_url: "https://..." (Nebula URL)
# - syllabus_gemini_uri: "https://generativelanguage.googleapis.com/..." (Gemini URI)

# Check Questions
> db.questions.countDocuments({ prof_id: "prof_owens" })  // Should be 30

# Check difficulty distribution
> db.questions.aggregate([
    { $match: { prof_id: "prof_owens" } },
    { $group: { _id: "$difficulty", count: { $sum: 1 } } }
  ])

# Sample a random question
> db.questions.findOne({ prof_id: "prof_owens", difficulty: "Medium" })

# Verify question structure
> db.questions.findOne({ prof_id: "prof_owens" }, {
    _id: 1,
    difficulty: 1,
    question_text: 1,
    options: 1,
    correct_answer: 1,
    explanation: 1
  })
```

---

## 🛠️ Test Execution Plan

### Step 1: Clean Environment
```bash
# Clear previous test data
mongosh "mongodb://..." --eval "
  db.questions.deleteMany({ prof_id: 'prof_owens' });
  db.professors.updateOne(
    { _id: 'prof_owens' },
    { \$set: { syllabus_source_url: null, syllabus_gemini_uri: null } }
  );
"

# Clear tmp directory
rm -rf backend/tmp/*
```

### Step 2: Run Seed
```bash
cd backend
npx tsx src/scripts/seed.ts
```

### Step 3: Run End-to-End Test
```bash
npx tsx src/scripts/testPipeline.ts
```

### Step 4: Validate Results
```bash
# Check database
mongosh "mongodb://..." < validation_queries.js

# Check file cleanup
ls -la tmp/  # Should be empty after test

# Review logs for errors
grep -i "error\|fail" test_output.log
```

---

## ✅ Success Criteria Summary

### Must Pass:
- [x] All 4 phases complete without errors
- [x] 30 questions in database with correct distribution
- [x] Professor has valid `syllabus_gemini_uri`
- [x] Temporary files cleaned up
- [x] No data corruption or partial failures

### Nice to Have:
- [ ] Test completes in < 90 seconds
- [ ] All edge cases handled gracefully
- [ ] Clear error messages for all failure modes
- [ ] Logs are informative and well-formatted

---

## 🐛 Known Issues to Monitor

1. **Mongoose Deprecation Warning**: Use `returnDocument: 'after'` instead of `new: true`
2. **Gemini JSON Parsing**: AI might wrap JSON in markdown (add fallback parsing)
3. **Nebula API Flakiness**: May return expired URLs or rate limit
4. **Network Dependencies**: Requires active VPN connection to database
5. **API Key Rotation**: Hardcoded Gemini key may expire

---

## 📝 Test Execution Checklist

Before running tests:
- [ ] VPN connected to database server
- [ ] `NEBULA_API_KEY` set in `.env`
- [ ] `GEMINI_API_KEY` set in `.env`
- [ ] MongoDB accessible at `172.30.241.83:27017`
- [ ] No running test processes (cleanup complete)

During test:
- [ ] Monitor console output for errors
- [ ] Watch `tmp/` directory for PDF downloads
- [ ] Check database in real-time for updates

After test:
- [ ] Validate all 30 questions exist
- [ ] Verify question quality and correctness
- [ ] Check for orphaned files in `tmp/`
- [ ] Review logs for warnings

---

## 🚀 Next Steps After Testing

1. **If Tests Pass**:
   - Document any warnings or edge cases
   - Create API endpoints in `server.ts`
   - Begin frontend integration

2. **If Tests Fail**:
   - Identify failure point (check logs)
   - Fix root cause
   - Re-run from clean state
   - Update error handling

3. **Improvements**:
   - Add retry logic for network failures
   - Implement timeout handling
   - Add JSON cleanup for markdown-wrapped responses
   - Create health check endpoints
