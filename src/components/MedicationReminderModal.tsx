import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  PhoneCall,
  ShoppingBag,
  CheckCircle2,
  Mic,
  Volume2,
  Send,
  X
} from 'lucide-react';
import { useApp, formatMedicationScheduleDays } from '../context/AppContext';
import { speechService } from '../services/speechService';
import { alarmService } from '../services/alarmService';
import { AIService } from '../services/aiClassifierService';
import { buildMedicarePharmacyDeepLink } from '../services/pharmacyIntegrationService';

export const MedicationReminderModal: React.FC = () => {
  const {
    targetMedication,
    medicationReminderStage,
    setMedicationReminderStage,
    updateMedicationStatus,
    setActiveModal,
    setSelectedRefillMedicine,
    showToast
  } = useApp();

  const med = targetMedication || {
    id: 'med-1',
    day: 'Every day',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    name: 'Lisinopril',
    dosage: '10 mg',
    frequency: '1 tablet',
    timing: 'Morning' as const,
    scheduledTime: '8:00 AM',
    status: 'REMINDER' as const
  };

  const [aiMessage, setAiMessage] = useState<string>(
    `Hello. This is your Sanjeevani medication reminder. I noticed your medication (${med.name} ${med.dosage}) hasn't been confirmed. Were you able to take it?`
  );
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [manualText, setManualText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceSubStage, setVoiceSubStage] = useState<'ASK_TAKEN' | 'ASK_REFILL'>('ASK_TAKEN');
  const [isAlarmPlaying, setIsAlarmPlaying] = useState<boolean>(false);
  const [isAlarmBlocked, setIsAlarmBlocked] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = alarmService.subscribe((playing, blocked) => {
      setIsAlarmPlaying(playing);
      setIsAlarmBlocked(blocked);
    });
    return () => {
      unsubscribe();
      alarmService.stopAlarm();
    };
  }, []);

  useEffect(() => {
    // Stage 2: ALARM STATE — Play audible alarm sound continuously until user responds
    if (medicationReminderStage === 2) {
      speechService.stopSpeaking();
      speechService.stopListening();
      alarmService.startAlarm();
    } else {
      alarmService.stopAlarm();
    }

    // Stage 3: AI Voice Call
    if (medicationReminderStage === 3) {
      const opening = `Hello. This is your Sanjeevani medication reminder. I noticed your medication hasn't been confirmed. Were you able to take it?`;
      setAiMessage(opening);
      setVoiceSubStage('ASK_TAKEN');
      speechService.speak(opening, () => {
        startListeningForMedicationReply('ASK_TAKEN');
      });
    }

    return () => {
      alarmService.stopAlarm();
      speechService.stopSpeaking();
      speechService.stopListening();
    };
  }, [medicationReminderStage]);

  const startListeningForMedicationReply = (stageOverride?: 'ASK_TAKEN' | 'ASK_REFILL') => {
    const activeSubStage = stageOverride || voiceSubStage;
    setIsListening(true);
    speechService.startListening(
      (text, isFinal) => {
        setSpokenTranscript(text);
        if (isFinal && text.trim()) {
          setIsListening(false);
          processSpokenReply(text.trim(), activeSubStage);
        }
      },
      () => {
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const processSpokenReply = (text: string, currentSubStage: 'ASK_TAKEN' | 'ASK_REFILL') => {
    alarmService.stopAlarm();
    speechService.stopListening();
    setSpokenTranscript(text);

    const evaluation = AIService.analyzeMedicationCallResponse(text, med.name, currentSubStage);
    setAiMessage(evaluation.aiReply);

    if (evaluation.intent === 'TAKEN') {
      speechService.speak(evaluation.aiReply, () => {
        updateMedicationStatus(med.id, 'TAKEN');
        showToast(`${med.name} marked as TAKEN.`);
        setActiveModal('none');
      });
      return;
    }

    if (evaluation.intent === 'RAN_OUT') {
      setVoiceSubStage('ASK_REFILL');
      const refillPrompt = 'Would you like to request a refill?';
      setAiMessage(refillPrompt);
      speechService.speak(refillPrompt, () => {
        startListeningForMedicationReply('ASK_REFILL');
      });
      return;
    }

    if (evaluation.intent === 'CONFIRM_REFILL') {
      const deepLinkUrl = buildMedicarePharmacyDeepLink(med as any);
      updateMedicationStatus(med.id, 'NEEDS_REFILL');
      setSelectedRefillMedicine(med as any);
      window.open(deepLinkUrl, '_blank', 'noopener,noreferrer');
      speechService.speak(evaluation.aiReply, () => {
        setActiveModal('pharmacy_handoff');
      });
      setActiveModal('pharmacy_handoff');
      return;
    }

    // LATER or DECLINE_REFILL
    speechService.speak(evaluation.aiReply, () => {
      updateMedicationStatus(med.id, 'REMINDER');
      setActiveModal('none');
    });
  };

  const handleTaken = () => {
    alarmService.stopAlarm();
    speechService.stopSpeaking();
    speechService.stopListening();
    updateMedicationStatus(med.id, 'TAKEN');
    showToast(`${med.name} marked as TAKEN`);
    setActiveModal('none');
  };

  const handleRemindLater = () => {
    alarmService.stopAlarm();
    speechService.stopSpeaking();
    speechService.stopListening();
    updateMedicationStatus(med.id, 'REMINDER');
    showToast(`Reminder snoozed for ${med.name}`);
    setActiveModal('none');
  };

  const scheduleDaysText = formatMedicationScheduleDays(med.days, med.day);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 text-slate-900 shadow-2xl space-y-4 relative">
        <button
          onClick={() => {
            alarmService.stopAlarm();
            speechService.stopSpeaking();
            speechService.stopListening();
            setActiveModal('none');
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* STEP indicator tabs so judges can jump or follow sequence */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold">
          <button
            onClick={() => {
              alarmService.stopAlarm();
              setMedicationReminderStage(1);
            }}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${
              medicationReminderStage === 1
                ? 'bg-[#0F5C7A] text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            Step 1 (-10m)
          </button>
          <button
            onClick={() => {
              alarmService.unlockAudio();
              setMedicationReminderStage(2);
            }}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${
              medicationReminderStage === 2
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            Step 2 (-5m Alarm)
          </button>
          <button
            onClick={() => {
              alarmService.stopAlarm();
              speechService.warmupAudio();
              setMedicationReminderStage(3);
            }}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${
              medicationReminderStage === 3
                ? 'bg-[#2E7D4F] text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            Step 3 (AI Call)
          </button>
        </div>

        {/* STEP 1: 10 MINUTES BEFORE MEDICATION INTAKE TIME */}
        {medicationReminderStage === 1 && (
          <div className="text-center space-y-4 pt-1">
            <div className="w-14 h-14 rounded-2xl bg-[#0F5C7A]/10 text-[#0F5C7A] mx-auto flex items-center justify-center">
              <Bell className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[11px] uppercase font-extrabold tracking-wider text-[#0F5C7A]">
                Step 1 • 10 Minutes Before Intake
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">Medication reminder</h3>
              <p className="text-sm text-slate-600 mt-0.5">Your medication is due.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F3F7FA] border border-slate-200">
              <p className="text-base font-extrabold text-slate-900">{med.name}</p>
              <p className="text-xs text-slate-600 mt-0.5">
                {med.dosage} • {med.frequency || '1 tablet'} • {scheduleDaysText} at{' '}
                {med.scheduledTime}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleTaken}
                className="py-3.5 rounded-2xl bg-[#2E7D4F] hover:bg-[#24663F] text-white font-extrabold text-sm shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Taken</span>
              </button>
              <button
                onClick={handleRemindLater}
                className="py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-200 cursor-pointer"
              >
                Remind me later
              </button>
            </div>

            <button
              onClick={() => {
                alarmService.unlockAudio();
                setMedicationReminderStage(2);
              }}
              className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold cursor-pointer"
            >
              Simulate Ignored Notification → Escalate to Step 2 (-5 min Alarm)
            </button>
          </div>
        )}

        {/* STEP 2: 5 MINUTES BEFORE MEDICATION INTAKE TIME (ALARM + AUDIBLE SOUND) */}
        {medicationReminderStage === 2 && (
          <div className="text-center space-y-4 pt-1">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[11px] uppercase font-extrabold tracking-wider text-amber-700">
                Step 2 • 5 Minutes Before Intake (Alarm)
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                Medication Alarm Active
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                First notification was not confirmed. Please confirm your dose.
              </p>
            </div>

            {/* Active Audible Alarm Indicator */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold animate-pulse">
              <Volume2 className="w-4 h-4 text-amber-700" />
              <span>
                {isAlarmPlaying
                  ? '🔊 Audible Alarm Sound Playing...'
                  : '🔊 Medication Alarm Active'}
              </span>
            </div>

            {isAlarmBlocked && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    alarmService.unlockAudio();
                    alarmService.startAlarm();
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs cursor-pointer shadow-xs"
                >
                  🔊 Enable Alarm Sound
                </button>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <p className="text-base font-extrabold text-slate-900">{med.name}</p>
              <p className="text-xs text-amber-900 mt-0.5">
                {med.dosage} • {scheduleDaysText} • Due at {med.scheduledTime}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleTaken}
                className="py-3.5 rounded-2xl bg-[#2E7D4F] hover:bg-[#24663F] text-white font-extrabold text-sm shadow-xs cursor-pointer"
              >
                Taken
              </button>
              <button
                onClick={handleRemindLater}
                className="py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-200 cursor-pointer"
              >
                Remind me later
              </button>
            </div>

            <button
              onClick={() => {
                alarmService.stopAlarm();
                speechService.warmupAudio();
                setMedicationReminderStage(3);
              }}
              className="w-full py-3 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Simulate Ignored Alarm → Start Step 3 AI Voice Call</span>
            </button>
          </div>
        )}

        {/* STEP 3: AI MEDICATION REMINDER CALL SIMULATION */}
        {medicationReminderStage === 3 && (
          <div className="space-y-4 pt-1">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-full bg-[#0F5C7A] text-white mx-auto flex items-center justify-center shadow-md">
                <Volume2 className="w-7 h-7 animate-pulse" />
              </div>
              <span className="text-[11px] uppercase font-extrabold tracking-wider text-[#0F5C7A] block pt-1">
                Step 3 • AI Medication Reminder Call
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                Sanjeevani AI Voice Check
              </h3>
            </div>

            {/* AI Prompt Bubble */}
            <div className="p-4 rounded-2xl bg-[#F3F7FA] border border-slate-200 text-xs text-slate-800 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-[#0F5C7A]">
                AI Assistant Speaking:
              </span>
              <p className="font-bold text-sm text-slate-900 leading-relaxed">"{aiMessage}"</p>
            </div>

            {/* Spoken Transcript */}
            {spokenTranscript && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-[#2E7D4F]/30 text-xs">
                <span className="text-[10px] font-extrabold uppercase text-[#2E7D4F] block">
                  Your Spoken Response:
                </span>
                <p className="font-bold text-slate-900">"{spokenTranscript}"</p>
              </div>
            )}

            {/* Microphone & Natural Response Input */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => startListeningForMedicationReply()}
                className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-[#2E7D4F] text-white animate-pulse'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{isListening ? 'Listening...' : 'Speak'}</span>
              </button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualText.trim()) {
                    processSpokenReply(manualText.trim(), voiceSubStage);
                    setManualText('');
                  }
                }}
                className="flex-1 flex gap-1.5"
              >
                <input
                  type="text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder={
                    voiceSubStage === 'ASK_REFILL'
                      ? 'Say "Yes" to open Medicare Pharmacy...'
                      : 'Say "I took it" or "I ran out"...'
                  }
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 outline-none focus:border-[#0F5C7A]"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-[#0F5C7A] text-white text-xs font-bold cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Quick Voice Response Triggers for Fast Demo */}
            {voiceSubStage === 'ASK_TAKEN' ? (
              <div className="grid grid-cols-1 gap-2 text-xs pt-1">
                <button
                  onClick={() => processSpokenReply('I took my medicine already', 'ASK_TAKEN')}
                  className="py-3 rounded-xl bg-[#2E7D4F] hover:bg-[#23633D] font-bold text-white shadow-2xs cursor-pointer"
                >
                  Speak: "Yes, I took it"
                </button>
                <button
                  onClick={() => processSpokenReply('I ran out of medicine', 'ASK_TAKEN')}
                  className="py-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 font-extrabold text-amber-900 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-700" />
                  <span>Speak: "I ran out of medicine"</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
                <button
                  onClick={() => processSpokenReply('Yes, please request a refill', 'ASK_REFILL')}
                  className="py-3.5 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] font-extrabold text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>"YES, REQUEST REFILL"</span>
                </button>
                <button
                  onClick={() => processSpokenReply('No, not right now', 'ASK_REFILL')}
                  className="py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 border border-slate-300 cursor-pointer"
                >
                  "No, later"
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
