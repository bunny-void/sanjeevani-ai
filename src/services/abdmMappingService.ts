import {
  PatientProfile,
  MedicalReport,
  Medication,
  ExtractedLabItem,
  Appointment,
  UnifiedHealthProfileModel,
  FhirPatient,
  FhirObservation,
  FhirMedicationStatement,
  FhirCondition,
  FhirDiagnosticReport,
  FhirImmunization,
  FhirEncounter
} from '../types';

/**
 * ABDM Mapping Service - Phase 6 Prototype
 * 
 * This service maps Sanjeevani AI's internal state into FHIR-style resources.
 * This is a Mock/Demo implementation of ABDM Readiness.
 */

export const mapPatientToFhir = (patient: PatientProfile): FhirPatient => {
  return {
    resourceType: 'Patient',
    id: patient.id,
    identifier: [
      {
        system: 'https://healthid.ndhm.gov.in',
        value: patient.abhaId || 'ABHA-NOT-SETUP'
      }
    ],
    name: [{ text: patient.name }],
    gender: patient.gender.toLowerCase(),
    telecom: [{ system: 'phone', value: patient.phone }]
  };
};

export const mapConditionsToFhir = (patient: PatientProfile): FhirCondition[] => {
  return patient.medicalConditions.map((cond, idx) => ({
    resourceType: 'Condition',
    id: `cond-${patient.id}-${idx}`,
    subject: { reference: `Patient/${patient.id}` },
    code: { text: cond }
  }));
};

export const mapMedicationsToFhir = (medications: Medication[], patientId: string): FhirMedicationStatement[] => {
  return medications.map(med => ({
    resourceType: 'MedicationStatement',
    id: med.id,
    status: med.status === 'TAKEN' ? 'completed' : 'active',
    medicationCodeableConcept: { text: med.name },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: med.isoDate,
    dosage: [{ text: `${med.dosage} - ${med.frequency} - ${med.timing} - ${med.day}` }]
  }));
};

export const mapLabResultToFhirObservation = (lab: ExtractedLabItem, report: MedicalReport, patientId: string): FhirObservation => {
  // Convert basic string value to number if possible for valueQuantity
  const numericVal = parseFloat(lab.value.replace(/[^0-9.]/g, ''));
  const hasValidNumber = !isNaN(numericVal);

  return {
    resourceType: 'Observation',
    id: `obs-${report.id}-${lab.testName.replace(/\\s+/g, '-')}`,
    status: 'final',
    code: { text: lab.testName },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: report.isoDate,
    valueQuantity: hasValidNumber ? { value: numericVal, unit: lab.unit } : undefined,
    valueString: !hasValidNumber ? `${lab.value} ${lab.unit}` : undefined,
    interpretation: [{ text: lab.flag }]
  };
};

export const mapReportToFhirDiagnosticReport = (report: MedicalReport, patientId: string): FhirDiagnosticReport => {
  return {
    resourceType: 'DiagnosticReport',
    id: report.id,
    status: 'final',
    code: { text: report.title },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: report.isoDate,
    presentedForm: report.fileType ? [{ contentType: `application/${report.fileType.toLowerCase()}`, data: report.fileName }] : undefined
  };
};

export const mapAppointmentsToFhirEncounter = (appointments: Appointment[], patientId: string): FhirEncounter[] => {
  return appointments.map(appt => ({
    resourceType: 'Encounter',
    id: appt.id,
    status: appt.status === 'COMPLETED' ? 'finished' : 'planned',
    class: { code: 'AMB', display: 'ambulatory' },
    subject: { reference: `Patient/${patientId}` },
    period: { start: `${appt.date}T${appt.time}` },
    participant: [{ individual: { display: appt.doctorName } }]
  }));
};

export const mapVaccinationsToFhir = (profile: UnifiedHealthProfileModel, patientId: string): FhirImmunization[] => {
  return profile.vaccinations.map(vax => ({
    resourceType: 'Immunization',
    id: vax.id,
    status: 'completed',
    vaccineCode: { text: vax.vaccine },
    patient: { reference: `Patient/${patientId}` },
    occurrenceDateTime: vax.isoDate,
    protocolApplied: vax.doseSequence ? [{ doseNumberString: vax.doseSequence }] : undefined
  }));
};

export const generateFhirBundle = (
  patient: PatientProfile, 
  reports: MedicalReport[], 
  medications: Medication[], 
  appointments: Appointment[],
  unifiedProfile: UnifiedHealthProfileModel
) => {
  const patientResource = mapPatientToFhir(patient);
  const conditionResources = mapConditionsToFhir(patient);
  const medicationResources = mapMedicationsToFhir(medications, patient.id);
  const diagnosticResources = reports.map(r => mapReportToFhirDiagnosticReport(r, patient.id));
  const encounterResources = mapAppointmentsToFhirEncounter(appointments, patient.id);
  const immunizationResources = mapVaccinationsToFhir(unifiedProfile, patient.id);
  
  const observationResources: FhirObservation[] = [];
  reports.forEach(r => {
    if (r.extractedData && r.extractedData.labTests) {
      r.extractedData.labTests.forEach(lab => {
        observationResources.push(mapLabResultToFhirObservation(lab, r, patient.id));
      });
    }
  });

  return {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [
      { resource: patientResource },
      ...conditionResources.map(r => ({ resource: r })),
      ...medicationResources.map(r => ({ resource: r })),
      ...diagnosticResources.map(r => ({ resource: r })),
      ...encounterResources.map(r => ({ resource: r })),
      ...immunizationResources.map(r => ({ resource: r })),
      ...observationResources.map(r => ({ resource: r }))
    ]
  };
};
