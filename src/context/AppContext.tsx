import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  PatientProfile,
  Medication,
  Appointment,
  CheckInLog,
  EmergencyLog,
  PharmacyOrder,
  PrototypeState,
  CallStatus,
  ActiveViewType,
  ActiveModalType,
  AppNotification,
  HealthNewsItem,
  DemoState,
  MedicalReport,
  ReportCategoryId,
  CopilotAttachment,
  UnifiedHealthProfileModel
} from '../types';
import { alarmService } from '../services/alarmService';
import { speechService } from '../services/speechService';
import {
  DEFAULT_DEMO_REPORTS,
  formatExtractedDataToSummaryText
} from '../services/reportStorageService';
import { buildUnifiedHealthProfileAndTimeline } from '../services/healthTimelineService';

export const ALL_DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
] as const;

export const normalizeMedicationDays = (med: Partial<Medication>): string[] => {
  if (Array.isArray(med.days) && med.days.length > 0) {
    // Sort according to week order
    const valid = ALL_DAYS_OF_WEEK.filter((d) => med.days!.includes(d));
    return valid.length > 0 ? [...valid] : [...med.days];
  }
  if (
    !med.day ||
    med.day === 'Daily' ||
    med.day === 'Every day' ||
    med.day.toLowerCase() === 'every day'
  ) {
    return [...ALL_DAYS_OF_WEEK];
  }
  if (med.day.includes('•')) {
    const parts = med.day
      .split('•')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts;
  }
  return [med.day.trim()];
};

export const formatMedicationScheduleDays = (days?: string[], legacyDay?: string): string => {
  const normalized = normalizeMedicationDays({ days, day: legacyDay });
  if (normalized.length >= 7) {
    return 'Every day';
  }
  return normalized.join(' • ');
};

const STORAGE_KEYS = {
  PATIENT: 'sanjeevani_patient_v1',
  MEDICATIONS: 'sanjeevani_medications_v1',
  APPOINTMENTS: 'sanjeevani_appointments_v1',
  CHECKINS: 'sanjeevani_checkins_v1',
  WELLNESS: 'sanjeevani_wellness_v1',
  SETUP_COMPLETE: 'sanjeevani_setup_complete_v1',
  REPORTS: 'sanjeevani_medical_reports_v1'
};

interface AppContextType {
  patient: PatientProfile;
  setPatient: React.Dispatch<React.SetStateAction<PatientProfile>>;
  medications: Medication[];
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  checkInLogs: CheckInLog[];
  emergencyLogs: EmergencyLog[];
  pharmacyOrders: PharmacyOrder[];
  notifications: AppNotification[];
  healthNews: HealthNewsItem[];
  prototypeState: PrototypeState;
  setPrototypeState: React.Dispatch<React.SetStateAction<PrototypeState>>;
  lastCheckIn: string | null;
  todayCheckInResult: string | null;
  activeView: ActiveViewType;
  setActiveView: (view: ActiveViewType) => void;
  activeCallStatus: CallStatus;
  setActiveCallStatus: (status: CallStatus) => void;
  activeModal: ActiveModalType;
  setActiveModal: (modal: ActiveModalType) => void;
  selectedRefillMedicine: Medication | null;
  setSelectedRefillMedicine: (med: Medication | null) => void;
  medicationReminderStage: 1 | 2 | 3;
  setMedicationReminderStage: (stage: 1 | 2 | 3) => void;
  targetMedication: Medication | null;
  setTargetMedication: (med: Medication | null) => void;
  appointmentReminderStage: 1 | 2 | 3;
  setAppointmentReminderStage: (stage: 1 | 2 | 3) => void;
  targetAppointment: Appointment | null;
  setTargetAppointment: (appt: Appointment | null) => void;
  demoState: DemoState;
  setDemoState: React.Dispatch<React.SetStateAction<DemoState>>;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  hasCompletedSetup: boolean;
  completeProfileSetup: () => void;

