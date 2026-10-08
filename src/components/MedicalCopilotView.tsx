import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Trash2,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  User,
  Plus,
  Camera,
  FolderOpen,
  FileText,
  X,
  Paperclip
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  askMedicalCopilot,
  CopilotHistoryMessage,
  CopilotPayloadAttachment
} from '../services/medicalCopilotService';
import { speechService } from '../services/speechService';
import { CopilotAttachment, MedicalReport, ReportCategoryId } from '../types';
import {
  REPORT_CATEGORIES,
  formatExtractedDataToSummaryText,
  selectRelevantReportsForQuestion
} from '../services/reportStorageService';
import {
  isPersonalRecordOrTimelineQuestion,
  selectRelevantTimelineContextForQuestion
} from '../services/healthTimelineService';
import {
  SanjeevaniCopilotIcon,
  PrescriptionReportIcon,
  BloodReportIcon,
  XRayReportIcon,
  ScanReportIcon,
  DischargeSummaryIcon,
  VaccineReportIcon,
  MedicalHistoryReportIcon
} from './SanjeevaniIcons';

export type CopilotVoiceState =
  | 'IDLE'
  | 'READY'
  | 'CONNECTING'
  | 'LISTENING'
  | 'SPEECH_DETECTED'
  | 'TRANSCRIBING'
  | 'THINKING'
  | 'SPEAKING'
  | 'ERROR';

const SUGGESTED_STARTERS = [
  'Explain my latest blood test.',
  'What does HbA1c mean in my report?',
  'Summarize my discharge summary.',
  'What does the impression section of my scan report say?',
  'What medicines are currently recorded?',
  'What is hypertension?'
];

const SUGGESTED_STARTERS_TE = [
  'నా తాజా రక్త పరీక్ష రిపోర్ట్ వివరాలు చెప్పండి.',
  'నా రిపోర్ట్‌లో HbA1c అంటే ఏమిటి?',
  'నా డిశ్చార్జ్ సారాంశాన్ని (Discharge Summary) వివరించండి.',
  'ప్రస్తుతం నమోదైన నా మందులు ఏవి?',
  'What is hypertension?',
  'మధుమేహం (Diabetes) గురించి సులభంగా వివరించండి.'
];

/**
 * Simple, clean markdown-style text formatter for AI medical responses
 */
const FormattedMessageText: React.FC<{ text: string; isUser: boolean }> = ({ text, isUser }) => {
  if (isUser) {
    return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>;
  }

  const lines = text.split('\n');
  const formatBold = (lineText: string) => {
    const parts = lineText.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-extrabold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={i} className="h-1" />;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span className="text-[#0F5C7A] font-extrabold mt-0.5">•</span>
              <span className="flex-1">{formatBold(trimmed.replace(/^[-*•]\s+/, ''))}</span>
            </div>
          );
        }
        if (/^\d+\.\s+/.test(trimmed)) {
          const match = trimmed.match(/^(\d+\.)\s+(.*)$/);
          if (match) {
            return (
              <div key={i} className="flex items-start gap-2 pl-1">
                <span className="text-[#0F5C7A] font-extrabold mt-0.5">{match[1]}</span>
                <span className="flex-1">{formatBold(match[2])}</span>
              </div>
            );
          }
        }
        return <p key={i}>{formatBold(line)}</p>;
      })}
    </div>
  );
};

