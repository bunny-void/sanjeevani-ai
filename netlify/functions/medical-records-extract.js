import { handleNetlifyFunctionEvent } from '../../server/medicalCopilotHandler.js';

/**
 * Netlify Serverless Function for POST /api/medical-records/extract
 * Connects to the real Sanjeevani Medical Record Intelligence & OCR Gemini pipeline.
 * Supports PDF, PNG, JPG, JPEG uploads via base64 Data URLs.
 * Reads GEMINI_API_KEY from server-side Netlify environment variables.
 */
export const handler = async (event) => {
  return handleNetlifyFunctionEvent(event, '/api/medical-records/extract');
};
