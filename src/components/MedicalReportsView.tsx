import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Plus,
  Camera,
  FileUp,
  Eye,
  Download,
  Trash2,
  X,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Pencil,
  Loader2,
  Pill,
  FlaskConical
} from 'lucide-react';
import { useApp, ALL_DAYS_OF_WEEK } from '../context/AppContext';
import {
  ExtractedLabItem,
  ExtractedMedicalData,
  ExtractedMedicineItem,
  MedicalReport,
  ReportCategoryId,
  ReportProcessingStatus
} from '../types';
import {
  REPORT_CATEGORIES,
  ReportCategoryMeta,
  SAMPLE_TEST_DOCUMENTS,
  buildAbnormalValuePlainExplanation,
  buildMedicineTeluguInstruction,
  deriveReportSummarySections,
  evaluateLabFlagFromProvidedRange,
  formatExtractedDataToSummaryText,
  processMedicalDocumentWithAI
} from '../services/reportStorageService';
import {
  SanjeevaniCopilotIcon,
  BloodReportIcon,
  XRayReportIcon,
  ScanReportIcon,
  VaccineReportIcon,
  MedicalHistoryReportIcon,
  PrescriptionReportIcon,
  DischargeSummaryIcon
} from './SanjeevaniIcons';

/**
 * Phase 2 & Phase 5 Structured Report Summary UI Component:
 * Renders:
 * 1. AI SUMMARY (English Summary + తెలుగు సారాంశం)
 * 2. KEY FINDINGS (plus structured Lab Values table with Test | Value | Unit | Reference range | Status)
 * 3. VALUES TO DISCUSS WITH A PROFESSIONAL (when appropriate, with plain-language English & Telugu explanations)
 */
