import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

let projectRoot = process.cwd();
try {
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    projectRoot = path.resolve(__dirname, '..');
  }
} catch {
  // Fallback to process.cwd() in bundled serverless environments
}

// Load .env locally if GEMINI_API_KEY is not already injected by the serverless environment
if (!process.env.GEMINI_API_KEY) {
  try {
    dotenv.config({ path: path.join(projectRoot, '.env') });
    if (!process.env.GEMINI_API_KEY && process.env.USERPROFILE) {
      dotenv.config({ path: path.join(process.env.USERPROFILE, '.env') });
    }
  } catch {
    // Ignore .env read errors in serverless runtime
  }
}

export const MEDICAL_COPILOT_SYSTEM_PROMPT = `You are the Sanjeevani Medical AI Copilot, a knowledgeable, calm, clear, and trustworthy medical-information assistant integrated into the Sanjeevani AI Health Guardian application.

CORE RESPONSIBILITIES:
1. Answer general medical, health, anatomy, physiology, pharmacology, laboratory test (e.g., HbA1c, CBC, lipid panel), diagnostic scan/procedure (e.g., ECG, MRI, CT, ultrasound), symptom, disease, and preventive healthcare questions accurately and clearly.
2. You DO NOT depend on a patient's profile or reports to answer general medical questions. Answer any broad medical or health topic directly.
3. Maintain multi-turn conversational continuity: carefully resolve pronouns and follow-up requests (such as "What are its symptoms?", "What about the HbA1c?", "Explain that in simple words", or "Summarize that") using the prior conversation history and any active report context.
4. Structure your answers for high readability:
   - Use clear, patient-friendly language.
   - Use short paragraphs and concise bullet points where helpful.
   - When explaining complex medical concepts, offer a clear, easy-to-understand explanation first before adding clinical detail.

MEDICAL REPORT & ATTACHMENT ANALYSIS RULES (MANDATORY):
- When the user attaches an image, PDF, or stored Medical Report, or asks about one of their stored reports:
  - Explain terminology, summarize the report in simple language, explain what a test generally measures, and explain what a reported value means in general educational terms.
  - Compare reported lab values ONLY against the reference range PROVIDED BY THE REPORT. Do NOT invent a reference range when the report does not provide one (if no reference range is provided on the report, state that the reference range is not listed / UNKNOWN).
  - For abnormal values (HIGH or LOW outside the report's reference range), explain in plain language:
    1. State the test name, reported value, and the reference range listed on the report, noting whether the value is above or below that range.
    2. Explain in simple words what the test generally measures (e.g., "HbA1c is a measure related to average blood glucose over the previous few months.").
    3. State: "A qualified healthcare professional should interpret this result in context."
  - Clearly distinguish between:
    1. Educational explanation (general medical knowledge about what a test, condition, or medicine is),
    2. Report interpretation (explaining what values, findings, or impressions are written in the user's report and how they compare to the report's reference range), and
    3. Professional medical diagnosis (clinical diagnosis and treatment decisions, which can only be made by a qualified healthcare professional).
  - NEVER claim "You have X disease", "You definitely have X disease", "It is definitely normal", or "You don't need to see a doctor." (No false certainty).
  - NEVER label a finding as medically dangerous unless the source report itself clearly supports that wording.
  - NEVER invent, guess, or fabricate laboratory numbers or clinical values that are not visibly present in the provided image, document, or report text.
  - If an attached image or PDF is blank, blurry, corrupted, or unreadable, or does not contain legible medical text/values, explicitly tell the user that the report/image could not be read clearly and ask for a clearer upload. Do NOT guess values.
- If multiple reports exist in the requested category and the user did not specify which date they mean (and ` + '`isAmbiguousReportCategory`' + ` is flagged), briefly list the available report dates in that category and ask which one they would like explained (or offer a quick overview of the latest one while noting the other dates).

MEDICAL SAFETY RULES (MANDATORY):
- Provide educational medical information and report explanation only.
- No diagnosis: NEVER claim to diagnose the user with a medical condition ("You have X disease").
- No prescriptions: NEVER prescribe new medications.
- No dosage changes: NEVER recommend starting, stopping, increasing, or decreasing the dosage of any prescribed medication.
- No false certainty: Avoid absolute diagnostic assurances ("definitely normal", "definitely nothing to worry about").
- If findings are outside the reference range or concerning, recommend discussing them with a qualified healthcare professional.
- If the user describes potential medical emergency symptoms (such as severe chest pain, difficulty breathing, stroke symptoms, severe bleeding, or loss of consciousness), immediately and calmly advise seeking urgent emergency medical care.`;

const PREFERRED_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash'
];

// Circuit-breaker map so if a model returns 429 / 503 / times out, subsequent turns don't wait
const modelCooldownUntil = new Map();

function markModelCooldownIfNeeded(modelName, err) {
  const errStr = String(err?.message || err);
  if (
    errStr.includes('429') ||
    errStr.includes('RESOURCE_EXHAUSTED') ||
    errStr.includes('Quota exceeded')
  ) {
    modelCooldownUntil.set(modelName, Date.now() + 1800000); // 30m cooldown on quota limit
    return true;
  }
  if (
    errStr.includes('503') ||
    errStr.includes('UNAVAILABLE') ||
    errStr.includes('Timeout')
  ) {
    modelCooldownUntil.set(modelName, Date.now() + 180000);
    return true;
  }
  return false;
}

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${ms}ms calling ${label}`));
    }, ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

let cachedClient = null;
let cachedApiKey = null;

function getGenAIClient() {
  // In local development, load .env if present; in Netlify Functions, process.env.GEMINI_API_KEY is injected directly
  if (!process.env.GEMINI_API_KEY) {
    try {
      dotenv.config({ path: path.join(projectRoot, '.env'), override: true });
      if (!process.env.GEMINI_API_KEY && process.env.USERPROFILE) {
        dotenv.config({ path: path.join(process.env.USERPROFILE, '.env'), override: true });
      }
    } catch {
      // Ignore .env read errors in serverless runtime
    }
  }

  // Ensure the SDK never routes to Vertex AI / Agent Platform
  delete process.env.GOOGLE_GENAI_USE_VERTEXAI;
  delete process.env.GOOGLE_GENAI_USE_ENTERPRISE;
  delete process.env.GOOGLE_CLOUD_PROJECT;
  delete process.env.GOOGLE_CLOUD_LOCATION;

  const rawKey = process.env.GEMINI_API_KEY || '';
  const apiKey = rawKey.trim().replace(/^['"]|['"]$/g, '');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the backend server.');
  }
  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedClient = new GoogleGenAI({
      apiKey,
      vertexai: false
    });
    cachedApiKey = apiKey;
  }
  return cachedClient;
}

/**
 * Extracts raw base64 data and mimeType from a data URL (`data:image/png;base64,...`).
 * If the data URL is an SVG (`data:image/svg+xml;utf8,...`), decodes the SVG text so
 * any embedded text labels can be read reliably alongside binary images/PDFs.
 */
function parseAttachmentDataUrl(att) {
  if (!att || !att.dataUrl || typeof att.dataUrl !== 'string') {
    return { inlinePart: null, decodedSvgText: null };
  }

  const dataUrl = att.dataUrl.trim();

  if (dataUrl.startsWith('data:image/svg+xml')) {
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx !== -1) {
      try {
        const rawSvg = decodeURIComponent(dataUrl.slice(commaIdx + 1));
        const textMatches = [...rawSvg.matchAll(/<text[^>]*>(.*?)<\/text>/g)]
          .map((m) => m[1])
          .filter(Boolean);
        return {
          inlinePart: null,
          decodedSvgText: textMatches.join('\n')
        };
      } catch {
        return { inlinePart: null, decodedSvgText: null };
      }
    }
  }

  const base64Match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (base64Match) {
    const mimeType = base64Match[1] || att.mimeType || 'image/png';
    const base64Data = base64Match[2].replace(/\s/g, '');
    return {
      inlinePart: {
        mimeType,
        data: base64Data
      },
      decodedSvgText: null
    };
  }

  return { inlinePart: null, decodedSvgText: null };
}

/**
 * Builds the system instruction string, optionally enriched with active user context
 * and controlled report metadata while keeping general medical Q&A completely independent.
 */
function buildSystemInstruction(appContext, attachments = [], language = 'English') {
  const sections = [MEDICAL_COPILOT_SYSTEM_PROMPT];

  const isTeluguSelected =
    language === 'Telugu' ||
    language === 'తెలుగు' ||
    language === 'te' ||
    language === 'te-IN';

  if (isTeluguSelected) {
    sections.push(
      `SELECTED RESPONSE LANGUAGE: TELUGU (తెలుగు) — MANDATORY:
- The user has selected Telugu (తెలుగు) as their response language.
- You MUST write your entire explanation and response in clear, natural, patient-friendly Telugu (తెలుగు script), even if the user asks their question in English (for example, if the user asks "What is hypertension?", explain hypertension in Telugu).
- NUMERIC & CLINICAL ACCURACY IN TELUGU:
  - Do NOT translate, alter, or invent numbers, reference ranges, dates, or units.
  - Keep all numbers (e.g., 7.4%, 126 mg/dL, 13.8 g/dL, 18 ng/mL, 500 mg, 10 mg), units (%, mg/dL, g/dL, ng/mL, mg), test names (e.g., HbA1c, Hemoglobin, Fasting Blood Glucose, Vitamin D), and medicine names (e.g., Metformin, Lisinopril, Atorvastatin) 100% accurate and exact.
  - Clearly distinguish educational explanation, report interpretation, and professional medical diagnosis (which requires a qualified doctor).`
    );
  }

  if (appContext && typeof appContext === 'object') {
    const contextLines = [];
    if (appContext.patientName) {
      contextLines.push(`User Name: ${appContext.patientName} (Age: ${appContext.age || 'N/A'})`);
    }
    if (Array.isArray(appContext.conditions) && appContext.conditions.length > 0) {
      contextLines.push(`Noted Health Conditions: ${appContext.conditions.join(', ')}`);
    }
    if (Array.isArray(appContext.medications) && appContext.medications.length > 0) {
      const medList = appContext.medications
        .map(
          (m) =>
            `${m.name} ${m.dosage} (${m.scheduledTime || m.timing || ''}, Status: ${
              m.status || 'Scheduled'
            })`
        )
        .join('; ');
      contextLines.push(`Scheduled Medications in App: ${medList}`);
    }
    if (Array.isArray(appContext.appointments) && appContext.appointments.length > 0) {
      const apptList = appContext.appointments
        .map((a) => `${a.doctorName} (${a.specialty}) on ${a.date} at ${a.time}`)
        .join('; ');
      contextLines.push(`Upcoming Appointments in App: ${apptList}`);
    }

    if (contextLines.length > 0) {
      sections.push(
        `OPTIONAL USER APP CONTEXT (Use ONLY if relevant to the user's question; do NOT restrict general medical answers to this profile):\n${contextLines.join(
          '\n'
        )}`
      );
    }

    // Controlled Medical Report Retrieval Context
    if (Array.isArray(appContext.relevantReports) && appContext.relevantReports.length > 0) {
      const reportDescriptions = appContext.relevantReports
        .map(
          (r, idx) =>
            `[Report ${idx + 1}] Category: ${r.category} | Title: "${r.title}" | Date: ${
              r.date
            } | Format: ${r.fileType}\n${
              r.extractedSummaryText ? `Contents/Findings:\n${r.extractedSummaryText}` : ''
            }`
        )
        .join('\n\n');

      const ambiguityNote = appContext.isAmbiguousReportCategory
        ? `\nNOTE ON MULTIPLE REPORTS: The user has ${appContext.relevantReports.length} reports in the ${
            appContext.ambiguousCategoryName || 'requested'
          } category and did not specify a date. Mention the available report dates clearly (${appContext.relevantReports
            .map((r) => `${r.title} on ${r.date}`)
            .join(', ')}), explain the latest one (${appContext.relevantReports[0].date}) or ask which specific date they want to focus on.`
        : '';

      sections.push(
        `RETRIEVED USER MEDICAL REPORTS FOR THIS QUESTION:\n${reportDescriptions}${ambiguityNote}`
      );
    }

    if (
      typeof appContext.relevantTimelineContext === 'string' &&
      appContext.relevantTimelineContext.trim()
    ) {
      sections.push(
        `RETRIEVED UNIFIED HEALTH TIMELINE DATA (Selected specifically for this question):\n${appContext.relevantTimelineContext.trim()}`
      );
    }
  }

  // Include structured metadata for any explicitly attached files/reports
  if (Array.isArray(attachments) && attachments.length > 0) {
    const attTextBlocks = [];
    for (const att of attachments) {
      const { decodedSvgText } = parseAttachmentDataUrl(att);
      const metaHeader = `Attached Item: "${att.name}" (Type: ${att.fileTypeLabel || att.mimeType}${
        att.reportDate ? `, Date: ${att.reportDate}` : ''
      })`;
      const textContent = att.extractedText || decodedSvgText || '';
      if (textContent) {
        attTextBlocks.push(`${metaHeader}\nExtracted/Document Text:\n${textContent}`);
      } else {
        attTextBlocks.push(
          `${metaHeader}\n(Inspect the attached binary image/PDF file directly. If the image or document is blank, tiny, blurry, or contains no readable medical text/values, state clearly that the report/image is unreadable and do not invent values.)`
        );
      }
    }
    if (attTextBlocks.length > 0) {
      sections.push(`ACTIVE ATTACHMENTS IN THIS CONVERSATION:\n${attTextBlocks.join('\n\n')}`);
    }
  }

  return sections.join('\n\n');
}

/**
 * Extracts text from an Interactions API response object.
 */
function extractInteractionText(interaction) {
  if (!interaction) return '';
  if (Array.isArray(interaction.outputs)) {
    const textParts = interaction.outputs
      .filter((o) => o && (o.type === 'text' || typeof o.text === 'string'))
      .map((o) => o.text || '')
      .filter(Boolean);
    if (textParts.length > 0) {
      return textParts.join('\n').trim();
    }
  }
  if (typeof interaction.output_text === 'string' && interaction.output_text.trim()) {
    return interaction.output_text.trim();
  }
  return '';
}

/**
 * Generates a real multi-turn response from Gemini using the Gemini Developer API.
 * Supports both text-only multi-turn conversations and multimodal (image/PDF) attachments.
 */
export async function generateMedicalCopilotReply({
  message,
  history = [],
  previousInteractionId = null,
  appContext = null,
  attachments = [],
  language = 'English'
}) {
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new Error('A non-empty question or message is required.');
  }

  const ai = getGenAIClient();
  const safeAttachments = Array.isArray(attachments) ? attachments : [];
  const rawMessage = message.trim();
  const hasTeluguScriptInMessage = /[\u0C00-\u0C7F]/.test(rawMessage);
  const effectiveLanguage =
    language === 'Telugu' ||
    language === 'తెలుగు' ||
    language === 'te' ||
    language === 'te-IN' ||
    hasTeluguScriptInMessage
      ? 'Telugu'
      : 'English';

  const systemInstruction = buildSystemInstruction(
    appContext,
    safeAttachments,
    effectiveLanguage
  );
  const cleanMessage =
    effectiveLanguage === 'Telugu'
      ? `${rawMessage}\n\n[దయచేసి సమాధానాన్ని సరళమైన తెలుగులో (తెలుగు లిపిలో) ఇవ్వండి. రిపోర్ట్‌లోని సంఖ్యలు, యూనిట్లు (ఉదా: %, mg/dL, g/dL, ng/mL, mg), మరియు మందుల పేర్లను ఖచ్చితంగా అలాగే ఉంచండి.]`
      : rawMessage;

  // Extract any binary inline parts (PNG, JPEG, PDF) from attachments
  const binaryInlineParts = [];
  for (const att of safeAttachments) {
    const { inlinePart } = parseAttachmentDataUrl(att);
    if (inlinePart) {
      binaryInlineParts.push({
        name: att.name,
        mimeType: inlinePart.mimeType,
        data: inlinePart.data
      });
    }
  }

  // Format multi-turn conversation history
  const normalizedHistory = Array.isArray(history)
    ? history
        .filter((item) => item && typeof item.text === 'string' && item.text.trim())
        .map((item) => ({
          role: item.role === 'model' || item.sender === 'AI' ? 'model' : 'user',
          text: item.text.trim()
        }))
    : [];

  let lastError = null;

  // Order models so any model currently in a 503/timeout cooldown is tried last
  const now = Date.now();
  const activeModels = [
    ...PREFERRED_MODELS.filter((m) => (modelCooldownUntil.get(m) || 0) <= now),
    ...PREFERRED_MODELS.filter((m) => (modelCooldownUntil.get(m) || 0) > now)
  ];

  // If binary PDF/image attachments are present, build multimodal content parts
  // 1. Primary: Modern Gemini Interactions API (gemini-3.8-flash -> gemini-3.5-flash-lite)
  if (ai.interactions && typeof ai.interactions.create === 'function') {
    for (const modelName of activeModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          let interactionInput;

          if (binaryInlineParts.length > 0) {
            // Multimodal input array for Interactions API
            const multimodalParts = [];
            if (normalizedHistory.length > 0 && !previousInteractionId) {
              const historyTranscript = normalizedHistory
                .map((h) => `${h.role === 'model' ? 'AI' : 'User'}: ${h.text}`)
                .join('\n\n');
              multimodalParts.push({
                type: 'text',
                text: `Previous Conversation Context:\n${historyTranscript}\n\nCurrent User Question: ${cleanMessage}`
              });
            } else {
              multimodalParts.push({
                type: 'text',
                text: cleanMessage
              });
            }

            for (const part of binaryInlineParts) {
              if (part.mimeType.startsWith('image/')) {
                multimodalParts.push({
                  type: 'image',
                  data: part.data,
                  mime_type: part.mimeType
                });
              } else {
                multimodalParts.push({
                  type: 'document',
                  data: part.data,
                  mime_type: part.mimeType
                });
              }
            }
            interactionInput = multimodalParts;
          } else {
            interactionInput =
              previousInteractionId || normalizedHistory.length === 0
                ? cleanMessage
                : [
                    ...normalizedHistory.map((h) => ({
                      role: h.role,
                      content: h.text
                    })),
                    { role: 'user', content: cleanMessage }
                  ];
          }

          const interactionParams = {
            model: modelName,
            system_instruction: systemInstruction,
            generation_config: {
              thinking_level: 'minimal',
              temperature: 0.3
            },
            input: interactionInput
          };

          if (previousInteractionId) {
            interactionParams.previous_interaction_id = previousInteractionId;
          }

          const interaction = await withTimeout(
            ai.interactions.create(interactionParams),
            25000,
            modelName
          );
          const textOutput = extractInteractionText(interaction);

          if (textOutput) {
            modelCooldownUntil.delete(modelName);
            return {
              reply: textOutput,
              interactionId: interaction.id || null,
              model: modelName,
              timestamp: new Date().toISOString()
            };
          }
        } catch (err) {
          lastError = err;
          if (markModelCooldownIfNeeded(modelName, err)) {
            break;
          }
          if (previousInteractionId && attempt === 1) {
            previousInteractionId = null;
            continue;
          }
          break;
        }
      }
    }
  }

  // 2. Secondary fallback: ai.models.generateContent with inlineData support for images & PDFs
  if (ai.models && typeof ai.models.generateContent === 'function') {
    const userParts = [{ text: cleanMessage }];
    for (const part of binaryInlineParts) {
      userParts.push({
        inlineData: {
          mimeType: part.mimeType,
          data: part.data
        }
      });
    }

    const contents = [
      ...normalizedHistory.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }]
      })),
      {
        role: 'user',
        parts: userParts
      }
    ];

    for (const modelName of activeModels) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              temperature: 0.3
            }
          }),
          25000,
          modelName
        );

        const replyText =
          typeof response?.text === 'string'
            ? response.text
            : response?.candidates?.[0]?.content?.parts
                ?.map((p) => p.text || '')
                .join('') || '';

        if (replyText && replyText.trim()) {
          return {
            reply: replyText.trim(),
            interactionId: null,
            model: modelName,
            timestamp: new Date().toISOString()
          };
        }
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError || new Error('Failed to generate a response from the Gemini AI model.');
}

const DOCUMENT_EXTRACTION_SYSTEM_PROMPT = `You are the Sanjeevani Medical Record Intelligence & Plain-Language Health Summary Engine.
Your task is to inspect an uploaded medical document (image, PDF, or embedded document text) and return STRICT, VALID JSON only.

