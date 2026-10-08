import React, { useState } from 'react';
import {
  History,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HealthTimelineSection } from './HealthTimelineSection';

export const HistoryView: React.FC = () => {
  const { checkInLogs, emergencyLogs, pharmacyOrders, unifiedHealthProfile } = useApp();
  const [activeTab, setActiveTab] = useState<'timeline' | 'checkins' | 'emergencies' | 'orders'>(
    'timeline'
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SAFE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-extrabold text-[11px] bg-[#2E7D4F]/15 text-[#2E7D4F] border border-[#2E7D4F]/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            SAFE
          </span>
        );
      case 'NOT_OK':
      case 'MONITORING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-extrabold text-[11px] bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5" />
            NOT OK
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-extrabold text-[11px] bg-[#B3261E]/15 text-[#B3261E] border border-[#B3261E]/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            CRITICAL
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0F5C7A]/10 text-[#0F5C7A] flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              My Health Timeline & History
            </h2>
            <p className="text-xs text-slate-500">
              Unified chronological health timeline, AI wellness check-ins, safety logs & refills
            </p>
          </div>
        </div>

        {/* Clean Filter Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[#F3F7FA] p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-2 px-2 rounded-lg font-extrabold transition-colors cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-[#0F5C7A] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Health Timeline ({unifiedHealthProfile.timeline.length})
          </button>
          <button
            onClick={() => setActiveTab('checkins')}
            className={`py-2 px-2 rounded-lg font-bold transition-colors cursor-pointer ${
              activeTab === 'checkins'
                ? 'bg-[#0F5C7A] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Check-Ins ({checkInLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('emergencies')}
            className={`py-2 px-2 rounded-lg font-bold transition-colors cursor-pointer ${
              activeTab === 'emergencies'
                ? 'bg-[#B3261E] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Safety Logs ({emergencyLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-2 rounded-lg font-bold transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#2E7D4F] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Refills ({pharmacyOrders.length})
          </button>
        </div>
      </div>

      {/* UNIFIED HEALTH TIMELINE */}
      {activeTab === 'timeline' && <HealthTimelineSection />}

      {/* CHECK-IN LOGS */}
      {activeTab === 'checkins' && (
        <div className="space-y-3">
          {checkInLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#0F5C7A]" />
                    {log.date || 'October 7'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {log.timestamp}
                  </span>
                </div>

                {getStatusBadge(log.classification)}
              </div>

              <p className="text-slate-800 font-semibold leading-relaxed">{log.summary}</p>

              {log.patientResponse && (
                <div className="p-2.5 rounded-xl bg-[#F3F7FA] border border-slate-200/70 text-slate-600">
                  <span className="font-bold text-slate-700">Spoken response: </span>"
                  {log.patientResponse}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* EMERGENCY SIMULATION LOGS */}
      {activeTab === 'emergencies' && (
        <div className="space-y-3">
          {emergencyLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 text-xs">
              No emergency countdown simulations triggered in this session yet.
            </div>
          ) : (
            emergencyLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-white border border-[#B3261E]/30 shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{log.timestamp}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#B3261E]/10 text-[#B3261E] font-extrabold text-[10px]">
                    {log.countdownResult}
                  </span>
                </div>
                <p className="text-slate-700">
                  <strong>Outcome:</strong> {log.verificationResult}
                </p>
                <p className="text-slate-500">
                  <strong>User Action:</strong> {log.patientResponse}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* PHARMACY REFILL LOGS */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {pharmacyOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 text-xs">
              No pharmacy refill orders logged in this session yet.
            </div>
          ) : (
            pharmacyOrders.map((ord) => (
              <div
                key={ord.orderId}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">{ord.medicineName}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#2E7D4F]/15 text-[#2E7D4F] font-bold text-[10px]">
                    Refill Logged
                  </span>
                </div>
                <p className="text-slate-600">
                  {ord.quantity} • {ord.pharmacy} ({ord.orderId})
                </p>
                <p className="text-slate-400 text-[11px]">{ord.orderDate}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
