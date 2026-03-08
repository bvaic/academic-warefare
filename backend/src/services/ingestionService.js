import { getDB } from '../db/connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMP_DIR = path.join(__dirname, '../../tmp');

// Ensure tmp directory exists
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

/**
 * Check if syllabus already processed in MongoDB
 * @param {string} sectionId - The section ID (e.g., "ITSS4330-001")
 * @returns {Promise<boolean>} - True if already processed, false otherwise
 */
async function isSyllabusProcessed(sectionId) {
  const db = getDB();
  const section = await db.collection('sections').findOne({ _id: sectionId });

  if (!section) {
    throw new Error(`Section ${sectionId} not found in database`);
  }

  return section.syllabus_gemini_uri !== null;
}

/**
 * Download PDF from URL to temporary directory
 * @param {string} url - The PDF URL
 * @param {string} sectionId - The section ID for filename
 * @returns {Promise<string>} - Path to downloaded PDF
 */
async function downloadPDF(url, sectionId) {
  const fileName = `${sectionId}.pdf`;
  const filePath = path.join(TMP_DIR, fileName);

  console.log(`Downloading PDF from: ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    fs.writeFileSync(filePath, buffer);
    console.log(`✓ PDF downloaded to: ${filePath}`);

    return filePath;
  } catch (error) {
    throw new Error(`Failed to download PDF: ${error.message}`);
  }
}

/**
 * Main ingestion function - checks DB and downloads PDF if needed
 * @param {Object} courseData - Course data object with section_id and syllabus_source_url
 * @returns {Promise<string|null>} - Path to downloaded PDF or null if already processed
 */
export async function ingestSyllabus(courseData) {
  const { section_id, syllabus_source_url } = courseData;

  if (!section_id || !syllabus_source_url) {
    throw new Error('Missing required fields: section_id and syllabus_source_url');
  }

  // Step 1: Check if already processed
  const alreadyProcessed = await isSyllabusProcessed(section_id);

  if (alreadyProcessed) {
    console.log(`⚠ Syllabus already processed for section: ${section_id}`);
    return null;
  }

  // Step 2: Download PDF
  const pdfPath = await downloadPDF(syllabus_source_url, section_id);

  return pdfPath;
}