SUPPORTED DOCUMENT TYPES (choose the best matching one):
- "PRESCRIPTION"
- "BLOOD_TEST"
- "XRAY"
- "SCANNING"
- "DISCHARGE_SUMMARY"
- "VACCINATION"
- "MEDICAL_HISTORY"

CRITICAL SAFETY & ACCURACY RULES:
1. NEVER invent, guess, or fabricate laboratory values, reference ranges, medicines, dosages, diagnoses, or dates that are not present in the document.
2. If the uploaded image or document is blank, blurry, illegible, or contains no readable medical text/values:
   - Set "isReadable": false
   - Set "unreadableMessage": "Some information could not be read clearly."
   - Leave arrays empty and do NOT guess any values.
3. PLAIN-LANGUAGE DOCUMENT SUMMARY ("summary" AND "summaryTe"):
   - Generate a friendly, plain-language English AI summary ("summary") AND a plain-language Telugu summary ("summaryTe" / తెలుగు సారాంశం) based strictly on the actual extracted document data:
     - For Blood/Lab reports: e.g., "This blood test checks several aspects of blood health and metabolism..."
     - For Prescriptions: e.g., "This prescription contains three medicines prescribed by..."
     - For Discharge Summaries: e.g., "This discharge summary records a hospital stay from..."
   - In "summaryTe" (తెలుగు సారాంశం):
     - Write in clear, natural Telugu (తెలుగు script) generated strictly from the actual extracted document data.
     - Do NOT translate, alter, or invent values. Numbers, units (e.g., %, mg/dL, g/dL, ng/mL, mg), medicine names (e.g., Metformin, Lisinopril, Amlodipine), and report values must remain 100% accurate.
   - Do NOT invent information and do NOT diagnose the user.
4. LAB ABNORMAL VALUES & REFERENCE RANGE RULES:
   - Compare each reported lab value ONLY against the reference range PROVIDED BY THE REPORT.
   - Do NOT invent a reference range when the report does not provide one. If no reference range is printed on the report for a test, set "referenceRange": "" and "flag": "UNKNOWN".
   - Allowed "flag" values: "NORMAL" | "HIGH" | "LOW" | "UNKNOWN".
   - For abnormal values ("HIGH" or "LOW"), provide a plain-language "explanation" (English) and "explanationTe" (Telugu) following this structure:
     "The report lists a reference range of <referenceRange>, so this result is <above/below> the range shown on this report. <Simple 1-sentence explanation of what the test generally measures>. A qualified healthcare professional should interpret this result in context."
5. For "XRAY" and "SCANNING" (Diagnostic Reports):
   - Do NOT independently diagnose from an X-ray or scan image.
   - Extract ONLY the written diagnostic report information (test/modality, body area, written report text, and written impression/conclusion when explicitly present).
   - Never label something as medically dangerous unless the source report itself clearly supports that wording.
6. Keep "internalConfidence" as a number between 0.0 and 1.0 representing OCR/extraction completeness.

