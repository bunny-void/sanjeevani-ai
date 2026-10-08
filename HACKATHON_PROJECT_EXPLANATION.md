# Sanjeevani AI — Project Explanation
## AI-Powered Personal Health Copilot

---

## THE PROBLEM

Medical information is fragmented.

People carry prescriptions, lab reports, discharge summaries, and vaccination records in paper files, WhatsApp messages, or scattered across hospital portals. When they visit a new doctor, they struggle to recall their medicines, their last blood test values, or when they were vaccinated.

**The result**: Delayed diagnosis. Poor medication adherence. Preventable complications.

---

## THE SOLUTION

**Sanjeevani AI** transforms medical records into understandable, structured, and accessible health information.

A patient uploads any medical document — a blood test, a prescription, a discharge summary. Sanjeevani AI extracts the important information, explains it in plain language, stores it in a unified health timeline, and makes it available through a conversational Medical AI Copilot.

> "Your health records — organized, explained, always with you."

---

## AI VALUE

| Capability | How It Works |
|---|---|
| **Document OCR + Understanding** | Google Gemini multimodal AI reads PDF and image documents, understanding handwritten prescriptions, typed lab reports, and printed discharge summaries |
| **Structured Extraction** | Medicines, dosages, lab values, diagnoses, dates, and doctor names are extracted into a clean, structured format |
| **Plain Language Summaries** | AI generates clear, jargon-free explanations. Example: *"Your HbA1c of 7.4% is slightly above the normal range of below 5.7%, which means your blood sugar has been running a bit high over the past few months."* |
| **Abnormal Value Explanations** | Lab values outside the report's own reference ranges are flagged and explained safely, without inventing clinical advice |
| **Medical AI Copilot** | A conversational AI assistant that answers questions using the patient's actual stored records — "What was my latest blood test?" — or general medical knowledge — "What is hypertension?" |
| **Unified Health Timeline** | All records — reports, prescriptions, appointments, vaccinations, check-ins — organized chronologically |

---

## REGIONAL LANGUAGE SUPPORT

Sanjeevani AI supports:

- **English** (default)
- **తెలుగు** (Telugu)

Report summaries, abnormal value explanations, medicine schedules, and AI Copilot responses can all be provided in Telugu. The user can switch language at any time.

---

## ABDM / FHIR READINESS

Sanjeevani AI is built with future ABDM interoperability in mind:

- Each patient record has a **mock ABHA ID** (demonstration only)
- An internal mapping service (`abdmMappingService.ts`) converts Sanjeevani records to **FHIR-style resources**: `Patient`, `Condition`, `MedicationStatement`, `Observation`, `DiagnosticReport`, `Immunization`, `Encounter`
- The architecture is ready for a future HIE/ABDM gateway integration

> Clearly labeled: **"ABDM Ready — Prototype Architecture"** — not a production ABDM integration.

---

## IMPACT

**For patients**: Understand their own health. Know their medicines. Track their progress.

**For caregivers**: Get a complete picture of the patient's health history at a glance.

**For doctors**: See structured, organized patient records instantly.

**For health systems**: A step toward interoperable, patient-controlled health data.

---

## SAFETY

Sanjeevani AI is a healthcare information tool, **not a medical diagnosis system**.

- It does **not** prescribe medicines
- It does **not** diagnose conditions
- It explains reports using the report's own reference ranges — it does not invent clinical values
- All demo data is **fictional**
- Users are encouraged to consult a qualified doctor for medical decisions

---

## SUPPORTED DOCUMENT TYPES

1. Prescription
2. Blood Test / Lab Report
3. X-Ray Report
4. Scanning / Diagnostic Report
5. Discharge Summary
6. Vaccination Record
7. Medical History

---

## CHALLENGE REQUIREMENTS STATUS

| Requirement | Status |
|---|---|
| Medical Record Ingestion (PDF, PNG, JPG, JPEG) | ✅ Complete |
| Prescription extraction (medicines, dosages) | ✅ Complete |
| Lab report extraction (test values, reference ranges) | ✅ Complete |
| Discharge summary extraction | ✅ Complete |
| Diagnostic record extraction | ✅ Complete |
| Vaccination record extraction | ✅ Complete |
| AI Health Summary in plain language | ✅ Complete |
| Abnormal value detection + explanation | ✅ Complete |
| Unified Health Profile + Timeline | ✅ Complete |
| Report-Aware Medical AI Copilot | ✅ Complete |

**Bonus Requirements**

| Bonus | Status |
|---|---|
| Regional language support (Telugu) | ✅ Complete |
| ABDM / ABHA readiness | ✅ Complete (Prototype / Mock) |
| FHIR-style structured data model | ✅ Complete |
