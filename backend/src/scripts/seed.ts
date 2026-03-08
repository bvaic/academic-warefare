import { connectDB, disconnectDB } from '../db/connection.js';
import { Professor, Course } from '../db/models.js';

async function seed() {
  try {
    await connectDB();
    console.log('🌱 Starting seed...\n');

    // Professor 1: Dawn Owens
    const professor1 = await Professor.findOneAndUpdate(
      { _id: 'prof_owens' },
      {
        _id: 'prof_owens',
        first_name: 'Dawn',
        last_name: 'Owens',
        course_prefix: 'ITSS',
        course_number: '4330',
        syllabus_source_url: null,
        syllabus_gemini_uri: null,
        user_note_id: []
      },
      { upsert: true, new: true }
    );
    console.log('✓ Professor seeded:', professor1._id);

    // Course 1: ITSS 4330
    const course1 = await Course.findOneAndUpdate(
      { _id: 'ITSS 4330' },
      {
        _id: 'ITSS 4330',
        name: 'Systems Analysis and Design',
        course_name: 'ITSS 4330',
        leaderboard: [],
        prof_id: 'prof_owens'
      },
      { upsert: true, new: true }
    );
    console.log('✓ Course seeded:', course1._id);

    // Professor 2: John Smith
    const professor2 = await Professor.findOneAndUpdate(
      { _id: 'prof_smith' },
      {
        _id: 'prof_smith',
        first_name: 'John',
        last_name: 'Smith',
        course_prefix: 'CS',
        course_number: '1337',
        syllabus_source_url: null,
        syllabus_gemini_uri: null,
        user_note_id: []
      },
      { upsert: true, new: true }
    );
    console.log('✓ Professor seeded:', professor2._id);

    // Course 2: CS 1337
    const course2 = await Course.findOneAndUpdate(
      { _id: 'CS 1337' },
      {
        _id: 'CS 1337',
        name: 'Computer Science I',
        course_name: 'CS 1337',
        leaderboard: [],
        prof_id: 'prof_smith'
      },
      { upsert: true, new: true }
    );
    console.log('✓ Course seeded:', course2._id);

    // Professor 3: Jane Doe
    const professor3 = await Professor.findOneAndUpdate(
      { _id: 'prof_doe' },
      {
        _id: 'prof_doe',
        first_name: 'Jane',
        last_name: 'Doe',
        course_prefix: 'MATH',
        course_number: '2413',
        syllabus_source_url: null,
        syllabus_gemini_uri: null,
        user_note_id: []
      },
      { upsert: true, new: true }
    );
    console.log('✓ Professor seeded:', professor3._id);

    // Course 3: MATH 2413
    const course3 = await Course.findOneAndUpdate(
      { _id: 'MATH 2413' },
      {
        _id: 'MATH 2413',
        name: 'Calculus I',
        course_name: 'MATH 2413',
        leaderboard: [],
        prof_id: 'prof_doe'
      },
      { upsert: true, new: true }
    );
    console.log('✓ Course seeded:', course3._id);

    console.log('\n🎉 Seed completed successfully!');
  } catch (error) {
    console.error('✗ Seed failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

seed();
