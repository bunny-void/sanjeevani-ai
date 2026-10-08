import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { VoiceCallView } from './components/VoiceCallView';
import { MedicationView } from './components/MedicationView';
import { AppointmentView } from './components/AppointmentView';
import { MedicalReportsView } from './components/MedicalReportsView';
import { DemoCenterView } from './components/DemoCenterView';
import { ShockIdentifierView } from './components/ShockIdentifierView';
import { OnboardingView } from './components/OnboardingView';
import { ProfileView } from './components/ProfileView';
import { HistoryView } from './components/HistoryView';
import { MedicalCopilotView } from './components/MedicalCopilotView';
import { EmergencyCountdownOverlay } from './components/EmergencyCountdownOverlay';
import { EmergencyVerificationScreen } from './components/EmergencyVerificationScreen';
import { SimulatedEmergencyModal } from './components/SimulatedEmergencyModal';
import { MedicationReminderModal } from './components/MedicationReminderModal';
import { AppointmentReminderModal } from './components/AppointmentReminderModal';
import { SanjeevaniPharmacyModal } from './components/SanjeevaniPharmacyModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { SanjeevaniCopilotIcon } from './components/SanjeevaniIcons';
import {
  Home,
  Pill,
  FileText,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    activeView,
    setActiveView,
    activeModal,
    mobileFrame,
    toastMessage,
    openCopilotWithQuestion,
    appLanguage
  } = useApp();

  const renderActiveScreen = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'call':
        return <VoiceCallView />;
      case 'medications':
        return <MedicationView />;
      case 'appointments':
        return <AppointmentView />;
      case 'reports':
        return <MedicalReportsView />;
      case 'demo_center':
        return <DemoCenterView />;
      case 'shock_identifier':
        return <ShockIdentifierView />;
      case 'onboarding':
        return <OnboardingView />;
      case 'profile':
        return <ProfileView />;
      case 'history':
        return <HistoryView />;
      case 'copilot':
        return <MedicalCopilotView />;
      default:
        return <DashboardView />;
    }
  };

  /* Final Bottom Navigation with EXACTLY 5 destinations:
     [ Home ] [ Medicines ] [ AI Copilot ] [ Reports ] [ Demo ] */
  const renderBottomNav = () => (
    <nav
      aria-label="Primary Bottom Navigation"
      className="bg-white border-t border-slate-200 px-2 py-2 grid grid-cols-5 items-center text-[11px] font-semibold text-slate-500 relative shrink-0"
    >
      {/* 1. HOME */}
      <button
        onClick={() => setActiveView('dashboard')}
        className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-colors cursor-pointer ${
          activeView === 'dashboard'
            ? 'text-[#0F5C7A] font-extrabold bg-[#0F5C7A]/8'
            : 'hover:text-slate-900'
        }`}
      >
        <Home className="w-5 h-5" />
        <span>{appLanguage === 'Telugu' ? 'హోమ్' : 'Home'}</span>
      </button>

      {/* 2. MEDICINES */}
      <button
        onClick={() => setActiveView('medications')}
        className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-colors cursor-pointer ${
          activeView === 'medications'
            ? 'text-[#0F5C7A] font-extrabold bg-[#0F5C7A]/8'
            : 'hover:text-slate-900'
        }`}
      >
        <Pill className="w-5 h-5" />
        <span>{appLanguage === 'Telugu' ? 'మందులు' : 'Medicines'}</span>
      </button>

      {/* 3. AI COPILOT (Center Primary AI Intelligence Action) */}
      <div className="flex flex-col items-center justify-center">
        <button
          onClick={() => openCopilotWithQuestion()}
          className={`-mt-6 flex flex-col items-center justify-center w-14 h-14 rounded-full text-white shadow-lg border-4 border-white transition-transform active:scale-95 cursor-pointer ${
            activeView === 'copilot'
              ? 'bg-[#2E7D4F] shadow-[#2E7D4F]/35'
              : 'bg-[#0F5C7A] hover:bg-[#0A4359] shadow-[#0F5C7A]/35'
          }`}
          title="Open Sanjeevani Medical AI Copilot"
          aria-label="AI Copilot"
        >
          <SanjeevaniCopilotIcon className="w-6 h-6" />
        </button>
        <span
          onClick={() => openCopilotWithQuestion()}
          className={`text-[10px] mt-0.5 cursor-pointer ${
            activeView === 'copilot'
              ? 'text-[#0F5C7A] font-extrabold'
              : 'text-slate-600 font-bold'
          }`}
        >
          {appLanguage === 'Telugu' ? 'AI కోపైలట్' : 'AI Copilot'}
        </span>
      </div>

      {/* 4. REPORTS */}
      <button
        onClick={() => setActiveView('reports')}
        className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-colors cursor-pointer ${
          activeView === 'reports'
            ? 'text-[#0F5C7A] font-extrabold bg-[#0F5C7A]/8'
            : 'hover:text-slate-900'
        }`}
      >
        <FileText className="w-5 h-5" />
        <span>{appLanguage === 'Telugu' ? 'రిపోర్టులు' : 'Reports'}</span>
      </button>

      {/* 5. DEMO */}
      <button
        onClick={() => setActiveView('demo_center')}
        className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-colors cursor-pointer ${
          activeView === 'demo_center'
            ? 'text-[#0F5C7A] font-extrabold bg-[#0F5C7A]/8'
            : 'hover:text-slate-900'
        }`}
      >
        <Sparkles className="w-5 h-5" />
        <span>{appLanguage === 'Telugu' ? 'డెమో' : 'Demo'}</span>
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#F3F7FA] text-slate-900 flex flex-col font-sans">
      <Header />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#2E7D4F] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Layout — Responsive Mobile-First Shell */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
        {mobileFrame ? (
          <div className="max-w-[440px] mx-auto bg-[#F3F7FA] sm:border-[6px] sm:border-slate-800 sm:rounded-[40px] sm:shadow-xl overflow-hidden flex flex-col min-h-[calc(100vh-96px)] sm:h-[780px]">
            <div className="hidden sm:flex items-center justify-center py-2 bg-white border-b border-slate-100 shrink-0">
              <div className="w-24 h-1.5 bg-slate-300 rounded-full" />
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4">
              {renderActiveScreen()}
            </div>

            {renderBottomNav()}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto bg-[#F3F7FA] rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[700px]">
            <div className="flex-1 p-4 sm:p-6">{renderActiveScreen()}</div>
            {renderBottomNav()}
          </div>
        )}
      </main>

      {/* Active Modals */}
      {activeModal === 'emergency_countdown' && <EmergencyCountdownOverlay />}
      {activeModal === 'emergency_verification' && <EmergencyVerificationScreen />}
      {activeModal === 'simulated_emergency' && <SimulatedEmergencyModal />}
      {activeModal === 'medication_reminder' && <MedicationReminderModal />}
      {activeModal === 'appointment_reminder' && <AppointmentReminderModal />}
      {activeModal === 'pharmacy_handoff' && <SanjeevaniPharmacyModal />}
      {activeModal === 'notifications' && <NotificationCenterModal />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
