import React from 'react';
import {
  Newspaper,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  Clock,
  Info,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const HealthNewsView: React.FC = () => {
  const { healthNews, setActiveView } = useApp();

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0F5C7A]/10 text-[#0F5C7A] flex items-center justify-center shrink-0">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">Latest Health News</h2>
              <span className="px-2 py-0.5 rounded-full bg-sky-50 text-[#0F5C7A] border border-sky-200 text-[10px] font-extrabold uppercase">
                Sample / Demo Educational Content
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Curated health & disease awareness guides for older adults and caregivers
            </p>
          </div>
        </div>
      </div>

      {/* Educational Disclaimer */}
      <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-slate-700 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#0F5C7A] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#0F5C7A] block">
            Educational Reference Only — Not Personalized Medical Diagnosis
          </strong>
          <span>
            These sample educational summaries are provided for general awareness in the hackathon prototype and do not constitute clinical advice.
          </span>
        </div>
      </div>

      {/* Health Cards */}
      <div className="space-y-3.5">
        {healthNews.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3.5 text-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-[#0F5C7A]/10 text-[#0F5C7A] font-extrabold text-[11px]">
                {item.category}
              </span>
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {item.readTime}
              </span>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">{item.topic}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {item.shortDescription}
              </p>
            </div>

            {/* Common Symptoms */}
            <div className="p-3.5 rounded-2xl bg-[#F3F7FA] border border-slate-200/80 space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Common Symptoms to Know
              </span>
              <ul className="space-y-1 text-slate-700 pl-1">
                {item.commonSymptoms.map((sym, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5C7A] shrink-0 mt-0.5" />
                    <span>{sym}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* When Professional Medical Help May Be Appropriate */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-[#2E7D4F]/25 space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2E7D4F] flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5" />
                When Professional Medical Help May Be Appropriate
              </span>
              <p className="text-slate-700 leading-relaxed">{item.whenToSeekHelp}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setActiveView('dashboard')}
        className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home Dashboard</span>
      </button>
    </div>
  );
};