REQUIRED JSON OUTPUT SCHEMA:
{
  "documentType": "PRESCRIPTION" | "BLOOD_TEST" | "XRAY" | "SCANNING" | "DISCHARGE_SUMMARY" | "VACCINATION" | "MEDICAL_HISTORY",
  "isReadable": true | false,
  "unreadableMessage": "Some information could not be read clearly." (only when isReadable is false, otherwise ""),
  "internalConfidence": 0.92,
  "title": "Document title or test name",
  "date": "DD MMM YYYY (e.g., 10 Jan 2026) or empty string if not stated",
  "isoDate": "YYYY-MM-DD or empty string",
  "doctorName": "Doctor name if present, else empty string",
  "hospitalOrLab": "Hospital, clinic, or lab name if present, else empty string",
  "patientName": "Patient name if present, else empty string",
  "summary": "Plain-language English AI summary based strictly on the actual extracted document data (2-3 sentences, non-diagnostic).",
  "summaryTe": "Plain-language Telugu AI summary (తెలుగు సారాంశం) based strictly on the actual extracted document data, preserving exact numbers, units, and medicine/test names.",
  "keyFindings": [
    "Concise plain-language key finding 1 from the actual document",
    "Concise plain-language key finding 2 from the actual document"
  ],
  "keyFindingsTe": [
    "Concise Telugu key finding 1 preserving exact numbers and units"
  ],
  "medicines": [
    {
      "name": "Medicine name (e.g., Metformin)",
      "strength": "Strength (e.g., 500 mg)",
      "dosage": "Dosage (e.g., 500 mg or 1 tablet)",
      "frequency": "Frequency (e.g., Twice daily)",
      "duration": "Duration if stated (e.g., 30 days)",
      "route": "Route if stated (e.g., Oral)",
      "timing": "Morning" | "Afternoon" | "Evening",
      "instructions": "Instructions if stated (e.g., After meals)",
      "instructionsTe": "Telugu frequency & instruction summary (e.g., రోజుకు రెండుసార్లు — భోజనం తర్వాత)"
    }
  ],
  "labTests": [
    {
      "testName": "Test name (e.g., Hemoglobin, HbA1c)",
      "value": "Measured value (e.g., 13.8, 7.4)",
      "unit": "Unit (e.g., g/dL, %)",
      "referenceRange": "Reference range ONLY if stated on the report (e.g., 4.0-5.6%), else empty string",
      "flag": "NORMAL" | "HIGH" | "LOW" | "UNKNOWN",
      "explanation": "Plain-language English explanation",
      "explanationTe": "Plain-language Telugu explanation preserving exact numbers, units, and reference range"
    }
  ],
  "diagnostic": {
    "modality": "Modality/test (e.g., Digital Chest Radiograph PA View, Abdominal Ultrasound)",
    "bodyArea": "Body area (e.g., Chest, Right Knee, Abdomen)",
    "reportText": "Written findings text from the report",
    "impression": "Written impression/conclusion text when explicitly present"
  },
  "discharge": {
    "hospital": "Hospital name if stated",
    "doctor": "Attending physician if stated",
    "admissionDate": "Admission date if stated",
    "dischargeDate": "Discharge date if stated",
    "diagnoses": ["Diagnosis 1", "Diagnosis 2"],
    "procedures": ["Procedure 1"],
    "importantInstructions": "Discharge care instructions if stated",
    "followUp": "Follow-up instructions/date if stated"
  },
  "vaccinations": [
    {
      "vaccine": "Vaccine name",
      "date": "Date administered",
      "doseSequence": "Dose/sequence (e.g., Dose 2 of 2, Annual Booster)",
      "providerOrLocation": "Clinic/provider/route"
    }
  ],
  "medicalHistory": {
    "conditions": ["Condition 1", "Condition 2"],
    "date": "Date of record",
    "doctorOrHospital": "Doctor or hospital name",
    "relevantNotes": "Relevant care plan or clinical history notes"
  }
}`;

function parseJsonFromModelOutput(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const trimmed = rawText.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

const VALID_DOC_TYPES = new Set([
  'PRESCRIPTION',
  'BLOOD_TEST',
  'XRAY',
  'SCANNING',
  'DISCHARGE_SUMMARY',
  'VACCINATION',
  'MEDICAL_HISTORY'
]);

/**
 * Plain-language educational descriptions for common lab markers so that abnormal value
 * explanations are always clear, accurate, and non-diagnostic.
 */
function getPlainLanguageTestPurpose(testName = '') {
  const n = testName.toLowerCase();
  if (n.includes('hba1c') || n.includes('glycated hemoglobin') || n.includes('a1c')) {
    return 'HbA1c is a measure related to average blood glucose over the previous few months.';
  }
  if (n.includes('glucose') || n.includes('blood sugar') || n.includes('fbs') || n.includes('ppbs')) {
    return 'Blood glucose measures the amount of sugar circulating in the bloodstream at the time of the test.';
  }
  if (n.includes('hemoglobin') || n === 'hb') {
    return 'Hemoglobin is the iron-rich protein in red blood cells that carries oxygen throughout the body.';
  }
  if (n.includes('wbc') || n.includes('white blood') || n.includes('leukocyte')) {
    return 'White blood cell count measures immune system cells that help the body respond to infection and inflammation.';
  }
  if (n.includes('platelet')) {
    return 'Platelets are tiny blood cell fragments that help blood clot normally.';
  }
  if (n.includes('creatinine')) {
    return 'Serum creatinine is a waste product filtered by the kidneys and is commonly used to check kidney filtration.';
  }
  if (n.includes('egfr') || n.includes('glomerular')) {
    return 'Estimated glomerular filtration rate (eGFR) estimates how well the kidneys are filtering waste from the blood.';
  }
  if (n.includes('tsh') || n.includes('thyroid stimulating')) {
    return 'TSH is a pituitary hormone that signals the thyroid gland to regulate metabolism and thyroid hormone levels.';
  }
  if (n.includes('t4') || n.includes('thyroxine') || n.includes('t3')) {
    return 'This test measures thyroid hormone levels involved in regulating the body’s energy and metabolism.';
  }
  if (n.includes('cholesterol') || n.includes('ldl') || n.includes('hdl') || n.includes('triglyceride')) {
    return 'This lipid test measures fats and cholesterol in the blood that are evaluated as part of heart and vascular health.';
  }
  if (n.includes('potassium') || n.includes('sodium') || n.includes('chloride') || n.includes('calcium')) {
    return 'This electrolyte test measures an essential mineral in the blood that supports nerve, muscle, and fluid balance.';
  }
  if (n.includes('vitamin d') || n.includes('cholecalciferol')) {
    return 'Vitamin D supports bone strength, calcium absorption, and immune health.';
  }
  if (n.includes('vitamin b12') || n.includes('cobalamin')) {
    return 'Vitamin B12 is a nutrient important for nerve function and red blood cell formation.';
  }
  return `${testName || 'This test'} is a laboratory measurement used to help evaluate general health and physiological function.`;
}

/**
 * Compares a reported numeric value strictly against the reference range PROVIDED BY THE REPORT.
 * Never invents a reference range when none is provided: if referenceRange is empty/unavailable,
 * returns 'UNKNOWN'.
 */
export function evaluateLabStatusFromProvidedRange(valueStr = '', rangeStr = '', modelSuggestedFlag = '') {
  const cleanRange = String(rangeStr || '').trim();
  if (
    !cleanRange ||
    /^(n\/a|none|not provided|not listed|not available|unknown|unspecified|-|—)$/i.test(cleanRange)
  ) {
    return 'UNKNOWN';
  }

  const numVal = parseFloat(String(valueStr || '').replace(/,/g, '').trim());
  const cleanRangeNoCommas = cleanRange.replace(/,/g, '');

  if (!Number.isNaN(numVal)) {
    // 1. Range interval: "4.0 - 5.6", "4.0–5.6%", "70 to 99 mg/dL"
    const intervalMatch = cleanRangeNoCommas.match(
      /(-?\d+(?:\.\d+)?)\s*(?:[-–—]|to)\s*(-?\d+(?:\.\d+)?)/i
    );
    if (intervalMatch) {
      const min = parseFloat(intervalMatch[1]);
      const max = parseFloat(intervalMatch[2]);
      if (!Number.isNaN(min) && !Number.isNaN(max) && min <= max) {
        if (numVal < min) return 'LOW';
        if (numVal > max) return 'HIGH';
        return 'NORMAL';
      }
    }

    // 2. Upper bound: "< 5.7", "<= 200", "Up to 150"
    const upperMatch = cleanRangeNoCommas.match(/(?:<=?|up\s*to)\s*(-?\d+(?:\.\d+)?)/i);
    if (upperMatch) {
      const max = parseFloat(upperMatch[1]);
      if (!Number.isNaN(max)) {
        const inclusive = cleanRangeNoCommas.includes('<=');
        if (inclusive ? numVal > max : numVal >= max) return 'HIGH';
        return 'NORMAL';
      }
    }

    // 3. Lower bound: "> 60", ">= 40"
    const lowerMatch = cleanRangeNoCommas.match(/(?:>=?)\s*(-?\d+(?:\.\d+)?)/i);
    if (lowerMatch) {
      const min = parseFloat(lowerMatch[1]);
      if (!Number.isNaN(min)) {
        const inclusive = cleanRangeNoCommas.includes('>=');
        if (inclusive ? numVal < min : numVal <= min) return 'LOW';
        return 'NORMAL';
      }
    }
  }

  // Fallback to normalized model suggestion when referenceRange is present
  const upperFlag = String(modelSuggestedFlag || 'UNKNOWN').toUpperCase();
  if (upperFlag === 'NORMAL' || upperFlag === 'HIGH' || upperFlag === 'LOW') {
    return upperFlag;
  }
  if (upperFlag === 'CRITICAL' || upperFlag === 'BORDERLINE' || upperFlag === 'ABNORMAL') {
    return 'HIGH';
  }
  return 'UNKNOWN';
}

/**
 * Builds the 3-part plain-language explanation for an abnormal lab value (HIGH or LOW)
 * without diagnosing the user.
 */
export function buildAbnormalLabExplanation(testName, value, unit, referenceRange, flag, existingExplanation = '') {
  if (flag !== 'HIGH' && flag !== 'LOW') {
    return existingExplanation || '';
  }

  const directionWord = flag === 'HIGH' ? 'above' : 'below';
  const rangeSentence = referenceRange
    ? `The report lists a reference range of ${referenceRange}, so this result is ${directionWord} the range shown on this report.`
    : `This result is flagged as ${flag.toLowerCase()} on the report.`;

  const purposeSentence = getPlainLanguageTestPurpose(testName);
  const safetySentence =
    'A qualified healthcare professional should interpret this result in context.';

  // If the AI already generated a multi-sentence explanation containing "reference range" and "professional", use it; otherwise use our structured 3-part explanation
  if (
    existingExplanation &&
    existingExplanation.toLowerCase().includes('reference range') &&
    existingExplanation.toLowerCase().includes('professional')
  ) {
    return existingExplanation.trim();
  }

  return `${rangeSentence}\n\n${purposeSentence}\n\n${safetySentence}`;
}

function getTeluguTestPurpose(testName = '') {
  const n = testName.toLowerCase();
  if (n.includes('hba1c') || n.includes('glycated hemoglobin') || n.includes('a1c')) {
    return 'HbA1c అనేది గత 2–3 నెలల సగటు రక్తంలో చక్కెర (బ్లడ్ గ్లూకోజ్) స్థాయిని సూచించే పరీక్ష.';
  }
  if (n.includes('glucose') || n.includes('blood sugar') || n.includes('fbs') || n.includes('ppbs')) {
    return 'Fasting Blood Glucose అనేది పరీక్ష సమయంలో రక్తంలో ఉన్న చక్కెర స్థాయిని కొలుస్తుంది.';
  }
  if (n.includes('hemoglobin') || n === 'hb') {
    return 'Hemoglobin అనేది ఎర్ర రక్త కణాలలో శరీరమంతటా ఆక్సిజన్‌ను తీసుకెళ్లే ప్రోటీన్.';
  }
  if (n.includes('vitamin d')) {
    return 'Vitamin D అనేది ఎముకల బలం, కాల్షియం శోషణ మరియు రోగనిరోధక శక్తికి ఉపయోగపడే ముఖ్యమైన విటమిన్.';
  }
  if (n.includes('creatinine') || n.includes('egfr') || n.includes('urea')) {
    return 'ఈ పరీక్ష మూత్రపిండాలు (కిడ్నీలు) రక్తాన్ని ఎంత సమర్థవంతంగా శుద్ధి చేస్తున్నాయో తెలుసుకోవడానికి ఉపయోగపడుతుంది.';
  }
  if (n.includes('cholesterol') || n.includes('ldl') || n.includes('hdl') || n.includes('triglyceride')) {
    return 'ఈ పరీక్ష రక్తంలోని కొవ్వు (లిపిడ్) స్థాయిలను తెలుసుకోవడానికి ఉపయోగపడుతుంది.';
  }
  return `${testName} అనేది మీ ఆరోగ్య స్థితిని అంచనా వేయడానికి చేసే సాధారణ ప్రయోగశాల పరీక్ష.`;
}

export function buildAbnormalLabTeluguExplanation(
  testName,
  value,
  unit,
  referenceRange,
  flag,
  existingExplanationTe = ''
) {
  if (flag !== 'HIGH' && flag !== 'LOW') {
    return existingExplanationTe || '';
  }

  if (existingExplanationTe && /[\u0C00-\u0C7F]/.test(existingExplanationTe)) {
    return existingExplanationTe.trim();
  }

  const directionTe = flag === 'HIGH' ? 'ఎక్కువగా (HIGH)' : 'తక్కువగా (LOW)';
  const rangeSentenceTe = referenceRange
    ? `ఈ రిపోర్ట్‌లో సాధారణ పరిమితి (Reference Range) ${referenceRange} గా ఇవ్వబడింది; మీ ఫలితం (${value}${unit ? ` ${unit}` : ''}) ఈ పరిమితి కంటే ${directionTe} ఉంది.`
    : `ఈ రిపోర్ట్‌లో ఈ ఫలితం (${value}${unit ? ` ${unit}` : ''}) ${directionTe} గుర్తించబడింది.`;

  const purposeTe = getTeluguTestPurpose(testName);
  const safetyTe = 'అర్హత కలిగిన వైద్య నిపుణులు మీ మొత్తం ఆరోగ్య పరిస్థితిని బట్టి ఈ ఫలితాన్ని వివరిస్తారు.';

  return `${rangeSentenceTe}\n\n${purposeTe}\n\n${safetyTe}`;
}

function buildMedicineTeluguInstructions(med) {
  if (med.instructionsTe && /[\u0C00-\u0C7F]/.test(med.instructionsTe)) {
    return med.instructionsTe.trim();
  }
  const parts = [];
  const freq = String(med.frequency || '').toLowerCase();
  if (freq.includes('twice') || freq.includes('bd') || freq.includes('1-0-1')) {
    parts.push('రోజుకు రెండుసార్లు');
  } else if (freq.includes('thrice') || freq.includes('tid') || freq.includes('1-1-1')) {
    parts.push('రోజుకు మూడుసార్లు');
  } else if (freq.includes('once') || freq.includes('od') || freq.includes('daily')) {
    parts.push('రోజుకు ఒకసారి');
  } else if (med.frequency) {
    parts.push(med.frequency);
  }

  if (med.timing === 'Morning') parts.push('ఉదయం');
  else if (med.timing === 'Afternoon') parts.push('మధ్యాహ్నం');
  else if (med.timing === 'Evening') parts.push('రాత్రి');

  const inst = String(med.instructions || '').toLowerCase();
  if (inst.includes('after meal') || inst.includes('after food') || inst.includes('after breakfast') || inst.includes('after dinner')) {
    parts.push('భోజనం తర్వాత');
  } else if (inst.includes('before meal') || inst.includes('before breakfast') || inst.includes('empty stomach')) {
    parts.push('భోజనానికి ముందు');
  } else if (inst.includes('bedtime')) {
    parts.push('పడుకునే ముందు');
  }

  if (med.duration) {
    parts.push(`(${med.duration})`);
  }

  return parts.join(' • ');
}

function buildDeterministicTeluguSummary({
  docType,
  isReadable,
  doctorName,
  hospitalOrLab,
  date,
  medicines,
  labTests,
  diagnostic,
  discharge,
  vaccinations,
  medicalHistory,
  existingSummaryTe
}) {
  if (!isReadable) {
    return 'కొన్ని వివరాలు స్పష్టంగా చదవడానికి వీలుకాలేదు.';
  }

  let baseTe =
    existingSummaryTe && /[\u0C00-\u0C7F]/.test(existingSummaryTe)
      ? existingSummaryTe.trim()
      : '';

  if (labTests.length > 0) {
    const missingLabNumbers = labTests.some((t) => t.value && !baseTe.includes(String(t.value)));
    if (!baseTe || missingLabNumbers) {
      const normalTests = labTests.filter((t) => t.flag === 'NORMAL');
      const highTests = labTests.filter((t) => t.flag === 'HIGH');
      const lowTests = labTests.filter((t) => t.flag === 'LOW');
      const parts = [
        baseTe ||
          `ఈ రక్త పరీక్ష రిపోర్ట్${date ? ` (${date})` : ''} రక్త ఆరోగ్యం మరియు జీవక్రియ వివరాలను పరిశీలిస్తుంది.`
      ];
      if (highTests.length > 0) {
        parts.push(
          `ముఖ్య గమనిక: ${highTests
            .map(
              (t) =>
                `${t.testName}: ${t.value}${t.unit ? ` ${t.unit}` : ''}${
                  t.referenceRange ? ` (రిపోర్ట్ సాధారణ పరిమితి: ${t.referenceRange})` : ''
                }`
            )
            .join(', ')} సాధారణ పరిమితి కంటే ఎక్కువగా (HIGH) ఉన్నాయి.`
        );
      }
      if (lowTests.length > 0) {
        parts.push(
          `${lowTests
            .map(
              (t) =>
                `${t.testName}: ${t.value}${t.unit ? ` ${t.unit}` : ''}${
                  t.referenceRange ? ` (రిపోర్ట్ సాధారణ పరిమితి: ${t.referenceRange})` : ''
                }`
            )
            .join(', ')} సాధారణ పరిమితి కంటే తక్కువగా (LOW) ఉన్నాయి.`
        );
      }
      if (normalTests.length > 0) {
        parts.push(
          `సాధారణ పరిమితిలో (NORMAL) ఉన్న విలువలు: ${normalTests
            .map((t) => `${t.testName} (${t.value}${t.unit ? ` ${t.unit}` : ''})`)
            .join(', ')}.`
        );
      }
      if (medicines.length > 0) {
        parts.push(
          `సూచించిన మందులు: ${medicines
            .map((m) => `${m.name} ${m.strength || m.dosage}`.trim())
            .join(', ')}.`
        );
      }
      return parts.join(' ');
    }
  }

  if (medicines.length > 0) {
    const missingMedNames = medicines.some(
      (m) => m.name && !baseTe.toLowerCase().includes(String(m.name).toLowerCase())
    );
    if (!baseTe || missingMedNames) {
      const medList = medicines
        .map((m) => `${m.name} ${m.strength || m.dosage}`.trim())
        .join(', ');
      return baseTe
        ? `${baseTe} నమోదైన మందులు: ${medList}.`
        : `ఈ ప్రిస్క్రిప్షన్${date ? ` (${date})` : ''}${
            doctorName ? ` డా. ${doctorName} గారిచే` : ''
          } సూచించబడిన ${medicines.length} మందులను కలిగి ఉంది: ${medList}.`;
    }
  }

  if (baseTe) {
    return baseTe;
  }

  if (docType === 'DISCHARGE_SUMMARY') {
    const diagText =
      discharge.diagnoses && discharge.diagnoses.length > 0
        ? ` ఇందులో నమోదు చేయబడిన నిర్ధారణలు: ${discharge.diagnoses.join(', ')}.`
        : '';
    return `ఈ డిశ్చార్జ్ సారాంశం${date ? ` (${date})` : ''} ${discharge.hospital || hospitalOrLab || 'ఆసుపత్రి'}లో జరిగిన చికిత్స మరియు పరిశీలన వివరాలను తెలుపుతుంది.${diagText}`;
  }

  if (docType === 'XRAY' || docType === 'SCANNING') {
    const imp = diagnostic.impression ? ` ముఖ్య పరిశీలన (Impression): ${diagnostic.impression}` : '';
    return `ఈ ${diagnostic.modality || docType} రిపోర్ట్${date ? ` (${date})` : ''} పరీక్ష వివరాలను చూపుతుంది.${imp}`;
  }

  if (docType === 'VACCINATION' && vaccinations.length > 0) {
    const vacNames = vaccinations
      .map((v) => `${v.vaccine}${v.doseSequence ? ` (${v.doseSequence})` : ''}`)
      .join(', ');
    return `ఈ టీకా (Vaccination) రికార్డు${date ? ` (${date})` : ''} ప్రకారం వేయబడిన టీకా: ${vacNames}.`;
  }

  if (docType === 'MEDICAL_HISTORY' && medicalHistory.conditions.length > 0) {
    return `ఈ వైద్య చరిత్ర (Medical History) రికార్డు${date ? ` (${date})` : ''} లో నమోదైన ఆరోగ్య వివరాలు: ${medicalHistory.conditions.join(', ')}.`;
  }

  return 'ఈ వైద్య రిపోర్ట్ నుండి ముఖ్యమైన ఆరోగ్య వివరాలు సేకరించబడ్డాయి.';
}

function normalizeExtractedData(rawObj, expectedCategory = 'BLOOD_TEST', fallbackTitle = 'Medical Record') {
  const fallbackType = VALID_DOC_TYPES.has(expectedCategory) ? expectedCategory : 'BLOOD_TEST';
  if (!rawObj || typeof rawObj !== 'object') {
    return {
      documentType: fallbackType,
      isReadable: false,
      unreadableMessage: 'Some information could not be read clearly.',
      internalConfidence: 0,
      title: fallbackTitle,
      date: '',
      isoDate: '',
      doctorName: '',
      hospitalOrLab: '',
      patientName: '',
      summary: 'Some information could not be read clearly.',
      summaryTe: 'కొన్ని వివరాలు స్పష్టంగా చదవడానికి వీలుకాలేదు.',
      keyFindings: [],
      keyFindingsTe: [],
      valuesToDiscuss: [],
      medicines: [],
      labTests: [],
      diagnostic: { modality: '', bodyArea: '', reportText: '', impression: '' },
      discharge: {
        hospital: '',
        doctor: '',
        admissionDate: '',
        dischargeDate: '',
        diagnoses: [],
        procedures: [],
        importantInstructions: '',
        followUp: ''
      },
      vaccinations: [],
      medicalHistory: { conditions: [], date: '', doctorOrHospital: '', relevantNotes: '' }
    };
  }

  const docType = VALID_DOC_TYPES.has(rawObj.documentType) ? rawObj.documentType : fallbackType;
  const isReadable = Boolean(rawObj.isReadable);

  const medicines = Array.isArray(rawObj.medicines)
    ? rawObj.medicines
        .filter((m) => m && m.name)
        .map((m) => {
          const item = {
            name: String(m.name || '').trim(),
            strength: String(m.strength || m.dosage || '').trim(),
            dosage: String(m.dosage || m.strength || '1 tablet').trim(),
            frequency: String(m.frequency || 'Once daily').trim(),
            duration: String(m.duration || '').trim(),
            route: String(m.route || 'Oral').trim(),
            timing:
              m.timing === 'Afternoon' || m.timing === 'Evening' ? m.timing : 'Morning',
            instructions: String(m.instructions || '').trim(),
            instructionsTe: String(m.instructionsTe || '').trim()
          };
          item.instructionsTe = buildMedicineTeluguInstructions(item);
          return item;
        })
    : [];

  const labTests = Array.isArray(rawObj.labTests)
    ? rawObj.labTests
        .filter((t) => t && t.testName)
        .map((t) => {
          const testName = String(t.testName || '').trim();
          const value = String(t.value ?? '').trim();
          const unit = String(t.unit || '').trim();
          const rawRange = String(t.referenceRange || '').trim();
          const referenceRange = /^(n\/a|none|not provided|not listed|not available|unknown|unspecified|-|—)$/i.test(
            rawRange
          )
            ? ''
            : rawRange;

          const flag = evaluateLabStatusFromProvidedRange(value, referenceRange, t.flag);
          const explanation = buildAbnormalLabExplanation(
            testName,
            value,
            unit,
            referenceRange,
            flag,
            String(t.explanation || '').trim()
          );
          const explanationTe = buildAbnormalLabTeluguExplanation(
            testName,
            value,
            unit,
            referenceRange,
            flag,
            String(t.explanationTe || '').trim()
          );

          return {
            testName,
            value,
            unit,
            referenceRange,
            flag,
            explanation,
            explanationTe
          };
        })
    : [];

  const diagnostic = rawObj.diagnostic && typeof rawObj.diagnostic === 'object'
    ? {
        modality: String(rawObj.diagnostic.modality || '').trim(),
        bodyArea: String(rawObj.diagnostic.bodyArea || '').trim(),
        reportText: String(rawObj.diagnostic.reportText || '').trim(),
        impression: String(rawObj.diagnostic.impression || '').trim()
      }
    : { modality: '', bodyArea: '', reportText: '', impression: '' };

  const discharge = rawObj.discharge && typeof rawObj.discharge === 'object'
    ? {
        hospital: String(rawObj.discharge.hospital || rawObj.hospitalOrLab || '').trim(),
        doctor: String(rawObj.discharge.doctor || rawObj.doctorName || '').trim(),
        admissionDate: String(rawObj.discharge.admissionDate || '').trim(),
        dischargeDate: String(rawObj.discharge.dischargeDate || rawObj.date || '').trim(),
        diagnoses: Array.isArray(rawObj.discharge.diagnoses)
          ? rawObj.discharge.diagnoses.map((d) => String(d).trim()).filter(Boolean)
          : [],
        procedures: Array.isArray(rawObj.discharge.procedures)
          ? rawObj.discharge.procedures.map((p) => String(p).trim()).filter(Boolean)
          : [],
        importantInstructions: String(rawObj.discharge.importantInstructions || '').trim(),
        followUp: String(rawObj.discharge.followUp || '').trim()
      }
    : {
        hospital: '',
        doctor: '',
        admissionDate: '',
        dischargeDate: '',
        diagnoses: [],
        procedures: [],
        importantInstructions: '',
        followUp: ''
      };

  const vaccinations = Array.isArray(rawObj.vaccinations)
    ? rawObj.vaccinations
        .filter((v) => v && v.vaccine)
        .map((v) => ({
          vaccine: String(v.vaccine || '').trim(),
          date: String(v.date || rawObj.date || '').trim(),
          doseSequence: String(v.doseSequence || '').trim(),
          providerOrLocation: String(v.providerOrLocation || rawObj.hospitalOrLab || '').trim()
        }))
    : [];

  const medicalHistory =
    rawObj.medicalHistory && typeof rawObj.medicalHistory === 'object'
      ? {
          conditions: Array.isArray(rawObj.medicalHistory.conditions)
            ? rawObj.medicalHistory.conditions.map((c) => String(c).trim()).filter(Boolean)
            : [],
          date: String(rawObj.medicalHistory.date || rawObj.date || '').trim(),
          doctorOrHospital: String(
            rawObj.medicalHistory.doctorOrHospital ||
              rawObj.doctorName ||
              rawObj.hospitalOrLab ||
              ''
          ).trim(),
          relevantNotes: String(rawObj.medicalHistory.relevantNotes || '').trim()
        }
      : { conditions: [], date: '', doctorOrHospital: '', relevantNotes: '' };

  // Build keyFindings from actual extracted document data if not provided by model
  let keyFindings = Array.isArray(rawObj.keyFindings)
    ? rawObj.keyFindings.map((k) => String(k).trim()).filter(Boolean)
    : [];

  if (isReadable && keyFindings.length === 0) {
    if (labTests.length > 0) {
      const normalCount = labTests.filter((t) => t.flag === 'NORMAL').length;
      const abnormalTests = labTests.filter((t) => t.flag === 'HIGH' || t.flag === 'LOW');
      const unknownCount = labTests.filter((t) => t.flag === 'UNKNOWN').length;
      if (normalCount > 0) {
        keyFindings.push(
          `${normalCount} of ${labTests.length} reported test values are within the report's reference ranges.`
        );
      }
      for (const abn of abnormalTests) {
        keyFindings.push(
          `${abn.testName}: ${abn.value}${abn.unit ? ` ${abn.unit}` : ''} (${abn.flag} compared to report reference range ${abn.referenceRange}).`
        );
      }
      if (unknownCount > 0) {
        keyFindings.push(
          `${unknownCount} test value(s) do not list a reference range on this report (status: UNKNOWN).`
        );
      }
    } else if (medicines.length > 0) {
      for (const m of medicines) {
        keyFindings.push(
          `${m.name} (${m.strength || m.dosage}) — ${m.frequency}${m.duration ? ` for ${m.duration}` : ''}${m.instructions ? ` (${m.instructions})` : ''}`
        );
      }
    } else if (diagnostic.impression || diagnostic.reportText) {
      if (diagnostic.modality) keyFindings.push(`Study: ${diagnostic.modality}${diagnostic.bodyArea ? ` (${diagnostic.bodyArea})` : ''}`);
      if (diagnostic.impression) keyFindings.push(`Impression: ${diagnostic.impression}`);
    } else if (discharge.diagnoses.length > 0) {
      keyFindings.push(`Recorded Diagnoses: ${discharge.diagnoses.join(', ')}`);
      if (discharge.followUp) keyFindings.push(`Follow-up: ${discharge.followUp}`);
    } else if (vaccinations.length > 0) {
      for (const v of vaccinations) {
        keyFindings.push(`${v.vaccine}${v.doseSequence ? ` — ${v.doseSequence}` : ''}${v.date ? ` (${v.date})` : ''}`);
      }
    } else if (medicalHistory.conditions.length > 0) {
      keyFindings.push(`Recorded Conditions: ${medicalHistory.conditions.join(', ')}`);
    }
  }

  let keyFindingsTe = Array.isArray(rawObj.keyFindingsTe)
    ? rawObj.keyFindingsTe.map((k) => String(k).trim()).filter(Boolean)
    : [];

  // Build valuesToDiscuss from abnormal lab values (HIGH or LOW)
  const valuesToDiscuss = labTests
    .filter((t) => t.flag === 'HIGH' || t.flag === 'LOW')
    .map((t) => ({
      testOrFinding: t.testName,
      reportedValue: `${t.value}${t.unit ? ` ${t.unit}` : ''}`.trim(),
      referenceRange: t.referenceRange,
      status: t.flag,
      explanation:
        t.explanation ||
        buildAbnormalLabExplanation(t.testName, t.value, t.unit, t.referenceRange, t.flag),
      explanationTe:
        t.explanationTe ||
        buildAbnormalLabTeluguExplanation(t.testName, t.value, t.unit, t.referenceRange, t.flag)
    }));

  const summaryTe = buildDeterministicTeluguSummary({
    docType,
    isReadable,
    doctorName: String(rawObj.doctorName || '').trim(),
    hospitalOrLab: String(rawObj.hospitalOrLab || '').trim(),
    date: String(rawObj.date || '').trim(),
    medicines,
    labTests,
    diagnostic,
    discharge,
    vaccinations,
    medicalHistory,
    existingSummaryTe: String(rawObj.summaryTe || '').trim()
  });

  return {
    documentType: docType,
    isReadable,
    unreadableMessage: isReadable
      ? ''
      : String(rawObj.unreadableMessage || 'Some information could not be read clearly.'),
    internalConfidence:
      typeof rawObj.internalConfidence === 'number'
        ? Math.max(0, Math.min(1, rawObj.internalConfidence))
        : isReadable
          ? 0.88
          : 0.1,
    title: String(rawObj.title || fallbackTitle).trim(),
    date: String(rawObj.date || '').trim(),
    isoDate: String(rawObj.isoDate || '').trim(),
    doctorName: String(rawObj.doctorName || '').trim(),
    hospitalOrLab: String(rawObj.hospitalOrLab || '').trim(),
    patientName: String(rawObj.patientName || '').trim(),
    summary: isReadable
      ? String(rawObj.summary || 'Structured medical information extracted for your review.').trim()
      : 'Some information could not be read clearly.',
    summaryTe,
    keyFindings,
    keyFindingsTe,
    valuesToDiscuss,
    medicines,
    labTests,
    diagnostic,
    discharge,
    vaccinations,
    medicalHistory
  };
}

