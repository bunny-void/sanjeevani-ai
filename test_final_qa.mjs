/**
 * Sanjeevani AI — Final Hackathon QA Test Script
 * Tests all Phase 1-6 features and verifies build integrity
 */
import fs from 'fs';
import path from 'path';

const ROOT = '.';
let pass = 0;
let fail = 0;

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅  ${label}`);
    pass++;
  } else {
    console.log(`  ❌  ${label}${detail ? ': ' + detail : ''}`);
    fail++;
  }
}

function fileContains(filePath, strings) {
  if (!fs.existsSync(filePath)) {
    strings.forEach(s => check(`${path.basename(filePath)} → "${s}"`, false, 'file missing'));
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  strings.forEach(s => check(`${path.basename(filePath)} → "${s}"`, content.includes(s)));
}

function fileExists(filePath) {
  const exists = fs.existsSync(filePath);
  check(`File exists: ${path.basename(filePath)}`, exists);
  return exists;
}

console.log('\n=================================================');
console.log('SANJEEVANI AI — FINAL HACKATHON QA PASS');
console.log('=================================================\n');

// ── BUILD ──────────────────────────────────────────────────────────────────
console.log('── BUILD OUTPUT ──');
check('dist/index.html exists', fs.existsSync('dist/index.html'));
check('dist/assets JS bundle exists', fs.readdirSync('dist/assets').some(f => f.endsWith('.js')));
check('dist/assets CSS bundle exists', fs.readdirSync('dist/assets').some(f => f.endsWith('.css')));

// ── PHASE 1: DOCUMENT INGESTION + OCR ──────────────────────────────────────
console.log('\n── PHASE 1: DOCUMENT INGESTION + OCR ──');
fileContains('src/services/reportStorageService.ts', [
  'PRESCRIPTION',
  'BLOOD_TEST',
  'XRAY',
  'SCANNING',
  'DISCHARGE_SUMMARY',
  'VACCINATION',
  'MEDICAL_HISTORY',
  'buildDemoReportSvgDataUrl',
  'DEFAULT_DEMO_REPORTS',
]);
fileContains('src/components/MedicalReportsView.tsx', [
  'AI Summary',
  'processingStatus',
  'fileDataUrl',
]);
fileContains('server/medicalCopilotHandler.js', [
  'extract',
  'gemini',
  'extractedData',
]);

// ── PHASE 2: AI HEALTH SUMMARY + ABNORMAL VALUES ──────────────────────────
console.log('\n── PHASE 2: AI HEALTH SUMMARY + ABNORMAL VALUES ──');
fileContains('src/types/index.ts', [
  'ExtractedLabItem',
  'LabAbnormalFlag',
  'ValueToDiscussItem',
  'summary: string',
  'summaryTe?: string',
  'explanationTe?: string',
]);
fileContains('src/components/MedicalReportsView.tsx', [
  'AI SUMMARY',
  'valuesToDiscuss',
  'ReportSummarySectionsPanel',
]);

// ── PHASE 3: UNIFIED HEALTH TIMELINE ──────────────────────────────────────
console.log('\n── PHASE 3: UNIFIED HEALTH TIMELINE ──');
fileContains('src/services/healthTimelineService.ts', [
  'HealthTimelineEvent',
  'buildUnifiedHealthProfileAndTimeline',
  'BLOOD_TEST',
  'APPOINTMENT',
  'WELLNESS_CHECKIN',
]);
fileContains('src/components/HealthTimelineSection.tsx', [
  'MY HEALTH TIMELINE',
  'TimelineFilterId',
]);

// ── PHASE 4: REPORT-AWARE COPILOT ──────────────────────────────────────────
console.log('\n── PHASE 4: REPORT-AWARE MEDICAL AI COPILOT ──');
fileContains('src/components/MedicalCopilotView.tsx', [
  'medicalReports',
  'appLanguage',
]);
fileContains('server/medicalCopilotHandler.js', [
  'appContext',
  'buildSystemInstruction',
]);

// ── PHASE 5: TELUGU SUPPORT ──────────────────────────────────────────────
console.log('\n── PHASE 5: TELUGU REGIONAL LANGUAGE SUPPORT ──');
fileContains('src/context/AppContext.tsx', [
  "appLanguage: 'English' | 'Telugu'",
  'setAppLanguage',
]);
fileContains('src/components/MedicalCopilotView.tsx', [
  'తెలుగు',
  'Telugu',
]);
fileContains('src/components/MedicalReportsView.tsx', [
  'summaryTe',
  'తెలుగు సారాంశం',
]);

// ── PHASE 6: ABHA/FHIR READINESS ──────────────────────────────────────────
console.log('\n── PHASE 6: ABDM / ABHA / FHIR READINESS ──');
fileContains('src/types/index.ts', [
  'abhaId?: string;',
  'FhirPatient',
  'FhirObservation',
  'FhirMedicationStatement',
  'FhirDiagnosticReport',
  'FhirImmunization',
  'FhirEncounter',
]);
fileContains('src/context/AppContext.tsx', [
  "abhaId: 'ABHA-1234-5678-9012'",
]);
fileContains('src/components/ProfileView.tsx', [
  'ABHA ID',
  '(Demo / Mock)',
  'patient.abhaId',
]);
fileContains('src/services/abdmMappingService.ts', [
  'mapPatientToFhir',
  'mapMedicationsToFhir',
  'mapLabResultToFhirObservation',
  'mapReportToFhirDiagnosticReport',
  'generateFhirBundle',
]);
fileExists('ABDM_Prototype_Architecture.md');

// ── DEMO CENTER ────────────────────────────────────────────────────────────
console.log('\n── DEMO CENTER (HACKATHON PRIMARY PATH) ──');
fileContains('src/components/DemoCenterView.tsx', [
  'PERSONAL HEALTH COPILOT DEMO',
  'Hackathon Primary Path',
  'Patient Profile + ABHA ID',
  'Open Blood Test Report',
  'AI Extraction + Summary + Abnormal Values',
  'Health Timeline',
  'Copilot: Personal Record Query',
  'Copilot: Explain HbA1c',
  'Telugu Support Demo',
  'General Medical Knowledge',
  'UPCOMING FEATURES — ROUND 2',
  'SHOCK IDENTIFIER',
  'Coming in Round 2',
]);

// ── ARCHITECTURE DOCS ──────────────────────────────────────────────────────
console.log('\n── HACKATHON DOCUMENTATION ──');
fileExists('HACKATHON_ARCHITECTURE.md');
fileContains('HACKATHON_ARCHITECTURE.md', [
  'Gemini Developer API',
  'abdmMappingService.ts',
  'FHIR-Style Resources',
]);
fileExists('HACKATHON_PROJECT_EXPLANATION.md');
fileContains('HACKATHON_PROJECT_EXPLANATION.md', [
  'THE PROBLEM',
  'THE SOLUTION',
  'AI VALUE',
  'SAFETY',
  'ABDM / ABHA readiness',
]);

// ── CORE EXISTING FEATURES ─────────────────────────────────────────────────
console.log('\n── EXISTING FEATURES PRESERVED ──');
fileContains('src/components/VoiceCallView.tsx', [
  'Morning AI Check',
]);
fileContains('src/components/MedicationView.tsx', [
  'Medication',
]);
fileContains('src/components/AppointmentView.tsx', [
  'Appointment',
]);
fileContains('src/components/SanjeevaniPharmacyModal.tsx', [
  'pharmacy',
]);

// ── SUMMARY ────────────────────────────────────────────────────────────────
console.log('\n=================================================');
const total = pass + fail;
console.log(`RESULT: ${pass} / ${total} checks passed`);
if (fail === 0) {
  console.log('✅  ALL CHECKS PASSED — Application is hackathon-ready!');
} else {
  console.log(`❌  ${fail} check(s) failed — see above for details`);
}
console.log('=================================================\n');