export const MedicalCopilotView: React.FC = () => {
  const {
    patient,
    medications,
    appointments,
    medicalReports,
    unifiedHealthProfile,
    setActiveView,
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
    clearCopilotConversation,
    showToast,
    appLanguage,
    setAppLanguage
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [voiceState, setVoiceState] = useState<CopilotVoiceState>('IDLE');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [autoSpeakResponses, setAutoSpeakResponses] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);
  const [micWarning, setMicWarning] = useState(null as string | null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [isMicPermissionDenied, setIsMicPermissionDenied] = useState<boolean>(false);

  // "+" Attachment Menu & Stored Medical Report Picker Modal
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showReportPickerModal, setShowReportPickerModal] = useState(false);
  const [pickerCategory, setPickerCategory] = useState<ReportCategoryId>('BLOOD_TEST');

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isSubmittingRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [copilotMessages, voiceState, liveTranscript, errorBanner, copilotDraftAttachments]);

  // Clean up voice activity if user navigates away from Copilot
  useEffect(() => {
    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
    };
  }, []);

  const getCategoryIcon = (categoryId: ReportCategoryId) => {
    switch (categoryId) {
      case 'PRESCRIPTION':
        return <PrescriptionReportIcon className="w-4 h-4" />;
      case 'BLOOD_TEST':
        return <BloodReportIcon className="w-4 h-4" />;
      case 'XRAY':
        return <XRayReportIcon className="w-4 h-4" />;
      case 'SCANNING':
        return <ScanReportIcon className="w-4 h-4" />;
      case 'DISCHARGE_SUMMARY':
        return <DischargeSummaryIcon className="w-4 h-4" />;
      case 'VACCINATION':
        return <VaccineReportIcon className="w-4 h-4" />;
      case 'MEDICAL_HISTORY':
        return <MedicalHistoryReportIcon className="w-4 h-4" />;
    }
  };

  /**
   * Handles selecting a photo or file from the device via the "+" menu.
   * Previews the attachment in the composer above the input bar without auto-sending.
   */
  const handleFileAttachmentChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: 'PHOTO' | 'FILE'
  ) => {
    const file = e.target.files?.[0];
    setShowAttachmentMenu(false);
    if (!file) return;

    const ext = file.name.split('.').pop()?.toUpperCase() || '';
    const fileTypeLabel =
      ext === 'PDF' || file.type === 'application/pdf'
        ? 'PDF'
        : ext === 'PNG'
        ? 'PNG'
        : 'JPG';

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const newAtt: CopilotAttachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind,
        name: file.name,
        mimeType: file.type || (fileTypeLabel === 'PDF' ? 'application/pdf' : 'image/jpeg'),
        fileTypeLabel,
        dataUrl
      };
      setCopilotDraftAttachments((prev) => [...prev, newAtt]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /**
   * Attaches an existing stored Medical Report from the user's Medical Reports library.
   */
  const handleAttachStoredReport = (report: MedicalReport) => {
    const richExtractedText = report.extractedData
      ? formatExtractedDataToSummaryText(report.extractedData)
      : report.extractedSummaryText;

    const newAtt: CopilotAttachment = {
      id: `att-rep-${report.id}-${Date.now()}`,
      kind: 'MEDICAL_REPORT',
      name: `${report.title} — ${report.date}`,
      mimeType: report.mimeType,
      fileTypeLabel: report.fileType,
      dataUrl: report.fileDataUrl,
      reportId: report.id,
      reportCategory: report.category,
      reportDate: report.date,
      extractedText: richExtractedText
    };
    setCopilotDraftAttachments((prev) => {
      const filtered = prev.filter((p) => p.reportId !== report.id);
      return [...filtered, newAtt];
    });
    setShowReportPickerModal(false);
    setShowAttachmentMenu(false);
  };

  const handleRemoveDraftAttachment = (attId: string) => {
    const target = copilotDraftAttachments.find((a) => a.id === attId);
    setCopilotDraftAttachments((prev) => prev.filter((a) => a.id !== attId));
    if (target) {
      setCopilotSessionAttachments((prev) =>
        prev.filter((a) => a.id !== attId && (!target.reportId || a.reportId !== target.reportId))
      );
    }
  };

  /**
   * Core AI query pipeline:
   * User Question (+ Optional Attachments / Controlled Report Retrieval)
   *   -> Backend (/api/medical-copilot)
   *   -> Real Gemini AI Model
   *   -> UI + Optional TTS
   */
  const submitQuestion = async (
    rawQuestion: string,
    triggeredByVoice: boolean = false
  ): Promise<void> => {
    const question = rawQuestion.trim();
    if (!question || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    speechService.stopListening();
    speechService.stopSpeaking();
    setLiveTranscript('');
    setErrorBanner(null);
    setLastFailedQuestion(null);
    setMicWarning(null);
    setShowAttachmentMenu(false);
    setInputText('');

    const nowTime = new Date().toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Combine any newly staged composer attachments with active session attachments
    const currentTurnAttachments = [...copilotDraftAttachments];
    const combinedSessionAttachments = [
      ...copilotSessionAttachments.filter(
        (sa) => !currentTurnAttachments.some((ca) => ca.id === sa.id)
      ),
      ...currentTurnAttachments
    ];

    if (currentTurnAttachments.length > 0) {
      setCopilotSessionAttachments(combinedSessionAttachments);
      setCopilotDraftAttachments([]);
    }

    const userMsg: CopilotHistoryMessage = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      text: question,
      timestamp: nowTime,
      attachments: currentTurnAttachments.length > 0 ? currentTurnAttachments : undefined
    };

    const currentHistory = [...copilotMessages];
    setCopilotMessages((prev) => [...prev, userMsg]);
    setVoiceState('THINKING');

    try {
      const recentHistoryText = currentHistory
        .slice(-4)
        .map((m) => m.text)
        .join(' ');

      // Controlled Report Retrieval: Only retrieve reports relevant to the current question, attached report, or recent turn context
      const reportSelection = selectRelevantReportsForQuestion(
        question,
        medicalReports,
        combinedSessionAttachments,
        recentHistoryText
      );

      // Selective Timeline Retrieval: Retrieve only the timeline/profile slice relevant to the question
      const timelineSelection = selectRelevantTimelineContextForQuestion(
        question,
        unifiedHealthProfile,
        recentHistoryText
      );

      const categoryMeta = REPORT_CATEGORIES.find(
        (c) => c.id === reportSelection.matchedCategory
      );

      const hasPersonalOrReportIntent =
        reportSelection.selectedReports.length > 0 ||
        timelineSelection.matchedIntents.length > 0 ||
        combinedSessionAttachments.length > 0 ||
        isPersonalRecordOrTimelineQuestion(question, recentHistoryText);

      const includeMedsInContext =
        timelineSelection.matchedIntents.includes('PRESCRIPTIONS_AND_MEDICINES') ||
        timelineSelection.matchedIntents.includes('RECENT_TIMELINE') ||
        reportSelection.matchedCategory === 'PRESCRIPTION';

      const includeApptsInContext =
        timelineSelection.matchedIntents.includes('APPOINTMENTS') ||
        timelineSelection.matchedIntents.includes('RECENT_TIMELINE');

      const appContext = hasPersonalOrReportIntent
        ? {
            patientName: patient.name,
            age: patient.age,
            conditions: (unifiedHealthProfile.explicitConditions || []).map((c) => c.name),
            medications: includeMedsInContext
              ? medications.map((m) => ({
                  name: m.name,
                  dosage: m.dosage,
                  scheduledTime: m.scheduledTime,
                  timing: m.timing,
                  status: m.status
                }))
              : undefined,
            appointments: includeApptsInContext
              ? appointments.map((a) => ({
                  doctorName: a.doctorName,
                  specialty: a.specialty,
                  date: a.date,
                  time: a.time
                }))
              : undefined,
            relevantReports: reportSelection.selectedReports.map((r) => ({
              id: r.id,
              category: r.category,
              title: r.title,
              date: r.date,
              fileType: r.fileType,
              extractedSummaryText: r.extractedData
                ? formatExtractedDataToSummaryText(r.extractedData)
                : r.extractedSummaryText
            })),
            isAmbiguousReportCategory: reportSelection.isAmbiguousMultiple,
            ambiguousCategoryName: categoryMeta?.title,
            relevantTimelineContext: timelineSelection.contextString || undefined
          }
        : undefined;

      // Build multimodal payload attachments (from active session attachments + any retrieved uploaded report with binary data)
      const payloadAttachments: CopilotPayloadAttachment[] = combinedSessionAttachments.map(
        (att) => ({
          name: att.name,
          mimeType: att.mimeType,
          fileTypeLabel: att.fileTypeLabel,
          dataUrl: att.dataUrl,
          reportDate: att.reportDate,
          reportCategory: att.reportCategory,
          extractedText: att.extractedText
        })
      );

      // If controlled retrieval selected a user-uploaded report that wasn't explicitly in combinedSessionAttachments, include its binary/text content
      for (const rep of reportSelection.selectedReports) {
        const alreadyIncluded = combinedSessionAttachments.some((a) => a.reportId === rep.id);
        if (!alreadyIncluded) {
          payloadAttachments.push({
            name: `${rep.title} — ${rep.date}`,
            mimeType: rep.mimeType,
            fileTypeLabel: rep.fileType,
            dataUrl: rep.fileDataUrl,
            reportDate: rep.date,
            reportCategory: rep.category,
            extractedText: rep.extractedData
              ? formatExtractedDataToSummaryText(rep.extractedData)
              : rep.extractedSummaryText
          });
        }
      }

      const result = await askMedicalCopilot({
        message: question,
        history: currentHistory,
        previousInteractionId: copilotInteractionId,
        appContext,
        attachments: payloadAttachments,
        language: appLanguage
      });

      const aiMsg: CopilotHistoryMessage = {
        id: `ai-${Date.now()}`,
        sender: 'AI',
        text: result.reply,
        timestamp: new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        model: result.model
      };

      setCopilotMessages((prev) => [...prev, aiMsg]);
      if (result.interactionId) {
        setCopilotInteractionId(result.interactionId);
      }

      isSubmittingRef.current = false;

      if (autoSpeakResponses || triggeredByVoice) {
        const cleanSpokenText = result.reply.replace(/\*\*/g, '').replace(/[#*`]/g, '');
        speechService.setLanguage(appLanguage);
        setVoiceState('SPEAKING');
        await speechService.speak(
          cleanSpokenText,
          () => {
            setVoiceState('IDLE');
          },
          () => {
            setVoiceState('IDLE');
          }
        );
      } else {
        setVoiceState('IDLE');
      }
    } catch (err: any) {
      console.error('Medical Copilot request failed:', err);
      setVoiceState('IDLE');
      setErrorBanner('Medical AI is temporarily unavailable.');
      setLastFailedQuestion(question);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  // Automatically process a question launched from Demo Center, Home card, or Report action
  useEffect(() => {
    if (pendingCopilotQuestion && !isSubmittingRef.current) {
      const q = pendingCopilotQuestion;
      setPendingCopilotQuestion(null);
      submitQuestion(q, false);
    }
  }, [pendingCopilotQuestion]);

  const handleToggleMicrophone = async () => {
    setMicWarning(null);
    setErrorBanner(null);
    setShowAttachmentMenu(false);

    if (
      voiceState === 'LISTENING' ||
      voiceState === 'SPEECH_DETECTED' ||
      voiceState === 'CONNECTING'
    ) {
      await speechService.finishListening();
      if (!speechService.isTranscribing && !isSubmittingRef.current) {
        if (liveTranscript.trim()) {
          const captured = liveTranscript.trim();
          setLiveTranscript('');
          await submitQuestion(captured, true);
        } else {
          setVoiceState('IDLE');
        }
      }
      return;
    }

    if (voiceState === 'SPEAKING') {
      speechService.stopSpeaking();
      setVoiceState('IDLE');
    }

    speechService.setLanguage(appLanguage);
    speechService.warmupAudio();
    setLiveTranscript('');
    setVoiceState('CONNECTING');

    const granted = await speechService.requestMicrophonePermission(true);
    if (!granted) {
      setIsMicPermissionDenied(speechService.isPermissionDenied);
      setMicWarning(
        speechService.lastMicError || 'Microphone access is required for voice input.'
      );
      setVoiceState('ERROR');
      return;
    }

    setIsMicPermissionDenied(false);

    const started = speechService.startListening(
      (transcriptText, isFinal) => {
        setLiveTranscript(transcriptText);
        if (isFinal && transcriptText.trim()) {
          speechService.stopListening();
          submitQuestion(transcriptText.trim(), true);
        }
      },
      (errMsg) => {
        setIsMicPermissionDenied(speechService.isPermissionDenied);
        setMicWarning(errMsg);
        setVoiceState('ERROR');
      },
      () => {
        setVoiceState((prev) =>
          prev === 'LISTENING' ||
          prev === 'SPEECH_DETECTED' ||
          prev === 'CONNECTING' ||
          prev === 'TRANSCRIBING'
            ? 'IDLE'
            : prev
        );
      },
      () => {
        setVoiceState((prev) =>
          prev === 'LISTENING' || prev === 'CONNECTING' ? 'SPEECH_DETECTED' : prev
        );
      },
      {
        onStateChange: (st) => {
          if (isSubmittingRef.current) return;
          if (st === 'CONNECTING') setVoiceState('CONNECTING');
          else if (st === 'LISTENING') setVoiceState('LISTENING');
          else if (st === 'SPEECH_DETECTED') setVoiceState('SPEECH_DETECTED');
          else if (st === 'TRANSCRIBING') setVoiceState('TRANSCRIBING');
          else if (st === 'ERROR') setVoiceState('ERROR');
        },
        onFallbackNotice: (notice) => {
          setFallbackNotice(notice);
        }
      }
    );

    if (!started) {
      setVoiceState('ERROR');
      setMicWarning(
        speechService.lastMicError ||
          'Speech recognition is unavailable in this browser. Please type your question below.'
      );
    }
  };

  const handleNewOrClearConversation = (actionLabel: string) => {
    clearCopilotConversation();
    setVoiceState('IDLE');
    setLiveTranscript('');
    setErrorBanner(null);
    setLastFailedQuestion(null);
    setMicWarning(null);
    setFallbackNotice(null);
    setIsMicPermissionDenied(false);
    setShowAttachmentMenu(false);
    showToast(actionLabel);
  };

  const handleTryAgain = () => {
    if (!lastFailedQuestion) return;
    setCopilotMessages((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].sender === 'USER') {
        return prev.slice(0, -1);
      }
      return prev;
    });
    submitQuestion(lastFailedQuestion, false);
  };

  return (
    <div className="flex flex-col h-full min-h-[610px] space-y-3 pb-2 relative">
      {/* Hidden File Inputs for "+" Attachment Menu */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        capture="environment"
        onChange={(e) => handleFileAttachmentChange(e, 'PHOTO')}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        onChange={(e) => handleFileAttachmentChange(e, 'FILE')}
        className="hidden"
      />

      {/* Top Header Card */}
      <div className="bg-[#0F5C7A] rounded-2xl p-4 text-white shadow-sm space-y-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button
            onClick={() => {
              speechService.stopListening();
              speechService.stopSpeaking();
              setActiveView('dashboard');
            }}
            className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{appLanguage === 'Telugu' ? 'వెనుకకు' : 'Back'}</span>
          </button>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Copilot Language Selector: English | తెలుగు */}
            <div
              role="group"
              aria-label="Copilot Language Selector"
              className="inline-flex items-center bg-white/15 rounded-xl p-0.5 text-[11px] font-extrabold"
            >
              <button
                type="button"
                onClick={() => setAppLanguage('English')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  appLanguage === 'English'
                    ? 'bg-white text-[#0F5C7A] shadow-2xs'
                    : 'text-sky-100 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setAppLanguage('Telugu')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  appLanguage === 'Telugu'
                    ? 'bg-white text-[#0F5C7A] shadow-2xs'
                    : 'text-sky-100 hover:text-white'
                }`}
              >
                తెలుగు
              </button>
            </div>

            <button
              onClick={() => setAutoSpeakResponses((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                autoSpeakResponses
                  ? 'bg-white text-[#0F5C7A]'
                  : 'bg-white/15 text-sky-100 hover:bg-white/25'
              }`}
              title={autoSpeakResponses ? 'Voice Output Enabled' : 'Voice Output Muted'}
            >
              {autoSpeakResponses ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{appLanguage === 'Telugu' ? 'వాయిస్ ఆన్' : 'Voice On'}</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>{appLanguage === 'Telugu' ? 'మ్యూట్' : 'Muted'}</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleNewOrClearConversation('Started new AI Copilot conversation')}
              className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="New Conversation"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{appLanguage === 'Telugu' ? 'కొత్తది' : 'New'}</span>
            </button>

            {copilotMessages.length > 0 && (
              <button
                onClick={() => handleNewOrClearConversation('Cleared Copilot conversation')}
                className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-rose-500/80 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Clear Conversation"
              >
                <Trash2 className="w-3 h-3" />
                <span>{appLanguage === 'Telugu' ? 'క్లియర్' : 'Clear'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <SanjeevaniCopilotIcon className="w-6 h-6 text-sky-100" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-tight truncate">
                {appLanguage === 'Telugu'
                  ? 'సంజీవని మెడికల్ AI కోపైలట్'
                  : 'Sanjeevani Medical AI Copilot'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#2E7D4F] text-white text-[9px] font-extrabold uppercase tracking-wider shrink-0">
                Live Gemini AI
              </span>
            </div>
            <p className="text-[11px] text-sky-100/90 truncate">
              {appLanguage === 'Telugu'
                ? 'ఆరోగ్య ప్రశ్నలు అడగండి లేదా మీ మెడికల్ రిపోర్టుల గురించి తెలుగులో వివరణ పొందండి'
                : 'Ask medical questions or attach photos, PDFs & stored Medical Reports'}
            </p>
          </div>
        </div>
      </div>

      {/* Unobtrusive Educational Medical Disclaimer */}
      <div className="px-3 py-2 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center gap-2 text-[11px] text-slate-700 shrink-0">
        <ShieldCheck className="w-4 h-4 text-[#0F5C7A] shrink-0" />
        <span>
          {appLanguage === 'Telugu'
            ? 'ఈ సమాచారం అవగాహన కోసం మాత్రమే. ఇది అర్హత కలిగిన డాక్టర్ సలహాకు ప్రత్యామ్నాయం కాదు.'
            : 'Medical information for educational purposes. This AI does not replace a qualified healthcare professional.'}
        </span>
      </div>

      {/* Active Session Report Context Indicator (when a report was attached earlier in the session) */}
      {copilotSessionAttachments.length > 0 && copilotDraftAttachments.length === 0 && (
        <div className="px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-2 text-[11px] text-emerald-900 shrink-0">
          <div className="flex items-center gap-1.5 truncate font-bold">
            <Paperclip className="w-3.5 h-3.5 text-[#2E7D4F] shrink-0" />
            <span className="truncate">
              {appLanguage === 'Telugu' ? 'జోడించిన రిపోర్ట్: ' : 'Active context: '}
              {copilotSessionAttachments.map((a) => a.name).join(', ')}
            </span>
          </div>
          <button
            onClick={() => setCopilotSessionAttachments([])}
            className="text-[10px] font-extrabold text-emerald-800 hover:underline cursor-pointer shrink-0"
          >
            {appLanguage === 'Telugu' ? 'తొలగించు' : 'Detach'}
          </button>
        </div>
      )}

      {/* Live Voice Status Indicator Banner (Connecting / Listening / Speech Detected / Transcribing / Thinking / Speaking) */}
      {voiceState !== 'IDLE' && voiceState !== 'READY' && voiceState !== 'ERROR' && (
        <div
          className={`px-4 py-3 rounded-2xl border flex items-center justify-between gap-3 shrink-0 transition-all ${
            voiceState === 'LISTENING' || voiceState === 'SPEECH_DETECTED'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : voiceState === 'CONNECTING' || voiceState === 'THINKING'
              ? 'bg-sky-50 border-sky-300 text-sky-950'
              : 'bg-indigo-50 border-indigo-300 text-indigo-950'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {(voiceState === 'LISTENING' || voiceState === 'SPEECH_DETECTED') && (
              <span className="relative flex h-3.5 w-3.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-600" />
              </span>
            )}
            {(voiceState === 'CONNECTING' ||
              voiceState === 'TRANSCRIBING' ||
              voiceState === 'THINKING') && (
              <RefreshCw className="w-4 h-4 text-[#0F5C7A] animate-spin shrink-0" />
            )}
            {voiceState === 'SPEAKING' && (
              <div className="flex items-end gap-0.5 h-4 shrink-0">
                <span className="w-1 h-3 bg-[#0F5C7A] rounded-full animate-pulse" />
                <span className="w-1 h-4 bg-[#0F5C7A] rounded-full animate-bounce" />
                <span className="w-1 h-2.5 bg-[#0F5C7A] rounded-full animate-pulse" />
              </div>
            )}

            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wider">
                {voiceState === 'CONNECTING' &&
                  (appLanguage === 'Telugu'
                    ? 'కనెక్ట్ అవుతోంది... మైక్రోఫోన్ సిద్ధం చేస్తోంది'
                    : 'Connecting... Preparing microphone')}
                {voiceState === 'LISTENING' &&
                  (appLanguage === 'Telugu'
                    ? 'వింటోంది... మీ వైద్య ప్రశ్నను మాట్లాడండి'
                    : 'Listening... Speak your medical question')}
                {voiceState === 'SPEECH_DETECTED' &&
                  (appLanguage === 'Telugu'
                    ? 'మాట గుర్తించబడింది... మీ ప్రశ్నను వింటోంది'
                    : 'Speech Detected... Hearing your question')}
                {voiceState === 'TRANSCRIBING' &&
                  (appLanguage === 'Telugu'
                    ? 'టెక్స్ట్‌గా మారుస్తోంది... మీ వాయిస్ ప్రాసెస్ అవుతోంది'
                    : 'Transcribing... Converting speech to text')}
                {voiceState === 'THINKING' &&
                  (appLanguage === 'Telugu'
                    ? 'ఆలోచిస్తోంది... AI వైద్య సమాధానాన్ని సిద్ధం చేస్తోంది'
                    : 'Thinking... Generating AI medical response')}
                {voiceState === 'SPEAKING' &&
                  (appLanguage === 'Telugu'
                    ? 'మాట్లాడుతోంది... AI వాయిస్ సమాధానం'
                    : 'Speaking... Playing AI voice response')}
              </p>
              {(voiceState === 'LISTENING' || voiceState === 'SPEECH_DETECTED') &&
                liveTranscript && (
                  <p className="text-xs font-semibold text-emerald-800 mt-0.5 truncate">
                    "{liveTranscript}"
                  </p>
                )}
              {fallbackNotice &&
                (voiceState === 'LISTENING' ||
                  voiceState === 'SPEECH_DETECTED' ||
                  voiceState === 'TRANSCRIBING') && (
                  <p className="text-[11px] font-bold text-[#0F5C7A] mt-0.5">
                    {fallbackNotice}
                  </p>
                )}
            </div>
          </div>

          {voiceState === 'SPEAKING' && (
            <button
              onClick={() => {
                speechService.stopSpeaking();
                setVoiceState('IDLE');
              }}
              className="px-2.5 py-1 rounded-xl bg-white border border-indigo-200 text-indigo-900 text-[11px] font-bold cursor-pointer shrink-0"
            >
              {appLanguage === 'Telugu' ? 'ఆపు' : 'Stop Voice'}
            </button>
          )}

          {(voiceState === 'LISTENING' || voiceState === 'SPEECH_DETECTED') && (
            <button
              onClick={handleToggleMicrophone}
              className="px-2.5 py-1 rounded-xl bg-emerald-700 text-white text-[11px] font-bold cursor-pointer shrink-0"
            >
              {appLanguage === 'Telugu' ? 'పూర్తయింది' : 'Done Speaking'}
            </button>
          )}
        </div>
      )}

      {/* Microphone Permission / Warning Banner with Try Again */}
      {micWarning && (
        <div
          className={`px-3.5 py-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 shrink-0 ${
            isMicPermissionDenied || micWarning.includes('Microphone access is required')
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <span className="font-bold">{micWarning}</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleMicrophone}
              className="px-3 py-1 rounded-lg bg-[#0F5C7A] hover:bg-[#0A4359] text-white text-[11px] font-extrabold cursor-pointer"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => {
                setMicWarning(null);
                setVoiceState((prev) => (prev === 'ERROR' ? 'IDLE' : prev));
              }}
              className="text-[11px] font-extrabold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Conversation Messages Stream */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 p-3.5 overflow-y-auto space-y-3 max-h-[400px]">
        {copilotMessages.length === 0 ? (
          <div className="space-y-4 py-2">
            <div className="text-center space-y-1.5 px-2">
              <div className="w-12 h-12 rounded-2xl bg-[#0F5C7A]/10 text-[#0F5C7A] flex items-center justify-center mx-auto">
                <SanjeevaniCopilotIcon className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {appLanguage === 'Telugu'
                  ? 'మెడికల్ AI కోపైలట్ & రిపోర్ట్ విశ్లేషణ (తెలుగు / English)'
                  : 'Medical AI Copilot & Report Analyzer'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                {appLanguage === 'Telugu' ? (
                  <>
                    మీరు తెలుగులో లేదా ఇంగ్లీషులో ప్రశ్నలు అడగవచ్చు — <strong>తెలుగు</strong> ఎంచుకుంటే AI
                    తెలుగులో సమాధానం ఇస్తుంది. రిపోర్ట్ జోడించడానికి క్రింద ఉన్న <strong>"+"</strong> నొక్కండి.
                  </>
                ) : (
                  <>
                    Ask general medical questions, ask about your stored reports, or tap{' '}
                    <strong>"+"</strong> below to attach a photo, PDF, or medical record.
                  </>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                {appLanguage === 'Telugu' ? 'ప్రశ్నను ఎంచుకుని అడగండి:' : 'Try asking a live question:'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(appLanguage === 'Telugu' ? SUGGESTED_STARTERS_TE : SUGGESTED_STARTERS).map(
                  (q) => (
                    <button
                      key={q}
                      onClick={() => submitQuestion(q, false)}
                      disabled={voiceState === 'THINKING'}
                      className="text-left px-3 py-2 rounded-xl bg-[#F3F7FA] hover:bg-sky-50 border border-slate-200 hover:border-[#0F5C7A]/40 text-xs font-bold text-slate-800 transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          copilotMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'USER' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {msg.sender === 'AI' ? (
                  <>
                    <SanjeevaniCopilotIcon className="w-3.5 h-3.5 text-[#0F5C7A]" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F5C7A]">
                      {appLanguage === 'Telugu' ? 'సంజీవని AI' : 'Sanjeevani AI'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      {appLanguage === 'Telugu' ? 'మీరు' : 'You'}
                    </span>
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  </>
                )}
                <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs space-y-2 ${
                  msg.sender === 'USER'
                    ? 'bg-[#0F5C7A] text-white rounded-br-xs shadow-2xs'
                    : 'bg-[#F3F7FA] text-slate-800 border border-slate-200/90 rounded-bl-xs'
                }`}
              >
                {/* Display attached items inside user message bubble if sent */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="space-y-1.5 pb-1.5 border-b border-white/20">
                    {msg.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 bg-white/15 rounded-xl p-2 text-[11px]"
                      >
                        {att.dataUrl && att.mimeType.startsWith('image/') ? (
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/30"
                          />
                        ) : (
                          <FileText className="w-4 h-4 shrink-0" />
                        )}
                        <span className="font-bold truncate">{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <FormattedMessageText text={msg.text} isUser={msg.sender === 'USER'} />

                {msg.sender === 'AI' && (
                  <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        speechService.setLanguage(appLanguage);
                        speechService.warmupAudio();
                        const cleanText = msg.text.replace(/\*\*/g, '').replace(/[#*`]/g, '');
                        setVoiceState('SPEAKING');
                        speechService.speak(
                          cleanText,
                          () => setVoiceState('IDLE'),
                          () => setVoiceState('IDLE')
                        );
                      }}
                      className="text-[11px] font-bold text-[#0F5C7A] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{appLanguage === 'Telugu' ? 'వినండి (Read Aloud)' : 'Read Aloud'}</span>
                    </button>

                    {msg.model && (
                      <span className="text-[9px] font-semibold text-slate-400">
                        {msg.model}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Thinking Skeleton Bubble */}
        {voiceState === 'THINKING' && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 mb-1 px-1">
              <SanjeevaniCopilotIcon className="w-3.5 h-3.5 text-[#0F5C7A]" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F5C7A]">
                {appLanguage === 'Telugu'
                  ? 'సంజీవని AI • ఆలోచిస్తోంది...'
                  : 'Sanjeevani AI • Thinking...'}
              </span>
            </div>
            <div className="bg-[#F3F7FA] border border-slate-200/90 rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-2 text-xs text-slate-600 font-semibold">
              <RefreshCw className="w-3.5 h-3.5 text-[#0F5C7A] animate-spin" />
              <span>
                {appLanguage === 'Telugu'
                  ? 'Gemini AI ద్వారా వైద్య వివరాలను విశ్లేషిస్తోంది...'
                  : 'Analyzing medical context with Gemini AI...'}
              </span>
            </div>
          </div>
        )}

        {/* Real Error State with Try Again */}
        {errorBanner && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#B3261E] shrink-0" />
              <p className="text-xs font-extrabold">{errorBanner}</p>
            </div>
            {lastFailedQuestion && (
              <button
                onClick={handleTryAgain}
                className="px-3.5 py-2 rounded-xl bg-[#B3261E] hover:bg-red-800 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{appLanguage === 'Telugu' ? 'మళ్ళీ ప్రయత్నించండి' : 'Try Again'}</span>
              </button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ATTACHMENT COMPOSER (Staged Attachments Above Input Area with Preview & Remove "X") */}
      {copilotDraftAttachments.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#0F5C7A]/30 p-2.5 space-y-2 shadow-2xs shrink-0">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F5C7A]">
              {appLanguage === 'Telugu'
                ? `తదుపరి సందేశానికి జోడించబడింది (${copilotDraftAttachments.length})`
                : `Attached to next message (${copilotDraftAttachments.length})`}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {appLanguage === 'Telugu'
                ? 'క్రింద ప్రశ్న టైప్ చేసి Send నొక్కండి'
                : 'Ask a question below and press Send'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {copilotDraftAttachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2.5 pl-2.5 pr-2 py-1.5 rounded-xl bg-[#F3F7FA] border border-slate-200 text-xs max-w-full"
              >
                {att.dataUrl && att.mimeType.startsWith('image/') ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#0F5C7A]/10 text-[#0F5C7A] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F5C7A]">
                    {att.kind === 'MEDICAL_REPORT'
                      ? appLanguage === 'Telugu'
                        ? 'జోడించిన రిపోర్ట్:'
                        : 'Attached report:'
                      : att.kind === 'PHOTO'
                      ? 'Photo attachment:'
                      : 'File attachment:'}
                  </p>
                  <p className="text-xs font-bold text-slate-800 truncate">{att.name}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveDraftAttachment(att.id)}
                  className="p-1 rounded-lg hover:bg-rose-100 text-slate-500 hover:text-[#B3261E] transition-colors cursor-pointer shrink-0"
                  title="Remove Attachment"
                  aria-label={`Remove ${att.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* "+" ATTACHMENT MENU POPUP */}
      {showAttachmentMenu && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-2 space-y-1 shrink-0 z-20">
          <div className="flex items-center justify-between px-2.5 py-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {appLanguage === 'Telugu'
                ? 'AI కోపైలట్‌కు రిపోర్ట్ / ఫైల్ జోడించండి'
                : 'Attach to Sanjeevani AI Copilot'}
            </span>
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(false)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {/* Option 1: Add Photo */}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="p-3 rounded-xl bg-[#F3F7FA] hover:bg-sky-50 border border-slate-200/80 hover:border-[#0F5C7A]/40 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0F5C7A]/10 text-[#0F5C7A] flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900">
                  {appLanguage === 'Telugu' ? 'ఫోటో జోడించండి' : 'Add Photo'}
                </p>
                <p className="text-[10px] text-slate-500">Camera or image</p>
              </div>
            </button>

            {/* Option 2: Add File */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl bg-[#F3F7FA] hover:bg-sky-50 border border-slate-200/80 hover:border-[#0F5C7A]/40 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0F5C7A]/10 text-[#0F5C7A] flex items-center justify-center shrink-0">
                <FolderOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900">
                  {appLanguage === 'Telugu' ? 'ఫైల్ జోడించండి' : 'Add File'}
                </p>
                <p className="text-[10px] text-slate-500">PDF, PNG, JPG</p>
              </div>
            </button>

            {/* Option 3: Select Medical Report */}
            <button
              type="button"
              onClick={() => {
                setShowAttachmentMenu(false);
                setShowReportPickerModal(true);
              }}
              className="p-3 rounded-xl bg-[#F3F7FA] hover:bg-sky-50 border border-slate-200/80 hover:border-[#0F5C7A]/40 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[#2E7D4F]/15 text-[#2E7D4F] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900">
                  {appLanguage === 'Telugu' ? 'మెడికల్ రిపోర్ట్ ఎంచుకోండి' : 'Select Medical Report'}
                </p>
                <p className="text-[10px] text-slate-500">From stored records</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Input Bar: [ + ] [ Ask a medical question... ] [ 🎤 ] [ Send ] */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (inputText.trim() && voiceState !== 'THINKING') {
            submitQuestion(inputText, false);
          }
        }}
        className="bg-white rounded-2xl border border-slate-200 p-2 flex items-center gap-1.5 shadow-2xs shrink-0"
      >
        {/* [ + ] Prominent Attachment Button */}
        <button
          type="button"
          onClick={() => setShowAttachmentMenu((prev) => !prev)}
          disabled={voiceState === 'THINKING'}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            showAttachmentMenu
              ? 'bg-[#0F5C7A] text-white'
              : 'bg-[#F3F7FA] hover:bg-sky-50 text-[#0F5C7A] border border-slate-200'
          }`}
          title="Add Photo, File, or Medical Report"
          aria-label="Open Attachment Menu"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* [ Ask a medical question... ] */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            voiceState === 'LISTENING' || voiceState === 'SPEECH_DETECTED'
              ? appLanguage === 'Telugu'
                ? 'మీ వాయిస్ వింటోంది...'
                : 'Listening to your voice...'
              : voiceState === 'TRANSCRIBING'
              ? appLanguage === 'Telugu'
                ? 'మీ వాయిస్ టెక్స్ట్‌గా మారుతోంది...'
                : 'Transcribing your voice...'
              : copilotDraftAttachments.length > 0
              ? appLanguage === 'Telugu'
                ? 'జోడించిన రిపోర్ట్ గురించి ప్రశ్న అడగండి...'
                : 'Ask a question about the attached report/file...'
              : appLanguage === 'Telugu'
              ? 'వైద్య ప్రశ్న అడగండి (తెలుగు లేదా English)...'
              : 'Ask a medical question...'
          }
          disabled={voiceState === 'THINKING' || voiceState === 'TRANSCRIBING'}
          className="flex-1 bg-transparent px-2 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium min-w-0"
        />

        {/* [ 🎤 ] Voice Input Button */}
        <button
          type="button"
          onClick={handleToggleMicrophone}
          disabled={voiceState === 'THINKING' || voiceState === 'TRANSCRIBING'}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            voiceState === 'LISTENING' || voiceState === 'SPEECH_DETECTED'
              ? 'bg-emerald-600 text-white animate-pulse shadow-md'
              : 'bg-[#F3F7FA] hover:bg-sky-50 text-[#0F5C7A] border border-slate-200'
          }`}
          title={
            voiceState === 'LISTENING' || voiceState === 'SPEECH_DETECTED'
              ? 'Stop Listening'
              : 'Speak Question with Microphone'
          }
          aria-label="Voice Input Microphone"
        >
          {voiceState === 'LISTENING' || voiceState === 'SPEECH_DETECTED' ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>

        {/* [ Send ] */}
        <button
          type="submit"
          disabled={!inputText.trim() || voiceState === 'THINKING'}
          className="px-3.5 h-10 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] disabled:opacity-40 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <span>{appLanguage === 'Telugu' ? 'పంపండి' : 'Send'}</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* MODAL: SELECT AN EXISTING STORED MEDICAL REPORT ("Add Medical Report") */}
      {showReportPickerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-5 text-slate-900 shadow-2xl flex flex-col max-h-[85vh] space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Select Stored Medical Report
                </h3>
                <p className="text-xs text-slate-500">
                  Choose a category and tap a report to attach it to Copilot
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReportPickerModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {REPORT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setPickerCategory(cat.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    pickerCategory === cat.id
                      ? 'bg-[#0F5C7A] text-white'
                      : 'bg-[#F3F7FA] text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  {getCategoryIcon(cat.id)}
                  <span>{cat.shortTitle}</span>
                </button>
              ))}
            </div>

            {/* Stored Reports in Selected Category */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {medicalReports
                .filter((r) => r.category === pickerCategory)
                .sort((a, b) => b.isoDate.localeCompare(a.isoDate))
                .map((rep) => (
                  <button
                    key={rep.id}
                    type="button"
                    onClick={() => handleAttachStoredReport(rep)}
                    className="w-full p-3 rounded-2xl bg-[#F3F7FA] hover:bg-sky-50 border border-slate-200 hover:border-[#0F5C7A]/40 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">
                        {rep.title}
                      </p>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        {rep.date} • {rep.fileType}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-[#0F5C7A] text-white text-[10px] font-extrabold shrink-0">
                      Attach
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
