import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Question } from '../db/models.js';
import { randomUUID } from 'crypto';

// Force explicit API key retrieval
const apiKey = process.env.GEMINI_API_KEY;

// Hard error check - fail fast if key is missing
if (!apiKey) {
  throw new Error('CRITICAL: GEMINI_API_KEY is completely missing inside .env');
}

// Initialize with explicit key
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-3-flash-preview',
  generationConfig: {
    maxOutputTokens: 2048, // Higher limit for 30 questions
    temperature: 0.1, // Low temp for more stable JSON
    responseMimeType: "application/json" // Native JSON mode
  }
}); 

interface GeneratedQuestion {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string; // The Proof: Include the explanation field
}

interface QuestionGenerationResponse {
  questions: GeneratedQuestion[];
}

const QUESTION_GENERATION_PROMPT = `You are an expert educational game designer creating a trivia chess battle for university students. I have attached the syllabus for this specific course.

Task: Analyze the attached syllabus strictly to determine the core ACADEMIC CONCEPTS, theories, and subject matter taught in this course (usually found in the course schedule or topic outline). 

Then, generate exactly 30 multiple-choice questions based on the ACADEMIC MATERIAL that would actually be taught in this class.

CRITICAL CONSTRAINTS: 
1. DO NOT generate questions about administrative details, grading policies, office hours, prerequisites, or late work. 
2. Focus entirely on the academic subject matter. (e.g., if it is a math class, ask math questions based on the topics; if it is ITSS 4330, ask about Systems Analysis and Design concepts).
3. Use your general knowledge and search the web to generate accurate, high-quality, challenging academic questions relevant to the identified course topics.

Break down the questions into:
- 10 Easy Questions: Basic definitions and easily identifiable facts related to the course subject.
- 10 Medium Questions: Application of concepts, formulas, or theories taught in the course.
- 10 Hard Questions: Complex scenarios, deep analytical understanding, or advanced problem-solving related to the subject.

Output Constraints:
Return ONLY a raw JSON object. Do not use markdown blocks (\`\`\`json). Structure:
{
  "questions": [
    {
      "difficulty": "Easy", // or Medium/Hard
      "question_text": "...",
      "options": ["A", "B", "C", "D"], // Exactly 4
      "correct_answer": "...", // Must exactly match one option
      "explanation": "..."
    }
  ]
}`;

async function generateWithRetry(syllabusGeminiUri: string, prompt: string, retries = 5): Promise<string> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🤖 Gemini Attempt ${i + 1}/${retries} using gemini-3-flash-preview...`);
      const result = await model.generateContent([
        {
          fileData: {
            mimeType: 'application/pdf',
            fileUri: syllabusGeminiUri
          }
        },
        { text: prompt }
      ]);
      const response = await result.response;
      return response.text() || '';
    } catch (error: any) {
      lastError = error;
      const status = error.status || (error.response && error.response.status);
      console.error(`❌ Gemini Error (Attempt ${i + 1}):`, error.message || error);
      
      // If it's a 404, maybe we need gemini-1.5-flash as a fallback if it was something else, 
      // but here we are already using gemini-1.5-flash.
      // The requirement mentions gemini 3 should not get stuck.
      if (status === 404 && i === 0) {
        console.log("404 Error - falling back to gemini-1.5-flash explicitly...");
        const fallbackModel = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        });
        try {
          const result = await fallbackModel.generateContent([
            {
              fileData: {
                mimeType: 'application/pdf',
                fileUri: syllabusGeminiUri
              }
            },
            { text: prompt }
          ]);
          const response = await result.response;
          return response.text() || '';
        } catch (innerError: any) {
            console.error("❌ Fallback Gemini Error:", innerError.message || innerError);
            // continue with the original retry loop
        }
      }

      // If it's 429 (Rate Limit) or 503 (Overloaded), wait longer
      if (status === 429 || status === 503) {
        const delay = Math.pow(2, i) * 5000 + Math.random() * 1000;
        console.log(`⏳ Rate limited or overloaded. Waiting ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
  throw lastError;
}

export async function generateQuestions(syllabusGeminiUri: string, profId: string): Promise<void> {
  // Check if questions already exist
  const existingCount = await Question.countDocuments({ prof_id: profId });
  if (existingCount >= 30) {
    console.log(`✓ Already have ${existingCount} questions for ${profId}`);
    return;
  }

  console.log(`🤖 Generating questions for ${profId}...`);

  const text = await generateWithRetry(syllabusGeminiUri, QUESTION_GENERATION_PROMPT);

  console.log(`✓ Received response from Gemini`);

  // Parse JSON response (strip markdown if present)
  let parsedResponse: QuestionGenerationResponse;
  try {
    // Clean potential markdown wrapper
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    parsedResponse = JSON.parse(cleanText) as QuestionGenerationResponse;
  } catch (error) {
    console.error('Failed to parse JSON response:', text);
    throw new Error('Invalid JSON response from Gemini', { cause: error });
  }

  if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
    throw new Error('Response does not contain questions array');
  }

  console.log(`✓ Parsed ${parsedResponse.questions.length} questions`);

  // Map questions and attach prof_id
  const questionsToInsert = parsedResponse.questions.map((q) => ({
    _id: randomUUID(),
    prof_id: profId,
    difficulty: q.difficulty,
    question_text: q.question_text,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation
  }));

  // Insert into database
  await Question.insertMany(questionsToInsert);

  console.log(`✓ Inserted ${questionsToInsert.length} questions into database`);
}
