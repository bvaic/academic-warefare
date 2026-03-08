import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' }); // No apiVersion

async function testFileNoBeta() {
    const fileUri = 'https://generativelanguage.googleapis.com/v1beta/files/bmges50rre5b';

    console.log('Testing gemini-2.5-flash-lite with fileData but no apiVersion...');
    try {
        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: 'application/pdf',
                    fileUri: fileUri
                }
            },
            { text: 'Describe this syllabus.' }
        ]);
        console.log('Response:', (await result.response).text());
    } catch (error) {
        console.error('Error:', error);
    }
}

testFileNoBeta().catch(console.error);
