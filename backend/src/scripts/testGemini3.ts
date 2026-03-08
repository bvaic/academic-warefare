import { connectDB, disconnectDB } from '../db/connection.js';
import { Professor, Question } from '../db/models.js';
import { generateQuestions } from '../services/aiService.js';

async function testGemini3() {
  console.log('🧪 Testing Gemini 3 Flash Preview...\n');
  try {
    await connectDB();
    console.log('✓ Connected to MongoDB');

    // Use Julie Stewart as it likely has a syllabus URI from previous steps
    const profId = 'prof_julie_stewart';
    const professor = await Professor.findById(profId);

    if (!professor || !professor.syllabus_gemini_uri) {
      console.error(`❌ Professor ${profId} not found or missing syllabus_gemini_uri!`);
      return;
    }

    console.log(`✓ Testing for: ${professor.first_name} ${professor.last_name}`);
    console.log(`  - Gemini URI: ${professor.syllabus_gemini_uri}`);

    // Cleanup existing questions
    console.log('🗑 Cleaning up existing questions...');
    await Question.deleteMany({ prof_id: profId });

    console.log('🤖 Calling generateQuestions (Gemini 3)...');
    const start = Date.now();
    await generateQuestions(professor.syllabus_gemini_uri, profId);
    const end = Date.now();

    const count = await Question.countDocuments({ prof_id: profId });
    console.log(`\n✅ TEST COMPLETE`);
    console.log(`✓ Generated ${count} questions in ${((end - start) / 1000).toFixed(2)}s`);

    const sample = await Question.findOne({ prof_id: profId });
    if (sample) {
      console.log(`\n📝 Sample Question:`);
      console.log(`  Q: ${sample.question_text}`);
    }

  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  } finally {
    await disconnectDB();
  }
}

testGemini3();
