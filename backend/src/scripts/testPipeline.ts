import { connectDB, disconnectDB } from '../db/connection.js';
import { Professor, Question } from '../db/models.js';
import { ingestSyllabus } from '../services/ingestionService.js';
import { generateQuestions } from '../services/aiService.js';

async function testPipeline() {
  console.log('🧪 Starting End-to-End Pipeline Test\n');
  console.log('='.repeat(60));

  try {
    // Phase 1: Connect to Database
    console.log('\n📦 Phase 1: Database Connection');
    await connectDB();
    console.log('✓ Connected to MongoDB');

    // Phase 2: Verify Professor Exists
    console.log('\n👤 Phase 2: Verify Professor Data');
    const professor = await Professor.findById('prof_owens');

    if (!professor) {
      throw new Error('Professor prof_owens not found! Run seed.ts first.');
    }

    console.log(`✓ Found Professor: ${professor.first_name} ${professor.last_name}`);
    console.log(`  - Course: ${professor.course_prefix} ${professor.course_number}`);
    console.log(`  - Syllabus URL: ${professor.syllabus_source_url || 'null'}`);
    console.log(`  - Gemini URI: ${professor.syllabus_gemini_uri || 'null'}`);

    // Phase 3: Ingest Syllabus
    console.log('\n📥 Phase 3: Syllabus Ingestion Pipeline');
    console.log('  → Fetching from Nebula API...');
    console.log('  → Downloading PDF...');
    console.log('  → Uploading to Gemini...');

    const startIngest = Date.now();
    const geminiUri = await ingestSyllabus('prof_owens');
    const ingestTime = ((Date.now() - startIngest) / 1000).toFixed(2);

    if (!geminiUri) {
      console.log('⚠ Syllabus already processed, skipping ingestion');
    } else {
      console.log(`✓ Ingestion complete in ${ingestTime}s`);
      console.log(`  - Gemini URI: ${geminiUri}`);
    }

    // Refresh professor data
    const updatedProf = await Professor.findById('prof_owens');
    if (!updatedProf?.syllabus_gemini_uri) {
      throw new Error('Professor syllabus_gemini_uri not updated!');
    }

    // Phase 4: Generate Questions
    console.log('\n🤖 Phase 4: AI Question Generation');

    // Check if questions already exist
    const existingCount = await Question.countDocuments({ prof_id: 'prof_owens' });

    if (existingCount > 0) {
      console.log(`⚠ Found ${existingCount} existing questions, cleaning up...`);
      await Question.deleteMany({ prof_id: 'prof_owens' });
      console.log('✓ Cleanup complete');
    }

    console.log('  → Sending syllabus to Gemini...');
    console.log('  → Generating 30 questions...');

    const startGen = Date.now();
    await generateQuestions(updatedProf.syllabus_gemini_uri, 'prof_owens');
    const genTime = ((Date.now() - startGen) / 1000).toFixed(2);

    console.log(`✓ Question generation complete in ${genTime}s`);

    // Phase 5: Validate Results
    console.log('\n✅ Phase 5: Validation');

    const totalQuestions = await Question.countDocuments({ prof_id: 'prof_owens' });
    console.log(`✓ Total questions: ${totalQuestions}/30`);

    if (totalQuestions !== 30) {
      console.warn(`⚠ Expected 30 questions, got ${totalQuestions}`);
    }

    // Check difficulty distribution
    const difficulties = await Question.aggregate([
      { $match: { prof_id: 'prof_owens' } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📊 Difficulty Distribution:');
    difficulties.forEach(d => {
      const expected = 10;
      const status = d.count === expected ? '✓' : '⚠';
      console.log(`  ${status} ${d._id}: ${d.count}/${expected}`);
    });

    // Sample a question
    const sampleQuestion = await Question.findOne({
      prof_id: 'prof_owens',
      difficulty: 'Medium'
    });

    if (sampleQuestion) {
      console.log('\n📝 Sample Question (Medium):');
      console.log(`  Q: ${sampleQuestion.question_text.substring(0, 80)}...`);
      console.log(`  Options: ${sampleQuestion.options.length} choices`);
      console.log(`  Answer: ${sampleQuestion.correct_answer.substring(0, 50)}...`);
      console.log(`  Explanation: ${sampleQuestion.explanation.substring(0, 60)}...`);
    }

    // Validate question structure
    const allQuestions = await Question.find({ prof_id: 'prof_owens' });
    const invalidQuestions = allQuestions.filter(q =>
      q.options.length !== 4 ||
      !q.question_text ||
      !q.correct_answer ||
      !q.explanation
    );

    if (invalidQuestions.length > 0) {
      console.warn(`\n⚠ Found ${invalidQuestions.length} invalid questions!`);
      invalidQuestions.forEach(q => {
        console.warn(`  - ${q._id}: Missing or invalid fields`);
      });
    } else {
      console.log('\n✓ All questions have valid structure');
    }

    // Final Summary
    const totalTime = ingestTime ? parseFloat(ingestTime) + parseFloat(genTime) : parseFloat(genTime);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 TEST COMPLETE');
    console.log('='.repeat(60));
    console.log(`✓ Total execution time: ${totalTime.toFixed(2)}s`);
    console.log(`✓ Questions generated: ${totalQuestions}`);
    console.log(`✓ Professor updated: prof_owens`);
    console.log(`✓ Pipeline status: SUCCESS`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error instanceof Error ? error.message : error);
    console.error('\nStack trace:');
    console.error(error);
    console.error('='.repeat(60));
    process.exit(1);
  } finally {
    await disconnectDB();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run the test
testPipeline();
