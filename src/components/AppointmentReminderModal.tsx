import React, { useEffect, useState } from 'react';
import {
  Calendar,
  MapPin,
  Bell,
  AlertTriangle,
  Volume2,
  CheckCircle2,
  Mic,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { speechService } from '../services/speechService';
import { alarmService } from '../services/alarmService';

export const AppointmentReminderModal: React.FC = () => {
  const {
    targetAppointment,
    appointmentReminderStage,
    setAppointmentReminderStage,
    updateAppointmentStatus,
    setActiveModal,
    showToast
  } = useApp();

  const appt = targetAppointment || {
    id: 'appt-1',
    doctorName: 'Dr. Priya Nair, MD',
    specialty: 'Cardiology & Internal Medicine',
    date: '2026-10-12',
    time: '10:30 AM',
    address: 'Sanjeevani Heart & Wellness Clinic, Suite 302, Green Park',
    status: 'UPCOMING' as const
  };

  const [spokenAck, setSpokenAck] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState<boolean>(false);
  const [isAlarmBlocked, setIsAlarmBlocked] = useState<boolean>(false);

  const aiVoicePrompt = `You have a doctor appointment scheduled today at ${appt.time} with ${appt.doctorName} at ${appt.address}. Would you like to acknowledge this reminder?`;

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
    if (appointmentReminderStage === 2) {
      speechService.stopSpeaking();
      speechService.stopListening();
      alarmService.startAlarm();
    } else {
      alarmService.stopAlarm();
    }

    // Stage 3: AI Voice Reminder
    if (appointmentReminderStage === 3) {
      speechService.speak(aiVoicePrompt, () => {
        setIsListening(true);
        speechService.startListening(
          (text, isFinal) => {
            setSpokenAck(text);
            if (isFinal && text.trim()) {
              setIsListening(false);
              handleAcknowledge();
            }
          },
          () => setIsListening(false),
          () => setIsListening(false)
        );
      });
    }
    return () => {
      alarmService.stopAlarm();
      speechService.stopSpeaking();
      speechService.stopListening();
    };
  }, [appointmentReminderStage]);

  const handleAcknowledge = () => {
    alarmService.stopAlarm();
    speechService.stopSpeaking();
    speechService.stopListening();
    updateAppointmentStatus(appt.id, 'ACKNOWLEDGED');
    showToast(`Appointment with ${appt.doctorName} acknowledged.`);
    setActiveModal('none');
  };

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

        {/* Stage Switcher */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold">
          <button
            onClick={() => {
              alarmService.stopAlarm();
              setAppointmentReminderStage(1);
            }}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${
              appointmentReminderStage === 1
                ? 'bg-[#0F5C7A] text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            Step 1 (-10m)
          </button>
          <button
            onClick={() => {
              alarmService.unlockAudio();
              setAppointmentReminderStage(2);
            }}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${
              appointmentReminderStage === 2
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            Step 2 (2nd Alert)
          </button>
          <button
            onClick={() => {
              alarmService.stopAlarm();
              speechService.warmupAudio();
              setAppointmentReminderStage(3);
            }}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${
              appointmentReminderStage === 3
                ? 'bg-[#2E7D4F] text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            Step 3 (AI Voice)
          </button>
        </div>

        {/* STEP 1: 10 MINUTES BEFORE NOTIFICATION */}
        {appointmentReminderStage === 1 && (
          <div className="text-center space-y-4 pt-1">
            <div className="w-14 h-14 rounded-2xl bg-[#0F5C7A]/10 text-[#0F5C7A] mx-auto flex items-center justify-center">
              <Bell className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[11px] uppercase font-extrabold tracking-wider text-[#0F5C7A]">
                Step 1 • 10 Minutes Before Appointment
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                Doctor Appointment Reminder
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-[#F3F7FA] border border-slate-200 text-left space-y-1.5 text-xs">
              <p className="text-base font-extrabold text-slate-900">{appt.doctorName}</p>
              <p className="text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0F5C7A]" /> {appt.date} at{' '}
                <strong>{appt.time}</strong>
              </p>
              <p className="text-slate-600 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0F5C7A] shrink-0 mt-0.5" />
                <span>{appt.address}</span>
              </p>
            </div>

            <button
              onClick={handleAcknowledge}
              className="w-full py-3.5 rounded-2xl bg-[#2E7D4F] hover:bg-[#23633D] text-white font-extrabold text-sm shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Acknowledge Appointment</span>
            </button>

            <button
              onClick={() => {
                alarmService.unlockAudio();
                setAppointmentReminderStage(2);
              }}
              className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold cursor-pointer"
            >
              Simulate Ignored Notification → Step 2 Second Reminder
            </button>
          </div>
        )}

        {/* STEP 2: SECOND REMINDER + AUDIBLE ALARM SOUND */}
        {appointmentReminderStage === 2 && (
          <div className="text-center space-y-4 pt-1">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[11px] uppercase font-extrabold tracking-wider text-amber-700">
                Step 2 • Second Reminder Alert (Alarm)
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                Upcoming Visit Unacknowledged
              </h3>
            </div>

            {/* Active Audible Alarm Indicator */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold animate-pulse">
              <Volume2 className="w-4 h-4 text-amber-700" />
              <span>
                {isAlarmPlaying
                  ? '🔊 Audible Alarm Sound Playing...'
                  : '🔊 Appointment Alarm Active'}
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

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
              <p className="font-extrabold text-slate-900 text-sm">{appt.doctorName}</p>
              <p className="text-amber-900 mt-1">
                Scheduled at <strong>{appt.time}</strong> • {appt.address}
              </p>
            </div>

            <button
              onClick={handleAcknowledge}
              className="w-full py-3.5 rounded-2xl bg-[#2E7D4F] hover:bg-[#23633D] text-white font-extrabold text-sm shadow-xs cursor-pointer"
            >
              Acknowledge Now
            </button>

            <button
              onClick={() => {
                alarmService.stopAlarm();
                speechService.warmupAudio();
                setAppointmentReminderStage(3);
              }}
              className="w-full py-3 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white text-xs font-bold cursor-pointer"
            >
              Simulate Still Ignored → Start Step 3 AI Voice Reminder
            </button>
          </div>
        )}

        {/* STEP 3: AI VOICE REMINDER SIMULATION */}
        {appointmentReminderStage === 3 && (
          <div className="space-y-4 pt-1 text-center">
            <div className="w-14 h-14 rounded-full bg-[#0F5C7A] text-white mx-auto flex items-center justify-center shadow-md">
              <Volume2 className="w-7 h-7 animate-pulse" />
            </div>

            <div>
              <span className="text-[11px] uppercase font-extrabold tracking-wider text-[#0F5C7A]">
                Step 3 • AI Voice Appointment Reminder
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                Sanjeevani AI Speaking
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-[#F3F7FA] border border-slate-200 text-left text-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-[#0F5C7A]">
                Voice Output:
              </span>
              <p className="font-bold text-sm text-slate-900 leading-relaxed">
                "{aiVoicePrompt}"
              </p>
            </div>

            {spokenAck && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-[#2E7D4F]/30 text-xs">
                <span className="font-bold text-[#2E7D4F]">Spoken Response: </span>"{spokenAck}"
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleAcknowledge}
                className="w-full py-3.5 rounded-2xl bg-[#2E7D4F] hover:bg-[#23633D] text-white font-extrabold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Acknowledge Reminder ("Yes, Thank You")</span>
              </button>

              {isListening && (
                <span className="text-[11px] text-[#2E7D4F] font-semibold flex items-center justify-center gap-1 animate-pulse">
                  <Mic className="w-3.5 h-3.5" /> Listening for your spoken acknowledgement...
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
