import React, { useState } from 'react';
import {
  PhoneCall,
  Pill,
  Calendar,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ArrowLeft,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { speechService } from '../services/speechService';
import { alarmService } from '../services/alarmService';
import {
  SanjeevaniCopilotIcon,
  BloodReportIcon,
  ShockIdentifierIcon,
  GlobalHealthAlertsIcon,
  RewardStreaksIcon
} from './SanjeevaniIcons';

export const DemoCenterView: React.FC = () => {
  const {
    startMorningCheckIn,
    medications,
    appointments,
    medicalReports,
    setSelectedReportCategory,
    setTargetMedication,
    setMedicationReminderStage,
    setTargetAppointment,
    setAppointmentReminderStage,
    setSelectedRefillMedicine,
    setActiveModal,
    setActiveView,
    addCheckInLog,
    setPrototypeState,
    resetDemoState,
    patient,
    openCopilotWithQuestion,
    openCopilotWithReport
  } = useApp();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleRunMorningCheckInDemo = async () => {
    speechService.warmupAudio();
    alarmService.unlockAudio();
    await speechService.requestMicrophonePermission();
    startMorningCheckIn();
  };

  const handleRunMedicationDemo = () => {
    speechService.warmupAudio();
    alarmService.unlockAudio();
    const med = medications.find((m) => m.status !== 'TAKEN') || medications[0];
    setTargetMedication(med);
    setMedicationReminderStage(1);
    setActiveModal('medication_reminder');
  };

  const handleRunAppointmentDemo = () => {
    speechService.warmupAudio();
    alarmService.unlockAudio();
    const appt = appointments[0];
    setTargetAppointment(appt);
    setAppointmentReminderStage(1);
    setActiveModal('appointment_reminder');
  };

  const handleRunEmergencyDemo = () => {
    speechService.warmupAudio();
    alarmService.unlockAudio();
    setActiveModal('emergency_countdown');
  };

  const sampleBloodReport =
    medicalReports.find((r) => r.category === 'BLOOD_TEST') || medicalReports[0];

  return (
    <div className="space-y-4 pb-8">
      {/* Top Banner */}
      <div className="bg-[#0F5C7A] rounded-2xl p-5 text-white shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-sky-100 text-[11px] font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Experience Sanjeevani AI
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Reset Demo Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
            <button
              onClick={() => setActiveView('dashboard')}
              className="px-3 py-1.5 rounded-xl bg-white text-[#0F5C7A] text-xs font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit Demo</span>
            </button>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight">Demo Center</h2>
        <p className="text-xs text-sky-100 leading-relaxed">
          Experience Sanjeevani AI — launch any demonstration immediately without waiting for scheduled times.
        </p>
      </div>

      {/* =====================================================================
          PRIMARY DEMO PATH: PERSONAL HEALTH COPILOT DEMO
         ===================================================================== */}
      <div className="bg-gradient-to-br from-indigo-50 to-sky-50 rounded-2xl p-5 border-2 border-indigo-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center">★</span>
              <h3 className="text-base font-extrabold text-indigo-900 tracking-tight">PERSONAL HEALTH COPILOT DEMO</h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold">Hackathon Primary Path</span>
            </div>
            <p className="text-xs text-indigo-700 ml-9">Complete judge walkthrough — follow each step in order</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

          {/* STEP 1 */}
          <button
            onClick={() => setActiveView('profile')}
            className="p-3.5 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-left flex items-start gap-3 cursor-pointer transition-colors shadow-xs"
          >
            <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center justify-center shrink-0">1</span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900">Patient Profile + ABHA ID</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Open unified profile — see Alex Johnson, ABHA-1234-5678-9012, health vitals</p>
            </div>
          </button>

          {/* STEP 2 */}
          <button
            onClick={() => { setSelectedReportCategory('BLOOD_TEST'); setActiveView('reports'); }}
            className="p-3.5 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-left flex items-start gap-3 cursor-pointer transition-colors shadow-xs"
          >
            <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center justify-center shrink-0">2</span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900">Open Blood Test Report</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Navigate to Reports → Blood Tests — 3 demo reports pre-loaded</p>
            </div>
          </button>

          {/* STEP 3+4+5+6 */}
          <button
            onClick={() => { setSelectedReportCategory('BLOOD_TEST'); setActiveView('reports'); }}
            className="p-3.5 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-left flex items-start gap-3 cursor-pointer transition-colors shadow-xs"
          >
            <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center justify-center shrink-0">3–6</span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900">AI Extraction + Summary + Abnormal Values</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Click a report → Run AI Processing → View structured lab table + AI Health Summary + Abnormal flags</p>
            </div>
          </button>

          {/* STEP 7 */}
          <button
            onClick={() => { setActiveView('profile'); }}
            className="p-3.5 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-left flex items-start gap-3 cursor-pointer transition-colors shadow-xs"
          >
            <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center justify-center shrink-0">7</span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900">Health Timeline</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Profile → Health Timeline tab — see all reports, medicines, appointments in chronological order</p>
            </div>
          </button>

          {/* STEP 8 */}
          <button
            onClick={() => openCopilotWithQuestion('What does my latest blood test say?')}
            className="p-3.5 rounded-xl bg-white border border-[#0F5C7A]/30 hover:border-[#0F5C7A] hover:bg-sky-50 text-left flex items-start gap-3 cursor-pointer transition-colors shadow-xs"
          >
            <span className="w-7 h-7 rounded-full bg-sky-100 text-[#0F5C7A] text-xs font-extrabold flex items-center justify-center shrink-0">8</span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900">Copilot: Personal Record Query</p>
              <p className="text-[11px] text-slate-500 mt-0.5">"What does my latest blood test say?" — AI answers from stored report</p>
            </div>
          </button>

          {/* STEP 9 */}
          <button
            onClick={() => openCopilotWithQuestion('Explain the HbA1c result in simple words.')}
            className="p-3.5 rounded-xl bg-white border border-[#0F5C7A]/30 hover:border-[#0F5C7A] hover:bg-sky-50 text-left flex items-start gap-3 cursor-pointer transition-colors shadow-xs"
          >
            <span className="w-7 h-7 rounded-full bg-sky-100 text-[#0F5C7A] text-xs font-extrabold flex items-center justify-center shrink-0">9</span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900">Copilot: Explain HbA1c</p>
              <p className="text-[11px] text-slate-500 mt-0.5">"Explain the HbA1c result in simple words." — AI explains abnormal value in plain language</p>
            </div>
          </button>

          {/* STEP 10 */}
          <button
            onClick={() => openCopilotWithQuestion('రక్త పరీక్ష ఫలితాలు సరళమైన మాటల్లో వివరించండి.')}
            className="p-3.5 rounded-xl bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-left flex items-start gap-3 cursor-pointer transition-colors shadow-xs"
          >
            <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-extrabold flex items-center justify-center shrink-0">10</span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900">Telugu Support Demo</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Switch language to తెలుగు in Copilot header → Ask the same question → AI responds in Telugu</p>
            </div>
          </button>

          {/* STEP 11 */}
          <button
            onClick={() => openCopilotWithQuestion('What is hypertension?')}
            className="p-3.5 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-left flex items-start gap-3 cursor-pointer transition-colors shadow-xs"
          >
            <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center justify-center shrink-0">11</span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900">General Medical Knowledge</p>
              <p className="text-[11px] text-slate-500 mt-0.5">"What is hypertension?" — AI answers without personal records, showing general knowledge</p>
            </div>
          </button>
        </div>

        <div className="pt-3 border-t border-indigo-200 text-[11px] text-indigo-700 font-bold flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-[9px] font-extrabold">i</span>
          Each button above opens the relevant app screen or sends the question directly to the Medical AI Copilot.
        </div>
      </div>

      {/* LARGE PREMIUM DEMO CARDS (ROUND 1 ACTIVE DEMOS) */}
      <div className="space-y-3.5">
        {/* CARD 1: MORNING AI CHECK-IN */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0F5C7A]/10 text-[#0F5C7A] flex items-center justify-center shrink-0">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">MORNING AI CHECK-IN</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Experience the AI voice health check.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunMorningCheckInDemo}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-extrabold text-xs shadow-xs cursor-pointer shrink-0"
          >
            Run Demo
          </button>
        </div>

        {/* CARD 2: MEDICATION REMINDER */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#2E7D4F]/10 text-[#2E7D4F] flex items-center justify-center shrink-0">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">MEDICATION REMINDER</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Experience the intelligent medication reminder.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunMedicationDemo}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-extrabold text-xs shadow-xs cursor-pointer shrink-0"
          >
            Run Demo
          </button>
        </div>

        {/* CARD 3: DOCTOR APPOINTMENT */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-[#0F5C7A] flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">DOCTOR APPOINTMENT</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Experience the appointment reminder.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunAppointmentDemo}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-extrabold text-xs shadow-xs cursor-pointer shrink-0"
          >
            Run Demo
          </button>
        </div>

        {/* CARD 4: EMERGENCY RESPONSE */}
        <div className="bg-white rounded-2xl p-5 border border-[#B3261E]/25 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#B3261E]/10 text-[#B3261E] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">EMERGENCY RESPONSE</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Experience the 10-second emergency simulation.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunEmergencyDemo}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#B3261E] hover:bg-red-800 text-white font-extrabold text-xs shadow-xs cursor-pointer shrink-0"
          >
            Run Demo
          </button>
        </div>

        {/* CARD 5: MEDICAL AI + REPORTS DEMO */}
        <div className="bg-white rounded-2xl p-5 border border-[#0F5C7A]/30 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0F5C7A]/10 text-[#0F5C7A] flex items-center justify-center shrink-0">
                <SanjeevaniCopilotIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-slate-900">
                    MEDICAL AI + REPORTS DEMO
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#2E7D4F]/15 text-[#2E7D4F] text-[10px] font-extrabold">
                    Real Gemini AI + Multimodal
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Explore organized Medical Reports, attach files/photos with "+", or ask Sanjeevani AI about stored lab & scan reports.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setSelectedReportCategory(null);
                  setActiveView('reports');
                }}
                className="px-3.5 py-2.5 rounded-xl bg-[#F3F7FA] hover:bg-sky-50 border border-slate-200 text-[#0F5C7A] font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Open Reports</span>
              </button>
              <button
                onClick={() => openCopilotWithQuestion()}
                className="px-4 py-2.5 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                Open Copilot
              </button>
            </div>
          </div>

          {/* Step-by-step Report + AI Demo Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setSelectedReportCategory('BLOOD_TEST');
                setActiveView('reports');
              }}
              className="p-3 rounded-xl bg-[#F3F7FA] hover:bg-sky-50 border border-slate-200/90 text-left flex items-center gap-2.5 cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <BloodReportIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 truncate">
                  1. View Blood Test Reports
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  3 demo reports (10 Jan 2026, Aug 2025, Apr 2025)
                </p>
              </div>
            </button>

            {sampleBloodReport && (
              <button
                onClick={() =>
                  openCopilotWithReport(
                    sampleBloodReport,
                    'Can you explain this blood test report in simple words?'
                  )
                }
                className="p-3 rounded-xl bg-[#0F5C7A]/8 hover:bg-[#0F5C7A]/15 border border-[#0F5C7A]/25 text-left flex items-center gap-2.5 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[#0F5C7A] text-white flex items-center justify-center shrink-0">
                  <SanjeevaniCopilotIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-[#0F5C7A] truncate">
                    2. Ask AI About CBC Report
                  </p>
                  <p className="text-[11px] text-slate-600 truncate">
                    Attaches report & explains values via Gemini AI
                  </p>
                </div>
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Click any sample report or medical question to send to the real Gemini AI model:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Explain my blood test report',
                'What does my HbA1c result mean?',
                'When was my latest vaccination recorded?',
                'What is hypertension?',
                'What is Metformin used for?'
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => openCopilotWithQuestion(q)}
                  className="px-3 py-1.5 rounded-xl bg-[#F3F7FA] hover:bg-sky-50 border border-slate-200 text-xs font-bold text-[#0F5C7A] cursor-pointer transition-colors"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Wellness State Simulators for Judges */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
          Quick Wellness Status Testing
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <button
            onClick={() => {
              addCheckInLog({
                date: 'October 7',
                timestamp: new Date().toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                }),
                duration: '00:35',
                patientResponse: 'I feel fine and slept well.',
                classification: 'SAFE',
                videoEnabled: patient.enableVideo,
                finalStatus: 'SAFE',
                summary: 'Morning check-in completed.'
              });
              setPrototypeState('SAFE');
            }}
            className="p-2.5 rounded-xl bg-[#2E7D4F]/10 hover:bg-[#2E7D4F]/20 text-[#2E7D4F] font-bold border border-[#2E7D4F]/30 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Test SAFE</span>
          </button>

          <button
            onClick={() => {
              addCheckInLog({
                date: 'October 7',
                timestamp: new Date().toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                }),
                duration: '00:52',
                patientResponse: "I've been feeling unusually weak this morning.",
                classification: 'NOT_OK',
                videoEnabled: patient.enableVideo,
                finalStatus: 'NOT_OK',
                summary: "Recorded that user is not feeling their usual self."
              });
              setPrototypeState('NOT_OK');
            }}
            className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-300 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Test NOT OK</span>
          </button>

          <button
            onClick={handleRunEmergencyDemo}
            className="p-2.5 rounded-xl bg-[#B3261E]/10 hover:bg-[#B3261E]/20 text-[#B3261E] font-bold border border-[#B3261E]/30 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Test CRITICAL</span>
          </button>

          <button
            onClick={() => {
              setSelectedRefillMedicine(medications[2] || medications[0]);
              setActiveModal('pharmacy_handoff');
            }}
            className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0F5C7A] font-bold border border-sky-200 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Refill Flow</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Need to restart the demonstration from User Profile Setup?
          </span>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-[#B3261E] text-[#B3261E] hover:text-white border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* UPCOMING FEATURES — ROUND 2 SECTION */}
      <div className="pt-4 border-t border-slate-200/90 space-y-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold uppercase tracking-tight text-slate-900">
              UPCOMING FEATURES — ROUND 2
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-extrabold">
              Roadmap Preview
            </span>
          </div>
          <p className="text-xs text-slate-500">
            More intelligent healthcare experiences are coming in the next round.
          </p>
        </div>

        <div className="space-y-3">
          {/* UPCOMING FEATURE 1: SHOCK IDENTIFIER */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                <ShockIdentifierIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    SHOCK IDENTIFIER
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold">
                    Coming in Round 2
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  AI-assisted emergency event detection using future device and sensor signals.
                </p>
              </div>
            </div>

            <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-500 font-extrabold text-xs text-center shrink-0 select-none border border-slate-200/80">
              Coming Soon
            </span>
          </div>

          {/* UPCOMING FEATURE 2: GLOBAL HEALTH ALERTS */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200 text-[#0F5C7A] flex items-center justify-center shrink-0">
                <GlobalHealthAlertsIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    GLOBAL HEALTH ALERTS
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-[#0F5C7A] text-[10px] font-extrabold">
                    Coming in Round 2
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Daily updates about emerging diseases and important health developments around the world.
                </p>
              </div>
            </div>

            <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-500 font-extrabold text-xs text-center shrink-0 select-none border border-slate-200/80">
              Coming Soon
            </span>
          </div>

          {/* UPCOMING FEATURE 3: HEALTH SURVEY & REWARD STREAKS */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#2E7D4F] flex items-center justify-center shrink-0">
                <RewardStreaksIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    HEALTH SURVEY & REWARD STREAKS
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#2E7D4F] text-[10px] font-extrabold">
                    Coming in Round 2
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Answer quick health and wellness questions regularly, build a streak, and unlock medicine-purchase discount coupons.
                </p>
              </div>
            </div>

            <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-500 font-extrabold text-xs text-center shrink-0 select-none border border-slate-200/80">
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      {/* Reset Demo Data Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-white border border-slate-200 rounded-3xl p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#B3261E]/10 text-[#B3261E] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900">
                Reset demo data?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This will clear the current demo profile, medications, appointments and check-in history.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  resetDemoState();
                }}
                className="py-3 rounded-xl bg-[#B3261E] hover:bg-red-800 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                Reset Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