/**
 * Dedicated backend service for AI Medical Record Intelligence & OCR extraction.
 */
export async function extractMedicalDocument({
  dataUrl = '',
  mimeType = '',
  fileName = 'Uploaded_Document',
  expectedCategory = 'BLOOD_TEST',
  rawTextHint = ''
}) {
  const ai = getGenAIClient();
  const { inlinePart, decodedSvgText } = parseAttachmentDataUrl({
    dataUrl,
    mimeType,
    name: fileName
  });

  const combinedText = [decodedSvgText, rawTextHint].filter(Boolean).join('\n').trim();

  // Fast guard if no binary data and no text content at all
  if (!inlinePart && !combinedText) {
    return {
      extractedData: normalizeExtractedData(null, expectedCategory, fileName),
      model: 'validation-guard',
      timestamp: new Date().toISOString()
    };
  }

  // Guard for tiny 1x1 blank/corrupted image (< 160 bytes base64) with no text
  if (inlinePart && !combinedText && inlinePart.data.length < 160) {
    return {
      extractedData: normalizeExtractedData(
        {
          documentType: expectedCategory,
          isReadable: false,
          unreadableMessage: 'Some information could not be read clearly.',
          internalConfidence: 0.05
        },
        expectedCategory,
        fileName
      ),
      model: 'image-clarity-guard',
      timestamp: new Date().toISOString()
    };
  }

  const promptText = `Analyze this uploaded medical document (File name: "${fileName}", Expected category hint: "${expectedCategory}").
${combinedText ? `Document Text Content:\n${combinedText}\n` : ''}
Extract all structured fields according to the required JSON schema. Return ONLY valid JSON.`;

  const now = Date.now();
  const activeModels = [
    ...PREFERRED_MODELS.filter((m) => (modelCooldownUntil.get(m) || 0) <= now),
    ...PREFERRED_MODELS.filter((m) => (modelCooldownUntil.get(m) || 0) > now)
  ];

  let lastError = null;

  // 1. Primary: Modern Gemini Interactions API
  if (ai.interactions && typeof ai.interactions.create === 'function') {
    for (const modelName of activeModels) {
      try {
        let interactionInput;
        if (inlinePart) {
          const parts = [{ type: 'text', text: promptText }];
          if (inlinePart.mimeType.startsWith('image/')) {
            parts.push({
              type: 'image',
              data: inlinePart.data,
              mime_type: inlinePart.mimeType
            });
          } else {
            parts.push({
              type: 'document',
              data: inlinePart.data,
              mime_type: inlinePart.mimeType
            });
          }
          interactionInput = parts;
        } else {
          interactionInput = promptText;
        }

        const interaction = await withTimeout(
          ai.interactions.create({
            model: modelName,
            system_instruction: DOCUMENT_EXTRACTION_SYSTEM_PROMPT,
            generation_config: {
              thinking_level: 'minimal',
              temperature: 0.1
            },
            input: interactionInput
          }),
          15000,
          modelName
        );

        const rawOutput = extractInteractionText(interaction);
        const parsed = parseJsonFromModelOutput(rawOutput);
        if (parsed) {
          modelCooldownUntil.delete(modelName);
          return {
            extractedData: normalizeExtractedData(parsed, expectedCategory, fileName),
            model: modelName,
            timestamp: new Date().toISOString()
          };
        }
      } catch (err) {
        lastError = err;
        markModelCooldownIfNeeded(modelName, err);
      }
    }
  }

  // 2. Secondary fallback: ai.models.generateContent
  if (ai.models && typeof ai.models.generateContent === 'function') {
    const userParts = [{ text: promptText }];
    if (inlinePart) {
      userParts.push({
        inlineData: {
          mimeType: inlinePart.mimeType,
          data: inlinePart.data
        }
      });
    }

    for (const modelName of activeModels) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts: userParts }],
            config: {
              systemInstruction: DOCUMENT_EXTRACTION_SYSTEM_PROMPT,
              temperature: 0.1,
              responseMimeType: 'application/json'
            }
          }),
          15000,
          modelName
        );

        const replyText =
          typeof response?.text === 'string'
            ? response.text
            : response?.candidates?.[0]?.content?.parts
                ?.map((p) => p.text || '')
                .join('') || '';

        const parsed = parseJsonFromModelOutput(replyText);
        if (parsed) {
          return {
            extractedData: normalizeExtractedData(parsed, expectedCategory, fileName),
            model: modelName,
            timestamp: new Date().toISOString()
          };
        }
      } catch (err) {
        lastError = err;
        markModelCooldownIfNeeded(modelName, err);
      }
    }
  }

  throw lastError || new Error('Failed to process medical document with Gemini AI.');
}

