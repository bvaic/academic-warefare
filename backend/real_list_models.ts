import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function listModels() {
    const listResult = await genAI.listModels();
    for (const model of listResult.models) {
        console.log(`- ${model.name}: ${model.supportedGenerationMethods.join(', ')}`);
    }
}

listModels().catch(console.error);
