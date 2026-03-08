import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

async function testModel() {
    console.log('Testing gemini-3-flash-preview with text only...');
    try {
        const result = await model.generateContent('Hi, who are you?');
        console.log('Response:', result.response.text());
        console.log('Success!');
    } catch (error) {
        console.error('Error:', error);
    }
}

testModel().catch(console.error);