/**
 * Backend Speech-to-Text Fallback using Google Gemini Developer API Multimodal Audio Understanding.
 * Accepts recorded microphone audio (WebM, WAV, MP4, OGG) and returns the exact spoken transcript
 * without exposing the Gemini API key to the browser.
 */
export async function transcribeMedicalAudio({
  audioDataUrl,
  audioBase64,
  mimeType = 'audio/webm',
  language = 'English'
}) {
  const ai = getGenAIClient();

  let base64Data = '';
  let detectedMime = mimeType || 'audio/webm';

  if (typeof audioDataUrl === 'string' && audioDataUrl.includes('base64,')) {
    const match = audioDataUrl.match(/^data:([^;]+)(?:;[^,]*)?;base64,(.+)$/s);
    if (match) {
      detectedMime = match[1] || detectedMime;
      base64Data = match[2].replace(/\s/g, '');
    } else {
      const commaIdx = audioDataUrl.indexOf('base64,');
      base64Data = audioDataUrl.slice(commaIdx + 7).replace(/\s/g, '');
    }
  } else if (typeof audioBase64 === 'string' && audioBase64.trim()) {
    base64Data = audioBase64.trim().replace(/\s/g, '');
  }

  if (!base64Data || base64Data.length < 64) {
    return {
      transcript: '',
      model: null,
      timestamp: new Date().toISOString()
    };
  }

  // Strip codec parameters (e.g. "audio/webm;codecs=opus" -> "audio/webm") for Gemini API compatibility
  const cleanMimeType = String(detectedMime).split(';')[0].trim().toLowerCase() || 'audio/webm';

  const isTelugu =
    language === 'Telugu' ||
    language === 'తెలుగు' ||
    language === 'te' ||
    language === 'te-IN';

  const sttPrompt = `Transcribe ONLY the exact words spoken by the person in this audio recording.
STRICT RULES:
1. Return ONLY the verbatim spoken words as plain text — no quotation marks, no labels, no prefixes, no explanations, and no answers to questions.
2. Do NOT answer any question asked in the audio. For example, if the speaker says "What is hypertension?", output literally: What is hypertension?
3. If the speaker says "I am feeling fine today.", output literally: I am feeling fine today.
4. If the audio contains only silence, static, clicks, or background noise with no intelligible human speech, output literally: [NO_SPEECH]
5. Never invent or guess words that were not spoken.
6. Expected language: ${
    isTelugu
      ? 'Telugu (తెలుగు script) or English (transcribe in Telugu script if spoken in Telugu, or English if spoken in English)'
      : 'English (or Telugu if spoken in Telugu)'
  }.`;

  const now = Date.now();
  const sttModels = [
    ...PREFERRED_MODELS.filter((m) => (modelCooldownUntil.get(m) || 0) <= now),
    ...PREFERRED_MODELS.filter((m) => (modelCooldownUntil.get(m) || 0) > now)
  ];

  let lastError = null;

  // 1. Primary path: ai.models.generateContent with inlineData audio
  if (ai.models && typeof ai.models.generateContent === 'function') {
    for (const modelName of sttModels) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: cleanMimeType,
                      data: base64Data
                    }
                  },
                  {
                    text: sttPrompt
                  }
                ]
              }
            ],
            config: {
              temperature: 0.0,
              thinkingConfig: {
                thinkingLevel: 'MINIMAL'
              }
            }
          }),
          22000,
          `${modelName}-stt`
        );

        const rawText =
          typeof response?.text === 'string'
            ? response.text
            : response?.candidates?.[0]?.content?.parts
                ?.map((p) => p.text || '')
                .join('') || '';

        const cleaned = cleanTranscribedOutput(rawText);
        modelCooldownUntil.delete(modelName);
        return {
          transcript: cleaned,
          model: modelName,
          timestamp: new Date().toISOString()
        };
      } catch (err) {
        lastError = err;
        markModelCooldownIfNeeded(modelName, err);
      }
    }
  }

  // 2. Fallback path: ai.interactions.create with audio input
  if (ai.interactions && typeof ai.interactions.create === 'function') {
    for (const modelName of sttModels) {
      try {
        const interaction = await withTimeout(
          ai.interactions.create({
            model: modelName,
            generation_config: {
              thinking_level: 'minimal',
              temperature: 0.0
            },
            input: [
              {
                type: 'text',
                text: sttPrompt
              },
              {
                type: 'audio',
                data: base64Data,
                mime_type: cleanMimeType
              }
            ]
          }),
          15000,
          `${modelName}-stt-interactions`
        );

        const rawText = extractInteractionText(interaction);
        const cleaned = cleanTranscribedOutput(rawText);
        return {
          transcript: cleaned,
          model: modelName,
          timestamp: new Date().toISOString()
        };
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError || new Error('Speech transcription service is temporarily unavailable.');
}

function cleanTranscribedOutput(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = rawText.trim();
  if (
    !text ||
    text.includes('[NO_SPEECH]') ||
    text.toUpperCase() === 'NO_SPEECH' ||
    text.toLowerCase() === 'silence' ||
    text.toLowerCase() === '[silence]'
  ) {
    return '';
  }
  // Strip surrounding quotes if model wrapped transcript in quotes
  text = text.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();
  // Strip accidental "Transcript:" prefix if present
  text = text.replace(/^(transcript|transcription)\s*:\s*/i, '').trim();
  return text;
}

/**
 * Connect/Vite-compatible HTTP middleware for /api/medical-copilot and /api/medical-records/extract
 */
const ALLOWED_EXACT_ORIGINS = new Set([
  'https://bunny-void.github.io'
]);

/**
 * Computes strict CORS response headers allowing https://bunny-void.github.io,
 * localhost/127.0.0.1 for local development, and *.netlify.app preview origins.
 */
export function getCorsHeaders(originHeader = '') {
  const origin = String(originHeader || '').trim().replace(/\/+$/, '');
  const customAllowed = String(process.env.ALLOWED_CORS_ORIGIN || '').trim().replace(/\/+$/, '');

  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  const isNetlifyPreview = /^https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(origin);
  const isAllowedOrigin =
    ALLOWED_EXACT_ORIGINS.has(origin) ||
    isLocalhost ||
    isNetlifyPreview ||
    (Boolean(customAllowed) && origin === customAllowed);

  const allowOriginValue = isAllowedOrigin ? origin : 'https://bunny-void.github.io';

  return {
    'Access-Control-Allow-Origin': allowOriginValue,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Origin, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

/**
 * Shared Netlify Function handler adapter that routes serverless events to the
 * existing Sanjeevani Gemini backend functions without duplicating business logic.
 */
export async function handleNetlifyFunctionEvent(event, defaultRoute = '/api/medical-copilot') {
  const headers = event?.headers || {};
  const origin = headers.origin || headers.Origin || '';
  const corsHeaders = getCorsHeaders(origin);
  const httpMethod = String(event?.httpMethod || 'POST').toUpperCase();
  const routePath = String(event?.path || event?.rawUrl || defaultRoute);

  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  // Health check endpoint
  if (
    httpMethod === 'GET' &&
    (routePath.includes('/health') || defaultRoute === '/api/medical-copilot/health')
  ) {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: hasKey ? 'ok' : 'missing_api_key',
        configured: hasKey
      })
    };
  }

  if (httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' })
    };
  }

  try {
    let rawBody = event?.body || '';
    if (event?.isBase64Encoded && rawBody) {
      rawBody = Buffer.from(rawBody, 'base64').toString('utf-8');
    }
    const body =
      typeof rawBody === 'string' && rawBody.trim()
        ? JSON.parse(rawBody)
        : typeof rawBody === 'object' && rawBody !== null
        ? rawBody
        : {};

    // 1. Medical Record OCR & Extraction (/api/medical-records/extract)
    if (
      defaultRoute === '/api/medical-records/extract' ||
      routePath.includes('/medical-records/extract') ||
      routePath.includes('medical-records-extract')
    ) {
      const extractionResult = await extractMedicalDocument({
        dataUrl: body.dataUrl,
        mimeType: body.mimeType,
        fileName: body.fileName,
        expectedCategory: body.expectedCategory,
        rawTextHint: body.rawTextHint
      });
      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(extractionResult)
      };
    }

    // 2. Backend Speech-to-Text Fallback (/api/medical-copilot/transcribe)
    if (
      defaultRoute === '/api/medical-copilot/transcribe' ||
      routePath.includes('/medical-copilot/transcribe') ||
      routePath.includes('medical-copilot-transcribe')
    ) {
      const sttResult = await transcribeMedicalAudio({
        audioDataUrl: body.audioDataUrl || body.dataUrl,
        audioBase64: body.audioBase64,
        mimeType: body.mimeType,
        language: body.language || body.appLanguage || 'English'
      });
      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sttResult)
      };
    }

    // 3. Medical AI Copilot (/api/medical-copilot)
    const result = await generateMedicalCopilotReply({
      message: body.message || body.question,
      history: body.history,
      previousInteractionId: body.previousInteractionId,
      appContext: body.appContext,
      attachments: body.attachments,
      language: body.language || body.appLanguage || 'English'
    });

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...result, answer: result.reply })
    };
  } catch (err) {
    console.error('[Sanjeevani Medical AI Error]:', err?.message || err);
    return {
      statusCode: 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Medical AI service is temporarily unavailable.',
        details: err?.message || 'Unknown AI service error'
      })
    };
  }
}

