import {
  ExtractedMedicalData,
  LabAbnormalFlag,
  MedicalReport,
  ReportCategoryId,
  ValueToDiscussItem
} from '../types';
import { buildApiUrl } from './apiConfig';

export interface ReportCategoryMeta {
  id: ReportCategoryId;
  title: string;
  shortTitle: string;
  unitLabel: 'reports' | 'records';
  description: string;
}

export const REPORT_CATEGORIES: ReportCategoryMeta[] = [
  {
    id: 'PRESCRIPTION',
    title: 'Prescriptions',
    shortTitle: 'Prescription',
    unitLabel: 'records',
    description: 'Doctor prescriptions with extracted medicines, strengths, dosages, and schedules'
  },
  {
    id: 'BLOOD_TEST',
    title: 'Blood Test Reports',
    shortTitle: 'Blood Test',
    unitLabel: 'reports',
    description: 'Complete blood counts, metabolic panels, HbA1c, and lipid profiles'
  },
  {
    id: 'XRAY',
    title: 'X-Ray Reports',
    shortTitle: 'X-Ray',
    unitLabel: 'reports',
    description: 'Digital radiography imaging and written radiology findings'
  },
  {
    id: 'SCANNING',
    title: 'Scanning Reports',
    shortTitle: 'Scanning',
    unitLabel: 'reports',
    description: 'Ultrasound, CT scan, MRI, and echocardiogram diagnostic summaries'
  },
  {
    id: 'DISCHARGE_SUMMARY',
    title: 'Discharge Summaries',
    shortTitle: 'Discharge Summary',
    unitLabel: 'records',
    description: 'Hospital discharge records, admission diagnoses, procedures, and follow-up care'
  },
  {
    id: 'VACCINATION',
    title: 'Vaccination Reports',
    shortTitle: 'Vaccination',
    unitLabel: 'records',
    description: 'Immunization certificates, booster dates, and vaccine history'
  },
  {
    id: 'MEDICAL_HISTORY',
    title: 'Medical History Reports',
    shortTitle: 'Medical History',
    unitLabel: 'records',
    description: 'Past diagnoses, specialist consultations, and longitudinal care plans'
  }
];

/**
 * Generates a clean SVG document preview encoded as a data URL for fictional demo reports
 * so users can view, download, or run OCR extraction on them without external network assets.
 */
