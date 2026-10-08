export type PrototypeState = 'AWAITING_CHECKIN' | 'SAFE' | 'NOT_OK' | 'CRITICAL' | 'MONITORING';

export type LanguageOption = 'English' | 'Telugu' | 'Telgish';

export type MedicationStatus =
  | 'UPCOMING'
  | 'DUE'
  | 'TAKEN'
  | 'PENDING'
  | 'MISSED'
  | 'NEEDS_REFILL'
  | 'ORDERED'
  | 'REMINDER';

export type CountdownResult = 'IM_OK' | 'CALL_FOR_HELP' | 'NO_RESPONSE' | 'CANCELLED';

export type ReportCategoryId =
  | 'PRESCRIPTION'
  | 'BLOOD_TEST'
  | 'XRAY'
  | 'SCANNING'
  | 'DISCHARGE_SUMMARY'
  | 'VACCINATION'
  | 'MEDICAL_HISTORY';

export type ReportProcessingStatus =
  | 'Uploaded'
  | 'Processing'
  | 'Ready'
  | 'Needs Review'
  | 'Unreadable'
  | 'Error';

export interface ExtractedMedicineItem {
  name: string;
  strength?: string;
  dosage: string;
  frequency: string;
  duration?: string;
  route?: string;
  timing?: 'Morning' | 'Afternoon' | 'Evening';
  instructions?: string;
  instructionsTe?: string;
}

export type LabAbnormalFlag = 'NORMAL' | 'HIGH' | 'LOW' | 'UNKNOWN';

export interface ExtractedLabItem {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: LabAbnormalFlag;
  explanation?: string;
  explanationTe?: string;
}

export interface ValueToDiscussItem {
  testOrFinding: string;
  reportedValue: string;
  referenceRange: string;
  status: LabAbnormalFlag;
  explanation: string;
  explanationTe?: string;
}

export interface ExtractedDiagnosticInfo {
  modality?: string;
  bodyArea?: string;
  reportText?: string;
  impression?: string;
}

export interface ExtractedDischargeInfo {
  hospital?: string;
  doctor?: string;
  admissionDate?: string;
  dischargeDate?: string;
  diagnoses: string[];
  procedures: string[];
  importantInstructions?: string;
  followUp?: string;
}

export interface ExtractedVaccinationInfo {
  vaccine: string;
  date?: string;
  doseSequence?: string;
  providerOrLocation?: string;
}

export interface ExtractedMedicalHistoryInfo {
  conditions: string[];
  date?: string;
  doctorOrHospital?: string;
  relevantNotes?: string;
}

export interface ExtractedMedicalData {
  documentType: ReportCategoryId;
  isReadable: boolean;
  unreadableMessage?: string;
  internalConfidence?: number; // 0.0 - 1.0 kept internally, not presented as clinical certainty
  title?: string;
  date?: string;
  isoDate?: string;
  doctorName?: string;
  hospitalOrLab?: string;
  patientName?: string;
  summary: string;
  summaryTe?: string;
  keyFindings?: string[];
  keyFindingsTe?: string[];
  valuesToDiscuss?: ValueToDiscussItem[];
  medicines?: ExtractedMedicineItem[];
  labTests?: ExtractedLabItem[];
  diagnostic?: ExtractedDiagnosticInfo;
  discharge?: ExtractedDischargeInfo;
  vaccinations?: ExtractedVaccinationInfo[];
  medicalHistory?: ExtractedMedicalHistoryInfo;
}

export interface MedicalReport {
  id: string;
  category: ReportCategoryId;
  documentType?: ReportCategoryId;
  title: string;
  date: string; // e.g., "12 Apr 2025"
  isoDate: string; // e.g., "2025-04-12" for reliable sorting
  createdAt?: string;
  fileType: 'PDF' | 'PNG' | 'JPG' | 'JPEG';
  mimeType: string;
  fileName: string;
  fileDataUrl?: string; // base64 data URL for uploaded or generated preview/download
  sourceFile?: string; // alias for source file dataUrl/name
  extractedSummaryText?: string; // structured text/findings for Copilot & summary view
  summary?: string; // plain-language AI summary (English)
  summaryTe?: string; // plain-language AI summary (Telugu / తెలుగు సారాంశం)
  extractedData?: ExtractedMedicalData;
  processingStatus?: ReportProcessingStatus;
  isDemoReport?: boolean;
}

export interface CopilotAttachment {
  id: string;
  kind: 'PHOTO' | 'FILE' | 'MEDICAL_REPORT';
  name: string;
  mimeType: string;
  fileTypeLabel: string;
  dataUrl?: string; // base64 data URL (image or PDF)
  reportId?: string;
  reportCategory?: ReportCategoryId;
  reportDate?: string;
  extractedText?: string;
}

export type ActiveViewType =
  | 'dashboard'
  | 'call'
  | 'medications'
  | 'appointments'
  | 'reports'
  | 'demo_center'
  | 'profile'
  | 'history'
  | 'onboarding'
  | 'shock_identifier'
  | 'copilot';