const ReportSummarySectionsPanel: React.FC<{
  extractedData: ExtractedMedicalData;
  compact?: boolean;
}> = ({ extractedData, compact = false }) => {
  const { aiSummary, aiSummaryTe, keyFindings, valuesToDiscuss } =
    deriveReportSummarySections(extractedData);

  const getLabStatusBadgeClass = (flag: ExtractedLabItem['flag']) => {
    switch (flag) {
      case 'HIGH':
      case 'LOW':
        return 'bg-amber-100 text-amber-900 border border-amber-300';
      case 'NORMAL':
        return 'bg-[#2E7D4F]/15 text-[#2E7D4F] border border-[#2E7D4F]/30';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-300';
    }
  };

  return (
    <div className="space-y-3 text-xs">
      {/* SECTION 1: AI SUMMARY (English Summary + తెలుగు సారాంశం) */}
      <div className="bg-[#F3F7FA] rounded-xl p-3 border border-slate-200/90 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F5C7A] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            AI SUMMARY • తెలుగు సారాంశం
          </span>
          {(extractedData.doctorName || extractedData.hospitalOrLab) && (
            <span className="text-[10px] font-bold text-slate-500 truncate">
              {[extractedData.doctorName, extractedData.hospitalOrLab].filter(Boolean).join(' • ')}
            </span>
          )}
        </div>

        {/* English Summary */}
        <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F5C7A] block">
            English Summary
          </span>
          <p className="text-xs text-slate-800 leading-relaxed font-medium">{aiSummary}</p>
        </div>

        {/* తెలుగు సారాంశం */}
        {aiSummaryTe && (
          <div className="bg-sky-50/70 rounded-lg p-2.5 border border-sky-200/80 space-y-1">
            <span className="text-[10px] font-extrabold tracking-wider text-[#0F5C7A] block">
              తెలుగు సారాంశం
            </span>
            <p className="text-xs text-slate-900 leading-relaxed font-medium">{aiSummaryTe}</p>
          </div>
        )}
      </div>

      {/* SECTION 2: KEY FINDINGS & EXTRACTED MEDICINES */}
      {(keyFindings.length > 0 ||
        (extractedData.labTests && extractedData.labTests.length > 0) ||
        (extractedData.medicines && extractedData.medicines.length > 0)) && (
        <div className="bg-white rounded-xl p-3 border border-slate-200/90 space-y-2.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">
            KEY FINDINGS • ముఖ్య అంశాలు
          </span>

          {keyFindings.length > 0 && (
            <ul className="space-y-1.5">
              {keyFindings.map((finding, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="text-[#0F5C7A] font-extrabold mt-0.5">•</span>
                  <span className="leading-relaxed">{finding}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Extracted Medicines with Telugu Instructions where appropriate */}
          {!compact && extractedData.medicines && extractedData.medicines.length > 0 && (
            <div className="pt-1 space-y-1.5 border-t border-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F5C7A] block">
                Extracted Medicines • సూచించిన మందులు
              </span>
              <div className="space-y-1.5">
                {extractedData.medicines.map((m, mIdx) => {
                  const teInstr = buildMedicineTeluguInstruction(m);
                  return (
                    <div
                      key={mIdx}
                      className="p-2 rounded-lg bg-[#F3F7FA] border border-slate-200/80 space-y-0.5"
                    >
                      <p className="font-extrabold text-slate-900 text-xs">
                        {m.name} —{' '}
                        <span className="text-[#0F5C7A]">{m.strength || m.dosage}</span>
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {[m.frequency, m.duration, m.route, m.instructions]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                      {teInstr && (
                        <p className="text-[11px] text-[#0F5C7A] font-semibold">
                          తెలుగు సూచన: {teInstr}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Structured Lab Comparison Table (Test | Value | Unit | Reference range | Status) */}
          {!compact && extractedData.labTests && extractedData.labTests.length > 0 && (
            <div className="overflow-x-auto pt-1">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500">
                    <th className="py-1.5 pr-2">Test</th>
                    <th className="py-1.5 px-2">Value</th>
                    <th className="py-1.5 px-2">Unit</th>
                    <th className="py-1.5 px-2">Reference range</th>
                    <th className="py-1.5 pl-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {extractedData.labTests.map((t, i) => (
                    <tr key={i} className="text-slate-800">
                      <td className="py-2 pr-2 font-bold">{t.testName}</td>
                      <td className="py-2 px-2 font-extrabold">{t.value}</td>
                      <td className="py-2 px-2 text-slate-600">{t.unit || '—'}</td>
                      <td className="py-2 px-2 text-slate-600">
                        {t.referenceRange || 'Not provided'}
                      </td>
                      <td className="py-2 pl-2 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold ${getLabStatusBadgeClass(
                            t.flag
                          )}`}
                        >
                          {t.flag}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: VALUES TO DISCUSS WITH A PROFESSIONAL (when appropriate) */}
      {valuesToDiscuss.length > 0 && (
        <div className="bg-amber-50/70 rounded-xl p-3.5 border border-amber-200/90 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0F5C7A]" />
              VALUES TO DISCUSS WITH A PROFESSIONAL • డాక్టర్‌తో చర్చించాల్సిన విలువలు
            </span>
            <span className="text-[10px] font-bold text-amber-800">
              English & తెలుగు వివరణ
            </span>
          </div>

          <div className="space-y-2.5">
            {valuesToDiscuss.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-3 border border-amber-200/80 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-extrabold text-slate-900 text-xs">
                    {item.testOrFinding}: {item.reportedValue}
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${getLabStatusBadgeClass(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-700 leading-relaxed">
                  {item.explanation
                    .split(/\n\n+/)
                    .filter(Boolean)
                    .map((para, pIdx) => (
                      <p key={pIdx}>{para}</p>
                    ))}
                </div>

                {item.explanationTe && (
                  <div className="mt-1.5 pt-2 border-t border-amber-100 space-y-1 text-[11px] text-slate-800 leading-relaxed bg-sky-50/50 rounded-lg p-2">
                    <span className="text-[10px] font-extrabold text-[#0F5C7A] block">
                      తెలుగు ఆరోగ్య వివరణ:
                    </span>
                    {item.explanationTe
                      .split(/\n\n+/)
                      .filter(Boolean)
                      .map((para, pIdx) => (
                        <p key={pIdx}>{para}</p>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface StagedUploadDocument {
  fileName: string;
  fileType: 'PDF' | 'PNG' | 'JPG' | 'JPEG';
  mimeType: string;
  dataUrl: string;
  category: ReportCategoryId;
  title: string;
  isoDate: string;
  processingStatus: ReportProcessingStatus;
  extractedData: ExtractedMedicalData | null;
  errorMessage?: string;
  isEditingExtraction: boolean;
  editingExistingReportId?: string;
}

const BLANK_UNREADABLE_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';

export const MedicalReportsView: React.FC = () => {
  const {
    medicalReports,
    selectedReportCategory,
    setSelectedReportCategory,
    addMedicalReport,
    updateMedicalReport,
    deleteMedicalReport,
    openCopilotWithReport,
    addMedication,
    showToast,
    appLanguage
  } = useApp();

  const [viewingReport, setViewingReport] = useState<MedicalReport | null>(null);
  const [reportToDelete, setReportToDelete] = useState<MedicalReport | null>(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);

  // Staged Upload + AI OCR + Review State
  const [stagedDoc, setStagedDoc] = useState<StagedUploadDocument | null>(null);

  // Post-Confirm Auto-Integration Modal: "Add extracted medicines to your medication schedule"
  const [pendingMedIntegration, setPendingMedIntegration] = useState<{
    reportTitle: string;
    medicines: Array<ExtractedMedicineItem & { selected: boolean }>;
  } | null>(null);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getCategoryIcon = (categoryId: ReportCategoryId) => {
    switch (categoryId) {
      case 'PRESCRIPTION':
        return <PrescriptionReportIcon className="w-6 h-6" />;
      case 'BLOOD_TEST':
        return <BloodReportIcon className="w-6 h-6" />;
      case 'XRAY':
        return <XRayReportIcon className="w-6 h-6" />;
      case 'SCANNING':
        return <ScanReportIcon className="w-6 h-6" />;
      case 'DISCHARGE_SUMMARY':
        return <DischargeSummaryIcon className="w-6 h-6" />;
      case 'VACCINATION':
        return <VaccineReportIcon className="w-6 h-6" />;
      case 'MEDICAL_HISTORY':
        return <MedicalHistoryReportIcon className="w-6 h-6" />;
    }
  };

  const getCategoryLabel = (categoryId: ReportCategoryId): string => {
    return (
      REPORT_CATEGORIES.find((c) => c.id === categoryId)?.shortTitle ||
      categoryId.replace(/_/g, ' ')
    );
  };

  const getStatusBadgeStyle = (status: ReportProcessingStatus = 'Ready') => {
    switch (status) {
      case 'Ready':
        return 'bg-[#2E7D4F]/15 text-[#2E7D4F] border-[#2E7D4F]/30';
      case 'Processing':
        return 'bg-sky-100 text-[#0F5C7A] border-sky-300';
      case 'Needs Review':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Unreadable':
        return 'bg-rose-100 text-[#B3261E] border-rose-300';
      case 'Error':
        return 'bg-rose-100 text-[#B3261E] border-rose-300';
      case 'Uploaded':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const formatIsoToDisplayDate = (iso: string): string => {
    const parsed = new Date((iso || new Date().toISOString().slice(0, 10)) + 'T00:00:00');
    if (isNaN(parsed.getTime())) {
      return new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDownloadReport = (report: MedicalReport, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const link = document.createElement('a');
    if (report.fileDataUrl) {
      link.href = report.fileDataUrl;
    } else {
      const blob = new Blob([report.extractedSummaryText || report.summary || report.title], {
        type: 'text/plain;charset=utf-8'
      });
      link.href = URL.createObjectURL(blob);
    }
    link.download = report.fileName || `${report.title.replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setShowUploadMenu(false);
    if (!file) return;

    const targetCategory: ReportCategoryId = selectedReportCategory || 'PRESCRIPTION';
    const ext = file.name.split('.').pop()?.toUpperCase() || '';
    let fileType: 'PDF' | 'PNG' | 'JPG' | 'JPEG' = 'PDF';
    if (ext === 'PNG' || file.type === 'image/png') fileType = 'PNG';
    else if (ext === 'JPG' || file.type === 'image/jpeg') fileType = 'JPG';
    else if (ext === 'JPEG') fileType = 'JPEG';
    else if (ext === 'PDF' || file.type === 'application/pdf') fileType = 'PDF';
    else if (file.type.startsWith('image/')) fileType = 'JPG';

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
      setStagedDoc({
        fileName: file.name,
        fileType,
        mimeType:
          file.type || (fileType === 'PDF' ? 'application/pdf' : 'image/png'),
        dataUrl,
        category: targetCategory,
        title: cleanName || 'Uploaded Medical Record',
        isoDate: new Date().toISOString().slice(0, 10),
        processingStatus: 'Uploaded',
        extractedData: null,
        isEditingExtraction: false
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleLoadSampleDocument = (cat: ReportCategoryId, makeUnreadable = false) => {
    setShowUploadMenu(false);
    if (makeUnreadable) {
      setStagedDoc({
        fileName: 'Blurry_Unreadable_Scan.png',
        fileType: 'PNG',
        mimeType: 'image/png',
        dataUrl: BLANK_UNREADABLE_PNG,
        category: cat,
        title: 'Blurry Unreadable Document',
        isoDate: new Date().toISOString().slice(0, 10),
        processingStatus: 'Uploaded',
        extractedData: null,
        isEditingExtraction: false
      });
      return;
    }

    const sample = SAMPLE_TEST_DOCUMENTS[cat];
    setStagedDoc({
      fileName: sample.fileName,
      fileType: sample.fileType,
      mimeType: sample.mimeType,
      dataUrl: sample.dataUrl,
      category: cat,
      title: sample.defaultTitle,
      isoDate: sample.isoDate,
      processingStatus: 'Uploaded',
      extractedData: null,
      isEditingExtraction: false
    });
  };

  const handleRunAIExtraction = async () => {
    if (!stagedDoc) return;
    setStagedDoc((prev) =>
      prev
        ? {
            ...prev,
            processingStatus: 'Processing',
            errorMessage: undefined
          }
        : null
    );

    try {
      const result = await processMedicalDocumentWithAI({
        dataUrl: stagedDoc.dataUrl,
        mimeType: stagedDoc.mimeType,
        fileName: stagedDoc.fileName,
        expectedCategory: stagedDoc.category
      });

      const ext = result.extractedData;
      const nextStatus: ReportProcessingStatus = ext.isReadable
        ? 'Needs Review'
        : 'Unreadable';

      setStagedDoc((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          category: ext.documentType || prev.category,
          title: ext.title && ext.isReadable ? ext.title : prev.title,
          isoDate: ext.isoDate && /^\d{4}-\d{2}-\d{2}$/.test(ext.isoDate) ? ext.isoDate : prev.isoDate,
          processingStatus: nextStatus,
          extractedData: ext,
          isEditingExtraction: !ext.isReadable
        };
      });
    } catch (err: any) {
      setStagedDoc((prev) =>
        prev
          ? {
              ...prev,
              processingStatus: 'Error',
              errorMessage:
                err?.message || 'Could not process document right now. You can edit fields manually or retry.'
            }
          : null
      );
    }
  };

  const handleConfirmAndSaveReport = () => {
    if (!stagedDoc) return;

    const displayDate =
      stagedDoc.extractedData?.date && stagedDoc.extractedData.date.trim()
        ? stagedDoc.extractedData.date.trim()
        : formatIsoToDisplayDate(stagedDoc.isoDate);

    const finalExtracted: ExtractedMedicalData | undefined = stagedDoc.extractedData
      ? {
          ...stagedDoc.extractedData,
          documentType: stagedDoc.category,
          title: stagedDoc.title.trim() || stagedDoc.extractedData.title || 'Medical Record',
          date: displayDate,
          isoDate: stagedDoc.isoDate
        }
      : undefined;

    const finalStatus: ReportProcessingStatus = finalExtracted
      ? finalExtracted.isReadable
        ? 'Ready'
        : 'Unreadable'
      : 'Uploaded';

    const summaryText = finalExtracted
      ? formatExtractedDataToSummaryText(finalExtracted)
      : `Uploaded ${stagedDoc.fileType} record (${displayDate})`;

    const plainSummary = finalExtracted?.summary || '';
    const teluguSummary = finalExtracted
      ? deriveReportSummarySections(finalExtracted).aiSummaryTe
      : '';

    if (stagedDoc.editingExistingReportId) {
      updateMedicalReport(stagedDoc.editingExistingReportId, {
        category: stagedDoc.category,
        documentType: stagedDoc.category,
        title: stagedDoc.title.trim() || 'Medical Record',
        date: displayDate,
        isoDate: stagedDoc.isoDate,
        extractedData: finalExtracted,
        summary: plainSummary,
        summaryTe: teluguSummary,
        extractedSummaryText: summaryText,
        processingStatus: finalStatus
      });
      if (viewingReport && viewingReport.id === stagedDoc.editingExistingReportId) {
        setViewingReport({
          ...viewingReport,
          category: stagedDoc.category,
          documentType: stagedDoc.category,
          title: stagedDoc.title.trim() || 'Medical Record',
          date: displayDate,
          isoDate: stagedDoc.isoDate,
          extractedData: finalExtracted,
          summary: plainSummary,
          summaryTe: teluguSummary,
          extractedSummaryText: summaryText,
          processingStatus: finalStatus
        });
      }
    } else {
      addMedicalReport({
        category: stagedDoc.category,
        documentType: stagedDoc.category,
        title: stagedDoc.title.trim() || 'Uploaded Medical Record',
        date: displayDate,
        isoDate: stagedDoc.isoDate,
        createdAt: new Date().toISOString(),
        fileType: stagedDoc.fileType,
        mimeType: stagedDoc.mimeType,
        fileName: stagedDoc.fileName,
        sourceFile: stagedDoc.fileName,
        fileDataUrl: stagedDoc.dataUrl,
        extractedData: finalExtracted,
        summary: plainSummary,
        summaryTe: teluguSummary,
        extractedSummaryText: summaryText,
        processingStatus: finalStatus,
        isDemoReport: false
      });
    }

    // Check if there are extracted medicines to offer auto-integration with Medication Schedule
    const extractedMeds = finalExtracted?.medicines || [];
    const savedTitle = stagedDoc.title.trim() || 'Medical Record';
    setStagedDoc(null);

    if (extractedMeds.length > 0) {
      setPendingMedIntegration({
        reportTitle: savedTitle,
        medicines: extractedMeds.map((m) => ({ ...m, selected: true }))
      });
    }
  };

  const handleConfirmAddExtractedMedicines = () => {
    if (!pendingMedIntegration) return;
    const selectedMeds = pendingMedIntegration.medicines.filter((m) => m.selected);
    for (const med of selectedMeds) {
      const timing: 'Morning' | 'Afternoon' | 'Evening' =
        med.timing === 'Afternoon' || med.timing === 'Evening' ? med.timing : 'Morning';
      const defaultTime =
        timing === 'Morning'
          ? '08:00 AM'
          : timing === 'Afternoon'
            ? '01:00 PM'
            : '08:00 PM';

      addMedication({
        name: med.name,
        dosage: med.strength || med.dosage || '1 tablet',
        frequency: med.frequency || 'Once daily',
        timing,
        scheduledTime: defaultTime,
        day: 'Every day',
        days: [...ALL_DAYS_OF_WEEK],
        status: 'REMINDER',
        refillStatus: 'NORMAL',
        orderStatus: 'NONE',
        prescriptionFileName: pendingMedIntegration.reportTitle
      });
    }
    setPendingMedIntegration(null);
    if (selectedMeds.length > 0) {
      showToast(`Added ${selectedMeds.length} medicine(s) to your Medication Schedule`);
    }
  };

  const openEditExistingReportExtraction = (rep: MedicalReport) => {
    const fallbackData: ExtractedMedicalData = rep.extractedData || {
      documentType: rep.category,
      isReadable: true,
      internalConfidence: 0.9,
      title: rep.title,
      date: rep.date,
      isoDate: rep.isoDate,
      summary: rep.summary || rep.extractedSummaryText || '',
      medicines: [],
      labTests: [],
      diagnostic: { modality: '', bodyArea: '', reportText: '', impression: '' },
      discharge: {
        hospital: '',
        doctor: '',
        admissionDate: '',
        dischargeDate: '',
        diagnoses: [],
        procedures: [],
        importantInstructions: '',
        followUp: ''
      },
      vaccinations: [],
      medicalHistory: { conditions: [], date: rep.date, doctorOrHospital: '', relevantNotes: '' }
    };

    setStagedDoc({
      fileName: rep.fileName,
      fileType: rep.fileType,
      mimeType: rep.mimeType,
      dataUrl: rep.fileDataUrl || '',
      category: rep.category,
      title: rep.title,
      isoDate: rep.isoDate,
      processingStatus: 'Needs Review',
      extractedData: JSON.parse(JSON.stringify(fallbackData)),
      isEditingExtraction: true,
      editingExistingReportId: rep.id
    });
  };

  const activeCategoryMeta: ReportCategoryMeta | undefined = REPORT_CATEGORIES.find(
    (c) => c.id === selectedReportCategory
  );

  const categoryReports = selectedReportCategory
    ? medicalReports
        .filter((r) => r.category === selectedReportCategory)
        .sort((a, b) => b.isoDate.localeCompare(a.isoDate))
    : [];

  return (
    <div className="space-y-4 pb-8">
      {/* Hidden File Pickers for Photo & File Upload */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        capture="environment"
        onChange={handleFileSelected}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* VIEW 1: MAIN 7 REPORT CATEGORIES LIST */}
      {!selectedReportCategory ? (
        <>
          {/* Header Banner */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0F5C7A]/10 text-[#0F5C7A] text-[10px] font-extrabold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                {appLanguage === 'Telugu'
                  ? 'మెడికల్ రికార్డులు & OCR (English + తెలుగు)'
                  : 'Medical Record Intelligence & OCR'}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {medicalReports.length}{' '}
                {appLanguage === 'Telugu' ? 'మొత్తం రికార్డులు' : 'total records'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {appLanguage === 'Telugu'
                    ? 'మెడికల్ రిపోర్టులు (Medical Reports)'
                    : 'Medical Reports'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {appLanguage === 'Telugu'
                    ? 'మీ ఆరోగ్య రికార్డులను భద్రపరచండి మరియు ఇంగ్లీష్ & తెలుగు సారాంశాలను చూడండి.'
                    : 'Keep your important health records organized.'}
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{appLanguage === 'Telugu' ? 'రిపోర్ట్ అప్‌లోడ్' : 'Upload Record'}</span>
              </button>
            </div>
          </div>

          {/* 7 Compact Rounded Report Category Cards */}
          <div className="space-y-2.5">
            {REPORT_CATEGORIES.map((cat) => {
              const items = medicalReports
                .filter((r) => r.category === cat.id)
                .sort((a, b) => b.isoDate.localeCompare(a.isoDate));
              const latestDate = items[0]?.date;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedReportCategory(cat.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedReportCategory(cat.id);
                    }
                  }}
                  className="bg-white hover:bg-sky-50/50 rounded-2xl px-4 py-3.5 border border-slate-200/90 hover:border-[#0F5C7A]/40 shadow-2xs flex items-center justify-between gap-3.5 transition-all cursor-pointer group"
                >
                  {/* LEFT: Original Sanjeevani Category Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-[#0F5C7A]/10 text-[#0F5C7A] group-hover:bg-[#0F5C7A] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    {getCategoryIcon(cat.id)}
                  </div>

                  {/* CENTER: Category Title + Supporting Count & Latest Date */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight truncate">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">
                      {items.length} {items.length === 1 ? cat.unitLabel.slice(0, -1) : cat.unitLabel}
                      {latestDate ? ` • Latest: ${latestDate}` : ' • View reports'}
                    </p>
                  </div>

                  {/* RIGHT: Clear Download/View Action Icon */}
                  <div className="w-9 h-9 rounded-xl bg-[#F3F7FA] group-hover:bg-[#0F5C7A]/15 text-[#0F5C7A] flex items-center justify-center shrink-0 transition-colors">
                    <Download className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* VIEW 2: SELECTED CATEGORY REPORT DETAILS & UPLOAD */
        <div className="space-y-4">
          {/* Category Top Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setSelectedReportCategory(null);
                  setShowUploadMenu(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#F3F7FA] hover:bg-slate-200/70 text-slate-700 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Categories</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUploadMenu((prev) => !prev)}
                  className="px-3.5 py-2 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Report</span>
                </button>

                {/* Upload Menu: Upload Photo / Upload File / Sample Test Document */}
                {showUploadMenu && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-30 space-y-1">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full px-3 py-2.5 rounded-xl hover:bg-[#F3F7FA] text-left text-xs font-bold text-slate-800 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-[#0F5C7A]" />
                      <span>Upload Photo (JPG/PNG)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-3 py-2.5 rounded-xl hover:bg-[#F3F7FA] text-left text-xs font-bold text-slate-800 flex items-center gap-2.5 cursor-pointer"
                    >
                      <FileUp className="w-4 h-4 text-[#0F5C7A]" />
                      <span>Upload File (PDF/PNG/JPG)</span>
                    </button>
                    <div className="border-t border-slate-100 pt-1">
                      <button
                        type="button"
                        onClick={() => handleLoadSampleDocument(selectedReportCategory, false)}
                        className="w-full px-3 py-2 rounded-xl hover:bg-sky-50 text-left text-[11px] font-extrabold text-[#0F5C7A] flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>Test Sample {activeCategoryMeta?.shortTitle} OCR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadSampleDocument(selectedReportCategory, true)}
                        className="w-full px-3 py-2 rounded-xl hover:bg-rose-50 text-left text-[11px] font-bold text-rose-700 flex items-center gap-2 cursor-pointer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Test Blurry / Unreadable File</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-11 h-11 rounded-2xl bg-[#0F5C7A]/10 text-[#0F5C7A] flex items-center justify-center shrink-0">
                {activeCategoryMeta && getCategoryIcon(activeCategoryMeta.id)}
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {activeCategoryMeta?.title}
                </h2>
                <p className="text-xs text-slate-500">
                  {activeCategoryMeta?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Reports List inside Category */}
          {categoryReports.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-800">
                  No reports in this category yet
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Tap "+ Add Report" above to upload a PDF, PNG, or JPG medical record and extract structured information with AI.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {categoryReports.map((rep) => {
                const status: ReportProcessingStatus =
                  rep.processingStatus || (rep.extractedData ? 'Ready' : 'Uploaded');
                const hasAiSummary = Boolean(
                  rep.summary || rep.extractedData?.summary || rep.extractedSummaryText
                );

                return (
                  <div
                    key={rep.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Thumbnail or File Type Badge */}
                        {rep.fileDataUrl && rep.mimeType.startsWith('image/') ? (
                          <img
                            src={rep.fileDataUrl}
                            alt={rep.title}
                            onClick={() => setViewingReport(rep)}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 cursor-pointer"
                          />
                        ) : (
                          <div
                            onClick={() => setViewingReport(rep)}
                            className="w-12 h-12 rounded-xl bg-[#F3F7FA] border border-slate-200 flex flex-col items-center justify-center text-[#0F5C7A] shrink-0 cursor-pointer"
                          >
                            {rep.fileType === 'PDF' ? (
                              <FileText className="w-5 h-5" />
                            ) : (
                              <ImageIcon className="w-5 h-5" />
                            )}
                            <span className="text-[9px] font-extrabold uppercase mt-0.5">
                              {rep.fileType}
                            </span>
                          </div>
                        )}

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[9px] font-extrabold uppercase">
                              {getCategoryLabel(rep.category)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase ${getStatusBadgeStyle(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                            {hasAiSummary && status === 'Ready' && (
                              <span className="px-2 py-0.5 rounded-full bg-sky-50 text-[#0F5C7A] border border-sky-200 text-[9px] font-extrabold flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                AI Summary
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-extrabold text-slate-900 truncate">
                            {rep.title}
                          </h3>

                          <p className="text-xs text-slate-500 font-semibold">
                            {rep.date} • <span className="text-slate-700 font-bold">{rep.fileType}</span>
                          </p>
                        </div>
                      </div>

                      {/* Delete button (opens confirmation modal) */}
                      <button
                        onClick={() => setReportToDelete(rep)}
                        className="p-2 rounded-xl text-slate-400 hover:text-[#B3261E] hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                        title="Delete Report"
                        aria-label={`Delete ${rep.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Report Summary UI (AI SUMMARY / KEY FINDINGS / VALUES TO DISCUSS WITH A PROFESSIONAL) */}
                    {rep.extractedData ? (
                      <ReportSummarySectionsPanel extractedData={rep.extractedData} />
                    ) : (
                      rep.summary && (
                        <div className="bg-[#F3F7FA] rounded-xl p-3 border border-slate-200/90 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F5C7A] flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            AI SUMMARY
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed">{rep.summary}</p>
                        </div>
                      )
                    )}

                    {/* Action Bar: View | Download | Ask AI about this report */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingReport(rep)}
                          className="px-3 py-1.5 rounded-xl bg-[#F3F7FA] hover:bg-slate-200/70 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#0F5C7A]" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={(e) => handleDownloadReport(rep, e)}
                          className="px-3 py-1.5 rounded-xl bg-[#F3F7FA] hover:bg-slate-200/70 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-[#0F5C7A]" />
                          <span>Download</span>
                        </button>
                      </div>

                      <button
                        onClick={() => openCopilotWithReport(rep)}
                        className="px-3 py-1.5 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                      >
                        <SanjeevaniCopilotIcon className="w-3.5 h-3.5" />
                        <span>Ask AI about this report</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          MODAL 1: UPLOAD, AI DOCUMENT PROCESSING & USER REVIEW STEP
         ===================================================================== */}
      {stagedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 text-slate-900 shadow-2xl flex flex-col max-h-[92vh] space-y-3.5">
            {/* Top Bar */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase ${getStatusBadgeStyle(
                    stagedDoc.processingStatus
                  )}`}
                >
                  {stagedDoc.processingStatus}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {stagedDoc.extractedData
                    ? 'AI Extracted Information'
                    : 'Upload & Process Medical Record'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setStagedDoc(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                title="Cancel & Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
              {/* Source Document Preview + Remove / Sample Switcher */}
              <div className="bg-[#F3F7FA] rounded-2xl p-3 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-slate-700 truncate">
                    File: {stagedDoc.fileName} ({stagedDoc.fileType})
                  </span>
                  {!stagedDoc.editingExistingReportId && (
                    <button
                      type="button"
                      onClick={() => setStagedDoc(null)}
                      className="text-[11px] font-bold text-[#B3261E] hover:underline cursor-pointer shrink-0"
                    >
                      Remove File
                    </button>
                  )}
                </div>

                {stagedDoc.dataUrl && stagedDoc.dataUrl.startsWith('data:image/') && (
                  <img
                    src={stagedDoc.dataUrl}
                    alt="Document preview"
                    className="w-full max-h-44 object-contain bg-white rounded-xl border border-slate-200 p-1.5 mx-auto"
                  />
                )}

                {/* Quick Sample Loader Bar for Judges */}
                {!stagedDoc.editingExistingReportId && !stagedDoc.extractedData && (
                  <div className="pt-1 border-t border-slate-200/80 space-y-1.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Or load a fictional demo document to test AI OCR extraction:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {REPORT_CATEGORIES.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleLoadSampleDocument(c.id, false)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                            stagedDoc.category === c.id
                              ? 'bg-[#0F5C7A] text-white border-[#0F5C7A]'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50'
                          }`}
                        >
                          {c.shortTitle}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleLoadSampleDocument(stagedDoc.category, true)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                      >
                        Unreadable Sample
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Basic Document Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Document Category / Type
                  </label>
                  <select
                    value={stagedDoc.category}
                    onChange={(e) =>
                      setStagedDoc({
                        ...stagedDoc,
                        category: e.target.value as ReportCategoryId
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:outline-none focus:border-[#0F5C7A]"
                  >
                    {REPORT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Document Date
                  </label>
                  <input
                    type="date"
                    value={stagedDoc.isoDate}
                    onChange={(e) =>
                      setStagedDoc({
                        ...stagedDoc,
                        isoDate: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:outline-none focus:border-[#0F5C7A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Report / Record Title
                  </label>
                  <input
                    type="text"
                    value={stagedDoc.title}
                    onChange={(e) =>
                      setStagedDoc({
                        ...stagedDoc,
                        title: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:outline-none focus:border-[#0F5C7A]"
                  />
                </div>
              </div>

              {/* STEP A: Prompt to Process with AI if not yet processed */}
              {stagedDoc.processingStatus === 'Uploaded' && !stagedDoc.extractedData && (
                <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-5 h-5 text-[#0F5C7A] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-slate-900">
                        Run AI Medical Record Intelligence & OCR
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        Extract structured medicines, dosages, lab test values, diagnoses, and plain-language summaries for your review before saving.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunAIExtraction}
                    className="w-full py-2.5 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Process Document with Gemini AI</span>
                  </button>
                </div>
              )}

              {/* STEP B: Processing Spinner */}
              {stagedDoc.processingStatus === 'Processing' && (
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6 text-center space-y-2">
                  <Loader2 className="w-7 h-7 text-[#0F5C7A] animate-spin mx-auto" />
                  <p className="font-extrabold text-slate-900">
                    Analyzing document & extracting structured medical data...
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Communicating securely with Gemini AI backend
                  </p>
                </div>
              )}

              {/* STEP C: Error Banner */}
              {stagedDoc.processingStatus === 'Error' && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2 text-[#B3261E]">
                  <div className="flex items-center gap-2 font-extrabold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{stagedDoc.errorMessage || 'Document processing failed.'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunAIExtraction}
                    className="px-3 py-1.5 rounded-xl bg-white border border-rose-300 text-xs font-bold cursor-pointer"
                  >
                    Retry AI Extraction
                  </button>
                </div>
              )}

              {/* STEP D: Unreadable Document Warning ("Some information could not be read clearly.") */}
              {stagedDoc.extractedData && !stagedDoc.extractedData.isReadable && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-start gap-2.5 text-[#B3261E]">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-sm">
                        Some information could not be read clearly.
                      </h4>
                      <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                        The uploaded image or document appears blurry, blank, or illegible. For your safety, Sanjeevani AI does not guess or invent medical values. Please upload a clearer document or enter details manually below.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP E: USER REVIEW & CORRECTION PANEL ("AI extracted information") */}
              {stagedDoc.extractedData && (
                <div className="bg-white border-2 border-[#0F5C7A]/25 rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F5C7A] block">
                        User Verification Step
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        AI extracted information
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setStagedDoc({
                          ...stagedDoc,
                          isEditingExtraction: !stagedDoc.isEditingExtraction
                        })
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-[#F3F7FA] hover:bg-sky-50 border border-slate-200 text-[#0F5C7A] font-extrabold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>{stagedDoc.isEditingExtraction ? 'Done Editing' : 'Edit'}</span>
                    </button>
                  </div>

                  {/* Provider & Summary */}
                  <div className="space-y-2.5">
                    {stagedDoc.isEditingExtraction ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                              Doctor Name
                            </label>
                            <input
                              type="text"
                              value={stagedDoc.extractedData.doctorName || ''}
                              onChange={(e) =>
                                setStagedDoc({
                                  ...stagedDoc,
                                  extractedData: {
                                    ...stagedDoc.extractedData!,
                                    isReadable: true,
                                    doctorName: e.target.value
                                  }
                                })
                              }
                              placeholder="e.g., Dr. Priya Nair"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                              Hospital / Lab / Clinic
                            </label>
                            <input
                              type="text"
                              value={stagedDoc.extractedData.hospitalOrLab || ''}
                              onChange={(e) =>
                                setStagedDoc({
                                  ...stagedDoc,
                                  extractedData: {
                                    ...stagedDoc.extractedData!,
                                    isReadable: true,
                                    hospitalOrLab: e.target.value
                                  }
                                })
                              }
                              placeholder="e.g., Sanjeevani Clinic"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                            Plain-Language AI Summary
                          </label>
                          <textarea
                            rows={2}
                            value={stagedDoc.extractedData.summary || ''}
                            onChange={(e) =>
                              setStagedDoc({
                                ...stagedDoc,
                                extractedData: {
                                  ...stagedDoc.extractedData!,
                                  isReadable: true,
                                  summary: e.target.value
                                }
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                          />
                        </div>
                      </>
                    ) : (
                      <ReportSummarySectionsPanel extractedData={stagedDoc.extractedData} />
                    )}
                  </div>

                  {/* 1. EXTRACTED MEDICINES (Prescription / Discharge Summary) */}
                  {((stagedDoc.extractedData.medicines &&
                    stagedDoc.extractedData.medicines.length > 0) ||
                    stagedDoc.category === 'PRESCRIPTION' ||
                    stagedDoc.category === 'DISCHARGE_SUMMARY') && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-[#0F5C7A]" />
                          Extracted Medicines ({stagedDoc.extractedData.medicines?.length || 0})
                        </span>
                        {stagedDoc.isEditingExtraction && (
                          <button
                            type="button"
                            onClick={() => {
                              const current = stagedDoc.extractedData?.medicines || [];
                              setStagedDoc({
                                ...stagedDoc,
                                extractedData: {
                                  ...stagedDoc.extractedData!,
                                  isReadable: true,
                                  medicines: [
                                    ...current,
                                    {
                                      name: '',
                                      strength: '',
                                      dosage: '',
                                      frequency: 'Once daily',
                                      duration: '30 days',
                                      route: 'Oral',
                                      timing: 'Morning',
                                      instructions: ''
                                    }
                                  ]
                                }
                              });
                            }}
                            className="text-[11px] font-extrabold text-[#0F5C7A] hover:underline cursor-pointer"
                          >
                            + Add Medicine Row
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {(stagedDoc.extractedData.medicines || []).map((med, idx) =>
                          stagedDoc.isEditingExtraction ? (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2"
                            >
                              <input
                                type="text"
                                placeholder="Medicine Name (e.g. Metformin)"
                                value={med.name}
                                onChange={(e) => {
                                  const next = [...(stagedDoc.extractedData?.medicines || [])];
                                  next[idx] = { ...next[idx], name: e.target.value };
                                  setStagedDoc({
                                    ...stagedDoc,
                                    extractedData: { ...stagedDoc.extractedData!, medicines: next }
                                  });
                                }}
                                className="px-2 py-1 rounded border border-slate-300 bg-white font-bold"
                              />
                              <input
                                type="text"
                                placeholder="Dosage/Strength (e.g. 500 mg)"
                                value={med.dosage}
                                onChange={(e) => {
                                  const next = [...(stagedDoc.extractedData?.medicines || [])];
                                  next[idx] = {
                                    ...next[idx],
                                    dosage: e.target.value,
                                    strength: e.target.value
                                  };
                                  setStagedDoc({
                                    ...stagedDoc,
                                    extractedData: { ...stagedDoc.extractedData!, medicines: next }
                                  });
                                }}
                                className="px-2 py-1 rounded border border-slate-300 bg-white"
                              />
                              <input
                                type="text"
                                placeholder="Frequency (e.g. Twice daily)"
                                value={med.frequency}
                                onChange={(e) => {
                                  const next = [...(stagedDoc.extractedData?.medicines || [])];
                                  next[idx] = { ...next[idx], frequency: e.target.value };
                                  setStagedDoc({
                                    ...stagedDoc,
                                    extractedData: { ...stagedDoc.extractedData!, medicines: next }
                                  });
                                }}
                                className="px-2 py-1 rounded border border-slate-300 bg-white"
                              />
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  placeholder="Instructions / Duration"
                                  value={med.instructions || med.duration || ''}
                                  onChange={(e) => {
                                    const next = [...(stagedDoc.extractedData?.medicines || [])];
                                    next[idx] = { ...next[idx], instructions: e.target.value };
                                    setStagedDoc({
                                      ...stagedDoc,
                                      extractedData: { ...stagedDoc.extractedData!, medicines: next }
                                    });
                                  }}
                                  className="flex-1 px-2 py-1 rounded border border-slate-300 bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = (stagedDoc.extractedData?.medicines || []).filter(
                                      (_, i) => i !== idx
                                    );
                                    setStagedDoc({
                                      ...stagedDoc,
                                      extractedData: { ...stagedDoc.extractedData!, medicines: next }
                                    });
                                  }}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-[#F3F7FA] border border-slate-200/80 flex items-center justify-between gap-2"
                            >
                              <div>
                                <p className="font-extrabold text-slate-900">
                                  {med.name} — <span className="text-[#0F5C7A]">{med.dosage || med.strength}</span>
                                </p>
                                <p className="text-[11px] text-slate-600">
                                  {med.frequency}
                                  {med.duration ? ` • ${med.duration}` : ''}
                                  {med.route ? ` • ${med.route}` : ''}
                                  {med.instructions ? ` (${med.instructions})` : ''}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. EXTRACTED LAB TEST VALUES EDITOR (When in Edit mode) */}
                  {stagedDoc.isEditingExtraction &&
                    ((stagedDoc.extractedData.labTests &&
                      stagedDoc.extractedData.labTests.length > 0) ||
                      stagedDoc.category === 'BLOOD_TEST') && (
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-[#0F5C7A]" />
                            Edit Lab Results ({stagedDoc.extractedData.labTests?.length || 0})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const current = stagedDoc.extractedData?.labTests || [];
                              setStagedDoc({
                                ...stagedDoc,
                                extractedData: {
                                  ...stagedDoc.extractedData!,
                                  isReadable: true,
                                  labTests: [
                                    ...current,
                                    {
                                      testName: '',
                                      value: '',
                                      unit: '',
                                      referenceRange: '',
                                      flag: 'UNKNOWN'
                                    }
                                  ]
                                }
                              });
                            }}
                            className="text-[11px] font-extrabold text-[#0F5C7A] hover:underline cursor-pointer"
                          >
                            + Add Test Value
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {(stagedDoc.extractedData.labTests || []).map((test, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-1.5"
                            >
                              <input
                                type="text"
                                placeholder="Test Name"
                                value={test.testName}
                                onChange={(e) => {
                                  const next = [...(stagedDoc.extractedData?.labTests || [])];
                                  next[idx] = { ...next[idx], testName: e.target.value };
                                  setStagedDoc({
                                    ...stagedDoc,
                                    extractedData: { ...stagedDoc.extractedData!, labTests: next }
                                  });
                                }}
                                className="px-2 py-1 rounded border border-slate-300 bg-white font-bold"
                              />
                              <input
                                type="text"
                                placeholder="Value"
                                value={test.value}
                                onChange={(e) => {
                                  const next = [...(stagedDoc.extractedData?.labTests || [])];
                                  const newVal = e.target.value;
                                  const newFlag = evaluateLabFlagFromProvidedRange(
                                    newVal,
                                    next[idx].referenceRange,
                                    next[idx].flag
                                  );
                                  next[idx] = {
                                    ...next[idx],
                                    value: newVal,
                                    flag: newFlag,
                                    explanation: buildAbnormalValuePlainExplanation(
                                      next[idx].testName,
                                      newVal,
                                      next[idx].unit,
                                      next[idx].referenceRange,
                                      newFlag
                                    )
                                  };
                                  setStagedDoc({
                                    ...stagedDoc,
                                    extractedData: { ...stagedDoc.extractedData!, labTests: next }
                                  });
                                }}
                                className="px-2 py-1 rounded border border-slate-300 bg-white"
                              />
                              <input
                                type="text"
                                placeholder="Unit (e.g. %)"
                                value={test.unit}
                                onChange={(e) => {
                                  const next = [...(stagedDoc.extractedData?.labTests || [])];
                                  next[idx] = { ...next[idx], unit: e.target.value };
                                  setStagedDoc({
                                    ...stagedDoc,
                                    extractedData: { ...stagedDoc.extractedData!, labTests: next }
                                  });
                                }}
                                className="px-2 py-1 rounded border border-slate-300 bg-white"
                              />
                              <input
                                type="text"
                                placeholder="Ref Range (e.g. 4.0-5.6%)"
                                value={test.referenceRange}
                                onChange={(e) => {
                                  const next = [...(stagedDoc.extractedData?.labTests || [])];
                                  const newRange = e.target.value;
                                  const newFlag = evaluateLabFlagFromProvidedRange(
                                    next[idx].value,
                                    newRange,
                                    next[idx].flag
                                  );
                                  next[idx] = {
                                    ...next[idx],
                                    referenceRange: newRange,
                                    flag: newFlag,
                                    explanation: buildAbnormalValuePlainExplanation(
                                      next[idx].testName,
                                      next[idx].value,
                                      next[idx].unit,
                                      newRange,
                                      newFlag
                                    )
                                  };
                                  setStagedDoc({
                                    ...stagedDoc,
                                    extractedData: { ...stagedDoc.extractedData!, labTests: next }
                                  });
                                }}
                                className="px-2 py-1 rounded border border-slate-300 bg-white"
                              />
                              <select
                                value={test.flag}
                                onChange={(e) => {
                                  const next = [...(stagedDoc.extractedData?.labTests || [])];
                                  const newFlag = e.target.value as ExtractedLabItem['flag'];
                                  next[idx] = {
                                    ...next[idx],
                                    flag: newFlag,
                                    explanation: buildAbnormalValuePlainExplanation(
                                      next[idx].testName,
                                      next[idx].value,
                                      next[idx].unit,
                                      next[idx].referenceRange,
                                      newFlag
                                    )
                                  };
                                  setStagedDoc({
                                    ...stagedDoc,
                                    extractedData: { ...stagedDoc.extractedData!, labTests: next }
                                  });
                                }}
                                className="px-2 py-1 rounded border border-slate-300 bg-white font-bold"
                              >
                                <option value="NORMAL">NORMAL</option>
                                <option value="HIGH">HIGH</option>
                                <option value="LOW">LOW</option>
                                <option value="UNKNOWN">UNKNOWN</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* 3. DIAGNOSTIC REPORT (X-Ray / Scanning) */}
                  {(stagedDoc.category === 'XRAY' ||
                    stagedDoc.category === 'SCANNING' ||
                    stagedDoc.extractedData.diagnostic?.modality ||
                    stagedDoc.extractedData.diagnostic?.impression) && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block">
                        Extracted Diagnostic Report Info
                      </span>
                      {stagedDoc.isEditingExtraction ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Modality / Test"
                            value={stagedDoc.extractedData.diagnostic?.modality || ''}
                            onChange={(e) =>
                              setStagedDoc({
                                ...stagedDoc,
                                extractedData: {
                                  ...stagedDoc.extractedData!,
                                  diagnostic: {
                                    ...(stagedDoc.extractedData!.diagnostic || {}),
                                    modality: e.target.value
                                  }
                                }
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                          />
                          <input
                            type="text"
                            placeholder="Body Area"
                            value={stagedDoc.extractedData.diagnostic?.bodyArea || ''}
                            onChange={(e) =>
                              setStagedDoc({
                                ...stagedDoc,
                                extractedData: {
                                  ...stagedDoc.extractedData!,
                                  diagnostic: {
                                    ...(stagedDoc.extractedData!.diagnostic || {}),
                                    bodyArea: e.target.value
                                  }
                                }
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                          />
                          <textarea
                            rows={2}
                            placeholder="Written Impression / Conclusion"
                            value={stagedDoc.extractedData.diagnostic?.impression || ''}
                            onChange={(e) =>
                              setStagedDoc({
                                ...stagedDoc,
                                extractedData: {
                                  ...stagedDoc.extractedData!,
                                  diagnostic: {
                                    ...(stagedDoc.extractedData!.diagnostic || {}),
                                    impression: e.target.value
                                  }
                                }
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                          />
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-[#F3F7FA] border border-slate-200/80 space-y-1">
                          {stagedDoc.extractedData.diagnostic?.modality && (
                            <p>
                              <strong>Modality:</strong> {stagedDoc.extractedData.diagnostic.modality}
                              {stagedDoc.extractedData.diagnostic.bodyArea
                                ? ` (${stagedDoc.extractedData.diagnostic.bodyArea})`
                                : ''}
                            </p>
                          )}
                          {stagedDoc.extractedData.diagnostic?.reportText && (
                            <p>
                              <strong>Findings:</strong> {stagedDoc.extractedData.diagnostic.reportText}
                            </p>
                          )}
                          {stagedDoc.extractedData.diagnostic?.impression && (
                            <p>
                              <strong>Impression:</strong> {stagedDoc.extractedData.diagnostic.impression}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. DISCHARGE SUMMARY */}
                  {(stagedDoc.category === 'DISCHARGE_SUMMARY' ||
                    (stagedDoc.extractedData.discharge?.diagnoses &&
                      stagedDoc.extractedData.discharge.diagnoses.length > 0)) && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block">
                        Extracted Discharge Summary Details
                      </span>
                      {stagedDoc.isEditingExtraction ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Diagnoses (comma separated)"
                            value={(stagedDoc.extractedData.discharge?.diagnoses || []).join(', ')}
                            onChange={(e) =>
                              setStagedDoc({
                                ...stagedDoc,
                                extractedData: {
                                  ...stagedDoc.extractedData!,
                                  discharge: {
                                    ...(stagedDoc.extractedData!.discharge || {
                                      diagnoses: [],
                                      procedures: []
                                    }),
                                    diagnoses: e.target.value
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean)
                                  }
                                }
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                          />
                          <input
                            type="text"
                            placeholder="Follow-up instructions"
                            value={stagedDoc.extractedData.discharge?.followUp || ''}
                            onChange={(e) =>
                              setStagedDoc({
                                ...stagedDoc,
                                extractedData: {
                                  ...stagedDoc.extractedData!,
                                  discharge: {
                                    ...(stagedDoc.extractedData!.discharge || {
                                      diagnoses: [],
                                      procedures: []
                                    }),
                                    followUp: e.target.value
                                  }
                                }
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                          />
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-[#F3F7FA] border border-slate-200/80 space-y-1">
                          {stagedDoc.extractedData.discharge?.diagnoses &&
                            stagedDoc.extractedData.discharge.diagnoses.length > 0 && (
                              <p>
                                <strong>Diagnoses:</strong>{' '}
                                {stagedDoc.extractedData.discharge.diagnoses.join(', ')}
                              </p>
                            )}
                          {stagedDoc.extractedData.discharge?.procedures &&
                            stagedDoc.extractedData.discharge.procedures.length > 0 && (
                              <p>
                                <strong>Procedures:</strong>{' '}
                                {stagedDoc.extractedData.discharge.procedures.join(', ')}
                              </p>
                            )}
                          {stagedDoc.extractedData.discharge?.importantInstructions && (
                            <p>
                              <strong>Instructions:</strong>{' '}
                              {stagedDoc.extractedData.discharge.importantInstructions}
                            </p>
                          )}
                          {stagedDoc.extractedData.discharge?.followUp && (
                            <p>
                              <strong>Follow-Up:</strong>{' '}
                              {stagedDoc.extractedData.discharge.followUp}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. VACCINATION */}
                  {stagedDoc.extractedData.vaccinations &&
                    stagedDoc.extractedData.vaccinations.length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block">
                          Extracted Vaccination Info
                        </span>
                        {stagedDoc.extractedData.vaccinations.map((v, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-xl bg-[#F3F7FA] border border-slate-200/80"
                          >
                            <p className="font-bold text-slate-900">{v.vaccine}</p>
                            <p className="text-[11px] text-slate-600">
                              {[v.doseSequence, v.date, v.providerOrLocation]
                                .filter(Boolean)
                                .join(' • ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* 6. MEDICAL HISTORY */}
                  {stagedDoc.extractedData.medicalHistory &&
                    (stagedDoc.extractedData.medicalHistory.conditions.length > 0 ||
                      stagedDoc.extractedData.medicalHistory.relevantNotes) && (
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block">
                          Extracted Medical History
                        </span>
                        <div className="p-2.5 rounded-xl bg-[#F3F7FA] border border-slate-200/80 space-y-1">
                          {stagedDoc.extractedData.medicalHistory.conditions.length > 0 && (
                            <p>
                              <strong>Conditions:</strong>{' '}
                              {stagedDoc.extractedData.medicalHistory.conditions.join(', ')}
                            </p>
                          )}
                          {stagedDoc.extractedData.medicalHistory.relevantNotes && (
                            <p>
                              <strong>Notes:</strong>{' '}
                              {stagedDoc.extractedData.medicalHistory.relevantNotes}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Footer Action Buttons: Confirm | Edit | Cancel */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStagedDoc(null)}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>

              {stagedDoc.extractedData ? (
                <button
                  type="button"
                  onClick={() =>
                    setStagedDoc({
                      ...stagedDoc,
                      isEditingExtraction: !stagedDoc.isEditingExtraction
                    })
                  }
                  className="py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0F5C7A] border border-sky-200 font-extrabold text-xs cursor-pointer"
                >
                  {stagedDoc.isEditingExtraction ? 'Done Editing' : 'Edit'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRunAIExtraction}
                  disabled={stagedDoc.processingStatus === 'Processing'}
                  className="py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0F5C7A] border border-sky-200 font-extrabold text-xs cursor-pointer disabled:opacity-50"
                >
                  Process AI
                </button>
              )}

              <button
                type="button"
                onClick={handleConfirmAndSaveReport}
                disabled={stagedDoc.processingStatus === 'Processing'}
                className="py-2.5 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-extrabold text-xs shadow-xs cursor-pointer disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: AUTO-INTEGRATION CONFIRMATION ("Add extracted medicines to your medication schedule")
         ===================================================================== */}
      {pendingMedIntegration && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-5 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#2E7D4F]/15 text-[#2E7D4F] flex items-center justify-center shrink-0">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2E7D4F]">
                  Prescription Auto-Integration
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Add extracted medicines to your medication schedule
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select the medicines from "{pendingMedIntegration.reportTitle}" that you want to add to your active schedule:
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {pendingMedIntegration.medicines.map((med, idx) => (
                <label
                  key={idx}
                  className="p-3 rounded-2xl bg-[#F3F7FA] border border-slate-200 flex items-start gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={med.selected}
                    onChange={(e) => {
                      const next = [...pendingMedIntegration.medicines];
                      next[idx] = { ...next[idx], selected: e.target.checked };
                      setPendingMedIntegration({
                        ...pendingMedIntegration,
                        medicines: next
                      });
                    }}
                    className="mt-1 w-4 h-4 accent-[#0F5C7A]"
                  />
                  <div className="text-xs">
                    <p className="font-extrabold text-slate-900">
                      {med.name} ({med.strength || med.dosage})
                    </p>
                    <p className="text-slate-600">
                      {med.frequency} • {med.timing || 'Morning'}
                      {med.duration ? ` • ${med.duration}` : ''}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setPendingMedIntegration(null)}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Skip for Now
              </button>
              <button
                type="button"
                onClick={handleConfirmAddExtractedMedicines}
                className="py-2.5 rounded-xl bg-[#2E7D4F] hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Add</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: REPORT PREVIEW VIEWER (IMAGE / PDF / STRUCTURED EXTRACTION)
         ===================================================================== */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 text-slate-900 shadow-2xl flex flex-col max-h-[90vh] space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-[#0F5C7A]/10 text-[#0F5C7A] text-[10px] font-extrabold">
                    {getCategoryLabel(viewingReport.category)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${getStatusBadgeStyle(
                      viewingReport.processingStatus || 'Ready'
                    )}`}
                  >
                    {viewingReport.processingStatus || 'Ready'}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {viewingReport.date}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {viewingReport.title}
                </h3>
              </div>

              <button
                onClick={() => setViewingReport(null)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                aria-label="Close Preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview Content Area */}
            <div className="flex-1 overflow-y-auto bg-[#F3F7FA] rounded-2xl border border-slate-200 p-3 space-y-3 text-xs">
              {viewingReport.fileDataUrl &&
                (viewingReport.fileDataUrl.startsWith('data:image/') ? (
                  <img
                    src={viewingReport.fileDataUrl}
                    alt={viewingReport.title}
                    className="w-full h-auto rounded-xl border border-slate-200 bg-white mx-auto"
                  />
                ) : viewingReport.fileDataUrl.startsWith('data:application/pdf') ? (
                  <iframe
                    src={viewingReport.fileDataUrl}
                    title={viewingReport.title}
                    className="w-full h-72 rounded-xl border border-slate-200 bg-white"
                  />
                ) : null)}

              {/* Structured AI Extraction Cards inside Viewer */}
              {viewingReport.extractedData && (
                <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F5C7A] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Structured AI Extraction
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        const target = viewingReport;
                        setViewingReport(null);
                        openEditExistingReportExtraction(target);
                      }}
                      className="text-[11px] font-extrabold text-[#0F5C7A] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Review / Edit</span>
                    </button>
                  </div>

                  <ReportSummarySectionsPanel extractedData={viewingReport.extractedData} />

                  {/* Extracted Medicines in Viewer */}
                  {viewingReport.extractedData.medicines &&
                    viewingReport.extractedData.medicines.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-extrabold text-slate-800">
                            Extracted Medicines ({viewingReport.extractedData.medicines.length})
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const meds = viewingReport.extractedData?.medicines || [];
                              setPendingMedIntegration({
                                reportTitle: viewingReport.title,
                                medicines: meds.map((m) => ({ ...m, selected: true }))
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#2E7D4F]/15 text-[#2E7D4F] font-extrabold text-[10px] hover:bg-[#2E7D4F]/25 cursor-pointer"
                          >
                            + Add to Medication Schedule
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {viewingReport.extractedData.medicines.map((m, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-lg bg-[#F3F7FA] border border-slate-200/80"
                            >
                              <p className="font-bold text-slate-900">
                                {m.name} — {m.dosage || m.strength}
                              </p>
                              <p className="text-[11px] text-slate-600">
                                {[m.frequency, m.duration, m.route, m.instructions]
                                  .filter(Boolean)
                                  .join(' • ')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {viewingReport.extractedSummaryText && (
                <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 space-y-1.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F5C7A]">
                    Report Findings Summary
                  </p>
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {viewingReport.extractedSummaryText}
                  </pre>
                </div>
              )}
            </div>

            {/* Viewer Actions: Ask AI | Download | Delete */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadReport(viewingReport)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#0F5C7A]" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => {
                    const target = viewingReport;
                    setViewingReport(null);
                    setReportToDelete(target);
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#B3261E] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              <button
                onClick={() => {
                  const target = viewingReport;
                  setViewingReport(null);
                  openCopilotWithReport(target);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white text-xs font-extrabold flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <SanjeevaniCopilotIcon className="w-4 h-4" />
                <span>Ask AI about this report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE CONFIRMATION MODAL */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-white border border-slate-200 rounded-3xl p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#B3261E]/10 text-[#B3261E] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900">
                Delete this report?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently remove this report?
              </p>
              <p className="text-xs font-bold text-slate-800 pt-1">
                "{reportToDelete.title}" ({reportToDelete.date})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = reportToDelete.id;
                  setReportToDelete(null);
                  deleteMedicalReport(id);
                }}
                className="py-3 rounded-xl bg-[#B3261E] hover:bg-red-800 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
