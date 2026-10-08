import React, { useEffect } from 'react';
import {
  Bell,
  PhoneCall,
  Pill,
  Calendar,
  AlertTriangle,
  ShoppingBag,
  X,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NotificationCenterModal: React.FC = () => {
  const {
    notifications,
    markNotificationsRead,
    setActiveModal,
    setActiveView,
    startMorningCheckIn
  } = useApp();

  useEffect(() => {
    markNotificationsRead();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'CHECKIN':
        return <PhoneCall className="w-4 h-4 text-[#0F5C7A]" />;
      case 'MEDICATION':
        return <Pill className="w-4 h-4 text-[#2E7D4F]" />;
      case 'APPOINTMENT':
        return <Calendar className="w-4 h-4 text-[#0F5C7A]" />;
      case 'EMERGENCY':
        return <AlertTriangle className="w-4 h-4 text-[#B3261E]" />;
      case 'REFILL':
        return <ShoppingBag className="w-4 h-4 text-amber-700" />;
      default:
        return <Bell className="w-4 h-4 text-[#0F5C7A]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 text-slate-900 shadow-2xl space-y-4 max-h-[82vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F5C7A]/10 text-[#0F5C7A] flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Notification Center</h3>
              <p className="text-xs text-slate-500">
                Check-ins, medication reminders, appointments & refills
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                setActiveModal('none');
                if (notif.actionModal) {
                  setActiveModal(notif.actionModal);
                } else if (notif.actionView === 'call') {
                  startMorningCheckIn();
                } else if (notif.actionView) {
                  setActiveView(notif.actionView);
                }
              }}
              className="p-3.5 rounded-2xl bg-[#F3F7FA] hover:bg-sky-50/70 border border-slate-200/80 flex items-start gap-3 cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold text-slate-900 truncate">
                    {notif.title}
                  </h4>
                  <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                    {notif.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setActiveModal('none')}
          className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-[#2E7D4F]" />
          <span>Done</span>
        </button>
      </div>
    </div>
  );
};