export type ActiveModalType =
  | 'none'
  | 'emergency_countdown'
  | 'emergency_verification'
  | 'simulated_emergency'
  | 'medication_reminder'
  | 'appointment_reminder'
  | 'pharmacy_handoff'
  | 'notifications';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  address: string;
}

export interface HealthProfile {
  currentHealthIssues: string[];
  currentHealthStatus: string;
  heartBpm: number;
  bloodPressure: string; // e.g., "128/82 mmHg"
  heightCm: number;
  weightKg: number;
  bmi: number;
  allergies: string[];
}

export interface User {
  id: string;
  abhaId?: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  countryCode: string;
  phone: string;
  email: string;
  occupation: string;
  address: string;
  healthProfile: HealthProfile;
  emergencyContact: EmergencyContact;
  checkInTime: string; // e.g., "09:00 AM"
  enableVideo: boolean;
  language: LanguageOption;
  notificationsEnabled: boolean;
  voicePermissionsGranted: boolean;
}

// Keep PatientProfile alias/compatibility for existing components
export interface PatientProfile extends User {
  medicalConditions: string[];
  currentMedicines: Medication[];
}

export interface Medication {
  id: string;
  day: string; // e.g., "Every day" or "Monday • Wednesday • Friday"
  days?: string[]; // e.g., ["Monday", "Wednesday", "Friday"]
  name: string;
  dosage: string; // e.g., "10 mg"
  frequency: string; // e.g., "1 tablet"
  timing: 'Morning' | 'Afternoon' | 'Evening';
  scheduledTime: string; // e.g., "08:00 AM"
  status: MedicationStatus;
  timeTaken?: string;
  refillStatus?: 'NORMAL' | 'NEEDS_REFILL' | 'ORDERED';
  orderStatus?: 'NONE' | 'DEMO_ORDERED' | 'CANCELLED';
  prescriptionFileName?: string;
  addedDate?: string; // e.g., "05 Oct 2026"
  isoDate?: string; // e.g., "2026-10-05"
  sourceReportId?: string;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string; // e.g., "2026-10-12" or "October 12, 2026"
  time: string; // 12-hour format e.g., "10:30 AM"
  address: string;
  status: 'UPCOMING' | 'ACKNOWLEDGED' | 'COMPLETED';
  notes?: string;
}

export interface CheckInMessage {
  id: string;
  sender: 'AI' | 'USER';
  text: string;
  timestamp: string;
}

export interface AIStatusAssessment {
  status: 'SAFE' | 'NOT_OK' | 'CRITICAL';
  summary: string;
  followUp?: string;
  reason: string;
  confidence: string; // e.g., "Prototype Indicator: High (Wellness Pattern Match)"
}

export interface CheckIn {
  id: string;
  date: string; // e.g., "October 7" or "07 Oct 2026"
  isoDate?: string; // e.g., "2026-10-07"
  timestamp: string; // e.g., "8:31 AM"
  duration: string;
  patientResponse: string;
  classification: PrototypeState;
  medicineResponse?: string;
  videoEnabled: boolean;
  finalStatus: string;
  summary: string;
  reason?: string;
  followUp?: string;
  confidence?: string;
  messages?: CheckInMessage[];
}

export type CheckInLog = CheckIn;

export interface EmergencyLog {
  id: string;
  timestamp: string;
  trigger: string;
  classification: PrototypeState;
  countdownResult: CountdownResult;
  patientResponse: string;
  videoStatus: 'ENABLED' | 'DISABLED';
  verificationResult: string;
  finalResponseStatus: string;
}

export interface PharmacyOrder {
  orderId: string;
  medicineName: string;
  quantity: string;
  pharmacy: string;
  orderDate: string;
  status: 'DEMO_ORDERED' | 'CANCELLED';
  estimatedCost: string;
}

export interface AppNotification {
  id: string;
  type: 'CHECKIN' | 'MEDICATION' | 'APPOINTMENT' | 'EMERGENCY' | 'REFILL';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionView?: ActiveViewType;
  actionModal?: ActiveModalType;
}

export interface HealthNewsItem {
  id: string;
  topic: string;
  category: string;
  shortDescription: string;
  commonSymptoms: string[];
  whenToSeekHelp: string;
  readTime: string;
}

export interface DemoState {
  isSimulating: boolean;
  activeDemoName: string | null;
}

export type CallStatus =
  | 'IDLE'
  | 'READY'
  | 'CONNECTING'
  | 'AI_SPEAKING'
  | 'SPEAKING'
  | 'LISTENING'
  | 'HEARING'
  | 'SPEECH_DETECTED'
  | 'TRANSCRIBING'
  | 'PROCESSING'
  | 'THINKING'
  | 'AI_RESPONDING'
  | 'CALL_ENDED'
  | 'ERROR'
  | 'MIC_DENIED'
  | 'MIC_UNAVAILABLE';

