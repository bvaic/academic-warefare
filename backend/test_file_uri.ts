import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1beta' });

async function testFile() {
    const fileUri = 'https://generativelanguage.googleapis.com/v1beta/files/bmges50rre5b';
    const cleanFileUri = 'https://generativelanguage.googleapis.com/files/bmges50rre5b';

    console.log('Testing with full v1beta URI...');
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
        console.log('Response (v1beta URI):', (await result.response).text());
    } catch (error) {
        console.error('Error (v1beta URI):', error);
    }

    console.log('Testing with clean URI (no v1beta)...');
    try {
        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: 'application/pdf',
                    fileUri: cleanFileUri
                }
            },
            { text: 'Describe this syllabus.' }
        ]);
        console.log('Response (clean URI):', (await result.response).text());
    } catch (error) {
        console.error('Error (clean URI):', error);
    }
}

testFile().catch(console.error);
