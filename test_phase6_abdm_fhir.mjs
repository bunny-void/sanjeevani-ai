import fs from 'fs';
import path from 'path';

console.log("==================================================");
console.log("PHASE 6 TEST: ABDM / FHIR Readiness Mapping");
console.log("==================================================");

// We won't compile the TypeScript, we'll just check if the files were created
// and the type definitions exist.

const typesPath = './src/types/index.ts';
const appContextPath = './src/context/AppContext.tsx';
const profileViewPath = './src/components/ProfileView.tsx';
const mappingServicePath = './src/services/abdmMappingService.ts';
const docsPath = './ABDM_Prototype_Architecture.md';

function checkFile(filePath, stringsToFind) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  let passed = true;
  for (const str of stringsToFind) {
    if (content.includes(str)) {
      console.log(`✅ Found "${str}" in ${filePath}`);
    } else {
      console.error(`❌ Missing "${str}" in ${filePath}`);
      passed = false;
    }
  }
  return passed;
}

let allPassed = true;

allPassed = checkFile(typesPath, [
  'abhaId?: string;',
  'export interface FhirPatient',
  'export interface FhirObservation',
  'export interface FhirMedicationStatement',
  'export interface FhirDiagnosticReport'
]) && allPassed;

allPassed = checkFile(appContextPath, [
  "abhaId: 'ABHA-1234-5678-9012'"
]) && allPassed;

allPassed = checkFile(profileViewPath, [
  'ABHA ID',
  '(Demo / Mock)',
  'patient.abhaId'
]) && allPassed;

allPassed = checkFile(mappingServicePath, [
  'export const mapPatientToFhir',
  'export const mapMedicationsToFhir',
  'export const mapLabResultToFhirObservation',
  'export const mapReportToFhirDiagnosticReport',
  'export const generateFhirBundle'
]) && allPassed;

allPassed = checkFile(docsPath, [
  'ABDM Ready — Prototype Architecture',
  'abdmMappingService.ts',
  'FhirPatient'
]) && allPassed;

if (allPassed) {
  console.log("\n✅ ALL PHASE 6 CHECKS PASSED!");
} else {
  console.log("\n❌ SOME CHECKS FAILED. See above.");
}
