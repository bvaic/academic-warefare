import { GoogleAIFileManager } from '@google/generative-ai/server';
import dotenv from 'dotenv';
dotenv.config();

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

async function listFiles() {
    const listResult = await fileManager.listFiles();
    console.log('Files in Gemini:');
    for (const file of listResult.files) {
        console.log(`- ${file.displayName} (${file.name}): ${file.state} ${file.uri}`);
    }
}

listFiles().catch(console.error);
