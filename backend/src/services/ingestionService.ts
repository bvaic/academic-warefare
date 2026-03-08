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

  console.log(`📥 Fetching syllabus for ${professor.first_name} ${professor.last_name}...`);

  // Call getSyllabusUri
  const syllabusUrl = await getSyllabusUri(
    professor.course_prefix,
    professor.course_number,
    professor.first_name,
    professor.last_name
  );

  if (!syllabusUrl) {
    throw new Error(`No syllabus URL found for ${profId}`);
  }

  // Update the Professor with syllabus_source_url
  professor.syllabus_source_url = syllabusUrl;
  await professor.save();
  console.log(`✓ Syllabus URL saved: ${syllabusUrl}`);

  // Download the PDF
  const filePath = await downloadPDF(syllabusUrl, profId);
  console.log(`✓ PDF downloaded to: ${filePath}`);

  // Upload to Gemini File API
  const geminiUri = await uploadToGemini(filePath, profId);
  console.log(`✓ Uploaded to Gemini: ${geminiUri}`);

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