export function buildDemoReportSvgDataUrl(params: {
  badge: string;
  title: string;
  date: string;
  lines: string[];
}): string {
  const escapedLines = params.lines
    .map(
      (line, idx) =>
        `<text x="36" y="${170 + idx * 30}" font-family="Arial, sans-serif" font-size="13.5" fill="#1E293B">${line
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</text>`
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="490" viewBox="0 0 680 490">
    <rect width="680" height="490" rx="18" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/>
    <rect x="20" y="20" width="640" height="88" rx="12" fill="#0F5C7A"/>
    <text x="40" y="52" font-family="Arial, sans-serif" font-size="11.5" font-weight="bold" fill="#BAE6FD" letter-spacing="1">${params.badge} • FICTIONAL HACKATHON DEMO RECORD</text>
    <text x="40" y="82" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF">${params.title.replace(/&/g, '&amp;')}</text>
    <text x="520" y="82" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#E0F2FE">${params.date}</text>
    <rect x="20" y="124" width="640" height="308" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
    ${escapedLines}
    <text x="36" y="462" font-family="Arial, sans-serif" font-size="11" fill="#64748B">Sanjeevani AI Health Guardian — Fictional Educational Demonstration Document (Not Real Patient Data)</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Plain-language educational description of what a laboratory test generally measures.
 */
export function getPlainLanguageTestPurpose(testName: string = ''): string {
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
 * Compares a reported lab value strictly against the reference range PROVIDED BY THE REPORT.
 * Do not invent a reference range when the report does not provide one:
 * if referenceRange is unavailable/empty, returns 'UNKNOWN'.
 */
export function evaluateLabFlagFromProvidedRange(
  valueStr: string = '',
  rangeStr: string = '',
  fallbackFlag: string = 'UNKNOWN'
): LabAbnormalFlag {
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
    // 1. Interval: "4.0 - 5.6", "4.0–5.6%", "70 to 99"
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

  const upper = String(fallbackFlag || 'UNKNOWN').toUpperCase();
  if (upper === 'NORMAL' || upper === 'HIGH' || upper === 'LOW') {
    return upper as LabAbnormalFlag;
  }
  return 'UNKNOWN';
}

/**
 * Generates the plain-language 3-paragraph explanation for an abnormal lab value (HIGH or LOW)
 * without diagnosing the user.
 */
export function buildAbnormalValuePlainExplanation(
  testName: string,
  value: string,
  unit: string,
  referenceRange: string,
  flag: LabAbnormalFlag,
  existingExplanation: string = ''
): string {
  if (flag !== 'HIGH' && flag !== 'LOW') {
    return existingExplanation || '';
  }

  if (
    existingExplanation &&
    existingExplanation.toLowerCase().includes('reference range') &&
    existingExplanation.toLowerCase().includes('professional')
  ) {
    return existingExplanation.trim();
  }

  const direction = flag === 'HIGH' ? 'above' : 'below';
  const rangeLine = referenceRange
    ? `The report lists a reference range of ${referenceRange}, so this result is ${direction} the range shown on this report.`
    : `This result is marked as ${flag} on the report.`;
  const purposeLine = getPlainLanguageTestPurpose(testName);
  const safetyLine = 'A qualified healthcare professional should interpret this result in context.';

  return `${rangeLine}\n\n${purposeLine}\n\n${safetyLine}`;
}

export function getTeluguTestPurpose(testName: string = ''): string {
  const n = testName.toLowerCase();
  if (n.includes('hba1c') || n.includes('glycated hemoglobin') || n.includes('a1c')) {
    return 'HbA1c గత కొన్ని నెలల్లో రక్తంలో సగటు చక్కెర (బ్లడ్ గ్లూకోజ్) స్థాయిని సూచిస్తుంది.';
  }
  if (n.includes('glucose') || n.includes('blood sugar') || n.includes('fbs') || n.includes('ppbs')) {
    return 'బ్లడ్ గ్లూకోజ్ పరీక్ష రక్తంలో చక్కెర స్థాయిని కొలుస్తుంది.';
  }
  if (n.includes('hemoglobin') || n === 'hb') {
    return 'హిమోగ్లోబిన్ (Hemoglobin) ఎర్ర రక్త కణాలలో ఆక్సిజన్‌ను శరీరమంతటా చేరవేసే ప్రోటీన్.';
  }
  if (n.includes('wbc') || n.includes('white blood') || n.includes('leukocyte')) {
    return 'తెల్ల రక్త కణాల (WBC) సంఖ్య శరీర రోగనిరోధక శక్తిని అంచనా వేయడానికి ఉపయోగపడుతుంది.';
  }
  if (n.includes('platelet')) {
    return 'ప్లేట్‌లెట్స్ (Platelets) రక్తం గడ్డకట్టడంలో సహాయపడే కణాలు.';
  }
  if (n.includes('creatinine') || n.includes('egfr')) {
    return 'ఈ పరీక్ష మూత్రపిండాల (కిడ్నీల) పనితీరును అంచనా వేయడానికి ఉపయోగపడుతుంది.';
  }
  if (n.includes('tsh') || n.includes('t3') || n.includes('t4') || n.includes('thyroid')) {
    return 'ఈ పరీక్ష థైరాయిడ్ గ్రంథి పనితీరు మరియు జీవక్రియ (మెటబాలిజం) నియంత్రణను సూచిస్తుంది.';
  }
  if (n.includes('cholesterol') || n.includes('ldl') || n.includes('hdl') || n.includes('triglyceride')) {
    return 'ఈ లిపిడ్ పరీక్ష రక్తంలోని కొవ్వు మరియు కొలెస్ట్రాల్ స్థాయిలను కొలుస్తుంది.';
  }
  if (n.includes('vitamin d') || n.includes('cholecalciferol')) {
    return 'విటమిన్ D ఎముకల బలం మరియు కాల్షియం శోషణకు తోడ్పడుతుంది.';
  }
  if (n.includes('vitamin b12') || n.includes('cobalamin')) {
    return 'విటమిన్ B12 నరాల పనితీరు మరియు ఎర్ర రక్త కణాల ఉత్పత్తికి ముఖ్యమైనది.';
  }
  return `${testName || 'ఈ పరీక్ష'} సాధారణ ఆరోగ్య పరిస్థితిని అంచనా వేయడానికి ఉపయోగించే ప్రయోగశాల పరీక్ష.`;
}

export function buildAbnormalValueTeluguExplanation(
  testName: string,
  value: string,
  unit: string,
  referenceRange: string,
  flag: LabAbnormalFlag,
  existingExplanationTe: string = ''
): string {
  if (flag !== 'HIGH' && flag !== 'LOW') {
    return existingExplanationTe || '';
  }
  if (existingExplanationTe && /[\u0C00-\u0C7F]/.test(existingExplanationTe)) {
    return existingExplanationTe.trim();
  }
  const directionTe = flag === 'HIGH' ? 'ఎక్కువగా (HIGH)' : 'తక్కువగా (LOW)';
  const valWithUnit = `${value}${unit ? ` ${unit}` : ''}`.trim();
  const rangeLine = referenceRange
    ? `ఈ రిపోర్ట్‌లో ${testName} విలువ ${valWithUnit} గా ఉంది. రిపోర్ట్‌లో ఇచ్చిన సాధారణ పరిధి (${referenceRange}) కంటే ఇది ${directionTe} ఉంది.`
    : `ఈ రిపోర్ట్‌లో ${testName} విలువ ${valWithUnit} (${flag}) గా నమోదైంది.`;
  const purposeLine = getTeluguTestPurpose(testName);
  const safetyLine = 'ఈ ఫలితాన్ని మీ ఆరోగ్య పరిస్థితి ఆధారంగా అర్హత కలిగిన వైద్య నిపుణులు (డాక్టర్) పరిశీలించాలి.';
  return `${rangeLine}\n\n${purposeLine}\n\n${safetyLine}`;
}

export function buildMedicineTeluguInstruction(med: {
  name: string;
  strength?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  instructionsTe?: string;
}): string {
  if (med.instructionsTe && /[\u0C00-\u0C7F]/.test(med.instructionsTe)) {
    return med.instructionsTe.trim();
  }
  const freq = String(med.frequency || '').toLowerCase();
  const instr = String(med.instructions || '').toLowerCase();
  const parts: string[] = [];

  if (freq.includes('twice') || freq.includes('1-0-1') || freq.includes('bid') || freq.includes('bd')) {
    parts.push('రోజుకు రెండుసార్లు (ఉదయం, రాత్రి)');
  } else if (freq.includes('thrice') || freq.includes('1-1-1') || freq.includes('tid') || freq.includes('tds')) {
    parts.push('రోజుకు మూడుసార్లు');
  } else if (freq.includes('morning') || freq.includes('1-0-0')) {
    parts.push('రోజుకు ఒకసారి (ఉదయం)');
  } else if (freq.includes('night') || freq.includes('bedtime') || freq.includes('0-0-1')) {
    parts.push('రోజుకు ఒకసారి (రాత్రి)');
  } else if (freq.includes('once') || freq.includes('daily') || freq.includes('od')) {
    parts.push('రోజుకు ఒకసారి');
  } else if (med.frequency) {
    parts.push(med.frequency);
  }

  if (instr.includes('after food') || instr.includes('after meal') || instr.includes('with meal')) {
    parts.push('భోజనం తర్వాత');
  } else if (instr.includes('before food') || instr.includes('before meal') || instr.includes('empty stomach')) {
    parts.push('భోజనానికి ముందు (ఖాళీ కడుపుతో)');
  } else if (med.instructions) {
    parts.push(med.instructions);
  }

  if (med.duration) {
    parts.push(`వ్యవధి: ${med.duration}`);
  }

  return parts.join(' • ') || 'వైద్యుని సూచనల ప్రకారం తీసుకోవాలి';
}

export function buildTeluguSummaryFromExtractedData(data: ExtractedMedicalData): string {
  if (!data.isReadable) {
    return 'ఈ పత్రంలోని కొంత సమాచారం స్పష్టంగా కనిపించలేదు.';
  }
  if (data.summaryTe && /[\u0C00-\u0C7F]/.test(data.summaryTe)) {
    return data.summaryTe.trim();
  }

  const labTests = data.labTests || [];
  const medicines = data.medicines || [];
  const vaccinations = data.vaccinations || [];

  if (labTests.length > 0) {
    const abnormal = labTests.filter((t) => t.flag === 'HIGH' || t.flag === 'LOW');
    const normal = labTests.filter((t) => t.flag === 'NORMAL');
    const parts: string[] = [];
    parts.push(
      `ఈ రక్త పరీక్ష రిపోర్ట్${data.date ? ` (${data.date})` : ''} లో మొత్తం ${labTests.length} పరీక్ష విలువలు ఉన్నాయి.`
    );
    if (abnormal.length > 0) {
      const abDetails = abnormal
        .map(
          (t) =>
            `${t.testName}: ${t.value}${t.unit ? ` ${t.unit}` : ''} (రిపోర్ట్ సాధారణ పరిధి: ${
              t.referenceRange
            }, స్థితి: ${t.flag === 'HIGH' ? 'ఎక్కువ / HIGH' : 'తక్కువ / LOW'})`
        )
        .join('; ');
      parts.push(`రిపోర్ట్‌లో ఇచ్చిన సాధారణ పరిధి కంటే భిన్నంగా ఉన్న విలువలు: ${abDetails}.`);
    }
    if (normal.length > 0) {
      const normDetails = normal
        .slice(0, 4)
        .map((t) => `${t.testName} (${t.value}${t.unit ? ` ${t.unit}` : ''})`)
        .join(', ');
      parts.push(`సాధారణ పరిధిలో ఉన్న పరీక్షలు: ${normDetails}.`);
    }
    parts.push('ఈ వివరాలను మీ డాక్టర్‌తో సంప్రదించి తగిన సలహా తీసుకోండి.');
    return parts.join(' ');
  }

  if (data.documentType === 'PRESCRIPTION' || (medicines.length > 0 && !data.discharge?.diagnoses?.length)) {
    const medList = medicines
      .map((m) => `${m.name} ${m.strength || m.dosage || ''}`.trim())
      .join(', ');
    return `ఈ ప్రిస్క్రిప్షన్${data.date ? ` (${data.date})` : ''} లో ${medicines.length} మందులు నమోదు చేయబడ్డాయి: ${medList}. సూచించిన మోతాదు మరియు సమయాల ప్రకారం మందులు తీసుకోవాలి.`;
  }

  if (data.documentType === 'DISCHARGE_SUMMARY' || data.discharge?.diagnoses?.length) {
    const diagText = data.discharge?.diagnoses?.length
      ? `నిర్ధారణ (Diagnosis): ${data.discharge.diagnoses.join(', ')}. `
      : '';
    const medText = medicines.length
      ? `డిశ్చార్జ్ మందులు: ${medicines.map((m) => `${m.name} ${m.strength || m.dosage || ''}`.trim()).join(', ')}. `
      : '';
    const followText = data.discharge?.followUp ? `తదుపరి సూచనలు: ${data.discharge.followUp}.` : '';
    return `ఈ ఆసుపత్రి డిశ్చార్జ్ సారాంశం${data.date ? ` (${data.date})` : ''} చికిత్స వివరాలను తెలియజేస్తుంది. ${diagText}${medText}${followText}`.trim();
  }

  if (data.documentType === 'XRAY' || data.documentType === 'SCANNING' || data.diagnostic?.modality) {
    const mod = data.diagnostic?.modality || data.documentType;
    const imp = data.diagnostic?.impression || data.diagnostic?.reportText || '';
    return `ఈ ${mod} స్కాన్/ఎక్స్-రే రిపోర్ట్${data.date ? ` (${data.date})` : ''} లోని ముఖ్య పరిశీలన: ${imp || 'వివరాలు రిపోర్ట్‌లో నమోదు చేయబడ్డాయి.'}`;
  }

  if (data.documentType === 'VACCINATION' || vaccinations.length > 0) {
    const vList = vaccinations
      .map((v) => `${v.vaccine}${v.doseSequence ? ` (${v.doseSequence})` : ''}`)
      .join(', ');
    return `ఈ వ్యాక్సినేషన్ రికార్డు${data.date ? ` (${data.date})` : ''} లో టీకా వివరాలు నమోదయ్యాయి: ${vList}.`;
  }

  if (data.documentType === 'MEDICAL_HISTORY' || data.medicalHistory?.conditions?.length) {
    const conds = data.medicalHistory?.conditions?.join(', ') || '';
    return `ఈ వైద్య చరిత్ర రికార్డు${data.date ? ` (${data.date})` : ''} లో నమోదైన ఆరోగ్య వివరాలు: ${conds || data.summary}.`;
  }

  return `ఈ వైద్య రిపోర్ట్${data.date ? ` (${data.date})` : ''} నుండి సమాచారం సేకరించబడింది. ${data.summary || ''}`.trim();
}

/**
 * Derives the three structured Report Summary UI sections from ExtractedMedicalData:
 * 1. AI SUMMARY (English + Telugu)
 * 2. KEY FINDINGS
 * 3. VALUES TO DISCUSS WITH A PROFESSIONAL (when appropriate)
 */
export function deriveReportSummarySections(data: ExtractedMedicalData): {
  aiSummary: string;
  aiSummaryTe: string;
  keyFindings: string[];
  valuesToDiscuss: ValueToDiscussItem[];
} {
  if (!data.isReadable) {
    return {
      aiSummary: data.unreadableMessage || 'Some information could not be read clearly.',
      aiSummaryTe: 'ఈ పత్రంలోని కొంత సమాచారం స్పష్టంగా కనిపించలేదు.',
      keyFindings: [],
      valuesToDiscuss: []
    };
  }

  const aiSummary =
    data.summary || 'This medical record has been processed and summarized in plain language.';
  const aiSummaryTe = buildTeluguSummaryFromExtractedData(data);

  let keyFindings: string[] = Array.isArray(data.keyFindings)
    ? data.keyFindings.filter(Boolean)
    : [];

  const labTests = data.labTests || [];
  const medicines = data.medicines || [];

  if (keyFindings.length === 0) {
    if (labTests.length > 0) {
      const normalCount = labTests.filter((t) => t.flag === 'NORMAL').length;
      const abnormal = labTests.filter((t) => t.flag === 'HIGH' || t.flag === 'LOW');
      const unknownCount = labTests.filter((t) => t.flag === 'UNKNOWN').length;

      if (normalCount > 0) {
        keyFindings.push(
          `${normalCount} of ${labTests.length} test results are within the reference ranges listed on this report.`
        );
      }
      for (const ab of abnormal) {
        keyFindings.push(
          `${ab.testName}: ${ab.value}${ab.unit ? ` ${ab.unit}` : ''} is ${
            ab.flag === 'HIGH' ? 'above' : 'below'
          } the report's reference range (${ab.referenceRange}).`
        );
      }
      if (unknownCount > 0) {
        keyFindings.push(
          `${unknownCount} test value(s) do not list a reference range on this report (Status: UNKNOWN).`
        );
      }
    } else if (medicines.length > 0) {
      keyFindings.push(
        `Contains ${medicines.length} prescribed medicine${medicines.length === 1 ? '' : 's'}.`
      );
      for (const m of medicines) {
        keyFindings.push(
          `${m.name} (${m.strength || m.dosage}) — ${m.frequency}${
            m.duration ? ` for ${m.duration}` : ''
          }${m.instructions ? ` (${m.instructions})` : ''}`
        );
      }
    } else if (data.diagnostic && (data.diagnostic.modality || data.diagnostic.impression || data.diagnostic.reportText)) {
      if (data.diagnostic.modality) {
        keyFindings.push(
          `Examination: ${data.diagnostic.modality}${
            data.diagnostic.bodyArea ? ` (${data.diagnostic.bodyArea})` : ''
          }`
        );
      }
      if (data.diagnostic.reportText) {
        keyFindings.push(`Findings: ${data.diagnostic.reportText}`);
      }
      if (data.diagnostic.impression) {
        keyFindings.push(`Impression: ${data.diagnostic.impression}`);
      }
    } else if (data.discharge) {
      if (data.discharge.diagnoses && data.discharge.diagnoses.length > 0) {
        keyFindings.push(`Recorded Diagnoses: ${data.discharge.diagnoses.join(', ')}`);
      }
      if (data.discharge.procedures && data.discharge.procedures.length > 0) {
        keyFindings.push(`Procedures: ${data.discharge.procedures.join(', ')}`);
      }
      if (data.discharge.followUp) {
        keyFindings.push(`Follow-Up Plan: ${data.discharge.followUp}`);
      }
    } else if (data.vaccinations && data.vaccinations.length > 0) {
      for (const v of data.vaccinations) {
        keyFindings.push(
          `${v.vaccine}${v.doseSequence ? ` — ${v.doseSequence}` : ''}${
            v.date ? ` (${v.date})` : ''
          }`
        );
      }
    } else if (data.medicalHistory) {
      if (data.medicalHistory.conditions.length > 0) {
        keyFindings.push(`Recorded Conditions: ${data.medicalHistory.conditions.join(', ')}`);
      }
      if (data.medicalHistory.relevantNotes) {
        keyFindings.push(`Clinical Notes: ${data.medicalHistory.relevantNotes}`);
      }
    }
  }

  // Derive VALUES TO DISCUSS WITH A PROFESSIONAL from abnormal lab tests (HIGH / LOW)
  const valuesToDiscuss: ValueToDiscussItem[] = labTests
    .filter((t) => t.flag === 'HIGH' || t.flag === 'LOW')
    .map((t) => ({
      testOrFinding: t.testName,
      reportedValue: `${t.value}${t.unit ? ` ${t.unit}` : ''}`.trim(),
      referenceRange: t.referenceRange,
      status: t.flag,
      explanation: buildAbnormalValuePlainExplanation(
        t.testName,
        t.value,
        t.unit,
        t.referenceRange,
        t.flag,
        t.explanation
      ),
      explanationTe: buildAbnormalValueTeluguExplanation(
        t.testName,
        t.value,
        t.unit,
        t.referenceRange,
        t.flag,
        t.explanationTe
      )
    }));

  return {
    aiSummary,
    aiSummaryTe,
    keyFindings,
    valuesToDiscuss
  };
}

/**
 * Converts structured ExtractedMedicalData into a clean text block for AI Copilot context
 * and report summary display.
 */
export function formatExtractedDataToSummaryText(data: ExtractedMedicalData): string {
  if (!data.isReadable) {
    return data.unreadableMessage || 'Some information could not be read clearly.';
  }

  const sections = deriveReportSummarySections(data);
  const lines: string[] = [];
  lines.push(
    `DOCUMENT TYPE: ${data.documentType}${data.date ? ` | Date: ${data.date}` : ''}`
  );
  if (data.doctorName || data.hospitalOrLab) {
    lines.push(
      `Provider: ${[data.doctorName, data.hospitalOrLab].filter(Boolean).join(' — ')}`
    );
  }
  if (data.patientName) {
    lines.push(`Patient: ${data.patientName}`);
  }
  lines.push(`AI SUMMARY: ${sections.aiSummary}`);

  if (sections.keyFindings.length > 0) {
    lines.push('KEY FINDINGS:');
    for (const kf of sections.keyFindings) {
      lines.push(`- ${kf}`);
    }
  }

  if (data.medicines && data.medicines.length > 0) {
    lines.push('Extracted Medicines:');
    for (const m of data.medicines) {
      lines.push(
        `- ${m.name} ${m.strength || m.dosage} | Dosage: ${m.dosage} | Frequency: ${m.frequency}${
          m.duration ? ` | Duration: ${m.duration}` : ''
        }${m.route ? ` | Route: ${m.route}` : ''}${
          m.instructions ? ` (${m.instructions})` : ''
        }`
      );
    }
  }

  if (data.labTests && data.labTests.length > 0) {
    lines.push('Extracted Lab Results (Compared against report reference ranges):');
    for (const t of data.labTests) {
      lines.push(
        `- Test: ${t.testName} | Value: ${t.value} | Unit: ${t.unit || 'N/A'} | Reference Range: ${
          t.referenceRange || 'Not provided on report'
        } | Status: ${t.flag}`
      );
    }
  }

  if (sections.valuesToDiscuss.length > 0) {
    lines.push('VALUES TO DISCUSS WITH A PROFESSIONAL:');
    for (const v of sections.valuesToDiscuss) {
      lines.push(
        `- ${v.testOrFinding}: ${v.reportedValue} (Report Reference Range: ${v.referenceRange}, Status: ${v.status})\n  ${v.explanation.replace(/\n+/g, ' ')}`
      );
    }
  }

  if (data.diagnostic && (data.diagnostic.modality || data.diagnostic.reportText || data.diagnostic.impression)) {
    if (data.diagnostic.modality) lines.push(`Modality/Test: ${data.diagnostic.modality}`);
    if (data.diagnostic.bodyArea) lines.push(`Body Area: ${data.diagnostic.bodyArea}`);
    if (data.diagnostic.reportText) lines.push(`Findings: ${data.diagnostic.reportText}`);
    if (data.diagnostic.impression) lines.push(`Impression: ${data.diagnostic.impression}`);
  }

  if (data.discharge) {
    const d = data.discharge;
    if (d.hospital || d.doctor) {
      lines.push(`Hospital/Doctor: ${[d.hospital, d.doctor].filter(Boolean).join(' • ')}`);
    }
    if (d.diagnoses && d.diagnoses.length > 0) {
      lines.push(`Diagnoses: ${d.diagnoses.join(', ')}`);
    }
    if (d.procedures && d.procedures.length > 0) {
      lines.push(`Procedures: ${d.procedures.join(', ')}`);
    }
    if (d.importantInstructions) {
      lines.push(`Instructions: ${d.importantInstructions}`);
    }
    if (d.followUp) {
      lines.push(`Follow-Up: ${d.followUp}`);
    }
  }

  if (data.vaccinations && data.vaccinations.length > 0) {
    lines.push('Vaccination Details:');
    for (const v of data.vaccinations) {
      lines.push(
        `- ${v.vaccine}${v.doseSequence ? ` (${v.doseSequence})` : ''}${
          v.date ? ` on ${v.date}` : ''
        }${v.providerOrLocation ? ` at ${v.providerOrLocation}` : ''}`
      );
    }
  }

  if (data.medicalHistory) {
    const mh = data.medicalHistory;
    if (mh.conditions && mh.conditions.length > 0) {
      lines.push(`Conditions: ${mh.conditions.join(', ')}`);
    }
    if (mh.doctorOrHospital) {
      lines.push(`Recorded By: ${mh.doctorOrHospital}`);
    }
    if (mh.relevantNotes) {
      lines.push(`Notes: ${mh.relevantNotes}`);
    }
  }

  return lines.join('\n');
}

/**
 * Calls the secure backend OCR & Document Extraction service (POST /api/medical-records/extract).
 */
export async function processMedicalDocumentWithAI(params: {
  dataUrl: string;
  mimeType: string;
  fileName: string;
  expectedCategory: ReportCategoryId;
  rawTextHint?: string;
}): Promise<{ extractedData: ExtractedMedicalData; model: string }> {
  const response = await fetch(buildApiUrl('/api/medical-records/extract'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.details || errBody.error || `Document processing failed (${response.status})`);
  }

  return response.json();
}

export const DEFAULT_DEMO_REPORTS: MedicalReport[] = [
  // 0. PRESCRIPTION REPORTS (2 fictional demo prescriptions)
  {
    id: 'rep-rx-2',
    category: 'PRESCRIPTION',
    documentType: 'PRESCRIPTION',
    title: 'Cardiology & Metabolic Maintenance Prescription',
    date: '05 Oct 2026',
    isoDate: '2026-10-05',
    createdAt: '2026-10-05T10:30:00Z',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    fileName: 'Demo_Prescription_Dr_Priya_Nair_05_Oct_2026.pdf',
    isDemoReport: true,
    processingStatus: 'Ready',
    summary:
      'This prescription contains three medicines prescribed by Dr. Priya Nair on 05 Oct 2026 for blood pressure and glycemic maintenance: Metformin 500 mg, Lisinopril 10 mg, and Atorvastatin 20 mg.',
    extractedData: {
      documentType: 'PRESCRIPTION',
      isReadable: true,
      internalConfidence: 0.96,
      title: 'Cardiology & Metabolic Maintenance Prescription',
      date: '05 Oct 2026',
      isoDate: '2026-10-05',
      doctorName: 'Dr. Priya Nair, MD (Cardiology)',
      hospitalOrLab: 'Sanjeevani Heart & Wellness Clinic',
      patientName: 'Demo Patient (Fictional)',
      summary:
        'This prescription contains three medicines prescribed by Dr. Priya Nair on 05 Oct 2026 for blood pressure and glycemic maintenance: Metformin 500 mg, Lisinopril 10 mg, and Atorvastatin 20 mg.',
      medicines: [
        {
          name: 'Metformin',
          strength: '500 mg',
          dosage: '500 mg (1 tablet)',
          frequency: 'Twice daily',
          duration: '90 days',
          route: 'Oral',
          timing: 'Evening',
          instructions: 'Take after meals with water'
        },
        {
          name: 'Lisinopril',
          strength: '10 mg',
          dosage: '10 mg (1 tablet)',
          frequency: 'Once daily',
          duration: '90 days',
          route: 'Oral',
          timing: 'Morning',
          instructions: 'Take at 8:00 AM after breakfast'
        },
        {
          name: 'Atorvastatin',
          strength: '20 mg',
          dosage: '20 mg (1 tablet)',
          frequency: 'Once daily',
          duration: '90 days',
          route: 'Oral',
          timing: 'Evening',
          instructions: 'Take at bedtime (9:00 PM)'
        }
      ]
    },
    extractedSummaryText: `FICTIONAL DEMO PRESCRIPTION — Cardiology & Metabolic Maintenance (05 Oct 2026)
- Prescribing Doctor: Dr. Priya Nair, MD (Sanjeevani Heart & Wellness Clinic)
- Patient: Demo Patient (Fictional)
- Rx 1: Metformin 500 mg | 1 tablet Twice daily (Morning & Evening, Oral) for 90 days — Take after meals
- Rx 2: Lisinopril 10 mg | 1 tablet Once daily (Morning, Oral) for 90 days — Take after breakfast
- Rx 3: Atorvastatin 20 mg | 1 tablet Once daily (Evening, Oral) for 90 days — Take at bedtime`,
    fileDataUrl: buildDemoReportSvgDataUrl({
      badge: 'PRESCRIPTION RECORD',
      title: 'Outpatient Prescription — Dr. Priya Nair',
      date: '05 Oct 2026',
      lines: [
        'Doctor: Dr. Priya Nair, MD | Sanjeevani Heart & Wellness Clinic',
        'Patient: Demo Patient (Fictional) | Date: 05 Oct 2026',
        '1. Tab. Metformin 500 mg — 1 tablet Twice Daily (After Meals, Oral) x 90 days',
        '2. Tab. Lisinopril 10 mg — 1 tablet Once Daily (Morning, Oral) x 90 days',
        '3. Tab. Atorvastatin 20 mg — 1 tablet Once Daily (Bedtime, Oral) x 90 days',
        'Instructions: Monitor home BP and fasting glucose weekly. Stay hydrated.'
      ]
    })
  },
  {
    id: 'rep-rx-1',
    category: 'PRESCRIPTION',
    documentType: 'PRESCRIPTION',
    title: 'Vitamin D3 & Joint Support Prescription',
    date: '20 Nov 2025',
    isoDate: '2025-11-20',
    createdAt: '2025-11-20T14:15:00Z',
    fileType: 'PNG',
    mimeType: 'image/png',
    fileName: 'Demo_Prescription_Ortho_20_Nov_2025.png',
    isDemoReport: true,
    processingStatus: 'Ready',
    summary:
      'Nutritional and joint mobility prescription including Cholecalciferol (Vitamin D3) 2000 IU daily and Calcium Citrate 500 mg.',
    extractedData: {
      documentType: 'PRESCRIPTION',
      isReadable: true,
      internalConfidence: 0.94,
      title: 'Vitamin D3 & Joint Support Prescription',
      date: '20 Nov 2025',
      isoDate: '2025-11-20',
      doctorName: 'Dr. Arjun Mehta, MS (Orthopedics)',
      hospitalOrLab: 'Sanjeevani Mobility & Bone Clinic',
      patientName: 'Demo Patient (Fictional)',
      summary:
        'Nutritional and joint mobility prescription including Cholecalciferol (Vitamin D3) 2000 IU daily and Calcium Citrate 500 mg.',
      medicines: [
        {
          name: 'Vitamin D3 (Cholecalciferol)',
          strength: '2000 IU',
          dosage: '2000 IU (1 capsule)',
          frequency: 'Once daily',
          duration: '60 days',
          route: 'Oral',
          timing: 'Afternoon',
          instructions: 'Take with lunch'
        },
        {
          name: 'Calcium Citrate Malate',
          strength: '500 mg',
          dosage: '500 mg (1 tablet)',
          frequency: 'Once daily',
          duration: '60 days',
          route: 'Oral',
          timing: 'Afternoon',
          instructions: 'Take after afternoon meal'
        }
      ]
    },
    extractedSummaryText: `FICTIONAL DEMO PRESCRIPTION — Vitamin D3 & Joint Support (20 Nov 2025)
- Prescribing Doctor: Dr. Arjun Mehta, MS (Orthopedics)
- Rx 1: Vitamin D3 (Cholecalciferol) 2000 IU — Once daily (Afternoon, Oral) for 60 days
- Rx 2: Calcium Citrate Malate 500 mg — Once daily (Afternoon, Oral) for 60 days`,
    fileDataUrl: buildDemoReportSvgDataUrl({
      badge: 'PRESCRIPTION RECORD',
      title: 'Orthopedic & Bone Support Prescription',
      date: '20 Nov 2025',
      lines: [
        'Doctor: Dr. Arjun Mehta, MS | Sanjeevani Mobility Clinic',
        'Patient: Demo Patient (Fictional) | Date: 20 Nov 2025',
        '1. Cap. Vitamin D3 2000 IU — 1 capsule Once Daily (With Lunch, Oral) x 60 days',
        '2. Tab. Calcium Citrate 500 mg — 1 tablet Once Daily (Afternoon, Oral) x 60 days',
        'Advice: Gentle knee stretching exercises 15 mins daily.'
      ]
    })
  },

  // 1. BLOOD TEST REPORTS (3 demo reports to demonstrate multi-report date disambiguation)
  {
    id: 'rep-blood-3',
    category: 'BLOOD_TEST',
    documentType: 'BLOOD_TEST',
    title: 'CBC & HbA1c Blood Test',
    date: '08 Oct 2026',
    isoDate: '2026-10-08',
    createdAt: '2026-10-08T09:00:00Z',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    fileName: 'Demo_CBC_HbA1c_08_Oct_2026.pdf',
    isDemoReport: true,
    processingStatus: 'Ready',
    summary:
      'This blood test checks several aspects of blood health and blood sugar control. Complete blood count values (Hemoglobin 13.8 g/dL, WBC, Platelets) and Total Cholesterol are within the reference ranges shown on the report, while HbA1c (7.4%) and Fasting Blood Glucose (126 mg/dL) are above the reported reference ranges and Vitamin D (18 ng/mL) is below range.',
    extractedData: {
      documentType: 'BLOOD_TEST',
      isReadable: true,
      internalConfidence: 0.97,
      title: 'CBC & HbA1c Blood Test',
      date: '08 Oct 2026',
      isoDate: '2026-10-08',
      hospitalOrLab: 'Sanjeevani Central Diagnostic Laboratory',
      patientName: 'Demo Patient (Fictional)',
      summary:
        'This blood test checks several aspects of blood health and blood sugar control. Complete blood count values (Hemoglobin 13.8 g/dL, WBC, Platelets) and Total Cholesterol are within the reference ranges shown on the report, while HbA1c (7.4%) and Fasting Blood Glucose (126 mg/dL) are above the reported reference ranges and Vitamin D (18 ng/mL) is below range.',
      labTests: [
        {
          testName: 'HbA1c (Glycated Hemoglobin)',
          value: '7.4',
          unit: '%',
          referenceRange: '4.0–5.6%',
          flag: 'HIGH'
        },
        {
          testName: 'Fasting Blood Glucose',
          value: '126',
          unit: 'mg/dL',
          referenceRange: '70–99 mg/dL',
          flag: 'HIGH'
        },
        {
          testName: 'Hemoglobin (Hb)',
          value: '13.8',
          unit: 'g/dL',
          referenceRange: '13.0–17.0 g/dL',
          flag: 'NORMAL'
        },
        {
          testName: 'Vitamin D (25-OH)',
          value: '18',
          unit: 'ng/mL',
          referenceRange: '30–100 ng/mL',
          flag: 'LOW'
        },
        {
          testName: 'White Blood Cell Count (WBC)',
          value: '6,400',
          unit: '/mcL',
          referenceRange: '4,500–11,000 /mcL',
          flag: 'NORMAL'
        },
        {
          testName: 'Platelet Count',
          value: '245,000',
          unit: '/mcL',
          referenceRange: '150,000–450,000 /mcL',
          flag: 'NORMAL'
        },
        {
          testName: 'C-Reactive Protein (CRP)',
          value: '1.2',
          unit: 'mg/L',
          referenceRange: '',
          flag: 'UNKNOWN'
        }
      ]
    },
    extractedSummaryText: `FICTIONAL DEMO REPORT — CBC & Metabolic Blood Panel (08 Oct 2026)
- HbA1c (Glycated Hemoglobin): 7.4% (Reference range: 4.0–5.6%) [HIGH]
- Fasting Blood Glucose: 126 mg/dL (Reference range: 70–99 mg/dL) [HIGH]
- Hemoglobin (Hb): 13.8 g/dL (Reference range: 13.0–17.0 g/dL) [NORMAL]
- Vitamin D (25-OH): 18 ng/mL (Reference range: 30–100 ng/mL) [LOW]
- White Blood Cell Count (WBC): 6,400 /mcL (Reference range: 4,500–11,000 /mcL) [NORMAL]
- Platelet Count: 245,000 /mcL (Reference range: 150,000–450,000 /mcL) [NORMAL]
- C-Reactive Protein (CRP): 1.2 mg/L (Reference range: Not provided) [UNKNOWN]`,
    fileDataUrl: buildDemoReportSvgDataUrl({
      badge: 'BLOOD TEST REPORT',
      title: 'CBC & HbA1c Blood Test',
      date: '08 Oct 2026',
      lines: [
        'Lab: Sanjeevani Central Diagnostic Laboratory | Date: 08 Oct 2026',
        'HbA1c (Glycated Hemoglobin): 7.4% (Ref: 4.0 - 5.6%) [HIGH]',
        'Fasting Blood Glucose: 126 mg/dL (Ref: 70 - 99 mg/dL) [HIGH]',
        'Hemoglobin (Hb): 13.8 g/dL (Ref: 13.0 - 17.0 g/dL) [NORMAL]',
        'Vitamin D (25-OH): 18 ng/mL (Ref: 30 - 100 ng/mL) [LOW]',
        'White Blood Cell (WBC): 6,400 /mcL | Platelets: 245,000 /mcL [NORMAL]',
        'C-Reactive Protein (CRP): 1.2 mg/L (Reference range: Not provided) [UNKNOWN]'
      ]
    })
  },
  {
    id: 'rep-blood-2',
    category: 'BLOOD_TEST',
    documentType: 'BLOOD_TEST',
    title: 'CBC & Glycemic Panel',
    date: '18 Aug 2025',
    isoDate: '2025-08-18',
    createdAt: '2025-08-18T09:00:00Z',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    fileName: 'Demo_CBC_Panel_18_Aug_2025.pdf',
    isDemoReport: true,
    processingStatus: 'Ready',
    summary:
      'Mid-year blood panel showing normal CBC counts and elevated HbA1c (6.7%) and fasting glucose (122 mg/dL).',
    extractedData: {
      documentType: 'BLOOD_TEST',
      isReadable: true,
      internalConfidence: 0.95,
      title: 'CBC & Glycemic Panel',
      date: '18 Aug 2025',
      isoDate: '2025-08-18',
      hospitalOrLab: 'Sanjeevani Central Diagnostic Laboratory',
      summary:
        'Mid-year blood panel showing normal CBC counts and elevated HbA1c (6.7%) and fasting glucose (122 mg/dL).',
      labTests: [
        {
          testName: 'Hemoglobin (Hb)',
          value: '13.5',
          unit: 'g/dL',
          referenceRange: '13.0–17.0 g/dL',
          flag: 'NORMAL'
        },
        {
          testName: 'White Blood Cell Count (WBC)',
          value: '6,800',
          unit: '/mcL',
          referenceRange: '4,500–11,000 /mcL',
          flag: 'NORMAL'
        },
        {
          testName: 'Fasting Blood Glucose',
          value: '122',
          unit: 'mg/dL',
          referenceRange: '70–99 mg/dL',
          flag: 'HIGH'
        },
        {
          testName: 'HbA1c',
          value: '6.7',
          unit: '%',
          referenceRange: '< 5.7%',
          flag: 'HIGH'
        }
      ]
    },
    extractedSummaryText: `FICTIONAL DEMO REPORT — CBC & Glycemic Panel (18 Aug 2025)
- Hemoglobin (Hb): 13.5 g/dL [NORMAL]
- White Blood Cell Count (WBC): 6,800 /mcL [NORMAL]
- Platelet Count: 230,000 /mcL [NORMAL]
- Fasting Blood Glucose: 122 mg/dL [HIGH]
- HbA1c: 6.7% [HIGH]
Lab Note: Fictional mid-year routine checkup panel.`,
    fileDataUrl: buildDemoReportSvgDataUrl({
      badge: 'BLOOD TEST REPORT',
      title: 'CBC & Glycemic Panel',
      date: '18 Aug 2025',
      lines: [
        'Hemoglobin (Hb): 13.5 g/dL (Ref: 13.0 - 17.0 g/dL)',
        'White Blood Cell (WBC): 6,800 /mcL',
        'Platelets: 230,000 /mcL',
        'Fasting Blood Glucose: 122 mg/dL (Ref: 70 - 99 mg/dL) [HIGH]',
        'HbA1c (Glycated Hemoglobin): 6.7% (Ref: < 5.7%) [HIGH]',
        'Note: Fictional August 2025 demonstration blood test report.'
      ]
    })
  },
  {
    id: 'rep-blood-1',
    category: 'BLOOD_TEST',
    documentType: 'BLOOD_TEST',
    title: 'CBC Blood Test',
    date: '12 Apr 2025',
    isoDate: '2025-04-12',
    createdAt: '2025-04-12T09:00:00Z',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    fileName: 'Demo_CBC_Blood_Test_12_Apr_2025.pdf',
    isDemoReport: true,
    processingStatus: 'Ready',
    summary: 'Baseline Complete Blood Count (CBC) showing normal red blood cell, white blood cell, and platelet indices.',
    extractedData: {
      documentType: 'BLOOD_TEST',
      isReadable: true,
      internalConfidence: 0.96,
      title: 'CBC Blood Test',
      date: '12 Apr 2025',
      isoDate: '2025-04-12',
      hospitalOrLab: 'Sanjeevani Central Diagnostic Laboratory',
      summary:
        'Baseline Complete Blood Count (CBC) showing normal red blood cell, white blood cell, and platelet indices.',
      labTests: [
        {
          testName: 'Hemoglobin (Hb)',
          value: '13.4',
          unit: 'g/dL',
          referenceRange: '13.0–17.0 g/dL',
          flag: 'NORMAL'
        },
        {
          testName: 'RBC Count',
          value: '4.6',
          unit: 'million/mcL',
          referenceRange: '4.5–5.9 million/mcL',
          flag: 'NORMAL'
        },
        {
          testName: 'WBC Count',
          value: '7,100',
          unit: '/mcL',
          referenceRange: '4,500–11,000 /mcL',
          flag: 'NORMAL'
        },
        {
          testName: 'Platelets',
          value: '240,000',
          unit: '/mcL',
          referenceRange: '150,000–450,000 /mcL',
          flag: 'NORMAL'
        }
      ]
    },
    extractedSummaryText: `FICTIONAL DEMO REPORT — CBC Blood Test (12 Apr 2025)
- Hemoglobin (Hb): 13.4 g/dL (Reference: 13.0–17.0 g/dL)
- RBC Count: 4.6 million/mcL
- WBC Count: 7,100 /mcL
- Platelets: 240,000 /mcL
- Hematocrit: 41.2%
Lab Note: Fictional baseline Complete Blood Count (CBC) report from April 2025.`,
    fileDataUrl: buildDemoReportSvgDataUrl({
      badge: 'BLOOD TEST REPORT',
      title: 'CBC Blood Test',
      date: '12 Apr 2025',
      lines: [
        'Hemoglobin (Hb): 13.4 g/dL (Ref: 13.0 - 17.0 g/dL)',
        'Red Blood Cell (RBC): 4.6 million/mcL',
        'White Blood Cell (WBC): 7,100 /mcL',
        'Platelets: 240,000 /mcL',
        'Hematocrit (Hct): 41.2%',
        'Note: Fictional April 2025 baseline CBC demonstration report.'
      ]
    })
  },

  // 2. X-RAY REPORTS (2 reports)
  {
    id: 'rep-xray-2',
    category: 'XRAY',
    documentType: 'XRAY',
    title: 'Demo Chest X-Ray Report (PA View)',
    date: '04 Nov 2025',
    isoDate: '2025-11-04',
    createdAt: '2025-11-04T11:20:00Z',
    fileType: 'PNG',
    mimeType: 'image/png',
    fileName: 'Demo_Chest_XRay_04_Nov_2025.png',
    isDemoReport: true,
    processingStatus: 'Ready',
    summary:
      'Written radiology report states clear lung fields bilaterally, normal cardiac silhouette, and no acute cardiopulmonary findings.',
    extractedData: {
      documentType: 'XRAY',
      isReadable: true,
      internalConfidence: 0.95,
      title: 'Demo Chest X-Ray Report (PA View)',
      date: '04 Nov 2025',
      isoDate: '2025-11-04',
      hospitalOrLab: 'Sanjeevani Imaging Center',
      summary:
        'Written radiology report states clear lung fields bilaterally, normal cardiac silhouette, and no acute cardiopulmonary findings.',
      diagnostic: {
        modality: 'Digital Chest Radiograph (PA View)',
        bodyArea: 'Chest / Thorax',
        reportText:
          'Both lung fields appear clear. No focal consolidation or pleural effusion. Normal cardiothoracic ratio. Costophrenic angles are sharp bilaterally.',
        impression: 'No acute cardiopulmonary findings.'
      }
    },
    extractedSummaryText: `FICTIONAL DEMO REPORT — Chest X-Ray PA View (04 Nov 2025)
- Lungs: Both lung fields appear clear. No focal consolidation or pleural effusion.
- Cardiac Silhouette: Normal cardiothoracic ratio.
- Diaphragm & Costophrenic Angles: Sharp bilaterally.
- Bony Thorax: Intact; mild age-related degenerative changes noted along thoracic spine.
Impression: Fictional normal routine chest radiograph for demonstration.`,
    fileDataUrl: buildDemoReportSvgDataUrl({
      badge: 'X-RAY REPORT',
      title: 'Demo Chest X-Ray Report (PA View)',
      date: '04 Nov 2025',
      lines: [
        'Study: Digital Chest Radiograph (PA View) | Body Area: Chest',
        'Lung Fields: Clear bilaterally, no focal consolidation.',
        'Heart Size: Normal cardiothoracic ratio.',
        'Costophrenic Angles: Sharp and clear.',
        'Skeletal: Mild age-related thoracic spine changes.',
        'Impression: No acute cardiopulmonary findings (Fictional Demo).'
      ]
    })
  },
  {
    id: 'rep-xray-1',
    category: 'XRAY',
    documentType: 'XRAY',
    title: 'Demo Right Knee Joint X-Ray',
    date: '19 May 2025',
    isoDate: '2025-05-19',
    createdAt: '2025-05-19T15:00:00Z',
    fileType: 'PNG',
    mimeType: 'image/png',
    fileName: 'Demo_Right_Knee_XRay_19_May_2025.png',
    isDemoReport: true,
    processingStatus: 'Ready',
    summary:
      'Written radiology report notes normal bone alignment without fracture and mild medial compartment joint space narrowing.',
    extractedData: {
      documentType: 'XRAY',
      isReadable: true,
      internalConfidence: 0.94,
      title: 'Demo Right Knee Joint X-Ray',
      date: '19 May 2025',
      isoDate: '2025-05-19',
      hospitalOrLab: 'Sanjeevani Imaging Center',
      summary:
        'Written radiology report notes normal bone alignment without fracture and mild medial compartment joint space narrowing.',
      diagnostic: {
        modality: 'Right Knee Radiograph (AP & Lateral Views)',
        bodyArea: 'Right Knee Joint',
        reportText:
          'Normal tibiofemoral alignment; no acute fracture or dislocation. Mild medial compartment joint space narrowing.',
        impression: 'Mild age-related osteoarthritic changes in right knee.'
      }
    },
    extractedSummaryText: `FICTIONAL DEMO REPORT — Right Knee X-Ray AP/Lateral (19 May 2025)
- Alignment: Normal tibiofemoral alignment; no acute fracture or dislocation.
- Joint Space: Mild medial compartment joint space narrowing consistent with mild osteoarthritis.
- Soft Tissues: Unremarkable; no large joint effusion.`,
    fileDataUrl: buildDemoReportSvgDataUrl({
      badge: 'X-RAY REPORT',
      title: 'Demo Right Knee Joint X-Ray',
      date: '19 May 2025',
      lines: [
        'Study: Right Knee Radiograph (AP & Lateral Views)',
        'Bones: No fracture or dislocation identified.',
        'Joint Space: Mild medial compartment narrowing.',
        'Impression: Mild age-related osteoarthritic changes (Fictional Demo).'
      ]
    })
  },

  // 3. SCANNING REPORTS (1 report)
  {
    id: 'rep-scan-1',
    category: 'SCANNING',
    documentType: 'SCANNING',
    title: 'Demo Abdominal Ultrasound & Carotid Doppler Scan',
    date: '22 Sep 2025',
    isoDate: '2025-09-22',
    createdAt: '2025-09-22T12:00:00Z',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    fileName: 'Demo_Ultrasound_Scan_22_Sep_2025.pdf',
    isDemoReport: true,
    processingStatus: 'Ready',
    summary:
      'Diagnostic ultrasound and screening echocardiogram report noting normal liver and renal echotexture and estimated LVEF of 60%.',
    extractedData: {
      documentType: 'SCANNING',
      isReadable: true,
      internalConfidence: 0.95,
      title: 'Demo Abdominal Ultrasound & Carotid Doppler Scan',
      date: '22 Sep 2025',
      isoDate: '2025-09-22',
      hospitalOrLab: 'Sanjeevani Advanced Diagnostics',
      summary:
        'Diagnostic ultrasound and screening echocardiogram report noting normal liver and renal echotexture and estimated LVEF of 60%.',
      diagnostic: {
        modality: 'Abdominal Ultrasound & Screening Echocardiogram',
        bodyArea: 'Abdomen & Heart',
        reportText:
          'Liver and biliary system show normal size and echotexture with no gallstones. Bilateral kidneys show normal cortical thickness. Screening echo shows LVEF ~60%.',
        impression: 'Unremarkable abdominal ultrasound and normal left ventricular systolic function.'
      }
    },
    extractedSummaryText: `FICTIONAL DEMO REPORT — Abdominal Ultrasound & Echo Screening (22 Sep 2025)
- Liver & Biliary System: Normal size and echotexture; no gallstones or biliary dilation.
- Kidneys: Normal cortical thickness bilaterally; no calculi or hydronephrosis.
- Echocardiogram Screening: Left Ventricular Ejection Fraction (LVEF) estimated at 60%; normal valve motion.`,
    fileDataUrl: buildDemoReportSvgDataUrl({
      badge: 'SCANNING REPORT',
      title: 'Demo Ultrasound & Echo Screening',
      date: '22 Sep 2025',
      lines: [
        'Modality: Diagnostic Ultrasound & Screening Echocardiogram',
        'Liver & Gallbladder: Normal echotexture, no calculi.',
        'Renal Ultrasound: Normal bilateral kidneys.',
        'Cardiac Screening: LVEF ~60%, normal chamber dimensions.',
        'Impression: Unremarkable abdominal scan & normal LVEF (Fictional Demo).'
      ]
    })
  },

  // 4. DISCHARGE SUMMARY REPORTS (1 fictional demo discharge summary)
  {
    id: 'rep-discharge-1',
    category: 'DISCHARGE_SUMMARY',
    documentType: 'DISCHARGE_SUMMARY',
    title: 'Short-Stay Observation & Blood Pressure Stabilization Summary',
    date: '02 Oct 2026',
    isoDate: '2026-10-02',
    createdAt: '2026-10-02T16:30:00Z',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    fileName: 'Demo_Discharge_Summary_02_Oct_2026.pdf',
    isDemoReport: true,
    processingStatus: 'Ready',
    summary:
      'This discharge summary records a 24-hour observation stay at Sanjeevani Multispecialty Hospital (01–02 Oct 2026) under Dr. Priya Nair for transient blood pressure elevation and mild dehydration.',
    extractedData: {
      documentType: 'DISCHARGE_SUMMARY',
      isReadable: true,
      internalConfidence: 0.96,
      title: 'Short-Stay Observation & Blood Pressure Stabilization Summary',
      date: '02 Oct 2026',
      isoDate: '2026-10-02',
      doctorName: 'Dr. Priya Nair, MD',
      hospitalOrLab: 'Sanjeevani Multispecialty Hospital',
      patientName: 'Demo Patient (Fictional)',
      summary:
        'This discharge summary records a 24-hour observation stay at Sanjeevani Multispecialty Hospital (01–02 Oct 2026) under Dr. Priya Nair for transient blood pressure elevation and mild dehydration.',
      discharge: {
        hospital: 'Sanjeevani Multispecialty Hospital',
        doctor: 'Dr. Priya Nair, MD (Cardiology)',
        admissionDate: '01 Oct 2026',
        dischargeDate: '02 Oct 2026',
        diagnoses: [
          'Essential Hypertension — Transient Elevation Stabilized',
          'Mild Volume Depletion (Dehydration)'
        ],
        procedures: [
          '12-Lead Electrocardiogram (Normal Sinus Rhythm)',
          'IV Oral Rehydration & Serial Blood Pressure Monitoring'
        ],
        importantInstructions:
          'Maintain daily oral hydration (2–2.5 liters/day), low-sodium diet, and take morning Lisinopril 10 mg consistently.',
        followUp: 'Outpatient cardiology review with Dr. Priya Nair on 12 Oct 2026.'
      },
      medicines: [
        {
          name: 'Lisinopril',
          strength: '10 mg',
          dosage: '10 mg (1 tablet)',
          frequency: 'Once daily',
          duration: 'Ongoing',
          route: 'Oral',
          timing: 'Morning',
          instructions: 'Continue daily morning dose'
        },
        {
          name: 'Metformin',
          strength: '500 mg',
          dosage: '500 mg (1 tablet)',
          frequency: 'Twice daily',
          duration: 'Ongoing',
          route: 'Oral',
          timing: 'Evening',
          instructions: 'Continue with meals'
        }
      ]
    },
    extractedSummaryText: `FICTIONAL DEMO DISCHARGE SUMMARY — Sanjeevani Multispecialty Hospital (02 Oct 2026)
- Attending Doctor: Dr. Priya Nair, MD
- Admission Date: 01 Oct 2026 | Discharge Date: 02 Oct 2026
- Diagnoses: Essential Hypertension (Stabilized), Mild Dehydration
- Procedures: 12-Lead ECG (Normal Sinus Rhythm), Serial BP Monitoring & Hydration
- Discharge Medications: Lisinopril 10 mg Once Daily (Morning), Metformin 500 mg Twice Daily
- Important Instructions: Low-sodium diet, adequate daily fluids, daily home BP check
- Follow-Up: Cardiology outpatient clinic on 12 Oct 2026`,
    fileDataUrl: buildDemoReportSvgDataUrl({
      badge: 'DISCHARGE SUMMARY',
      title: 'Hospital Discharge Summary — 02 Oct 2026',
      date: '02 Oct 2026',
      lines: [
        'Hospital: Sanjeevani Multispecialty Hospital | Doctor: Dr. Priya Nair, MD',
        'Admission: 01 Oct 2026 | Discharge: 02 Oct 2026',
        'Diagnoses: Essential Hypertension (Stabilized), Mild Dehydration',
        'Procedures: 12-Lead ECG (Normal Sinus Rhythm), IV Hydration',
        'Discharge Meds: Lisinopril 10mg OD (Morning), Metformin 500mg BD',
        'Instructions: Low-sodium diet, 2L water daily, monitor morning BP.',
        'Follow-up: Cardiology OPD with Dr. Priya Nair on 12 Oct 2026.'
      ]
    })
  },

  // 5. VACCINATION REPORTS (4 records)
  {
    id: 'rep-vac-4',
    category: 'VACCINATION',
    documentType: 'VACCINATION',
    title: 'Seasonal Influenza (Flu) Quadrivalent Vaccine',
    date: '15 Sep 2026',
    isoDate: '2026-09-15',
    createdAt: '2026-09-15T10:00:00Z',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    fileName: 'Demo_Flu_Vaccination_15_Sep_2026.pdf',
    isDemoReport: true,
    processingStatus: 'Ready',
    summary:
      'Annual Quadrivalent Seasonal Influenza immunization administered on 15 Sep 2026 at Sanjeevani Preventive Care Center.',
    extractedData: {
      documentType: 'VACCINATION',
      isReadable: true,
      internalConfidence: 0.97,
      title: 'Seasonal Influenza (Flu) Quadrivalent Vaccine',
      date: '15 Sep 2026',
      isoDate: '2026-09-15',
      hospitalOrLab: 'Sanjeevani Preventive Care Center',
      summary:
        'Annual Quadrivalent Seasonal Influenza immunization administered on 15 Sep 2026 at Sanjeevani Preventive Care Center.',
      vaccinations: [
        {
          vaccine: 'Inactivated Quadrivalent Influenza Vaccine (2026–2027)',
          date: '15 Sep 2026',
          doseSequence: 'Annual Booster (0.5 mL IM)',
          providerOrLocation: 'Sanjeevani Preventive Care Center'
        }
      ]
    },
    extractedSummaryText: `FICTIONAL DEMO VACCINATION RECORD — Seasonal Influenza Vaccine (15 Sep 2026)
- Vaccine: Inactivated Quadrivalent Influenza Vaccine (2026–2027 Season)
- Dose: Annual Booster (0.5 mL Intramuscular, Left Deltoid)
- Clinic: Sanjeevani Preventive Care Center
- Status: Completed`,
    fileDataUrl: buildDemoReportSvgDataUrl({
      badge: 'VACCINATION RECORD',
      title: 'Seasonal Influenza (Flu) Vaccine',
      date: '15 Sep 2026',
      lines: [
        'Vaccine: Quadrivalent Seasonal Influenza Vaccine',
        'Date Administered: 15 Sep 2026',
        'Dose / Sequence: Annual Booster (0.5 mL Intramuscular)',
        'Facility: Sanjeevani Preventive Care Center',
        'Status: Verified Fictional Demo Immunization Record'
      ]
    })
  },
  {
    id: 'rep-vac-3',
    category: 'VACCINATION',
    documentType: 'VACCINATION',
    title: 'Pneumococcal Conjugate Vaccine (PCV20)',
    date: '02 Mar 2025',
    isoDate: '2025-03-02',
    createdAt: '2025-03-02T11:00:00Z',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    fileName: 'Demo_Pneumococcal_Vaccine_02_Mar_2025.pdf',
    isDemoReport: true,
    processingStatus: 'Ready',
    summary: 'Adult Pneumococcal 20-valent Conjugate Vaccine (PCV20) administered on 02 Mar 2025.',
    extractedData: {
      documentType: 'VACCINATION',
      isReadable: true,
      internalConfidence: 0.96,
      title: 'Pneumococcal Conjugate Vaccine (PCV20)',
      date: '02 Mar 2025',
      isoDate: '2025-03-02',
      hospitalOrLab: 'Sanjeevani Preventive Care Center',
      summary: 'Adult Pneumococcal 20-valent Conjugate Vaccine (PCV20) administered on 02 Mar 2025.',
      vaccinations: [
        {
          vaccine: 'Pneumococcal 20-valent Conjugate Vaccine (PCV20)',
          date: '02 Mar 2025',
          doseSequence: 'Single Adult Dose',
          providerOrLocation: 'Sanjeevani Preventive Care Center'
        }
      ]
    },
    extractedSummaryText: `FICTIONAL DEMO VACCINATION RECORD — Pneumococcal Conjugate Vaccine PCV20 (02 Mar 2025)
- Vaccine: Pneumococcal 20-valent Conjugate Vaccine
- Date Administered: 02 Mar 2025
- Purpose: Adult respiratory preventive immunization`,
    fileDataUrl: buildDemoReportSvgDataUrl({
      badge: 'VACCINATION RECORD',
      title: 'Pneumococcal Conjugate (PCV20)',
      date: '02 Mar 2025',
      lines: [
        'Vaccine: Pneumococcal 20-valent Conjugate (PCV20)',
        'Date Administered: 02 Mar 2025',
        'Dose: Single Adult Preventive Dose',
        'Status: Completed (Fictional Demo Record)'
      ]
    })
  },
  {
    id: 'rep-vac-2',
    category: 'VACCINATION',
    documentType: 'VACCINATION',
    title: 'Recombinant Shingles (Zoster) Vaccine — Dose 2',
    date: '14 Nov 2024',
    isoDate: '2024-11-14',
    createdAt: '2024-11-14T10:00:00Z',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    fileName: 'Demo_Shingles_Dose2_14_Nov_2024.pdf',
    isDemoReport: true,
    processingStatus: 'Ready',
    summary: 'Recombinant Zoster Vaccine (Shingrix) Dose 2 of 2 completed on 14 Nov 2024.',
    extractedData: {
      documentType: 'VACCINATION',
      isReadable: true,
      internalConfidence: 0.96,
      title: 'Recombinant Shingles (Zoster) Vaccine — Dose 2',
      date: '14 Nov 2024',
      isoDate: '2024-11-14',
      hospitalOrLab: 'Sanjeevani Preventive Care Center',
      summary: 'Recombinant Zoster Vaccine (Shingrix) Dose 2 of 2 completed on 14 Nov 2024.',
      vaccinations: [
        {
          vaccine: 'Shingrix (Recombinant Zoster Vaccine)',
          date: '14 Nov 2024',
          doseSequence: 'Dose 2 of 2 (Series Complete)',
          providerOrLocation: 'Sanjeevani Preventive Care Center'
        }
      ]
    },
    extractedSummaryText: `FICTIONAL DEMO VACCINATION RECORD — Recombinant Zoster Vaccine Dose 2 (14 Nov 2024)
- Vaccine: Shingrix (Recombinant Zoster Vaccine, Adjuvanted)
- Series: Dose 2 of 2 (Series Complete)`,
    fileDataUrl: buildDemoReportSvgDataUrl({
      badge: 'VACCINATION RECORD',
      title: 'Recombinant Shingles Vaccine (Dose 2)',
      date: '14 Nov 2024',
      lines: [
        'Vaccine: Recombinant Zoster Vaccine (Dose 2 of 2)',
        'Date Administered: 14 Nov 2024',
        'Series Status: 2-Dose Series Complete (Fictional Demo)'
      ]
    })
  },
  {
    id: 'rep-vac-1',
    category: 'VACCINATION',
    documentType: 'VACCINATION',
    title: 'Tdap (Tetanus, Diphtheria, Pertussis) Booster',
    date: '10 Jun 2024',
    isoDate: '2024-06-10',
    createdAt: '2024-06-10T10:00:00Z',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    fileName: 'Demo_Tdap_Booster_10_Jun_2024.pdf',
    isDemoReport: true,
    processingStatus: 'Ready',
    summary: 'Adult Tdap booster administered on 10 Jun 2024; next routine decennial booster due in June 2034.',
    extractedData: {
      documentType: 'VACCINATION',
      isReadable: true,
      internalConfidence: 0.96,
      title: 'Tdap (Tetanus, Diphtheria, Pertussis) Booster',
      date: '10 Jun 2024',
      isoDate: '2024-06-10',
      hospitalOrLab: 'Sanjeevani Preventive Care Center',
      summary: 'Adult Tdap booster administered on 10 Jun 2024; next routine decennial booster due in June 2034.',
      vaccinations: [
        {
          vaccine: 'Tdap (Tetanus, Diphtheria, Acellular Pertussis)',
          date: '10 Jun 2024',
          doseSequence: '10-Year Adult Booster',
          providerOrLocation: 'Sanjeevani Preventive Care Center'
        }
      ]
    },
    extractedSummaryText: `FICTIONAL DEMO VACCINATION RECORD — Tdap Adult Booster (10 Jun 2024)
- Vaccine: Tetanus Toxoid, Reduced Diphtheria Toxoid and Acellular Pertussis
- Next Routine Booster Due: June 2034`,
    fileDataUrl: buildDemoReportSvgDataUrl({
      badge: 'VACCINATION RECORD',
      title: 'Tdap Adult Booster Record',
      date: '10 Jun 2024',
      lines: [
        'Vaccine: Tdap (Tetanus, Diphtheria, Pertussis) Booster',
        'Date Administered: 10 Jun 2024',
        'Next Routine Booster: 2034 (Fictional Demo)'
      ]
    })
  },

  // 6. MEDICAL HISTORY REPORTS (2 records)
  {
    id: 'rep-hist-2',
    category: 'MEDICAL_HISTORY',
    documentType: 'MEDICAL_HISTORY',
    title: 'Annual Comprehensive Wellness & Cardiology Summary',
    date: '14 Dec 2025',
    isoDate: '2025-12-14',
    createdAt: '2025-12-14T11:00:00Z',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    fileName: 'Demo_Annual_Wellness_Summary_14_Dec_2025.pdf',
    isDemoReport: true,
    processingStatus: 'Ready',
    summary:
      'Annual clinical history review by Dr. Priya Nair documenting well-controlled hypertension, managed Type 2 diabetes, and mild knee osteoarthritis.',
    extractedData: {
      documentType: 'MEDICAL_HISTORY',
      isReadable: true,
      internalConfidence: 0.96,
      title: 'Annual Comprehensive Wellness & Cardiology Summary',
      date: '14 Dec 2025',
      isoDate: '2025-12-14',
      doctorName: 'Dr. Priya Nair, MD',
      hospitalOrLab: 'Sanjeevani Heart & Wellness Clinic',
      summary:
        'Annual clinical history review by Dr. Priya Nair documenting well-controlled hypertension, managed Type 2 diabetes, and mild knee osteoarthritis.',
      medicalHistory: {
        conditions: [
          'Essential Hypertension (well-controlled)',
          'Type 2 Diabetes Mellitus',
          'Mild Knee Osteoarthritis'
        ],
        date: '14 Dec 2025',
        doctorOrHospital: 'Dr. Priya Nair, MD — Sanjeevani Heart & Wellness Clinic',
        relevantNotes:
          'Home BP averaging 126/80 mmHg. Known allergies: Penicillin, Seasonal Pollen. Continue Lisinopril 10 mg, Metformin 500 mg, and daily 25-minute walk.'
      }
    },
    extractedSummaryText: `FICTIONAL DEMO MEDICAL HISTORY — Annual Cardiology & Internal Medicine Summary (14 Dec 2025)
- Reviewing Physician: Dr. Priya Nair, MD (Sanjeevani Heart & Wellness Clinic)
- Chronic Conditions Managed: Essential Hypertension (well-controlled on Lisinopril 10 mg), Type 2 Diabetes Mellitus (managed on Metformin 500 mg), Mild Knee Osteoarthritis.
- Blood Pressure Trend: Averaging 126/80 mmHg at home.
- Allergies: Penicillin, Seasonal Pollen.
- Care Plan: Continue current maintenance medications, daily morning wellness check-ins, low-sodium Mediterranean-style diet, and 25-minute daily walks.`,
    fileDataUrl: buildDemoReportSvgDataUrl({
      badge: 'MEDICAL HISTORY RECORD',
      title: 'Annual Wellness & Cardiology Summary',
      date: '14 Dec 2025',
      lines: [
        'Physician: Dr. Priya Nair, MD (Cardiology & Internal Medicine)',
        'Managed Conditions: Hypertension, Type 2 Diabetes, Mild Arthritis',
        'Current Regimen: Lisinopril 10mg, Metformin 500mg, Atorvastatin 20mg',
        'Home BP Average: 126/80 mmHg | Resting HR: 72 bpm',
        'Allergies: Penicillin, Seasonal Pollen',
        'Plan: Continue daily routine, hydration, and quarterly follow-up.'
      ]
    })
  },
  {
    id: 'rep-hist-1',
    category: 'MEDICAL_HISTORY',
    documentType: 'MEDICAL_HISTORY',
    title: 'Endocrinology Consultation & Metabolic Care Plan',
    date: '08 Jul 2025',
    isoDate: '2025-07-08',
    createdAt: '2025-07-08T10:30:00Z',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    fileName: 'Demo_Endocrinology_History_08_Jul_2025.pdf',
    isDemoReport: true,
    processingStatus: 'Ready',
    summary:
      'Endocrinology consultation note by Dr. Robert Chen documenting stable glycemic control with no episodes of hypoglycemia.',
    extractedData: {
      documentType: 'MEDICAL_HISTORY',
      isReadable: true,
      internalConfidence: 0.95,
      title: 'Endocrinology Consultation & Metabolic Care Plan',
      date: '08 Jul 2025',
      isoDate: '2025-07-08',
      doctorName: 'Dr. Robert Chen, MD (Endocrinology)',
      hospitalOrLab: 'Sanjeevani Metabolic Institute',
      summary:
        'Endocrinology consultation note by Dr. Robert Chen documenting stable glycemic control with no episodes of hypoglycemia.',
      medicalHistory: {
        conditions: ['Type 2 Diabetes Mellitus — Stable Glycemic Control'],
        date: '08 Jul 2025',
        doctorOrHospital: 'Dr. Robert Chen, MD (Endocrinology)',
        relevantNotes:
          'No hypoglycemic episodes reported. Recommend periodic HbA1c monitoring every 3–6 months and consistent evening Metformin schedule.'
      }
    },
    extractedSummaryText: `FICTIONAL DEMO MEDICAL HISTORY — Endocrinology Consultation Summary (08 Jul 2025)
- Consultant: Dr. Robert Chen, MD (Endocrinology)
- Assessment: Stable glycemic control with no episodes of hypoglycemia.
- Recommendations: Periodic HbA1c monitoring every 3–6 months, balanced carbohydrate intake, and consistent evening Metformin schedule.`,
    fileDataUrl: buildDemoReportSvgDataUrl({
      badge: 'MEDICAL HISTORY RECORD',
      title: 'Endocrinology Consultation Record',
      date: '08 Jul 2025',
      lines: [
        'Consultant: Dr. Robert Chen, MD (Endocrinology)',
        'Focus: Glycemic steadiness and metabolic wellness review',
        'Notes: No hypoglycemic episodes; steady energy levels.',
        'Recommendations: Routine HbA1c follow-up and balanced nutrition.'
      ]
    })
  }
];

/**
 * Ready-to-use fictional sample documents for each of the 7 supported document types
 * so users/judges can test the full Upload -> AI OCR -> Review -> Edit -> Confirm -> Save pipeline in 1 click.
 */
export const SAMPLE_TEST_DOCUMENTS: Record<
  ReportCategoryId,
  {
    fileName: string;
    fileType: 'PDF' | 'PNG' | 'JPG' | 'JPEG';
    mimeType: string;
    defaultTitle: string;
    isoDate: string;
    dataUrl: string;
  }
> = {
  PRESCRIPTION: {
    fileName: 'Sample_Rx_Metformin_Amlodipine_Jan2026.png',
    fileType: 'PNG',
    mimeType: 'image/png',
    defaultTitle: 'Fictional Outpatient Prescription (Dr. Rao)',
    isoDate: '2026-01-22',
    dataUrl: buildDemoReportSvgDataUrl({
      badge: 'PRESCRIPTION',
      title: 'Outpatient Prescription — Dr. K. Srinivas Rao, MD',
      date: '22 Jan 2026',
      lines: [
        'Clinic: Sanjeevani Family Medicine Clinic | Date: 22 Jan 2026',
        'Patient: Demo Patient (Fictional)',
        'Rx 1: Tab. Metformin 500 mg — Twice daily after meals (Oral) x 30 days',
        'Rx 2: Tab. Amlodipine 5 mg — Once daily in the morning (Oral) x 30 days',
        'Rx 3: Cap. Pantoprazole 40 mg — Once daily before breakfast (Oral) x 14 days',
        'Advice: Walk 25 mins daily and review fasting blood sugar after 1 month.'
      ]
    })
  },
  BLOOD_TEST: {
    fileName: 'Sample_Comprehensive_Glycemic_Lab_Report_Jan2026.pdf',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    defaultTitle: 'Fictional Comprehensive Blood & HbA1c Lab Report',
    isoDate: '2026-01-24',
    dataUrl: buildDemoReportSvgDataUrl({
      badge: 'BLOOD TEST / LAB REPORT',
      title: 'Comprehensive Blood & Glycemic Panel',
      date: '24 Jan 2026',
      lines: [
        'Lab: Sanjeevani Reference Laboratory | Date: 24 Jan 2026',
        'Hemoglobin (Hb): 13.8 g/dL (Reference range: 13.0 - 17.0 g/dL)',
        'HbA1c (Glycated Hemoglobin): 7.4 % (Reference range: 4.0 - 5.6 %)',
        'Fasting Blood Glucose: 126 mg/dL (Reference range: 70 - 99 mg/dL)',
        'Vitamin D (25-OH): 18 ng/mL (Reference range: 30 - 100 ng/mL)',
        'Serum Creatinine: 0.92 mg/dL (Reference range: 0.70 - 1.30 mg/dL)',
        'C-Reactive Protein (hs-CRP): 1.2 mg/L (Reference range: Not provided)'
      ]
    })
  },
  XRAY: {
    fileName: 'Sample_Cervical_Spine_XRay_Jan2026.png',
    fileType: 'PNG',
    mimeType: 'image/png',
    defaultTitle: 'Fictional Cervical Spine X-Ray Report',
    isoDate: '2026-01-12',
    dataUrl: buildDemoReportSvgDataUrl({
      badge: 'X-RAY DIAGNOSTIC REPORT',
      title: 'Digital Radiograph — Cervical Spine AP/Lateral',
      date: '12 Jan 2026',
      lines: [
        'Modality: Digital X-Ray (AP & Lateral Views) | Body Area: Cervical Spine',
        'Facility: Sanjeevani Radiology & Imaging Center | Date: 12 Jan 2026',
        'Findings: Normal vertebral body heights and alignment. No acute fracture.',
        'Mild disc space narrowing noted at C5-C6 level.',
        'Prevertebral soft tissues appear normal.',
        'Impression: Mild cervical spondylosis at C5-C6 without acute osseous injury.'
      ]
    })
  },
  SCANNING: {
    fileName: 'Sample_Carotid_Doppler_Scan_Jan2026.pdf',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    defaultTitle: 'Fictional Carotid Artery Doppler Ultrasound',
    isoDate: '2026-01-14',
    dataUrl: buildDemoReportSvgDataUrl({
      badge: 'SCANNING / DIAGNOSTIC REPORT',
      title: 'Bilateral Carotid Color Doppler Ultrasound',
      date: '14 Jan 2026',
      lines: [
        'Modality: Color Doppler Ultrasound | Body Area: Bilateral Carotid Arteries',
        'Facility: Sanjeevani Vascular Diagnostics | Date: 14 Jan 2026',
        'Findings: Normal intima-media thickness bilaterally. Smooth vessel walls.',
        'Normal peak systolic and end-diastolic flow velocities in CCA, ICA, and ECA.',
        'No hemodynamically significant plaque or stenosis seen.',
        'Impression: Normal bilateral carotid Doppler study.'
      ]
    })
  },
  DISCHARGE_SUMMARY: {
    fileName: 'Sample_Hospital_Discharge_Summary_Jan2026.pdf',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    defaultTitle: 'Fictional Inpatient Observation Discharge Summary',
    isoDate: '2026-01-08',
    dataUrl: buildDemoReportSvgDataUrl({
      badge: 'DISCHARGE SUMMARY',
      title: 'Inpatient Discharge Summary — Sanjeevani General Hospital',
      date: '08 Jan 2026',
      lines: [
        'Hospital: Sanjeevani General Hospital | Doctor: Dr. Ananya Sharma, MD',
        'Admission Date: 06 Jan 2026 | Discharge Date: 08 Jan 2026',
        'Final Diagnosis: Acute Viral Gastroenteritis with Mild Dehydration (Resolved)',
        'Procedures Performed: IV Fluid Rehydration, Electrolyte Panel Monitoring',
        'Discharge Meds: ORS Sachet (After loose stools), Probiotic Capsule 1 cap BD x 5 days',
        'Instructions: Soft bland diet for 3 days, plenty of fluids.',
        'Follow-up: Review in Internal Medicine OPD on 15 Jan 2026.'
      ]
    })
  },
  VACCINATION: {
    fileName: 'Sample_HepatitisB_Booster_Record_Jan2026.pdf',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    defaultTitle: 'Fictional Adult Hepatitis B Booster Record',
    isoDate: '2026-01-05',
    dataUrl: buildDemoReportSvgDataUrl({
      badge: 'VACCINATION RECORD',
      title: 'Adult Immunization Certificate — Hepatitis B',
      date: '05 Jan 2026',
      lines: [
        'Vaccine: Recombinant Hepatitis B Adult Vaccine (20 mcg/mL)',
        'Date Administered: 05 Jan 2026',
        'Dose / Sequence: Booster Dose (Intramuscular, Right Deltoid)',
        'Provider / Location: Sanjeevani Community Immunization Clinic',
        'Notes: No post-vaccination adverse reactions observed.'
      ]
    })
  },
  MEDICAL_HISTORY: {
    fileName: 'Sample_Ophthalmology_History_Jan2026.pdf',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    defaultTitle: 'Fictional Annual Diabetic Retinal Screening History',
    isoDate: '2026-01-11',
    dataUrl: buildDemoReportSvgDataUrl({
      badge: 'MEDICAL HISTORY',
      title: 'Specialist History — Annual Retinal & Eye Checkup',
      date: '11 Jan 2026',
      lines: [
        'Doctor / Hospital: Dr. Meera Verma, MS | Sanjeevani Eye Care Institute',
        'Date: 11 Jan 2026 | Condition: Routine Diabetic Retinopathy Screening',
        'Visual Acuity: 6/6 bilaterally with reading correction.',
        'Fundus Exam: Normal optic disc and macula; no evidence of diabetic retinopathy.',
        'Relevant Notes: Continue annual dilated fundus examination and blood sugar control.'
      ]
    })
  }
};

/**
 * Controlled report retrieval helper:
 * Inspects a user's question (and optional recent conversation history) to determine if they are asking
 * about their stored medical reports, selecting ONLY the relevant category/reports.
 */
export function selectRelevantReportsForQuestion(
  question: string,
  allReports: MedicalReport[],
  explicitAttachments: Array<{ reportId?: string }> = [],
  recentHistoryText: string = ''
): {
  matchedCategory: ReportCategoryId | null;
  selectedReports: MedicalReport[];
  isAmbiguousMultiple: boolean;
  candidateReports: MedicalReport[];
} {
  // If user already explicitly attached a stored report, prioritize that exact report
  const attachedIds = explicitAttachments.map((a) => a.reportId).filter(Boolean) as string[];
  if (attachedIds.length > 0) {
    const matched = allReports.filter((r) => attachedIds.includes(r.id));
    return {
      matchedCategory: matched[0]?.category || null,
      selectedReports: matched,
      isAmbiguousMultiple: false,
      candidateReports: matched
    };
  }

  const q = question.toLowerCase();
  const combinedSearch = `${q} ${recentHistoryText.toLowerCase()}`;

  // 1. Check if the question explicitly refers to the user's personal/stored reports
  const hasExplicitPersonalOrReportMarker =
    /\b(my|mine|me|i\s+have|stored|uploaded|latest|most\s+recent|recent|last|previous|report|reports|record|records|discharge\s+summary|scan\s+report|x-ray\s+report|lab\s+report|blood\s+test|impression\s+section|in\s+my\s+report|this\s+report|that\s+report)\b/i.test(
      q
    );

  // 2. Check if this is a multi-turn follow-up question referring to an active report discussed in recent history
  const isMultiTurnFollowUp =
    recentHistoryText.trim().length > 0 &&
    /\b(the\s+hba1c|what\s+is\s+the|that\s+result|this\s+result|those\s+results|these\s+results|outside\s+the\s+range|the\s+range|reference\s+range|reference\s+ranges|that\s+value|this\s+value|the\s+impression|what\s+about|explain\s+that|summarize\s+that|why\s+might\s+that|why\s+is\s+it|abnormal|high|low)\b/i.test(
      q
    );

  if (!hasExplicitPersonalOrReportMarker && !isMultiTurnFollowUp) {
    return {
      matchedCategory: null,
      selectedReports: [],
      isAmbiguousMultiple: false,
      candidateReports: []
    };
  }

  const detectCategory = (text: string): ReportCategoryId | null => {
    if (/\b(prescription|prescriptions|rx|prescribed)\b/i.test(text)) {
      return 'PRESCRIPTION';
    }
    if (/\b(discharge|discharge summary|hospital stay|admission)\b/i.test(text)) {
      return 'DISCHARGE_SUMMARY';
    }
    if (
      /\b(blood|cbc|hemoglobin|hba1c|a1c|glucose|cholesterol|lipid|platelet|wbc|rbc|tsh|thyroid|creatinine|vitamin d|reference range|reference ranges|lab)\b/i.test(
        text
      )
    ) {
      return 'BLOOD_TEST';
    }
    if (/\b(x-ray|xray|radiograph|chest x-ray|knee x-ray|spine x-ray)\b/i.test(text)) {
      return 'XRAY';
    }
    if (/\b(scan|scanning|ultrasound|doppler|ct|mri|echocardiogram|echo|impression)\b/i.test(text)) {
      return 'SCANNING';
    }
    if (
      /\b(vaccine|vaccination|immunization|flu|booster|shingles|pneumococcal|tdap|hepatitis)\b/i.test(
        text
      )
    ) {
      return 'VACCINATION';
    }
    if (/\b(medical history|history report|clinical summary|care plan|past record)\b/i.test(text)) {
      return 'MEDICAL_HISTORY';
    }
    return null;
  };

  const targetCategory = detectCategory(q) || detectCategory(combinedSearch);

  if (!targetCategory) {
    return {
      matchedCategory: null,
      selectedReports: [],
      isAmbiguousMultiple: false,
      candidateReports: []
    };
  }

  // Sort category reports newest first
  const categoryReports = allReports
    .filter((r) => r.category === targetCategory)
    .sort((a, b) => b.isoDate.localeCompare(a.isoDate));

  if (categoryReports.length === 0) {
    return {
      matchedCategory: targetCategory,
      selectedReports: [],
      isAmbiguousMultiple: false,
      candidateReports: []
    };
  }

  if (categoryReports.length === 1) {
    return {
      matchedCategory: targetCategory,
      selectedReports: [categoryReports[0]],
      isAmbiguousMultiple: false,
      candidateReports: categoryReports
    };
  }

  // Check if user specified a date/month/year or "all / compare / history"
  const wantsAllOrCompare = /\b(all|compare|trend|history|every)\b/i.test(q);
  const wantsLatest =
    isMultiTurnFollowUp ||
    /\b(latest|most recent|newest|last|current|those|these|in my report|my report|this report|that report|the report|reference range|reference ranges|outside the range|the range|that result|this result)\b/i.test(
      q
    ) ||
    /\b(latest|most recent|newest)\b/i.test(combinedSearch);

  const dateMatched = categoryReports.filter((r) => {
    const dateLower = r.date.toLowerCase();
    const parts = dateLower.split(/\s+/); // e.g. ["12", "apr", "2025"]
    return (
      q.includes(dateLower) ||
      (parts[1] && q.includes(parts[1])) ||
      (parts[2] && q.includes(parts[2]) && parts[1] && q.includes(parts[1]))
    );
  });

  if (dateMatched.length === 1) {
    return {
      matchedCategory: targetCategory,
      selectedReports: dateMatched,
      isAmbiguousMultiple: false,
      candidateReports: categoryReports
    };
  }

  if (wantsLatest) {
    return {
      matchedCategory: targetCategory,
      selectedReports: [categoryReports[0]],
      isAmbiguousMultiple: false,
      candidateReports: categoryReports
    };
  }

  if (wantsAllOrCompare) {
    return {
      matchedCategory: targetCategory,
      selectedReports: categoryReports,
      isAmbiguousMultiple: false,
      candidateReports: categoryReports
    };
  }

  // Multiple reports exist in this category and user didn't specify date or "latest"
  return {
    matchedCategory: targetCategory,
    selectedReports: categoryReports,
    isAmbiguousMultiple: true,
    candidateReports: categoryReports
  };
}