/**
 * Connect/Vite-compatible HTTP middleware for /api/medical-copilot and /api/medical-records/extract
 */
export function createMedicalCopilotMiddleware() {
  return async (req, res, next) => {
    if (
      !req.url ||
      (!req.url.startsWith('/api/medical-copilot') &&
        !req.url.startsWith('/api/medical-records'))
    ) {
      return next();
    }

    const corsHeaders = getCorsHeaders(req.headers?.origin || '');
    for (const [k, v] of Object.entries(corsHeaders)) {
      res.setHeader(k, v);
    }

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.url.startsWith('/api/medical-copilot/health') && req.method === 'GET') {
      if (!process.env.GEMINI_API_KEY) {
        try {
          dotenv.config({ path: path.join(projectRoot, '.env') });
        } catch {}
      }
      const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          status: hasKey ? 'ok' : 'missing_api_key',
          configured: hasKey
        })
      );
      return;
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
      return;
    }

    try {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const rawBody = Buffer.concat(chunks).toString('utf-8');
      const body = rawBody ? JSON.parse(rawBody) : {};

      // Route 1: Dedicated AI Document OCR & Structured Extraction
      if (req.url.startsWith('/api/medical-records/extract')) {
        const extractionResult = await extractMedicalDocument({
          dataUrl: body.dataUrl,
          mimeType: body.mimeType,
          fileName: body.fileName,
          expectedCategory: body.expectedCategory,
          rawTextHint: body.rawTextHint
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(extractionResult));
        return;
      }

      // Route 1b: Backend Speech-to-Text Fallback (/api/medical-copilot/transcribe)
      if (req.url.startsWith('/api/medical-copilot/transcribe')) {
        const sttResult = await transcribeMedicalAudio({
          audioDataUrl: body.audioDataUrl || body.dataUrl,
          audioBase64: body.audioBase64,
          mimeType: body.mimeType,
          language: body.language || body.appLanguage || 'English'
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(sttResult));
        return;
      }

      // Route 2: Multi-Turn Medical AI Copilot
      const result = await generateMedicalCopilotReply({
        message: body.message || body.question,
        history: body.history,
        previousInteractionId: body.previousInteractionId,
        appContext: body.appContext,
        attachments: body.attachments,
        language: body.language || body.appLanguage || 'English'
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ...result, answer: result.reply }));
    } catch (err) {
      console.error('[Sanjeevani Medical AI Error]:', err?.message || err);
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'Medical AI service is temporarily unavailable.',
          details: err?.message || 'Unknown AI service error'
        })
      );
    }
  };
}