export type TimelineFilterId =
  | 'ALL'
  | 'REPORTS'
  | 'MEDICINES'
  | 'APPOINTMENTS'
  | 'VACCINATIONS'
  | 'WELLNESS';

export type TimelineEventKind =
  | 'BLOOD_TEST'
  | 'PRESCRIPTION'
  | 'DISCHARGE_SUMMARY'
  | 'XRAY'
  | 'SCANNING'
  | 'MEDICAL_HISTORY'
  | 'VACCINATION'
  | 'APPOINTMENT'
  | 'MEDICINE'
  | 'WELLNESS_CHECKIN';

export interface HealthTimelineEvent {
  id: string;
  kind: TimelineEventKind;
  filterCategories: TimelineFilterId[];
  isoDate: string; // YYYY-MM-DD for strict chronological sorting
  displayDate: string; // e.g., "08 Oct 2026"
  sortTimestamp: number; // epoch ms for deterministic ordering
  typeLabel: string; // e.g., "Blood Test", "Prescription", "Doctor Appointment", "Vaccination Record"
  title: string;
  subtitle?: string;
  highlights: string[];
  explicitDiagnoses?: string[];
  hasAiSummary: boolean;
  aiSummarySnippet?: string;
  statusBadge?: {
    label: string;
    tone: 'normal' | 'warning' | 'critical' | 'info';
  };
  sourceReportId?: string;
  sourceAppointmentId?: string;
  sourceMedicationId?: string;
  sourceCheckInId?: string;
}

export interface UnifiedConditionItem {
  name: string;
  source: string;
  isoDate?: string;
}

export interface UnifiedVaccinationItem {
  id: string;
  vaccine: string;
  date: string;
  isoDate: string;
  doseSequence?: string;
  providerOrLocation?: string;
  sourceReportId?: string;
}

export interface UnifiedMedicineItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  schedule: string;
  status: string;
  addedDate?: string;
  isoDate?: string;
  sourcePrescriptionTitle?: string;
  sourcePrescriptionDate?: string;
  addedFromLatestPrescription?: boolean;
}

export interface UnifiedHealthProfileModel {
  personalInfo: {
    id: string;
    name: string;
    age: number;
    gender: string;
    phone: string;
    email: string;
    occupation: string;
    address: string;
    language: LanguageOption;
    emergencyContact: EmergencyContact;
    vitals: {
      heartBpm: number;
      bloodPressure: string;
      heightCm: number;
      weightKg: number;
      bmi: number;
      currentHealthStatus: string;
    };
  };
  explicitConditions: UnifiedConditionItem[];
  allergies: string[];
  medicines: UnifiedMedicineItem[];
  reportsSummary: {
    totalCount: number;
    latestReportDate: string | null;
    latestBloodTest: MedicalReport | null;
    latestPrescription: MedicalReport | null;
    byCategoryCount: Record<ReportCategoryId, number>;
    reports: MedicalReport[];
  };
  appointmentsSummary: {
    upcoming: Appointment[];
    completedOrPast: Appointment[];
    all: Appointment[];
  };
  vaccinations: UnifiedVaccinationItem[];
  recentCheckIns: CheckInLog[];
  timeline: HealthTimelineEvent[];
}

// FHIR-style prototypes for Phase 6
export interface FhirPatient {
  resourceType: 'Patient';
  id: string;
  identifier: { system: string; value: string; }[];
  name: { text: string }[];
  gender: string;
  telecom: { system: string; value: string }[];
}

export interface FhirCondition {
  resourceType: 'Condition';
  id: string;
  subject: { reference: string };
  code: { text: string };
  recordedDate?: string;
}

export interface FhirObservation {
  resourceType: 'Observation';
  id: string;
  status: string;
  code: { text: string };
  subject: { reference: string };
  valueQuantity?: { value: number; unit: string; system?: string; code?: string };
  valueString?: string;
  effectiveDateTime?: string;
  interpretation?: { text: string }[];
}

export interface FhirMedicationStatement {
  resourceType: 'MedicationStatement';
  id: string;
  status: string;
  medicationCodeableConcept: { text: string };
  subject: { reference: string };
  effectiveDateTime?: string;
  dosage?: { text: string }[];
}

export interface FhirDiagnosticReport {
  resourceType: 'DiagnosticReport';
  id: string;
  status: string;
  code: { text: string };
  subject: { reference: string };
  effectiveDateTime?: string;
  presentedForm?: { contentType: string; data: string }[]; // Base64 data etc.
  result?: { reference: string }[];
}

export interface FhirImmunization {
  resourceType: 'Immunization';
  id: string;
  status: string;
  vaccineCode: { text: string };
  patient: { reference: string };
  occurrenceDateTime: string;
  protocolApplied?: { doseNumberString: string }[];
}

export interface FhirEncounter {
  resourceType: 'Encounter';
  id: string;
  status: string;
  class: { code: string; display: string };
  subject: { reference: string };
  period: { start: string };
  participant?: { individual: { display: string } }[];
}
