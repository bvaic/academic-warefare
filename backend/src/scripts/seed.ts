import { connectDB, disconnectDB } from '../db/connection.js';
import { Professor, Course } from '../db/models.js';

async function seed() {
  try {
    await connectDB();
    console.log('🌱 Starting seed...\n');

    // Seed Professor
    const professor = await Professor.findOneAndUpdate(
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
    console.log('✓ Professor seeded:', professor._id);

    // Seed Course
    const course = await Course.findOneAndUpdate(
      { _id: 'ITSS4330' },
      {
        _id: 'ITSS4330',
        name: 'Systems Analysis and Design',
        leaderboard: [],
        prof_id: 'prof_owens'
      },
      { upsert: true, new: true }
    );
    console.log('✓ Course seeded:', course._id);

    console.log('\n🎉 Seed completed successfully!');
  } catch (error) {
    console.error('✗ Seed failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

seed();
