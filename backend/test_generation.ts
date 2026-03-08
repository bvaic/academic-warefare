import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Professor, Question } from './src/db/models.js';
import { generateQuestions } from './src/services/aiService.js';

async function testGeneration() {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('Connected to MongoDB');

    const profId = 'prof_nanda_kumar';
    const prof = await Professor.findById(profId);
    
    if (!prof || !prof.syllabus_gemini_uri) {
        console.error('Professor or syllabus Gemini URI not found');
        return;
    }

    console.log(`Testing generation for ${prof.first_name} ${prof.last_name}`);
    console.log(`Gemini URI: ${prof.syllabus_gemini_uri}`);

    try {
        await generateQuestions(prof.syllabus_gemini_uri, profId);
        console.log('Success!');
    } catch (error) {
        console.error('Error during generation:', error);
    }

    await mongoose.disconnect();
}

testGeneration().catch(console.error);
