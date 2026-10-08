// Frontend Service for Sanjeevani Medical AI Copilot
// Communicates strictly with the backend /api/medical-copilot endpoint so API keys remain private on the server.

import { CopilotAttachment, ReportCategoryId } from '../types';
import { buildApiUrl } from './apiConfig';

export interface CopilotHistoryMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
  model?: string;
  attachments?: CopilotAttachment[];
}

export interface CopilotAppContext {
  patientName?: string;
  age?: number;
  conditions?: string[];
  medications?: Array<{
    name: string;
    dosage: string;
    scheduledTime?: string;
    timing?: string;
    status?: string;
  }>;
  appointments?: Array<{
    doctorName: string;
    specialty: string;
    date: string;
    time: string;
  }>;
  relevantReports?: Array<{
    id: string;
    category: ReportCategoryId;
    title: string;
    date: string;
    fileType: string;
    extractedSummaryText?: string;
  }>;
  isAmbiguousReportCategory?: boolean;
  ambiguousCategoryName?: string;
  relevantTimelineContext?: string;
}

export interface CopilotPayloadAttachment {
  name: string;
  mimeType: string;
  fileTypeLabel: string;
  dataUrl?: string;
  reportTitle?: string;
  reportDate?: string;
  reportCategory?: string;
  extractedText?: string;
}

export interface CopilotResponse {
  reply: string;
  interactionId: string | null;
  model: string;
  timestamp: string;
}

export async function askMedicalCopilot(params: {
  message: string;
  history: CopilotHistoryMessage[];
  previousInteractionId?: string | null;
  appContext?: CopilotAppContext | null;
  attachments?: CopilotPayloadAttachment[];
  language?: 'English' | 'Telugu';
}): Promise<CopilotResponse> {
  const response = await fetch(buildApiUrl('/api/medical-copilot'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: params.message,
      history: params.history.map((m) => ({
        role: m.sender === 'AI' ? 'model' : 'user',
        sender: m.sender,
        text: m.text
      })),
      previousInteractionId: params.previousInteractionId || null,
      appContext: params.appContext || null,
      attachments: params.attachments || [],
      language: params.language || 'English'
    })
  });

  if (!response.ok) {
    let errText = 'Medical AI is temporarily unavailable.';
    try {
      const errData = await response.json();
      if (errData?.error) {
        errText = errData.error;
      }
    } catch {
      // Keep default message
    }
    throw new Error(errText);
  }

  const data = (await response.json()) as CopilotResponse;
  if (!data || !data.reply) {
    throw new Error('Medical AI is temporarily unavailable.');
  }

  return data;
}
