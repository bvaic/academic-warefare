import { GoogleGenerativeAI, ModelParams } from '@google/generative-ai';

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  // Note: listModels() is not available in @google/generative-ai
  // Use the official model list or check documentation
  console.log('Available Gemini models:');
  console.log('  - gemini-1.5-flash');
  console.log('  - gemini-1.5-pro');
  console.log('  - gemini-3-flash-preview');
  console.log('\nFor the latest models, visit: https://ai.google.dev/models/gemini');
}

listModels();
