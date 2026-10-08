# ABDM Ready — Prototype Architecture

## Overview
This document outlines the architecture for the Ayushman Bharat Digital Mission (ABDM) / FHIR readiness layer in the Sanjeevani AI prototype. This integration is explicitly labeled as **"ABDM Ready — Prototype Architecture"** to indicate that it is a mock implementation demonstrating interoperability concepts without production authentication or data exchange.

## Data Flow
The system isolates the internal React state representation from the interoperable FHIR format:

```mermaid
flowchart LR
    A[Sanjeevani Internal Model] -->|abdmMappingService.ts| B[FHIR-style Resources]
    B --> C[Future ABDM / HIE Gateway]
```

1. **Sanjeevani Record**: The application continues to use its native models (`PatientProfile`, `MedicalReport`, `Medication`, `Appointment`) which are optimized for React UI rendering, local storage, and the Gemini AI Copilot logic.
2. **Normalized Internal Model**: Data is collected from the context and unified models (e.g., `UnifiedHealthProfileModel`).
3. **FHIR-Style Representation**: The `abdmMappingService.ts` module generates standardized FHIR resources (`Patient`, `Condition`, `MedicationStatement`, `Observation`, `DiagnosticReport`, `Immunization`, `Encounter`).
4. **Future ABDM Integration**: When real credentials and a sandbox HIE gateway are introduced, the generated `Bundle` can be signed and pushed.

## Resource Mapping
- **PatientProfile** $\rightarrow$ `FhirPatient` (Uses the `abhaId` property for identity).
- **MedicalConditions** $\rightarrow$ `FhirCondition`.
- **Medication** $\rightarrow$ `FhirMedicationStatement`.
- **MedicalReport (General)** $\rightarrow$ `FhirDiagnosticReport`.
- **ExtractedLabItem** $\rightarrow$ `FhirObservation`.
- **UnifiedVaccinationItem** $\rightarrow$ `FhirImmunization`.
- **Appointment** $\rightarrow$ `FhirEncounter`.

## Demo Integration Details
- The ABHA ID is displayed on the UI as `ABHA-1234-5678-9012 (Demo / Mock)`.
- No real health exchanges occur. The mapping service exists as a standalone module that can be queried or serialized, avoiding unnecessary refactoring of the entire application.
