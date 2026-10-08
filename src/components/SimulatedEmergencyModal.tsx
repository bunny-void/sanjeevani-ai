import React from 'react';
import { AlertOctagon, CheckCircle2, MapPin, Phone, UserCheck, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SimulatedEmergencyModal: React.FC = () => {
  const { patient, setActiveModal, setActiveView } = useApp();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 text-white shadow-2xl space-y-4 relative overflow-hidden">
        {/* Top Emergency Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Emergency Header */}
        <div className="text-center space-y-2 border-b border-slate-800 pb-4">
          <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 mx-auto flex items-center justify-center animate-pulse">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-white uppercase tracking-tight">
            EMERGENCY RESPONSE ACTIVATED
          </h3>
          <span className="inline-block px-3 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 text-xs font-bold uppercase tracking-wider">
            DEMO / SIMULATED PAYLOAD
          </span>
        </div>

        {/* Simulated Telemetry Payload Cards */}
        <div className="space-y-2.5 text-xs">
          {/* Patient Card */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400 font-semibold">Patient:</span>
              <strong className="text-slate-100">{patient.name} ({patient.age}y)</strong>
            </div>
            <span className="text-slate-400 font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Situation & Verification Result */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Detected Situation:</span>
              <strong className="text-rose-400">Critical Patient Response Signal</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Verification Result:</span>
              <strong className="text-emerald-400">Escalation Confirmed</strong>
            </div>
          </div>

          {/* Simulated Location */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 font-semibold block">Simulated GPS Location:</span>
              <p className="text-slate-200 font-mono mt-0.5">37.7749° N, 122.4194° W — 123 Health Ave, Apt 4B</p>
            </div>
          </div>

          {/* Simulated Contact Notification */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 font-semibold block">Simulated Contact Notification:</span>
              <p className="text-slate-200 mt-0.5">
                {patient.emergencyContact.name} ({patient.emergencyContact.relationship}) — {patient.emergencyContact.phone}
              </p>
            </div>
          </div>
        </div>

        {/* Mandatory Demo Badges */}
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] space-y-1 font-mono">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Emergency service request simulated.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Emergency contact notification simulated.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Location sharing simulated.</span>
          </div>
        </div>

        {/* Return Button */}
        <button
          onClick={() => {
            setActiveModal('none');
            setActiveView('dashboard');
          }}
          className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Acknowledge & Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
