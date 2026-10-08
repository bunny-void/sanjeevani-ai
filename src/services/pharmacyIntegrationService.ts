import { Medication } from '../types';

export const MEDICARE_PHARMACY_BASE_URL = 'https://bunny-void.github.io/medicare-pharmacy/';

/**
 * Centralized DEMO product mapping for Sanjeevani AI -> Medicare Pharmacy deep-link integration.
 */
export const DEMO_PRODUCT_MAPPING: Record<string, string> = {
  metformin: 'DEMO_PRODUCT_METFORMIN',
  lisinopril: 'DEMO_PRODUCT_LISINOPRIL',
  atorvastatin: 'DEMO_PRODUCT_ATORVASTATIN',
  amlodipine: 'DEMO_PRODUCT_AMLODIPINE',
  telmisartan: 'DEMO_PRODUCT_TELMISARTAN',
  losartan: 'DEMO_PRODUCT_LOSARTAN',
  aspirin: 'DEMO_PRODUCT_ASPIRIN',
  pantoprazole: 'DEMO_PRODUCT_PANTOPRAZOLE',
  paracetamol: 'DEMO_PRODUCT_PARACETAMOL',
  levothyroxine: 'DEMO_PRODUCT_LEVOTHYROXINE'
};

/**
 * Extracts the clean medicine name from a medication record (e.g. "Metformin 500 mg" -> "Metformin").
 */
export function extractCleanMedicineName(rawName: string): string {
  const trimmed = (rawName || '').trim();
  if (!trimmed) return 'Metformin';
  const cleaned = trimmed
    .replace(/\b\d+\s*(mg|mcg|g|ml|iu|tablets?|tabs?|capsules?|caps?)\b.*$/i, '')
    .trim();
  return cleaned || trimmed;
}

/**
 * Resolves the centralized DEMO_PRODUCT_* identifier for a given medicine name.
 */
export function resolveDemoProductId(medicineName: string): string {
  const cleanKey = extractCleanMedicineName(medicineName).toLowerCase();
  if (DEMO_PRODUCT_MAPPING[cleanKey]) {
    return DEMO_PRODUCT_MAPPING[cleanKey];
  }
  for (const [key, prodId] of Object.entries(DEMO_PRODUCT_MAPPING)) {
    if (cleanKey.includes(key) || key.includes(cleanKey)) {
      return prodId;
    }
  }
  return `DEMO_PRODUCT_${cleanKey.replace(/[^a-z0-9]+/gi, '_').toUpperCase()}`;
}

/**
 * Builds the dynamic demo deep-link URL to Medicare Pharmacy:
 * e.g. https://bunny-void.github.io/medicare-pharmacy/?medicine=Metformin
 */
export function buildMedicarePharmacyDeepLink(medicineOrName: Medication | string): string {
  const rawName = typeof medicineOrName === 'string' ? medicineOrName : medicineOrName.name;
  const cleanMedicineName = extractCleanMedicineName(rawName);
  return `${MEDICARE_PHARMACY_BASE_URL}?medicine=${encodeURIComponent(cleanMedicineName)}`;
}

/**
 * Finds the best matching medication from the user's current medication list when spoken in voice check-in.
 */
export function findMedicationFromSpokenText(
  spokenText: string,
  medications: Medication[]
): Medication | undefined {
  if (!medications || medications.length === 0) return undefined;
  const lower = (spokenText || '').toLowerCase();

  // 1. Check if the user explicitly mentioned one of their medication names
  for (const med of medications) {
    const cleanName = extractCleanMedicineName(med.name).toLowerCase();
    if (cleanName && lower.includes(cleanName)) {
      return med;
    }
  }

  // 2. Otherwise prioritize a medication marked NEEDS_REFILL, then REMINDER, then first medication
  return (
    medications.find((m) => m.status === 'NEEDS_REFILL') ||
    medications.find((m) => m.status === 'REMINDER') ||
    medications[0]
  );
}
