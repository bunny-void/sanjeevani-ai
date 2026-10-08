import React, { useState } from 'react';
import {
  Calendar,
  FileText,
  Pill,
  Stethoscope,
  Syringe,
  HeartPulse,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  TIMELINE_FILTERS,
  filterTimelineEvents
} from '../services/healthTimelineService';
import { HealthTimelineEvent, TimelineFilterId } from '../types';
import { SanjeevaniCopilotIcon } from './SanjeevaniIcons';

const SAMPLE_TIMELINE_QUESTIONS = [
  'What happened in my health records recently?',
  'When was my last blood test?',
  'What medicines were added after my latest prescription?',
  'What was my most recent vaccination?'
];

export const HealthTimelineSection: React.FC = () => {
  const {
    unifiedHealthProfile,
    medicalReports,
    setSelectedReportCategory,
    setActiveView,
    openCopilotWithQuestion,
    openCopilotWithReport
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<TimelineFilterId>('ALL');

  const filteredEvents = filterTimelineEvents(unifiedHealthProfile.timeline, activeFilter);

  const getEventIcon = (kind: HealthTimelineEvent['kind']) => {
    switch (kind) {
      case 'PRESCRIPTION':
      case 'MEDICINE':
        return <Pill className="w-4 h-4 text-[#0F5C7A]" />;
      case 'APPOINTMENT':
        return <Stethoscope className="w-4 h-4 text-[#2E7D4F]" />;
      case 'VACCINATION':
        return <Syringe className="w-4 h-4 text-[#0F5C7A]" />;
      case 'WELLNESS_CHECKIN':
        return <HeartPulse className="w-4 h-4 text-[#2E7D4F]" />;
      case 'BLOOD_TEST':
      case 'DISCHARGE_SUMMARY':
      case 'XRAY':
      case 'SCANNING':
      case 'MEDICAL_HISTORY':
      default:
        return <FileText className="w-4 h-4 text-[#0F5C7A]" />;
    }
  };

  const getBadgeStyle = (tone: NonNullable<HealthTimelineEvent['statusBadge']>['tone']) => {
    switch (tone) {
      case 'normal':
        return 'bg-[#2E7D4F]/15 text-[#2E7D4F] border-[#2E7D4F]/30';
      case 'warning':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'critical':
        return 'bg-rose-100 text-[#B3261E] border-rose-300';
      case 'info':
      default:
        return 'bg-sky-50 text-[#0F5C7A] border-sky-200';
    }
  };

  const handleAskAiForEvent = (ev: HealthTimelineEvent) => {
    if (ev.sourceReportId) {
      const targetReport = medicalReports.find((r) => r.id === ev.sourceReportId);
      if (targetReport) {
        openCopilotWithReport(targetReport);
        return;
      }
    }
    openCopilotWithQuestion(
      `Explain my ${ev.typeLabel.toLowerCase()} "${ev.title}" from ${ev.displayDate}.`
    );
  };

  const handleOpenSourceView = (ev: HealthTimelineEvent) => {
    if (ev.sourceReportId) {
      const targetReport = medicalReports.find((r) => r.id === ev.sourceReportId);
      if (targetReport) {
        setSelectedReportCategory(targetReport.category);
        setActiveView('reports');
        return;
      }
    }
    if (ev.kind === 'APPOINTMENT') {
      setActiveView('appointments');
    } else if (ev.kind === 'MEDICINE') {
      setActiveView('medications');
    } else if (ev.kind === 'WELLNESS_CHECKIN') {
      setActiveView('history');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F5C7A] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            CHRONOLOGICAL HEALTH RECORD
          </span>
          <h3 className="text-base font-extrabold text-slate-900 mt-0.5 tracking-tight">
            MY HEALTH TIMELINE
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified chronological view of reports, prescriptions, lab values, diagnoses, vaccinations, appointments, medicines & AI check-ins
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-[#F3F7FA] border border-slate-200 text-[11px] font-extrabold text-slate-700">
          {filteredEvents.length} {filteredEvents.length === 1 ? 'Record' : 'Records'}
        </span>
      </div>

      {/* Quick Timeline Copilot Prompts */}
      <div className="bg-[#F3F7FA] rounded-xl p-3 border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F5C7A] flex items-center gap-1.5">
            <SanjeevaniCopilotIcon className="w-3.5 h-3.5" />
            Ask AI Copilot About Your Timeline
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_TIMELINE_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => openCopilotWithQuestion(q)}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-slate-800 hover:text-[#0F5C7A] border border-slate-200/90 text-[11px] font-bold transition-colors cursor-pointer text-left"
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* 6 Required Filter Pills: All | Reports | Medicines | Appointments | Vaccinations | Wellness */}
      <div
        role="tablist"
        aria-label="Health Timeline Filters"
        className="flex items-center gap-1.5 overflow-x-auto pb-1"
      >
        {TIMELINE_FILTERS.map((f) => {
          const count = filterTimelineEvents(unifiedHealthProfile.timeline, f.id).length;
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap border transition-colors cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#0F5C7A] text-white border-[#0F5C7A] shadow-2xs'
                  : 'bg-[#F3F7FA] text-slate-700 border-slate-200 hover:bg-slate-200/70'
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Chronological Timeline Stream */}
      {filteredEvents.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#F3F7FA] border border-slate-200/80 text-center text-xs text-slate-500">
          No records match the selected "{activeFilter}" filter yet.
        </div>
      ) : (
        <div className="relative pl-4 sm:pl-5 border-l-2 border-[#0F5C7A]/25 space-y-3.5">
          {filteredEvents.map((ev) => (
            <div key={ev.id} className="relative group">
              {/* Timeline node dot */}
              <div className="absolute -left-[23px] sm:-left-[27px] top-3 w-3.5 h-3.5 rounded-full bg-white border-[3px] border-[#0F5C7A] shadow-2xs" />

              <div className="rounded-2xl bg-[#F3F7FA] border border-slate-200/90 p-3.5 space-y-2.5 text-xs hover:border-[#0F5C7A]/40 transition-colors">
                {/* Date + Type Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200/90 shadow-2xs">
                      {ev.displayDate}
                    </span>

                    <span className="inline-flex items-center gap-1.5 font-extrabold text-[#0F5C7A] uppercase tracking-wider text-[10px]">
                      {getEventIcon(ev.kind)}
                      <span>{ev.typeLabel}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {ev.hasAiSummary && (
                      <span className="px-2 py-0.5 rounded-full bg-sky-50 text-[#0F5C7A] border border-sky-200 text-[10px] font-extrabold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Summary Available</span>
                      </span>
                    )}

                    {ev.statusBadge && !ev.statusBadge.label.includes('AI Summary Available') && (
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${getBadgeStyle(
                          ev.statusBadge.tone
                        )}`}
                      >
                        {ev.statusBadge.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Provider/Subtitle */}
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">{ev.title}</h4>
                  {ev.subtitle && (
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      {ev.subtitle}
                    </p>
                  )}
                </div>

                {/* Explicitly Stated Diagnoses (if any) */}
                {ev.explicitDiagnoses && ev.explicitDiagnoses.length > 0 && (
                  <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F5C7A] block">
                      Diagnoses Explicitly Stated in Document
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ev.explicitDiagnoses.map((diag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-[#F3F7FA] border border-slate-200 text-slate-800 font-bold text-[11px]"
                        >
                          {diag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Structured Highlights (Medicines, Lab Values, Vaccine Dose, Appointment Info) */}
                {ev.highlights.length > 0 && (
                  <div className="space-y-1">
                    {ev.highlights.map((item, idx) => {
                      const isHighOrLow =
                        /\((HIGH|LOW)\)/i.test(item) || item.includes('Out-of-Range');
                      const isNormal = /\(NORMAL\)/i.test(item);
                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-slate-800 font-semibold leading-relaxed"
                        >
                          {isHighOrLow ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          ) : isNormal ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D4F] shrink-0 mt-0.5" />
                          ) : (
                            <span className="text-[#0F5C7A] font-extrabold">•</span>
                          )}
                          <span>{item}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Actions Footer */}
                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenSourceView(ev)}
                    className="text-[11px] font-bold text-slate-600 hover:text-[#0F5C7A] flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>
                      {ev.sourceReportId
                        ? 'Open in Reports'
                        : ev.kind === 'APPOINTMENT'
                          ? 'View Appointments'
                          : ev.kind === 'MEDICINE'
                            ? 'View Medicines'
                            : 'View Check-ins'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAskAiForEvent(ev)}
                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#0F5C7A] text-[#0F5C7A] hover:text-white border border-slate-200/90 font-extrabold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <SanjeevaniCopilotIcon className="w-3 h-3" />
                    <span>Ask AI</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
