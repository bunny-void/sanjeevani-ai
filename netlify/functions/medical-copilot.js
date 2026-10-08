import { handleNetlifyFunctionEvent } from '../../server/medicalCopilotHandler.js';

/**
 * Netlify Serverless Function for POST /api/medical-copilot
 * Connects to the real Sanjeevani Medical AI Copilot Gemini pipeline.
 * Reads GEMINI_API_KEY from server-side Netlify environment variables.
 */
export const handler = async (event) => {
  return handleNetlifyFunctionEvent(event, '/api/medical-copilot');
};
