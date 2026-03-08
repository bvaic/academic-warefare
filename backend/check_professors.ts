import mongoose from 'mongoose';
import { Professor, Question } from './src/db/models.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkStatus() {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('Connected to MongoDB');

    const professors = await Professor.find({});
    console.log(`Found ${professors.length} professors`);

    for (const prof of professors) {
        const questionCount = await Question.countDocuments({ prof_id: prof._id });
        console.log(`- ${prof.first_name} ${prof.last_name} (${prof._id}):`);
        console.log(`  Syllabus URL: ${prof.syllabus_source_url}`);
        console.log(`  Gemini URI: ${prof.syllabus_gemini_uri}`);
        console.log(`  Questions: ${questionCount}`);
    }

    await mongoose.disconnect();
}

checkStatus().catch(console.error);
