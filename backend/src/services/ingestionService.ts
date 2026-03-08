import { Professor } from '../db/models.js';
import { getSyllabusUri } from '../nebula.js';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { createWriteStream } from 'fs';
import { mkdir, unlink } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import path from 'path';



const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is missing from environment variables');
}

const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);

export async function ingestSyllabus(profId: string): Promise<string | null> {
  // Query the Professor model
  const professor = await Professor.findById(profId);

  if (!professor) {
    throw new Error(`Professor with ID ${profId} not found`);
  }

  // Check if syllabus already processed
  if (professor.syllabus_gemini_uri) {
    console.log(`⚠ Syllabus already processed for ${profId}`);
    return null;
  }

  console.log(`📥 Ingesting syllabus for ${professor.first_name} ${professor.last_name}...`);

  // Check if we already have a source URL
  let syllabusUrl = professor.syllabus_source_url;

  if (syllabusUrl) {
    console.log(`✓ Using existing syllabus source URL: ${syllabusUrl}`);
  } else {
    // If not, fetch from Nebula API
    console.log(`📥 Fetching syllabus from Nebula API...`);
    syllabusUrl = await getSyllabusUri(
      professor.first_name,
      professor.last_name
    );

    if (syllabusUrl) {
      // Update the Professor with syllabus_source_url for next time
      professor.syllabus_source_url = syllabusUrl;
      await professor.save();
      console.log(`✓ Syllabus URL saved to database: ${syllabusUrl}`);
    }
  }

  if (!syllabusUrl) {
    throw new Error(`No syllabus URL found for ${profId}`);
  }

  // Download the PDF
  const filePath = await downloadPDF(syllabusUrl, profId);
  console.log(`✓ PDF downloaded to: ${filePath}`);

  // Upload to Gemini File API
  const geminiUri = await uploadToGemini(filePath, profId);
  console.log(`✓ Uploaded to Gemini: ${geminiUri}`);

  // Wait for file to become active
  await waitForFileActive(geminiUri);

  // Update Professor with Gemini URI
  professor.syllabus_gemini_uri = geminiUri;
  await professor.save();
  console.log(`✓ Gemini URI saved to database`);

  // Clean up tmp file
  await unlink(filePath);
  console.log(`✓ Temporary file cleaned up`);

  return geminiUri;
}

async function downloadPDF(url: string, profId: string): Promise<string> {
  // Ensure tmp directory exists
  const tmpDir = path.join(process.cwd(), 'tmp');
  await mkdir(tmpDir, { recursive: true });

  // Create file path
  const fileName = `${profId}_syllabus.pdf`;
  const filePath = path.join(tmpDir, fileName);

  // Fetch the PDF
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  // Stream the PDF to disk
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readableStream = Readable.fromWeb(response.body as any);
  const writeStream = createWriteStream(filePath);

  await pipeline(readableStream, writeStream);

  return filePath;
}

async function uploadToGemini(filePath: string, profId: string): Promise<string> {
  const uploadResult = await fileManager.uploadFile(filePath, {
    mimeType: 'application/pdf',
    displayName: `${profId}_syllabus`
  });

  return uploadResult.file.uri;
}

async function waitForFileActive(fileUri: string) {
  const fileId = fileUri.split('/').pop();
  if (!fileId) throw new Error('Invalid file URI');

  console.log(`⏳ Waiting for Gemini file to be ACTIVE...`);
  
  for (let i = 0; i < 10; i++) {
    const file = await fileManager.getFile(`files/${fileId}`);
    console.log(`File state: ${file.state}`);
    
    if (file.state === 'ACTIVE') {
      console.log(`✓ File is now ACTIVE`);
      return;
    }
    
    if (file.state === 'FAILED') {
      throw new Error(`Gemini file processing FAILED`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Timeout waiting for Gemini file to be ACTIVE');
}
