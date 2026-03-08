import { connectDB, closeDB, getDB } from '../db/connection.js';

const MOCK_SECTION = {
  _id: 'ITSS4330-001',
  course_id: 'ITSS4330',
  prof_name: 'Dawn Owens',
  syllabus_source_url: 'https://dox.utdallas.edu/syl75337',
  syllabus_gemini_uri: null
};

async function seed() {
  try {
    await connectDB();
    const db = getDB();

    // Drop existing collections
    console.log('Dropping existing collections...');
    await db.collection('sections').drop().catch(() => console.log('  - Sections collection does not exist'));
    await db.collection('questions').drop().catch(() => console.log('  - Questions collection does not exist'));

    // Insert mock section
    console.log('Inserting mock section...');
    await db.collection('sections').insertOne(MOCK_SECTION);
    console.log('✓ Mock section inserted:', MOCK_SECTION._id);

    // Verify insertion
    const count = await db.collection('sections').countDocuments();
    console.log(`✓ Total sections in database: ${count}`);

    await closeDB();
    console.log('\n✓ Seeding completed successfully!');
  } catch (error) {
    console.error('✗ Seeding failed:', error.message);
    process.exit(1);
  }
}

seed();
