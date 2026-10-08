import React, { useState } from 'react';
import { Sparkles, PhoneCall, ShieldCheck, AlertCircle, AlertTriangle, Pill, ShoppingBag, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DemoPanel: React.FC = () => {
  const {
    startMorningCheckIn,
    setPrototypeState,
    addCheckInLog,
    setActiveModal,
    setSelectedRefillMedicine,
    setTargetMedication,
    setMedicationReminderStage,
    resetDemoState,
    medications,
    patient
  } = useApp();

  const [isOpen, setIsOpen] = useState(true);

  const simulateSafe = () => {
    addCheckInLog({
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: '00:32',
      patientResponse: "I'm feeling good today.",
      classification: 'SAFE',
      videoEnabled: patient.enableVideo,
      finalStatus: 'SAFE',
      summary: 'Simulated SAFE check-in completed.'
    });
    setPrototypeState('SAFE');
  };

  const simulateNotOk = () => {
    addCheckInLog({
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: '01:05',
      patientResponse: "I'm not feeling well, I feel weak and dizzy.",
      classification: 'NOT_OK',
      videoEnabled: patient.enableVideo,
      finalStatus: 'MONITORING',
      summary: 'Patient reported weakness and mild dizziness. Caregiver notified.'
    });
    setPrototypeState('NOT_OK');
  };

  const simulateCritical = () => {
    setActiveModal('emergency_countdown');
  };

  const simulateRefill = () => {
    const med = medications[0];
    setSelectedRefillMedicine(med);
    setActiveModal('pharmacy_handoff');
  };

  const simulateMedReminder = () => {
    setTargetMedication(medications[0]);
    setMedicationReminderStage(1);
    setActiveModal('medication_reminder');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl">
      {/* Header bar */}
      <div
        className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between cursor-pointer border-b border-slate-800/60"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Hackathon Judge Demo Control Panel
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
            One-Click Journey Testing
          </span>
        </div>

        <button className="text-slate-400 hover:text-white p-1">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Control Buttons */}
      {isOpen && (
        <div className="max-w-6xl mx-auto p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          <button
            onClick={startMorningCheckIn}
            className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer truncate"
          >
            <PhoneCall className="w-3.5 h-3.5 fill-slate-950" />
            <span>Morning Voice Call</span>
          </button>

          <button
            onClick={simulateSafe}
            className="p-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold border border-emerald-500/40 flex items-center justify-center gap-1.5 cursor-pointer truncate"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Simulate SAFE</span>
          </button>

          <button
            onClick={simulateNotOk}
            className="p-2.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold border border-amber-500/40 flex items-center justify-center gap-1.5 cursor-pointer truncate"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Simulate NOT OK</span>
          </button>

          <button
            onClick={simulateCritical}
            className="p-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold border border-rose-500/40 flex items-center justify-center gap-1.5 cursor-pointer truncate"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Simulate CRITICAL</span>
          </button>

          <button
            onClick={simulateRefill}
            className="p-2.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 font-bold border border-indigo-500/40 flex items-center justify-center gap-1.5 cursor-pointer truncate"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Refill / Pharmacy</span>
          </button>

          <button
            onClick={resetDemoState}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer truncate"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      )}
    </div>
  );
};
