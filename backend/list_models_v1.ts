import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModelsV1() {
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

listModelsV1().catch(console.error);
