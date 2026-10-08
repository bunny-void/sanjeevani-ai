import React from 'react';
import { Bell, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SanjeevaniCopilotIcon } from './SanjeevaniIcons';

export const Header: React.FC = () => {
  const {
    patient,
    activeView,
    setActiveView,
    setActiveModal,
    notifications,
    openCopilotWithQuestion,
    appLanguage,
    setAppLanguage
  } = useApp();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs">
      {/* Compact Prototype Disclaimer Strip */}
      <div className="bg-[#0F5C7A] text-white py-1 px-3 text-center text-[10px] font-medium flex items-center justify-center gap-1.5">
        <Info className="w-3 h-3 text-sky-200 shrink-0" />
        <span className="truncate">
          {appLanguage === 'Telugu'
            ? 'డెమో ప్రోటోటైప్ మాత్రమే. ఇది వైద్య నిర్ధారణ లేదా అత్యవసర సేవలకు ప్రత్యామ్నాయం కాదు.'
            : 'Prototype for demonstration purposes. Not a medical diagnosis or emergency response service.'}
        </span>
      </div>

      {/* Professional Mobile App Bar: Minimal Left | Centered "Sanjeevani AI" | Language + Avatar Right */}
      <div className="max-w-[440px] mx-auto px-4 h-14 grid grid-cols-3 items-center">
        {/* LEFT: Visually minimal notification + AI Copilot icons */}
        <div className="flex items-center justify-start gap-1">
          <button
            onClick={() => setActiveModal('notifications')}
            className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            aria-label="Open Notifications"
            title={appLanguage === 'Telugu' ? 'నోటిఫికేషన్లు' : 'Notifications'}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B3261E]" />
            )}
          </button>

          <button
            onClick={() => openCopilotWithQuestion()}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              activeView === 'copilot'
                ? 'bg-[#0F5C7A] text-white'
                : 'hover:bg-sky-50 text-[#0F5C7A]'
            }`}
            aria-label="Open Sanjeevani Medical AI Copilot"
            title={appLanguage === 'Telugu' ? 'మెడికల్ AI కోపైలట్' : 'Medical AI Copilot'}
          >
            <SanjeevaniCopilotIcon className="w-4 h-4" />
          </button>
        </div>

        {/* CENTER: Horizontally centered "Sanjeevani AI" */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#2E7D4F]" />
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
              {appLanguage === 'Telugu' ? 'సంజీవని AI' : 'Sanjeevani AI'}
            </h1>
          </button>
        </div>

        {/* RIGHT: Language Selector (English | తెలుగు) + Small circular profile picture/avatar */}
        <div className="flex items-center justify-end gap-1.5">
          <div
            role="group"
            aria-label="Language Selector"
            className="inline-flex items-center bg-slate-100 border border-slate-200 rounded-full p-0.5 text-[10px] font-bold"
          >
            <button
              type="button"
              onClick={() => setAppLanguage('English')}
              className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                appLanguage === 'English'
                  ? 'bg-[#0F5C7A] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setAppLanguage('Telugu')}
              className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                appLanguage === 'Telugu'
                  ? 'bg-[#0F5C7A] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              తెలుగు
            </button>
          </div>

          <button
            onClick={() => setActiveView('profile')}
            className="w-[34px] h-[34px] rounded-full bg-[#0F5C7A] hover:bg-[#0A4359] text-white text-xs font-extrabold flex items-center justify-center shadow-xs border-2 border-sky-100 transition-transform active:scale-95 cursor-pointer shrink-0"
            aria-label="Open Profile and Personal Health Setup"
            title={appLanguage === 'Telugu' ? 'ప్రొఫైల్ & ఆరోగ్య వివరాలు' : 'Profile & Personal Health Setup'}
          >
            {patient.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </button>
        </div>
      </div>
    </header>
  );
};
