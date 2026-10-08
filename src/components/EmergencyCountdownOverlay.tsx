import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, PhoneCall, ShieldAlert, ArrowLeft, MapPin, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { speechService } from '../services/speechService';

export const EmergencyCountdownOverlay: React.FC = () => {
  const {
    patient,
    setActiveModal,
    addEmergencyLog,
    setPrototypeState,
    setActiveView
  } = useApp();

  const [countdown, setCountdown] = useState<number>(10);
  const [resolutionState, setResolutionState] = useState<
    'COUNTDOWN' | 'CANCELLED_SAFE' | 'HELP_REQUESTED'
  >('COUNTDOWN');

  const timerRef = useRef<any>(null);

  useEffect(() => {
    const voicePrompt =
      'Are you okay? If you do not respond within 10 seconds, your emergency contact will be alerted.';
    speechService.speak(voicePrompt);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeoutEscalation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      speechService.stopSpeaking();
    };
  }, []);

  const handleImOkay = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    speechService.stopSpeaking();

    addEmergencyLog({
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      trigger: 'Critical AI Wellness Check / SOS Trigger',
      classification: 'SAFE',
      countdownResult: 'IM_OK',
      patientResponse: "Selected I'M OKAY",
      videoStatus: patient.enableVideo ? 'ENABLED' : 'DISABLED',
      verificationResult: 'Alert cancelled — User confirmed safe',
      finalResponseStatus: 'ALERT_CANCELLED'
    });

    setPrototypeState('SAFE');
    setResolutionState('CANCELLED_SAFE');
  };

  const handleCallForHelp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    speechService.stopSpeaking();

    addEmergencyLog({
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      trigger: 'User Selected CALL FOR HELP',
      classification: 'CRITICAL',
      countdownResult: 'CALL_FOR_HELP',
      patientResponse: 'Selected CALL FOR HELP',
      videoStatus: patient.enableVideo ? 'ENABLED' : 'DISABLED',
      verificationResult: 'Emergency assistance requested (Prototype simulation)',
      finalResponseStatus: 'SIMULATED_CONTACT_ALERTED'
    });

    setPrototypeState('CRITICAL');
    setResolutionState('HELP_REQUESTED');
    speechService.speak(
      `Emergency assistance requested. This is a prototype emergency simulation. Displaying emergency contact ${patient.emergencyContact.name}.`
    );
  };

  const handleTimeoutEscalation = () => {
    speechService.stopSpeaking();

    addEmergencyLog({
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      trigger: '10-Second Countdown Expired',
      classification: 'CRITICAL',
      countdownResult: 'NO_RESPONSE',
      patientResponse: 'No response within 10 seconds',
      videoStatus: patient.enableVideo ? 'ENABLED' : 'DISABLED',
      verificationResult: 'Emergency assistance requested (Timeout simulation)',
      finalResponseStatus: 'SIMULATED_CONTACT_ALERTED'
    });

    setPrototypeState('CRITICAL');
    setResolutionState('HELP_REQUESTED');
  };

  // Calculate SVG progress ring stroke
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (countdown / 10) * circumference;

  return (
    <div className="fixed inset-0 z-50 bg-[#FDF2F2]/98 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-white border-2 border-[#B3261E]/30 rounded-3xl p-6 text-center shadow-2xl space-y-5">
        {/* Mandatory Simulation Label */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#B3261E]/10 text-[#B3261E] font-extrabold text-xs uppercase tracking-wider border border-[#B3261E]/25">
          <ShieldAlert className="w-4 h-4" />
          <span>Prototype emergency simulation</span>
        </div>

        {/* STATE 1: 10-SECOND COUNTDOWN */}
        {resolutionState === 'COUNTDOWN' && (
          <div className="space-y-5">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Are you okay?
            </h2>

            {/* Large Circular Countdown Ring */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="#FEE2E2"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="#B3261E"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-700 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-extrabold text-[#B3261E] font-mono">
                  {countdown}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  seconds
                </span>
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-700 leading-relaxed px-2">
              If you don't respond, your emergency contact will be alerted.
            </p>

            {/* Two Large Action Buttons */}
            <div className="space-y-3 pt-1">
              <button
                onClick={handleImOkay}
                className="w-full py-4 rounded-2xl bg-[#2E7D4F] hover:bg-[#256640] text-white font-extrabold text-lg shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
              >
                <CheckCircle2 className="w-6 h-6" />
                <span>I'M OKAY</span>
              </button>

              <button
                onClick={handleCallForHelp}
                className="w-full py-4 rounded-2xl bg-[#B3261E] hover:bg-red-800 text-white font-extrabold text-lg shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
              >
                <PhoneCall className="w-6 h-6" />
                <span>CALL FOR HELP</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 2: USER SELECTED "I'M OKAY" -> SUCCESS CANCELLATION STATE */}
        {resolutionState === 'CANCELLED_SAFE' && (
          <div className="space-y-4 py-3">
            <div className="w-16 h-16 rounded-full bg-[#2E7D4F]/15 text-[#2E7D4F] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-[#2E7D4F]">Alert cancelled</h3>
              <p className="text-base font-bold text-slate-800 mt-1">Glad you're safe.</p>
              <p className="text-xs text-slate-500 mt-1">
                Countdown stopped and escalation cancelled. Your AI wellness status has been set to SAFE.
              </p>
            </div>

            <button
              onClick={() => {
                setActiveModal('none');
                setActiveView('dashboard');
              }}
              className="w-full py-4 rounded-2xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Home</span>
            </button>
          </div>
        )}

        {/* STATE 3: USER SELECTED "CALL FOR HELP" OR TIMEOUT -> PROTOTYPE EMERGENCY SIMULATION */}
        {resolutionState === 'HELP_REQUESTED' && (
          <div className="space-y-4 text-left">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-full bg-[#B3261E]/15 text-[#B3261E] mx-auto flex items-center justify-center">
                <PhoneCall className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-[#B3261E] pt-1">
                Emergency assistance requested.
              </h3>
              <p className="text-xs text-slate-600">
                Simulated alert prepared for your designated emergency contact.
              </p>
            </div>

            {/* Emergency Contact Information Card */}
            <div className="p-4 rounded-2xl bg-[#F3F7FA] border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-extrabold uppercase tracking-wider text-[#0F5C7A]">
                  Emergency Contact Details
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                  SIMULATED ALERT
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-800">
                <User className="w-4 h-4 text-[#0F5C7A] shrink-0" />
                <span>
                  <strong>{patient.emergencyContact.name}</strong> ({patient.emergencyContact.relationship})
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-800">
                <PhoneCall className="w-4 h-4 text-[#2E7D4F] shrink-0" />
                <span className="font-mono font-bold">{patient.emergencyContact.phone}</span>
              </div>

              {patient.emergencyContact.address && (
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{patient.emergencyContact.address}</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium text-center">
              <strong>Prototype emergency simulation:</strong> No real emergency services or external responders are automatically contacted in this hackathon demonstration.
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setCountdown(10);
                  setResolutionState('COUNTDOWN');
                }}
                className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Restart 10s Demo
              </button>
              <button
                onClick={() => {
                  setActiveModal('none');
                  setActiveView('dashboard');
                }}
                className="py-3 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-bold text-xs cursor-pointer"
              >
                Return to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
