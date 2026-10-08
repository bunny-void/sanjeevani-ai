import React from 'react';
import {
  Mic,
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Calendar,
  MapPin,
  ShoppingBag,
  Stethoscope,
  History,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { speechService } from '../services/speechService';
import { alarmService } from '../services/alarmService';
import { SanjeevaniCopilotIcon } from './SanjeevaniIcons';

export const DashboardView: React.FC = () => {
  const {
    patient,
    medications,
    appointments,
    prototypeState,
    todayCheckInResult,
    startMorningCheckIn,
    setActiveView,
    setActiveModal,
    setTargetMedication,
    setMedicationReminderStage,
    setSelectedRefillMedicine,
    setTargetAppointment,
    setAppointmentReminderStage,
    openCopilotWithQuestion
  } = useApp();

  const nextAppointment = appointments[0];
  const firstName = patient.name.split(' ')[0] || patient.name;

  const handleStartVoiceCheckInClick = async () => {
    // Unlock browser TTS and request microphone permission directly on user gesture
    speechService.warmupAudio();
    alarmService.unlockAudio();
    await speechService.requestMicrophonePermission();
    startMorningCheckIn();
  };

  const getWellnessStatusCardStyle = () => {
    switch (prototypeState) {
      case 'SAFE':
        return {
          bg: 'bg-[#2E7D4F]/10 border-[#2E7D4F]/30 text-[#2E7D4F]',
          badgeBg: 'bg-[#2E7D4F] text-white',
          label: 'SAFE',
          subtitle: todayCheckInResult || 'Morning check-in completed. User feeling well.',
          icon: <CheckCircle2 className="w-5 h-5 text-[#2E7D4F]" />
        };
      case 'NOT_OK':
      case 'MONITORING':
        return {
          bg: 'bg-amber-50 border-amber-300 text-amber-900',
          badgeBg: 'bg-amber-600 text-white',
          label: 'NOT OK',
          subtitle:
            todayCheckInResult || 'Reported mild wellness concern during morning check-in.',
          icon: <AlertCircle className="w-5 h-5 text-amber-600" />
        };
      case 'CRITICAL':
        return {
          bg: 'bg-[#B3261E]/10 border-[#B3261E]/30 text-[#B3261E]',
          badgeBg: 'bg-[#B3261E] text-white',
          label: 'CRITICAL',
          subtitle:
            todayCheckInResult || 'Urgent safety check triggered during voice interaction.',
          icon: <AlertTriangle className="w-5 h-5 text-[#B3261E]" />
        };
      case 'AWAITING_CHECKIN':
      default:
        return {
          bg: 'bg-white border-slate-200 text-slate-700',
          badgeBg: 'bg-slate-200 text-slate-800',
          label: 'CHECK-IN NOT COMPLETED',
          subtitle: 'Awaiting morning check-in',
          icon: <Clock className="w-5 h-5 text-[#0F5C7A]" />
        };
    }
  };

  const getMedicationStatusPill = (status: string) => {
    switch (status) {
      case 'TAKEN':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#2E7D4F]/15 text-[#2E7D4F] border border-[#2E7D4F]/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Taken
          </span>
        );
      case 'NEEDS_REFILL':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#B3261E]/15 text-[#B3261E] border border-[#B3261E]/30">
            Needs refill
          </span>
        );
      case 'ORDERED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-[#0F5C7A] border border-sky-300">
            Refill Ordered
          </span>
        );
      case 'REMINDER':
      case 'DUE':
      case 'PENDING':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Reminder
          </span>
        );
    }
  };

  const statusInfo = getWellnessStatusCardStyle();

  return (
    <div className="space-y-4 pb-6">
      {/* Compact User Greeting */}
      <div className="px-1 pt-0.5 flex items-baseline justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Good morning, {firstName}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {patient.age} years • Daily AI Wellness Guardian
          </p>
        </div>

        <button
          onClick={() => setActiveView('history')}
          className="text-xs font-bold text-[#0F5C7A] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <History className="w-3.5 h-3.5" />
          <span>History</span>
        </button>
      </div>

      {/* MAIN HERO CARD: MORNING AI CHECK-IN */}
      <div className="bg-[#0F5C7A] rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-sky-100 text-[11px] font-extrabold uppercase tracking-wider">
            <Mic className="w-3.5 h-3.5" />
            MORNING AI CHECK-IN
          </span>
          <span className="text-xs font-semibold text-sky-100 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Scheduled daily at 9:00 AM
          </span>
        </div>

        <h3 className="text-2xl font-extrabold tracking-tight mb-1">
          "How are you feeling today?"
        </h3>
        <p className="text-xs text-sky-100/90 mb-5 leading-relaxed">
          Tap below to speak with your AI voice assistant.
        </p>

        <button
          onClick={handleStartVoiceCheckInClick}
          className="w-full py-4 px-5 rounded-2xl bg-white hover:bg-sky-50 text-[#0F5C7A] font-extrabold text-base shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
        >
          <Mic className="w-5 h-5 text-[#0F5C7A]" />
          <span>Start voice check-in</span>
        </button>
      </div>

      {/* CURRENT AI WELLNESS STATUS CARD */}
      <div
        className={`p-4 rounded-2xl border ${statusInfo.bg} flex items-center justify-between gap-3 shadow-2xs`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 shrink-0">
            {statusInfo.icon}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                AI Wellness Status
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${statusInfo.badgeBg}`}
              >
                {statusInfo.label}
              </span>
            </div>
            <p className="text-xs font-semibold mt-1 text-slate-800 truncate">
              {statusInfo.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* TODAY'S MEDICATIONS SECTION */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F5C7A]/10 text-[#0F5C7A] flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                TODAY'S MEDICATIONS
              </h3>
              <p className="text-xs text-slate-500">Daily schedule & refill status</p>
            </div>
          </div>

          <button
            onClick={() => setActiveView('medications')}
            className="text-xs font-bold text-[#0F5C7A] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          {medications.map((med) => (
            <div
              key={med.id}
              className="p-3.5 rounded-2xl bg-[#F3F7FA] border border-slate-200/80 flex items-center justify-between gap-2"
            >
              <div>
                <h4 className="text-sm font-bold text-slate-900">{med.name}</h4>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  {med.dosage} • <strong className="text-slate-800">{med.scheduledTime}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {getMedicationStatusPill(med.status)}

                {med.status === 'NEEDS_REFILL' && (
                  <button
                    onClick={() => {
                      setSelectedRefillMedicine(med);
                      setActiveModal('pharmacy_handoff');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Refill</span>
                  </button>
                )}

                {med.status === 'REMINDER' && (
                  <button
                    onClick={() => {
                      alarmService.unlockAudio();
                      speechService.warmupAudio();
                      setTargetMedication(med);
                      setMedicationReminderStage(1);
                      setActiveModal('medication_reminder');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-bold cursor-pointer"
                  >
                    Reminder
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NEXT APPOINTMENT CARD */}
      {nextAppointment && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#2E7D4F]/10 text-[#2E7D4F] flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  NEXT APPOINTMENT
                </h3>
                <p className="text-xs text-slate-500">{nextAppointment.specialty}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveView('appointments')}
              className="text-xs font-bold text-[#0F5C7A] hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Manage</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F3F7FA] border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-900">
                {nextAppointment.doctorName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#2E7D4F]/15 text-[#2E7D4F] font-bold text-[10px]">
                {nextAppointment.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-slate-700 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#0F5C7A]" />
                {nextAppointment.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#0F5C7A]" />
                {nextAppointment.time}
              </span>
            </div>

            <div className="flex items-start gap-1.5 text-slate-600 pt-1 border-t border-slate-200/70">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{nextAppointment.address}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => {
                alarmService.unlockAudio();
                speechService.warmupAudio();
                setTargetAppointment(nextAppointment);
                setAppointmentReminderStage(1);
                setActiveModal('appointment_reminder');
              }}
              className="text-xs font-bold text-[#0F5C7A] hover:underline cursor-pointer"
            >
              Test Appointment Reminder →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