  // Actions
  startMorningCheckIn: () => void;
  endCall: () => void;
  addCheckInLog: (log: Omit<CheckInLog, 'id'>) => void;
  addEmergencyLog: (log: Omit<EmergencyLog, 'id'>) => void;
  addPharmacyOrder: (order: Omit<PharmacyOrder, 'orderId'>) => void;
  addMedication: (med: Omit<Medication, 'id'>) => void;
  updateMedication: (medId: string, updated: Partial<Omit<Medication, 'id'>>) => void;
  deleteMedication: (medId: string) => void;
  updateMedicationStatus: (
    medId: string,
    status: Medication['status'],
    orderStatus?: Medication['orderStatus']
  ) => void;
  addAppointment: (appt: Omit<Appointment, 'id'>) => void;
  updateAppointmentStatus: (apptId: string, status: Appointment['status']) => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationsRead: () => void;
  resetDemoState: () => void;
  mobileFrame: boolean;
  setMobileFrame: (val: boolean) => void;
  copilotMessages: Array<{
    id: string;
    sender: 'USER' | 'AI';
    text: string;
    timestamp: string;
    model?: string;
    attachments?: CopilotAttachment[];
  }>;
  setCopilotMessages: React.Dispatch<
    React.SetStateAction<
      Array<{
        id: string;
        sender: 'USER' | 'AI';
        text: string;
        timestamp: string;
        model?: string;
        attachments?: CopilotAttachment[];
      }>
    >
  >;
  copilotInteractionId: string | null;
  setCopilotInteractionId: React.Dispatch<React.SetStateAction<string | null>>;
  pendingCopilotQuestion: string | null;
  setPendingCopilotQuestion: React.Dispatch<React.SetStateAction<string | null>>;
  copilotDraftAttachments: CopilotAttachment[];
  setCopilotDraftAttachments: React.Dispatch<React.SetStateAction<CopilotAttachment[]>>;
  copilotSessionAttachments: CopilotAttachment[];
  setCopilotSessionAttachments: React.Dispatch<React.SetStateAction<CopilotAttachment[]>>;
  openCopilotWithQuestion: (question?: string) => void;
  openCopilotWithReport: (report: MedicalReport, autoQuestion?: string) => void;
  clearCopilotConversation: () => void;

  // Medical Reports & Unified Health Profile / Timeline
  medicalReports: MedicalReport[];
  selectedReportCategory: ReportCategoryId | null;
  setSelectedReportCategory: (cat: ReportCategoryId | null) => void;
  addMedicalReport: (report: Omit<MedicalReport, 'id'>) => MedicalReport;
  updateMedicalReport: (reportId: string, updated: Partial<MedicalReport>) => void;
  deleteMedicalReport: (reportId: string) => void;
  unifiedHealthProfile: UnifiedHealthProfileModel;

  // Regional Language Support (English default | Telugu)
  appLanguage: 'English' | 'Telugu';
  setAppLanguage: (lang: 'English' | 'Telugu') => void;
}

const defaultMedicines: Medication[] = [
  {
    id: 'med-1',
    days: [...ALL_DAYS_OF_WEEK],
    day: 'Every day',
    name: 'Lisinopril',
    dosage: '10 mg',
    frequency: '1 tablet',
    timing: 'Morning',
    scheduledTime: '8:00 AM',
    status: 'TAKEN',
    timeTaken: '8:05 AM',
    refillStatus: 'NORMAL',
    orderStatus: 'NONE',
    addedDate: '05 Oct 2026',
    isoDate: '2026-10-05',
    sourceReportId: 'rep-rx-2'
  },
  {
    id: 'med-2',
    days: ['Monday', 'Wednesday', 'Friday'],
    day: 'Monday • Wednesday • Friday',
    name: 'Metformin',
    dosage: '500 mg',
    frequency: '1 tablet',
    timing: 'Evening',
    scheduledTime: '7:00 PM',
    status: 'REMINDER',
    refillStatus: 'NORMAL',
    orderStatus: 'NONE',
    addedDate: '05 Oct 2026',
    isoDate: '2026-10-05',
    sourceReportId: 'rep-rx-2'
  },
  {
    id: 'med-3',
    days: [...ALL_DAYS_OF_WEEK],
    day: 'Every day',
    name: 'Atorvastatin',
    dosage: '20 mg',
    frequency: '1 tablet',
    timing: 'Evening',
    scheduledTime: '8:00 PM',
    status: 'NEEDS_REFILL',
    refillStatus: 'NEEDS_REFILL',
    orderStatus: 'NONE',
    addedDate: '05 Oct 2026',
    isoDate: '2026-10-05',
    sourceReportId: 'rep-rx-2'
  }
];

const defaultAppointments: Appointment[] = [
  {
    id: 'appt-1',
    doctorName: 'Dr. Priya Nair, MD',
    specialty: 'Cardiology & Internal Medicine',
    date: '2026-10-12',
    time: '10:30 AM',
    address: 'Sanjeevani Heart & Wellness Clinic, Suite 302, Green Park',
    status: 'UPCOMING',
    notes: 'Routine blood pressure & quarterly wellness review'
  },
  {
    id: 'appt-2',
    doctorName: 'Dr. Robert Chen, MD',
    specialty: 'Endocrinology',
    date: '2026-10-24',
    time: '2:00 PM',
    address: 'Metro Medical Center, Floor 2, West Wing',
    status: 'UPCOMING',
    notes: 'HbA1c follow-up check'
  },
  {
    id: 'appt-past-1',
    doctorName: 'Dr. Priya Nair, MD',
    specialty: 'Cardiology & Internal Medicine',
    date: '2026-09-28',
    time: '11:00 AM',
    address: 'Sanjeevani Heart & Wellness Clinic, Suite 302, Green Park',
    status: 'COMPLETED',
    notes: 'Quarterly blood pressure & metabolic wellness review'
  }
];

