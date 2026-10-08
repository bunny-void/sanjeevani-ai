import React, { useState } from 'react';
import {
  User,
  HeartPulse,
  ShieldCheck,
  Save,
  CheckCircle2,
  Mic,
  Bell,
  Lock,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  Pill,
  FileText,
  Stethoscope,
  Syringe,
  Calendar,
  Pencil
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LanguageOption } from '../types';
import { HealthTimelineSection } from './HealthTimelineSection';
import { SanjeevaniCopilotIcon } from './SanjeevaniIcons';

export const ProfileView: React.FC = () => {
  const {
    patient,
    setPatient,
    setActiveView,
    resetDemoState,
    showToast,
    unifiedHealthProfile,
    openCopilotWithQuestion
  } = useApp();

  const [activeProfileMode, setActiveProfileMode] = useState<'overview' | 'timeline' | 'edit'>(
    'overview'
  );
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: patient.name,
    age: patient.age,
    gender: patient.gender || 'Male',
    countryCode: patient.countryCode || '+1',
    phone: patient.phone,
    email: patient.email || 'alex.johnson@example.com',
    occupation: patient.occupation || 'Retired Civil Engineer',
    address: patient.address || '742 Evergreen Terrace, Apt 4B, Springfield',
    healthConditions: (
      patient.healthProfile?.currentHealthIssues ||
      patient.medicalConditions ||
      []
    ).join(', '),
    heartBpm: patient.healthProfile?.heartBpm || 72,
    bloodPressure: patient.healthProfile?.bloodPressure || '126/80 mmHg',
    bmi: patient.healthProfile?.bmi || 25.1,
    allergies: (patient.healthProfile?.allergies || ['Penicillin', 'Pollen']).join(', '),
    emergencyName: patient.emergencyContact.name,
    emergencyRel: patient.emergencyContact.relationship,
    emergencyPhone: patient.emergencyContact.phone,
    emergencyAddress: patient.emergencyContact.address || '18 Oakridge Lane, Springfield',
    checkInTime: patient.checkInTime || '9:00 AM',
    language: patient.language || 'English',
    notificationsEnabled: patient.notificationsEnabled ?? true,
    voicePermissionsGranted: patient.voicePermissionsGranted ?? true
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const issues = formData.healthConditions
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const allergies = formData.allergies
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setPatient((prev) => ({
      ...prev,
      name: formData.name,
      age: Number(formData.age),
      gender: formData.gender as any,
      countryCode: formData.countryCode,
      phone: formData.phone,
      email: formData.email,
      occupation: formData.occupation,
      address: formData.address,
      checkInTime: formData.checkInTime,
      language: formData.language as LanguageOption,
      notificationsEnabled: formData.notificationsEnabled,
      voicePermissionsGranted: formData.voicePermissionsGranted,
      medicalConditions: issues,
      healthProfile: {
        ...prev.healthProfile,
        currentHealthIssues: issues,
        heartBpm: Number(formData.heartBpm) || 72,
        bloodPressure: formData.bloodPressure,
        bmi: Number(formData.bmi) || 25.1,
        allergies
      },
      emergencyContact: {
        name: formData.emergencyName,
        relationship: formData.emergencyRel,
        phone: formData.emergencyPhone,
        address: formData.emergencyAddress
      }
    }));

    setSavedSuccess(true);
    showToast('Profile & personal health data updated');
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0F5C7A] text-white flex items-center justify-center font-extrabold text-sm shrink-0">
              {patient.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Unified Health Profile & Timeline
              </h2>
              <p className="text-xs text-slate-500">
                Centralized medical summary, chronological records & personal settings
              </p>
            </div>
          </div>

          <button
            onClick={() => openCopilotWithQuestion('What happened in my health records recently?')}
            className="px-3 py-2 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
          >
            <SanjeevaniCopilotIcon className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>
        </div>

        {/* Navigation Sub-tabs: Unified Profile | My Health Timeline | Edit Profile */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#F3F7FA] p-1 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveProfileMode('overview')}
            className={`py-2 rounded-lg font-extrabold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeProfileMode === 'overview'
                ? 'bg-[#0F5C7A] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Unified Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveProfileMode('timeline')}
            className={`py-2 rounded-lg font-extrabold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeProfileMode === 'timeline'
                ? 'bg-[#0F5C7A] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Health Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveProfileMode('edit')}
            className={`py-2 rounded-lg font-extrabold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeProfileMode === 'edit'
                ? 'bg-[#0F5C7A] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Settings</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-[#2E7D4F]/15 border border-[#2E7D4F]/30 text-[#2E7D4F] text-xs font-extrabold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Profile changes saved! Unified health profile updated.</span>
        </div>
      )}

      {/* =====================================================================
          MODE 1: UNIFIED HEALTH PROFILE OVERVIEW + EMBEDDED TIMELINE
         ===================================================================== */}
      {activeProfileMode === 'overview' && (
        <div className="space-y-4">
          {/* 1. PERSONAL INFORMATION & VITALS */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F5C7A] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                1. Personal Information
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#2E7D4F]/15 text-[#2E7D4F] text-[10px] font-extrabold">
                {unifiedHealthProfile.personalInfo.vitals.currentHealthStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#F3F7FA] border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-500 block">Full Name</span>
                <strong className="text-slate-900">{unifiedHealthProfile.personalInfo.name}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-500 block">ABHA ID <span className="text-indigo-400 font-medium">(Demo / Mock)</span></span>
                <strong className="text-indigo-900">{patient.abhaId || 'Not Setup'}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F3F7FA] border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-500 block">Age & Gender</span>
                <strong className="text-slate-900">
                  {unifiedHealthProfile.personalInfo.age} yrs •{' '}
                  {unifiedHealthProfile.personalInfo.gender}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F3F7FA] border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-500 block">Blood Pressure</span>
                <strong className="text-slate-900">
                  {unifiedHealthProfile.personalInfo.vitals.bloodPressure}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F3F7FA] border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-500 block">Heart Rate & BMI</span>
                <strong className="text-slate-900">
                  {unifiedHealthProfile.personalInfo.vitals.heartBpm} bpm • BMI{' '}
                  {unifiedHealthProfile.personalInfo.vitals.bmi}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F3F7FA] border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-500 block">Phone & Language</span>
                <strong className="text-slate-900">
                  {unifiedHealthProfile.personalInfo.phone} ({unifiedHealthProfile.personalInfo.language})
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F3F7FA] border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-500 block">Emergency Contact</span>
                <strong className="text-slate-900">
                  {unifiedHealthProfile.personalInfo.emergencyContact.name} (
                  {unifiedHealthProfile.personalInfo.emergencyContact.relationship})
                </strong>
              </div>
            </div>
          </div>

          {/* 2. HEALTH CONDITIONS EXPLICITLY RECORDED & 3. ALLERGIES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F5C7A] flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5" />
                2. Health Conditions Explicitly Recorded
              </span>

              <div className="space-y-1.5">
                {unifiedHealthProfile.explicitConditions.map((cond, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#F3F7FA] border border-slate-200/80 flex items-center justify-between gap-2"
                  >
                    <span className="font-extrabold text-slate-900">{cond.name}</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                      {cond.source}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#B3261E] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                3. Recorded Allergies
              </span>

              <div className="flex flex-wrap gap-2 pt-1">
                {unifiedHealthProfile.allergies.length === 0 ? (
                  <span className="text-slate-500">No known allergies recorded</span>
                ) : (
                  unifiedHealthProfile.allergies.map((allergy, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-[#B3261E] border border-rose-200 font-extrabold text-xs"
                    >
                      {allergy}
                    </span>
                  ))
                )}
              </div>

              <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                Verified across patient setup and Annual Clinical History Summary.
              </p>
            </div>
          </div>

          {/* 4. MEDICINES (Unified Schedule + Prescription Provenance) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F5C7A] flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5" />
                4. Active Medicines ({unifiedHealthProfile.medicines.length})
              </span>
              <button
                type="button"
                onClick={() => setActiveView('medications')}
                className="text-[11px] font-extrabold text-[#0F5C7A] hover:underline cursor-pointer"
              >
                Manage Schedule →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {unifiedHealthProfile.medicines.map((med) => (
                <div
                  key={med.id}
                  className="p-3 rounded-xl bg-[#F3F7FA] border border-slate-200/80 space-y-1"
                >
                  <div className="flex items-center justify-between gap-1">
                    <strong className="text-slate-900 font-extrabold">
                      {med.name} {med.dosage}
                    </strong>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[9px] font-extrabold text-[#0F5C7A]">
                      {med.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{med.schedule}</p>
                  {med.sourcePrescriptionDate && (
                    <p className="text-[10px] font-bold text-[#2E7D4F]">
                      Rx: {med.sourcePrescriptionDate}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 5. REPORTS, 6. APPOINTMENTS, 7. VACCINATIONS, 8. RECENT CHECK-INS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {/* 5. Reports Summary */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F5C7A] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  5. Medical Reports ({unifiedHealthProfile.reportsSummary.totalCount})
                </span>
                <button
                  type="button"
                  onClick={() => setActiveView('reports')}
                  className="text-[11px] font-extrabold text-[#0F5C7A] hover:underline cursor-pointer"
                >
                  Open Vault →
                </button>
              </div>

              {unifiedHealthProfile.reportsSummary.latestBloodTest && (
                <div className="p-2.5 rounded-xl bg-[#F3F7FA] border border-slate-200/80">
                  <span className="text-[10px] font-extrabold text-[#0F5C7A] uppercase block">
                    Latest Blood Test ({unifiedHealthProfile.reportsSummary.latestBloodTest.date})
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {unifiedHealthProfile.reportsSummary.latestBloodTest.title}
                  </p>
                </div>
              )}

              {unifiedHealthProfile.reportsSummary.latestPrescription && (
                <div className="p-2.5 rounded-xl bg-[#F3F7FA] border border-slate-200/80">
                  <span className="text-[10px] font-extrabold text-[#2E7D4F] uppercase block">
                    Latest Prescription ({unifiedHealthProfile.reportsSummary.latestPrescription.date})
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {unifiedHealthProfile.reportsSummary.latestPrescription.title}
                  </p>
                </div>
              )}
            </div>

            {/* 6. Appointments Summary */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2E7D4F] flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" />
                  6. Doctor Appointments ({unifiedHealthProfile.appointmentsSummary.all.length})
                </span>
                <button
                  type="button"
                  onClick={() => setActiveView('appointments')}
                  className="text-[11px] font-extrabold text-[#0F5C7A] hover:underline cursor-pointer"
                >
                  View All →
                </button>
              </div>

              <div className="space-y-1.5">
                {unifiedHealthProfile.appointmentsSummary.all.slice(0, 3).map((appt) => (
                  <div
                    key={appt.id}
                    className="p-2.5 rounded-xl bg-[#F3F7FA] border border-slate-200/80 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-extrabold text-slate-900">{appt.doctorName}</p>
                      <p className="text-[11px] text-slate-500">
                        {appt.date} • {appt.time}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[9px] font-extrabold text-slate-700">
                      {appt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. Vaccinations Summary */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F5C7A] flex items-center gap-1.5">
                <Syringe className="w-3.5 h-3.5" />
                7. Vaccinations ({unifiedHealthProfile.vaccinations.length})
              </span>

              <div className="space-y-1.5">
                {unifiedHealthProfile.vaccinations.slice(0, 3).map((vac) => (
                  <div
                    key={vac.id}
                    className="p-2.5 rounded-xl bg-[#F3F7FA] border border-slate-200/80 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900 truncate">{vac.vaccine}</p>
                      <p className="text-[11px] text-slate-500">{vac.doseSequence || 'Completed'}</p>
                    </div>
                    <span className="text-[10px] font-extrabold text-[#0F5C7A] bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                      {vac.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 8. Recent Check-ins Summary */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2E7D4F] flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5" />
                  8. Recent Morning Check-ins ({unifiedHealthProfile.recentCheckIns.length})
                </span>
                <button
                  type="button"
                  onClick={() => setActiveView('history')}
                  className="text-[11px] font-extrabold text-[#0F5C7A] hover:underline cursor-pointer"
                >
                  History →
                </button>
              </div>

              <div className="space-y-1.5">
                {unifiedHealthProfile.recentCheckIns.slice(0, 3).map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-[#F3F7FA] border border-slate-200/80 space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">
                        {log.date} ({log.timestamp})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                          log.classification === 'SAFE'
                            ? 'bg-[#2E7D4F]/15 text-[#2E7D4F]'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {log.classification}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{log.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MY HEALTH TIMELINE (Embedded directly below Unified Profile Summary) */}
          <HealthTimelineSection />
        </div>
      )}

      {/* =====================================================================
          MODE 2: DEDICATED "MY HEALTH TIMELINE" VIEW
         ===================================================================== */}
      {activeProfileMode === 'timeline' && <HealthTimelineSection />}

      {/* =====================================================================
          MODE 3: EDITABLE PERSONAL DETAILS & SYSTEM PREFERENCES
         ===================================================================== */}
      {activeProfileMode === 'edit' && (
        <>
          {/* System Status & Permissions Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2E7D4F]/10 text-[#2E7D4F] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  AI Monitoring Status
                </span>
                <strong className="text-slate-900">Active (Daily {formData.checkInTime})</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F5C7A]/10 text-[#0F5C7A] flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Notification Preferences
                </span>
                <strong className="text-slate-900">
                  {formData.notificationsEnabled ? 'Enabled (3-Step Alerts)' : 'Muted'}
                </strong>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F5C7A]/10 text-[#0F5C7A] flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Voice Permissions
                </span>
                <strong className="text-slate-900">Browser Web Speech Ready</strong>
              </div>
            </div>
          </div>

          {/* Main Editable Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Info */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3.5 text-xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F5C7A] border-b border-slate-100 pb-2">
                Personal Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-2.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Preferred Voice Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) =>
                      setFormData({ ...formData, language: e.target.value as LanguageOption })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  >
                    <option value="English">English</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Telgish">Telgish</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  />
                </div>
              </div>
            </div>

            {/* Health Vitals & Conditions */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3.5 text-xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F5C7A] border-b border-slate-100 pb-2">
                Health Conditions, Vitals & Allergies
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">
                    Health Conditions (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.healthConditions}
                    onChange={(e) =>
                      setFormData({ ...formData, healthConditions: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Heart BPM</label>
                  <input
                    type="number"
                    value={formData.heartBpm}
                    onChange={(e) =>
                      setFormData({ ...formData, heartBpm: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    value={formData.bloodPressure}
                    onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">BMI</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.bmi}
                    onChange={(e) => setFormData({ ...formData, bmi: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">Allergies</label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3.5 text-xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#B3261E] border-b border-slate-100 pb-2">
                Emergency Contacts
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={formData.emergencyName}
                    onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Relationship</label>
                  <input
                    type="text"
                    value={formData.emergencyRel}
                    onChange={(e) => setFormData({ ...formData, emergencyRel: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Emergency Address</label>
                  <input
                    type="text"
                    value={formData.emergencyAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, emergencyAddress: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  />
                </div>
              </div>
            </div>

            {/* Privacy Information Card */}
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-slate-700 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-[#0F5C7A] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0F5C7A] block">Privacy & Data Protection</strong>
                <span>
                  Fictional demonstration patient data (Alex Johnson, 68 yrs) is used for this prototype. No personal health information is transmitted to unauthorized third parties.
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="flex-1 py-4 rounded-2xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('onboarding')}
                className="px-5 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
              >
                Open Setup Wizard
              </button>

              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="px-5 py-4 rounded-2xl bg-rose-50 hover:bg-[#B3261E] text-[#B3261E] hover:text-white border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Data</span>
              </button>
            </div>
          </form>
        </>
      )}

      {/* Reset Demo Data Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-white border border-slate-200 rounded-3xl p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#B3261E]/10 text-[#B3261E] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900">
                Reset demo data?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This will clear the current demo profile, medications, appointments and check-in history.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  resetDemoState();
                }}
                className="py-3 rounded-xl bg-[#B3261E] hover:bg-red-800 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                Reset Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
