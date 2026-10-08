import { handleNetlifyFunctionEvent } from '../../server/medicalCopilotHandler.js';

/**
 * Netlify Serverless Function for GET /api/medical-copilot/health
 * Reports whether GEMINI_API_KEY is configured on the server without exposing the key.
 */
export const handler = async (event) => {
  return handleNetlifyFunctionEvent(event, '/api/medical-copilot/health');
};
