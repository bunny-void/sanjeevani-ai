# Sanjeevani AI — Architecture Document
## AI-Powered Personal Health Copilot

---

## System Architecture

```
USER
  │
  ▼
┌──────────────────────────────────────┐
│         SANJEEVANI AI APP            │
│          (React + TypeScript)        │
│                                      │
│  ┌─────────────────────────────┐     │
│  │   Upload Medical Document   │     │
│  │  PDF / PNG / JPG / JPEG     │     │
│  └──────────────┬──────────────┘     │
│                 │                    │
│  ┌──────────────▼──────────────┐     │
│  │  Document Processing Layer  │     │
│  │  OCR + Multimodal           │     │
│  │  Understanding              │     │
│  │  (Google Gemini API)        │     │
│  └──────────────┬──────────────┘     │
│                 │                    │
│  ┌──────────────▼──────────────┐     │
│  │  Structured Extraction      │     │
│  │  - Medicines + Dosages      │     │
│  │  - Lab Tests + Values       │     │
│  │  - Diagnoses                │     │
│  │  - Dates                    │     │
│  │  - Vaccination Records      │     │
│  │  - Discharge Info           │     │
│  └──────────────┬──────────────┘     │
│                 │                    │
│  ┌──────────────▼──────────────┐     │
│  │  Validation Layer           │     │
│  │  - Abnormal flag detection  │     │
│  │  - Reference range check    │     │
│  │  - Confidence scoring       │     │
│  └──────────────┬──────────────┘     │
│                 │                    │
│  ┌──────────────▼──────────────┐     │
│  │  Local Storage Layer        │     │
│  │  (React Context + Browser   │     │
│  │   localStorage)             │     │
│  └──────────────┬──────────────┘     │
│                 │                    │
│  ┌──────────────▼──────────────┐     │
│  │  AI Health Summary          │     │
│  │  - English Plain Language   │     │
│  │  - Telugu (తెలుగు) Summary  │     │
│  │  - Abnormal Explanations    │     │
│  └──────────────┬──────────────┘     │
│                 │                    │
│  ┌──────────────▼──────────────┐     │
│  │  Unified Health Timeline    │     │
│  │  - Reports                  │     │
│  │  - Prescriptions            │     │
│  │  - Appointments             │     │
│  │  - Vaccinations             │     │
│  │  - Wellness Check-Ins       │     │
│  └──────────────┬──────────────┘     │
│                 │                    │
│  ┌──────────────▼──────────────┐     │
│  │  Medical AI Copilot         │     │
│  │  - Report-Aware Context     │     │
│  │  - Personal Health Queries  │     │
│  │  - General Medical Knowledge│     │
│  │  - Real-time Gemini API     │     │
│  │  - Telugu Voice + Text      │     │
│  └─────────────────────────────┘     │
│                                      │
└──────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI Styling | Tailwind CSS v4 |
| AI Engine | Google Gemini Developer API (`gemini-2.0-flash`) |
| SDK | `@google/genai` (official JS/TS SDK) |
| Backend | Node.js Express (document extraction server) |
| Storage | React Context + browser `localStorage` |
| Voice | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| Language | English (default) + Telugu (తెలుగు) |
| FHIR Readiness | `abdmMappingService.ts` — prototype mapper |

---

## Document Intelligence Pipeline

```
Input Document (PDF / Image)
        │
        ▼
Gemini Multimodal API
  (gemini-2.0-flash)
        │
        ▼
Structured JSON Extraction
   documentType
   date / doctorName / hospital
   medicines[] with dosage + frequency
   labTests[] with value + unit + reference range
   diagnoses[]
   vaccinations[]
   discharge info
        │
        ▼
Abnormal Value Detection
  Compare against report's OWN reference ranges
  Flag: NORMAL / HIGH / LOW / UNKNOWN
        │
        ▼
AI Health Summary Generation
  Plain English explanation
  Telugu summary (తెలుగు సారాంశం)
  Abnormal value explanations
        │
        ▼
Report Storage
  Saved to app context + localStorage
```

---

## Data Model

```
PatientProfile
  ├── abhaId (Mock ABHA ID — Demo)
  ├── HealthProfile (vitals, conditions, allergies)
  ├── emergencyContact
  └── language (English / Telugu)

MedicalReport
  ├── category (PRESCRIPTION / BLOOD_TEST / XRAY / ...)
  ├── extractedData
  │     ├── medicines[]
  │     ├── labTests[]
  │     ├── valuesToDiscuss[]
  │     ├── discharge info
  │     ├── summary (English)
  │     └── summaryTe (Telugu)
  └── processingStatus

Medication
  ├── name / dosage / frequency
  ├── timing / scheduledTime
  └── status (TAKEN / DUE / PENDING ...)

Appointment
  ├── doctorName / specialty
  ├── date / time
  └── status (UPCOMING / COMPLETED)

HealthTimelineEvent
  ├── kind (BLOOD_TEST / PRESCRIPTION / APPOINTMENT ...)
  ├── isoDate (for chronological sorting)
  ├── highlights[]
  └── aiSummarySnippet
```

---

## FHIR-Style / ABDM Readiness

> **Note**: This is a prototype mapping. No real ABDM authentication or health record exchange is implemented.

```
Sanjeevani Internal Model
        │
        ▼ abdmMappingService.ts
        │
        ▼
FHIR-Style Resources
  FhirPatient       (from PatientProfile + abhaId)
  FhirCondition     (from medicalConditions[])
  FhirMedicationStatement  (from Medication[])
  FhirObservation   (from ExtractedLabItem[])
  FhirDiagnosticReport     (from MedicalReport[])
  FhirImmunization  (from vaccination records)
  FhirEncounter     (from Appointment[])
        │
        ▼
Bundle (FHIR Collection)
        │
        ▼ (Future)
ABDM / HIE Gateway
```

---

## Supported Document Types

| Type | Extraction |
|---|---|
| Prescription | Medicines, dosages, frequency, timing |
| Blood Test / Lab Report | Test name, value, unit, reference range, abnormal flags |
| X-Ray Report | Modality, body area, impression |
| Scanning / Diagnostic | Modality, findings, impression |
| Discharge Summary | Hospital, admission/discharge dates, diagnoses, procedures, follow-up |
| Vaccination Record | Vaccine name, date, dose sequence |
| Medical History | Conditions, dates, doctor/hospital |

---

## AI Copilot Context Levels

1. **General Knowledge** — No personal data needed. Example: "What is hypertension?"
2. **Profile-Aware** — Uses patient profile. Example: "What medicines am I on?"
3. **Report-Aware** — Uses extracted report data. Example: "What does my blood test say?"
4. **Attached Document** — User attaches a file directly. Example: Drag a PDF → Ask about it.

---

## Disclaimer

> Sanjeevani AI is a **hackathon prototype** for educational and demonstration purposes.
> It is **not a medical diagnosis system**.
> All patient data in the demo is **fictional**.
> The ABHA ID is a **mock identifier** — no real health records are stored or exchanged.