const defaultPatient: PatientProfile = {
  id: 'user-alex-01',
  abhaId: 'ABHA-1234-5678-9012',
  name: 'Alex Johnson',
  age: 68,
  gender: 'Male',
  countryCode: '+1',
  phone: '555-019-2834',
  email: 'alex.johnson@example.com',
  occupation: 'Retired Civil Engineer',
  address: '742 Evergreen Terrace, Apt 4B, Springfield',
  healthProfile: {
    currentHealthIssues: ['Hypertension', 'Diabetes', 'Arthritis'],
    currentHealthStatus: 'Stable — Independent daily living',
    heartBpm: 72,
    bloodPressure: '126/80 mmHg',
    heightCm: 174,
    weightKg: 76,
    bmi: 25.1,
    allergies: ['Penicillin', 'Pollen']
  },
  emergencyContact: {
    name: 'Sarah Johnson',
    relationship: 'Daughter',
    phone: '+1 555-019-9812',
    address: '18 Oakridge Lane, Springfield'
  },
  medicalConditions: ['Hypertension', 'Diabetes', 'Arthritis'],
  currentMedicines: defaultMedicines,
  checkInTime: '9:00 AM',
  enableVideo: true,
  language: 'English',
  notificationsEnabled: true,
  voicePermissionsGranted: true
};

const initialCheckInLogs: CheckInLog[] = [
  {
    id: 'log-oct7',
    date: 'October 7',
    timestamp: '8:31 AM',
    duration: '00:42',
    patientResponse: 'I feel good today. I slept well and took my morning Lisinopril.',
    classification: 'SAFE',
    medicineResponse: 'Took Lisinopril 10 mg on time.',
    videoEnabled: true,
    finalStatus: 'SAFE',
    summary: 'Morning check-in completed. User reported good rest and no unusual symptoms.',
    reason: 'Steady morning energy and confirmed medication intake.',
    confidence: 'Prototype Indicator: Consistent Wellness Pattern'
  },
  {
    id: 'log-oct6',
    date: 'October 6',
    timestamp: '8:30 AM',
    duration: '00:38',
    patientResponse: 'Feeling well this morning, going for a short walk.',
    classification: 'SAFE',
    medicineResponse: 'Confirmed morning dose.',
    videoEnabled: true,
    finalStatus: 'SAFE',
    summary: 'Routine morning voice check-in completed with no wellness concerns.',
    reason: 'Positive spoken response and active routine.',
    confidence: 'Prototype Indicator: Consistent Wellness Pattern'
  },
  {
    id: 'log-oct5',
    date: 'October 5',
    timestamp: '8:32 AM',
    duration: '01:12',
    patientResponse: 'Feeling a bit tired and mildly dizzy after waking up.',
    classification: 'NOT_OK',
    medicineResponse: 'Pending food before medication.',
    videoEnabled: true,
    finalStatus: 'NOT_OK',
    summary: 'User noted mild morning dizziness and fatigue. Advised rest and hydration.',
    reason: 'Mentioned tiredness and mild lightheadedness alongside hypertension/diabetes profile.',
    confidence: 'Prototype Indicator: Wellness Attention Advised'
  }
];

const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'CHECKIN',
    title: 'Morning AI Check-in',
    message: 'Scheduled daily at 9:00 AM. Tap to start your voice wellness check.',
    timestamp: 'Today, 8:55 AM',
    read: false,
    actionView: 'call'
  },
  {
    id: 'notif-2',
    type: 'REFILL',
    title: 'Refill Reminder: Atorvastatin',
    message: 'Atorvastatin (20 mg) is marked as Needs Refill. Review on Medicare Pharmacy.',
    timestamp: 'Today, 8:15 AM',
    read: false,
    actionModal: 'pharmacy_handoff'
  },
  {
    id: 'notif-3',
    type: 'MEDICATION',
    title: 'Medication Reminder',
    message: 'Metformin 500 mg is scheduled for 7:00 PM this evening.',
    timestamp: 'Today, 8:00 AM',
    read: true,
    actionView: 'medications'
  },
  {
    id: 'notif-4',
    type: 'APPOINTMENT',
    title: 'Upcoming Doctor Appointment',
    message: 'Dr. Priya Nair (Cardiology) on Oct 12 at 10:30 AM.',
    timestamp: 'Yesterday',
    read: true,
    actionView: 'appointments'
  }
];

