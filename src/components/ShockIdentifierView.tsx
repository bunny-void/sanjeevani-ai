import React from 'react';
import {
  Zap,
  Watch,
  Activity,
  Smartphone,
  ShieldCheck,
  Info,
  ArrowLeft,
  Radio
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ShockIdentifierView: React.FC = () => {
  const { setActiveView } = useApp();

  return (
    <div className="space-y-4 pb-8">
      {/* Main Feature Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>

          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold uppercase tracking-wider">
            COMING IN FUTURE VERSION
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            SHOCK IDENTIFIER
          </h2>
          <p className="text-sm font-semibold text-slate-700 leading-relaxed">
            AI-assisted emergency event detection using future sensor and device signals.
          </p>
        </div>

        {/* Conceptual Future Hardware / Sensor Signals Preview */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F5C7A]">
            Planned Future Sensor & Device Signal Integration (Roadmap Concept)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-[#F3F7FA] border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 font-extrabold text-slate-900">
                <Watch className="w-4 h-4 text-[#0F5C7A]" />
                <span>Wearable Biometrics</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Future opt-in smartwatch optical pulse and skin temperature trend signals.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F3F7FA] border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 font-extrabold text-slate-900">
                <Smartphone className="w-4 h-4 text-[#0F5C7A]" />
                <span>Inertial Motion Signals</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Future accelerometer & gyroscope sudden-impact verification prompts.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F3F7FA] border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 font-extrabold text-slate-900">
                <Radio className="w-4 h-4 text-[#0F5C7A]" />
                <span>Ambient Voice Check</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Immediate hands-free AI voice safety verification when anomalous device movement occurs.
              </p>
            </div>
          </div>
        </div>

        {/* Responsible AI Roadmap Disclosure */}
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-slate-700 space-y-1.5">
          <div className="flex items-center gap-1.5 font-extrabold text-[#0F5C7A]">
            <ShieldCheck className="w-4 h-4" />
            <span>Responsible AI & Scope Transparency</span>
          </div>
          <p className="leading-relaxed">
            <strong>Shock Identifier</strong> is a future roadmap concept preview only. This Round-1 hackathon prototype does not claim to detect or diagnose medical emergencies, cardiovascular events, neurological events, or physical trauma.
          </p>
        </div>

        <button
          onClick={() => setActiveView('demo_center')}
          className="w-full py-3.5 rounded-2xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Demo Center</span>
        </button>
      </div>
    </div>
  );
};