const defaultHealthNews: HealthNewsItem[] = [
  {
    id: 'news-1',
    topic: 'Managing Daily Blood Pressure & Morning Wellness',
    category: 'Cardiovascular Wellness',
    shortDescription:
      'Consistent morning routines, hydration, and taking prescribed blood pressure medications on schedule help maintain steady cardiovascular wellness in older adults.',
    commonSymptoms: [
      'Unexplained morning headaches or lightheadedness',
      'Sudden dizziness when standing up quickly',
      'Blurred vision or unusual fatigue'
    ],
    whenToSeekHelp:
      'Consult a qualified healthcare professional if blood pressure readings remain consistently elevated, or seek urgent care if accompanied by chest discomfort, shortness of breath, or numbness.',
    readTime: '3 min read'
  },
  {
    id: 'news-2',
    topic: 'Understanding Type 2 Diabetes & Blood Sugar Steadiness',
    category: 'Metabolic Health',
    shortDescription:
      'Balanced meals, regular gentle movement, and timely medication adherence reduce daily blood sugar fluctuations and support sustained energy.',
    commonSymptoms: [
      'Sudden shakiness, sweating, or unusual weakness (possible low blood sugar)',
      'Increased thirst and frequent urination',
      'Mid-day fatigue or difficulty concentrating'
    ],
    whenToSeekHelp:
      'Speak with a doctor if you notice frequent episodes of dizziness, confusion, or persistent high/low glucose readings.',
    readTime: '4 min read'
  },
  {
    id: 'news-3',
    topic: 'Joint Mobility & Gentle Care for Arthritis',
    category: 'Mobility & Aging',
    shortDescription:
      'Low-impact stretching, warm compresses in the morning, and staying active without overexertion can ease everyday joint stiffness.',
    commonSymptoms: [
      'Morning joint stiffness lasting 15–30 minutes',
      'Mild swelling or tenderness around knees or fingers',
      'Reduced range of motion after prolonged sitting'
    ],
    whenToSeekHelp:
      'Evaluation by a physician is appropriate if a joint becomes suddenly hot, severely swollen, or unable to bear weight.',
    readTime: '3 min read'
  },
  {
    id: 'news-4',
    topic: 'Medication Adherence & Safe Refill Planning',
    category: 'Medication Safety',
    shortDescription:
      'Keeping a 7-day buffer on maintenance medications prevents missed doses and supports seamless coordination with your pharmacy and doctor.',
    commonSymptoms: [
      'Running out of daily tablets before the end of the month',
      'Uncertainty about whether a morning or evening dose was taken',
      'Side effects after skipping and restarting a prescription'
    ],
    whenToSeekHelp:
      'Always consult your prescribing doctor or pharmacist before stopping or changing the dosage of any prescribed medication.',
    readTime: '2 min read'
  }
];

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasCompletedSetup, setHasCompletedSetup] = useState<boolean>(() =>
    loadFromStorage<boolean>(STORAGE_KEYS.SETUP_COMPLETE, false)
  );

  const [patient, setPatient] = useState<PatientProfile>(() =>
    loadFromStorage<PatientProfile>(STORAGE_KEYS.PATIENT, defaultPatient)
  );

  const [medications, setMedications] = useState<Medication[]>(() => {
    const stored = loadFromStorage<Medication[]>(STORAGE_KEYS.MEDICATIONS, defaultMedicines);
    return stored.map((med) => {
      const normalizedDays = normalizeMedicationDays(med);
      return {
        ...med,
        days: normalizedDays,
        day: formatMedicationScheduleDays(normalizedDays, med.day)
      };
    });
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    loadFromStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, defaultAppointments)
  );

  const [checkInLogs, setCheckInLogs] = useState<CheckInLog[]>(() =>
    loadFromStorage<CheckInLog[]>(STORAGE_KEYS.CHECKINS, initialCheckInLogs)
  );

  const [emergencyLogs, setEmergencyLogs] = useState<EmergencyLog[]>([]);
  const [pharmacyOrders, setPharmacyOrders] = useState<PharmacyOrder[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [healthNews] = useState<HealthNewsItem[]>(defaultHealthNews);

  const initialWellness = loadFromStorage<{
    prototypeState: PrototypeState;
    lastCheckIn: string | null;
    todayCheckInResult: string | null;
  }>(STORAGE_KEYS.WELLNESS, {
    prototypeState: 'AWAITING_CHECKIN',
    lastCheckIn: 'October 7 at 8:31 AM',
    todayCheckInResult: 'Awaiting morning check-in'
  });

  const [prototypeState, setPrototypeState] = useState<PrototypeState>(
    initialWellness.prototypeState
  );
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(initialWellness.lastCheckIn);
  const [todayCheckInResult, setTodayCheckInResult] = useState<string | null>(
    initialWellness.todayCheckInResult
  );

  // Start on Profile Setup ('onboarding') until setup is completed
  const [activeView, setActiveView] = useState<ActiveViewType>(() =>
    loadFromStorage<boolean>(STORAGE_KEYS.SETUP_COMPLETE, false) ? 'dashboard' : 'onboarding'
  );

  const [activeCallStatus, setActiveCallStatus] = useState<CallStatus>('IDLE');
  const [activeModal, setActiveModal] = useState<ActiveModalType>('none');

  const [selectedRefillMedicine, setSelectedRefillMedicine] = useState<Medication | null>(
    () => medications[2] || defaultMedicines[2]
  );
  const [medicationReminderStage, setMedicationReminderStage] = useState<1 | 2 | 3>(1);
  const [targetMedication, setTargetMedication] = useState<Medication | null>(
    () => medications[1] || defaultMedicines[1]
  );

  const [appointmentReminderStage, setAppointmentReminderStage] = useState<1 | 2 | 3>(1);
  const [targetAppointment, setTargetAppointment] = useState<Appointment | null>(
    defaultAppointments[0]
  );

  const [demoState, setDemoState] = useState<DemoState>({
    isSimulating: false,
    activeDemoName: null
  });

  const [mobileFrame, setMobileFrame] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [copilotMessages, setCopilotMessages] = useState<
    Array<{
      id: string;
      sender: 'USER' | 'AI';
      text: string;
      timestamp: string;
      model?: string;
      attachments?: CopilotAttachment[];
    }>
  >([]);
  const [copilotInteractionId, setCopilotInteractionId] = useState<string | null>(null);
  const [pendingCopilotQuestion, setPendingCopilotQuestion] = useState<string | null>(null);
  const [copilotDraftAttachments, setCopilotDraftAttachments] = useState<CopilotAttachment[]>([]);
  const [copilotSessionAttachments, setCopilotSessionAttachments] = useState<CopilotAttachment[]>(
    []
  );

  const [medicalReports, setMedicalReports] = useState<MedicalReport[]>(() => {
    const stored = loadFromStorage<MedicalReport[]>(STORAGE_KEYS.REPORTS, DEFAULT_DEMO_REPORTS);
    const demoMap = new Map(DEFAULT_DEMO_REPORTS.map((r) => [r.id, r]));
    const hydrated = stored.map((r) => {
      const demoMatch = demoMap.get(r.id);
      if (demoMatch && r.isDemoReport) {
        return {
          ...r,
          ...demoMatch,
          documentType: demoMatch.documentType || r.documentType || r.category,
          processingStatus: r.processingStatus || demoMatch.processingStatus || 'Ready'
        };
      }
      return {
        ...r,
        documentType: r.documentType || r.category,
        processingStatus: r.processingStatus || (r.extractedData ? 'Ready' : 'Uploaded')
      };
    });

    const existingIds = new Set(hydrated.map((r) => r.id));
    const missingDefaults = DEFAULT_DEMO_REPORTS.filter((d) => !existingIds.has(d.id));
    return [...missingDefaults, ...hydrated];
  });
  const [selectedReportCategory, setSelectedReportCategory] = useState<ReportCategoryId | null>(
    null
  );

  const appLanguage: 'English' | 'Telugu' =
    patient.language === 'Telugu' ? 'Telugu' : 'English';

  const setAppLanguage = (lang: 'English' | 'Telugu') => {
    speechService.setLanguage(lang);
    setPatient((prev) => ({
      ...prev,
      language: lang
    }));
  };

  useEffect(() => {
    speechService.setLanguage(appLanguage);
  }, [appLanguage]);

  const unifiedHealthProfile = useMemo(
    () =>
      buildUnifiedHealthProfileAndTimeline({
        patient,
        medicalReports,
        medications,
        appointments,
        checkInLogs
      }),
    [patient, medicalReports, medications, appointments, checkInLogs]
  );

  const openCopilotWithQuestion = (question?: string) => {
    speechService.warmupAudio();
    if (question && question.trim()) {
      setPendingCopilotQuestion(question.trim());
    }
    setActiveView('copilot');
  };

  const openCopilotWithReport = (report: MedicalReport, autoQuestion?: string) => {
    speechService.warmupAudio();
    const attachment: CopilotAttachment = {
      id: `att-rep-${report.id}-${Date.now()}`,
      kind: 'MEDICAL_REPORT',
      name: `${report.title} — ${report.date}`,
      mimeType: report.mimeType,
      fileTypeLabel: report.fileType,
      dataUrl: report.fileDataUrl,
      reportId: report.id,
      reportCategory: report.category,
      reportDate: report.date,
      extractedText: report.extractedData
        ? formatExtractedDataToSummaryText(report.extractedData)
        : report.extractedSummaryText
    };

    // Attach to draft & active session context
    setCopilotDraftAttachments([attachment]);
    setCopilotSessionAttachments([attachment]);

    // Seed the greeting message from Sanjeevani AI Copilot as specified in Section 18:
    // "I can help explain this report. What would you like to understand?"
    const nowTime = new Date().toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const introText =
      appLanguage === 'Telugu'
        ? `**జోడించిన రిపోర్ట్: ${report.title} (${report.date})**\n\nఈ రిపోర్ట్‌ను అర్థం చేసుకోవడంలో నేను సహాయం చేయగలను. ఇందులో మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?`
        : `**Attached report: ${report.title} (${report.date})**\n\nI can help explain this report. What would you like to understand?`;
    setCopilotMessages((prev) => [
      ...prev,
      {
        id: `ai-report-intro-${Date.now()}`,
        sender: 'AI',
        text: introText,
        timestamp: nowTime
      }
    ]);

    if (autoQuestion && autoQuestion.trim()) {
      setPendingCopilotQuestion(autoQuestion.trim());
    }
    setActiveView('copilot');
  };

  const clearCopilotConversation = () => {
    speechService.stopSpeaking();
    speechService.stopListening();
    setCopilotMessages([]);
    setCopilotInteractionId(null);
    setPendingCopilotQuestion(null);
    setCopilotDraftAttachments([]);
    setCopilotSessionAttachments([]);
  };

  const addMedicalReport = (reportData: Omit<MedicalReport, 'id'>): MedicalReport => {
    const newReport: MedicalReport = {
      ...reportData,
      id: `rep-user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      documentType: reportData.documentType || reportData.category,
      createdAt: reportData.createdAt || new Date().toISOString(),
      sourceFile: reportData.sourceFile || reportData.fileName,
      processingStatus:
        reportData.processingStatus || (reportData.extractedData ? 'Ready' : 'Uploaded')
    };
    setMedicalReports((prev) => [newReport, ...prev]);
    showToast(`Saved "${newReport.title}" to Medical Reports`);
    return newReport;
  };

  const updateMedicalReport = (reportId: string, updated: Partial<MedicalReport>) => {
    setMedicalReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, ...updated } : r))
    );
    showToast('Updated medical record details');
  };

  const deleteMedicalReport = (reportId: string) => {
    const target = medicalReports.find((r) => r.id === reportId);
    setMedicalReports((prev) => prev.filter((r) => r.id !== reportId));
    setCopilotDraftAttachments((prev) => prev.filter((a) => a.reportId !== reportId));
    setCopilotSessionAttachments((prev) => prev.filter((a) => a.reportId !== reportId));
    showToast(target ? `Deleted "${target.title}"` : 'Report deleted');
  };

  // Sync currentMedicines into patient profile
  useEffect(() => {
    setPatient((prev) => ({
      ...prev,
      currentMedicines: medications,
      medicalConditions: prev.healthProfile?.currentHealthIssues || prev.medicalConditions
    }));
  }, [medications]);

  // Persist patient, medications, appointments, checkInLogs, wellness, and medicalReports to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(medicalReports));
    } catch {
      // Ignore storage quota warnings if large image uploaded
    }
  }, [medicalReports]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PATIENT, JSON.stringify(patient));
    } catch {
      // Ignore storage quota warnings
    }
  }, [patient]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(medications));
    } catch {
      // Ignore
    }
  }, [medications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    } catch {
      // Ignore
    }
  }, [appointments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(checkInLogs));
    } catch {
      // Ignore
    }
  }, [checkInLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.WELLNESS,
        JSON.stringify({ prototypeState, lastCheckIn, todayCheckInResult })
      );
    } catch {
      // Ignore
    }
  }, [prototypeState, lastCheckIn, todayCheckInResult]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETE, JSON.stringify(hasCompletedSetup));
    } catch {
      // Ignore
    }
  }, [hasCompletedSetup]);

  const completeProfileSetup = () => {
    setHasCompletedSetup(true);
    try {
      localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETE, 'true');
    } catch {
      // Ignore
    }
    setActiveView('dashboard');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const startMorningCheckIn = () => {
    setPrototypeState('AWAITING_CHECKIN');
    setTodayCheckInResult('Awaiting morning check-in');
    setActiveView('call');
    setActiveCallStatus('CONNECTING');
  };

  const endCall = () => {
    setActiveCallStatus('CALL_ENDED');
    setTimeout(() => {
      setActiveView('dashboard');
      setActiveCallStatus('IDLE');
    }, 900);
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addCheckInLog = (log: Omit<CheckInLog, 'id'>) => {
    const timeStr =
      log.timestamp ||
      new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const dateStr =
      log.date ||
      new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    const newLog: CheckInLog = {
      ...log,
      id: `checkin-${Date.now()}`,
      date: dateStr,
      timestamp: timeStr
    };
    setCheckInLogs((prev) => [newLog, ...prev]);
    setLastCheckIn(`${dateStr} at ${timeStr}`);
    setTodayCheckInResult(log.summary);
    setPrototypeState(log.classification);

    addNotification({
      type: 'CHECKIN',
      title: `AI Check-in: ${log.classification === 'NOT_OK' ? 'NOT OK' : log.classification}`,
      message: log.summary,
      actionView: 'history'
    });
  };

  const addEmergencyLog = (log: Omit<EmergencyLog, 'id'>) => {
    const newLog: EmergencyLog = {
      ...log,
      id: `emerg-${Date.now()}`
    };
    setEmergencyLogs((prev) => [newLog, ...prev]);
    if (log.classification === 'CRITICAL' || log.classification === 'MONITORING') {
      setPrototypeState(log.classification);
    }
    addNotification({
      type: 'EMERGENCY',
      title: 'Prototype Emergency Simulation',
      message: `${log.verificationResult} (${log.countdownResult})`,
      actionView: 'history'
    });
  };

  const addPharmacyOrder = (order: Omit<PharmacyOrder, 'orderId'>) => {
    const orderId = `DEMO-MC-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: PharmacyOrder = {
      ...order,
      orderId
    };
    setPharmacyOrders((prev) => [newOrder, ...prev]);

    if (order.medicineName) {
      setMedications((prev) =>
        prev.map((med) =>
          med.name.toLowerCase() === order.medicineName.toLowerCase()
            ? { ...med, status: 'ORDERED', refillStatus: 'ORDERED', orderStatus: 'DEMO_ORDERED' }
            : med
        )
      );
    }

    addNotification({
      type: 'REFILL',
      title: `Refill Prepared: ${order.medicineName}`,
      message: `Demo order ${orderId} logged for Medicare Pharmacy.`,
      actionView: 'medications'
    });
  };

  const addMedication = (med: Omit<Medication, 'id'>) => {
    const normalizedDays = normalizeMedicationDays(med);
    const formattedDay = formatMedicationScheduleDays(normalizedDays, med.day);
    const newMed: Medication = {
      ...med,
      id: `med-${Date.now()}`,
      days: normalizedDays,
      day: formattedDay
    };
    setMedications((prev) => [...prev, newMed]);
    addNotification({
      type: 'MEDICATION',
      title: `Medication Scheduled: ${newMed.name}`,
      message: `${newMed.name} (${newMed.dosage}) scheduled on ${formattedDay} at ${newMed.scheduledTime}.`,
      actionView: 'medications'
    });
    showToast(`Added ${med.name} (${med.dosage}) to schedule`);
  };

  const updateMedication = (medId: string, updated: Partial<Omit<Medication, 'id'>>) => {
    setMedications((prev) =>
      prev.map((med) => {
        if (med.id !== medId) return med;
        const merged = { ...med, ...updated };
        const normalizedDays = normalizeMedicationDays(merged);
        const formattedDay = formatMedicationScheduleDays(normalizedDays, merged.day);
        const finalMed: Medication = {
          ...merged,
          days: normalizedDays,
          day: formattedDay
        };
        if (targetMedication?.id === medId) {
          setTargetMedication(finalMed);
        }
        if (selectedRefillMedicine?.id === medId) {
          setSelectedRefillMedicine(finalMed);
        }
        return finalMed;
      })
    );
    showToast(`Updated ${updated.name || 'medication'} & reminder schedule`);
  };

  const deleteMedication = (medId: string) => {
    const medToDelete = medications.find((m) => m.id === medId);

    // If this medication currently has an active reminder, stop it cleanly
    if (targetMedication?.id === medId) {
      alarmService.stopAlarm();
      speechService.stopSpeaking();
      speechService.stopListening();
      if (activeModal === 'medication_reminder') {
        setActiveModal('none');
      }
      setTargetMedication(null);
    }

    if (selectedRefillMedicine?.id === medId) {
      setSelectedRefillMedicine(null);
    }

    setMedications((prev) => prev.filter((m) => m.id !== medId));

    // Remove associated notifications for this deleted medication
    if (medToDelete) {
      setNotifications((prev) =>
        prev.filter(
          (n) =>
            !(
              (n.type === 'MEDICATION' || n.type === 'REFILL') &&
              (n.title.toLowerCase().includes(medToDelete.name.toLowerCase()) ||
                n.message.toLowerCase().includes(medToDelete.name.toLowerCase()))
            )
        )
      );
    }

    showToast(
      `Removed ${medToDelete ? medToDelete.name : 'medication'} and its reminder schedule`
    );
  };

  const updateMedicationStatus = (
    medId: string,
    status: Medication['status'],
    orderStatus?: Medication['orderStatus']
  ) => {
    setMedications((prev) =>
      prev.map((m) =>
        m.id === medId
          ? {
              ...m,
              status,
              orderStatus: orderStatus || m.orderStatus,
              timeTaken:
                status === 'TAKEN'
                  ? new Date().toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })
                  : m.timeTaken
            }
          : m
      )
    );
  };

  const addAppointment = (appt: Omit<Appointment, 'id'>) => {
    const newAppt: Appointment = {
      ...appt,
      id: `appt-${Date.now()}`
    };
    setAppointments((prev) => [newAppt, ...prev]);
    showToast(`Scheduled appointment with ${appt.doctorName}`);
  };

  const updateAppointmentStatus = (apptId: string, status: Appointment['status']) => {
    setAppointments((prev) => prev.map((a) => (a.id === apptId ? { ...a, status } : a)));
  };

  const resetDemoState = () => {
    alarmService.stopAlarm();
    speechService.stopSpeaking();
    speechService.stopListening();

    try {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore
    }

    setHasCompletedSetup(false);
    setPatient(defaultPatient);
    setMedications(defaultMedicines);
    setAppointments(defaultAppointments);
    setCheckInLogs(initialCheckInLogs);
    setEmergencyLogs([]);
    setPharmacyOrders([]);
    setNotifications(initialNotifications);
    setPrototypeState('AWAITING_CHECKIN');
    setLastCheckIn('October 7 at 8:31 AM');
    setTodayCheckInResult('Awaiting morning check-in');
    setActiveCallStatus('IDLE');
    setActiveModal('none');
    setMedicationReminderStage(1);
    setAppointmentReminderStage(1);
    setCopilotMessages([]);
    setCopilotInteractionId(null);
    setPendingCopilotQuestion(null);
    setCopilotDraftAttachments([]);
    setCopilotSessionAttachments([]);
    setMedicalReports(DEFAULT_DEMO_REPORTS);
    setSelectedReportCategory(null);
    setActiveView('onboarding');
    showToast('Demo data reset. Returned to Personal Health Setup.');
  };

  return (
    <AppContext.Provider
      value={{
        patient,
        setPatient,
        medications,
        setMedications,
        appointments,
        setAppointments,
        checkInLogs,
        emergencyLogs,
        pharmacyOrders,
        notifications,
        healthNews,
        prototypeState,
        setPrototypeState,
        lastCheckIn,
        todayCheckInResult,
        activeView,
        setActiveView,
        activeCallStatus,
        setActiveCallStatus,
        activeModal,
        setActiveModal,
        selectedRefillMedicine,
        setSelectedRefillMedicine,
        medicationReminderStage,
        setMedicationReminderStage,
        targetMedication,
        setTargetMedication,
        appointmentReminderStage,
        setAppointmentReminderStage,
        targetAppointment,
        setTargetAppointment,
        demoState,
        setDemoState,
        toastMessage,
        showToast,
        hasCompletedSetup,
        completeProfileSetup,
        startMorningCheckIn,
        endCall,
        addCheckInLog,
        addEmergencyLog,
        addPharmacyOrder,
        addMedication,
        updateMedication,
        deleteMedication,
        updateMedicationStatus,
        addAppointment,
        updateAppointmentStatus,
        addNotification,
        markNotificationsRead,
        resetDemoState,
        mobileFrame,
        setMobileFrame,
        copilotMessages,
        setCopilotMessages,
        copilotInteractionId,
        setCopilotInteractionId,
        pendingCopilotQuestion,
        setPendingCopilotQuestion,
        copilotDraftAttachments,
        setCopilotDraftAttachments,
        copilotSessionAttachments,
        setCopilotSessionAttachments,
        openCopilotWithQuestion,
        openCopilotWithReport,
        clearCopilotConversation,
        medicalReports,
        selectedReportCategory,
        setSelectedReportCategory,
        addMedicalReport,
        updateMedicalReport,
        deleteMedicalReport,
        unifiedHealthProfile,
        appLanguage,
        setAppLanguage
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
