import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  Lock,
  Briefcase,
  MapPin,
  HeartPulse,
  Activity,
  Calculator,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LanguageOption } from '../types';

const COMMON_HEALTH_ISSUES = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Heart condition',
  'Arthritis',
  'Other'
];

const COUNTRY_CODES = [
  { code: '+1', label: '🇺🇸 +1 (US/CA)' },
  { code: '+91', label: '🇮🇳 +91 (IN)' },
  { code: '+44', label: '🇬🇧 +44 (UK)' },
  { code: '+61', label: '🇦🇺 +61 (AU)' },
  { code: '+65', label: '🇸🇬 +65 (SG)' }
];

const STEPS = [
  { number: 1, title: 'STEP 1', subtitle: 'Personal Information' },
  { number: 2, title: 'STEP 2', subtitle: 'Health Information' },
  { number: 3, title: 'STEP 3', subtitle: 'Emergency Contact' },
  { number: 4, title: 'STEP 4', subtitle: 'Complete' }
];

export const OnboardingView: React.FC = () => {
  const { patient, setPatient, completeProfileSetup, showToast } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);

  const [name, setName] = useState(patient.name || 'Alex Johnson');
  const [age, setAge] = useState(String(patient.age || 68));
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | 'Prefer not to say'>(
    patient.gender || 'Male'
  );
  const [countryCode, setCountryCode] = useState(patient.countryCode || '+1');
  const [phone, setPhone] = useState(patient.phone || '555-019-2834');
  const [email, setEmail] = useState(patient.email || 'alex.johnson@example.com');
  const [password, setPassword] = useState('demoPass2026!');
  const [confirmPassword, setConfirmPassword] = useState('demoPass2026!');
  const [occupation, setOccupation] = useState(patient.occupation || 'Retired Civil Engineer');
  const [address, setAddress] = useState(
    patient.address || '742 Evergreen Terrace, Apt 4B, Springfield'
  );

  const [selectedIssues, setSelectedIssues] = useState<string[]>(
    patient.healthProfile?.currentHealthIssues?.length
      ? patient.healthProfile.currentHealthIssues
      : ['Hypertension', 'Diabetes']
  );
  const [customIssue, setCustomIssue] = useState('');
  const [healthStatus, setHealthStatus] = useState(
    patient.healthProfile?.currentHealthStatus || 'Stable — Independent daily living'
  );
  const [heartBpm, setHeartBpm] = useState(String(patient.healthProfile?.heartBpm || 72));
  const [bloodPressure, setBloodPressure] = useState(
    patient.healthProfile?.bloodPressure || '126/80 mmHg'
  );

  // BMI Calculator fields
  const [heightCm, setHeightCm] = useState(String(patient.healthProfile?.heightCm || 174));
  const [weightKg, setWeightKg] = useState(String(patient.healthProfile?.weightKg || 76));

  const [allergiesText, setAllergiesText] = useState(
    (patient.healthProfile?.allergies || ['Penicillin', 'Pollen']).join(', ')
  );

  // Emergency Contact
  const [ecName, setEcName] = useState(patient.emergencyContact?.name || 'Sarah Johnson');
  const [ecRelationship, setEcRelationship] = useState(
    patient.emergencyContact?.relationship || 'Daughter'
  );
  const [ecPhone, setEcPhone] = useState(patient.emergencyContact?.phone || '+1 555-019-9812');
  const [ecAddress, setEcAddress] = useState(
    patient.emergencyContact?.address || '18 Oakridge Lane, Springfield'
  );

  const [language, setLanguage] = useState<LanguageOption>(patient.language || 'English');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calculate BMI dynamically
  const hMeters = Number(heightCm) > 0 ? Number(heightCm) / 100 : 1.74;
  const wKg = Number(weightKg) > 0 ? Number(weightKg) : 76;
  const calculatedBmi = Number((wKg / (hMeters * hMeters)).toFixed(1));

  const toggleIssue = (issue: string) => {
    if (selectedIssues.includes(issue)) {
      setSelectedIssues(selectedIssues.filter((i) => i !== issue));
    } else {
      setSelectedIssues([...selectedIssues, issue]);
    }
  };

  const addCustomIssueTag = () => {
    const trimmed = customIssue.trim();
    if (trimmed && !selectedIssues.includes(trimmed)) {
      setSelectedIssues([...selectedIssues, trimmed]);
      setCustomIssue('');
    }
  };

  const validateFields = (): boolean => {
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      setCurrentStep(1);
      return false;
    }
    if (!age || Number(age) < 1 || Number(age) > 120) {
      setErrorMsg('Please enter a valid age between 1 and 120.');
      setCurrentStep(1);
      return false;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter your phone number.');
      setCurrentStep(1);
      return false;
    }
    if (!email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      setCurrentStep(1);
      return false;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      setCurrentStep(1);
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your password.');
      setCurrentStep(1);
      return false;
    }
    if (!ecName.trim() || !ecPhone.trim()) {
      setErrorMsg('Please provide an emergency contact name and phone number.');
      setCurrentStep(3);
      return false;
    }
    return true;
  };

  const saveProfileAndContinue = () => {
    if (!validateFields()) return;

    const allergies = allergiesText
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    setPatient((prev) => ({
      ...prev,
      name: name.trim(),
      age: Number(age),
      gender,
      countryCode,
      phone: phone.trim(),
      email: email.trim(),
      occupation: occupation.trim(),
      address: address.trim(),
      language,
      medicalConditions: selectedIssues,
      healthProfile: {
        currentHealthIssues: selectedIssues,
        currentHealthStatus: healthStatus.trim(),
        heartBpm: Number(heartBpm) || 72,
        bloodPressure: bloodPressure.trim() || '120/80 mmHg',
        heightCm: Number(heightCm) || 170,
        weightKg: Number(weightKg) || 70,
        bmi: calculatedBmi,
        allergies
      },
      emergencyContact: {
        name: ecName.trim(),
        relationship: ecRelationship.trim(),
        phone: ecPhone.trim(),
        address: ecAddress.trim()
      }
    }));

    showToast('Your Sanjeevani AI profile is ready!');
    completeProfileSetup();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfileAndContinue();
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Top Hero Header */}
      <div className="bg-[#0F5C7A] rounded-2xl p-5 text-white shadow-sm space-y-2 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-sky-100 text-[11px] font-extrabold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SANJEEVANI AI</span>
          </div>
          <span className="text-[11px] font-bold text-sky-100 bg-white/10 px-2.5 py-1 rounded-full">
            Step {currentStep} of 4
          </span>
        </div>

        <h1 className="text-xl font-extrabold tracking-tight">
          Let&apos;s set up your health profile
        </h1>
        <p className="text-xs text-sky-100 leading-relaxed">
          Your AI-powered daily health companion
        </p>

        {/* Quick Judge Demo Banner */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 text-[11px] text-sky-100">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            Pre-filled with demo data (Alex Johnson, 68) — edit or continue anytime.
          </span>
          <button
            type="button"
            onClick={saveProfileAndContinue}
            className="px-3 py-1.5 rounded-xl bg-white text-[#0F5C7A] font-extrabold text-[11px] hover:bg-sky-50 transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            Continue to Sanjeevani AI →
          </button>
        </div>
      </div>

      {/* 4-Step Progress Indicator */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-4 gap-1.5">
          {STEPS.map((s) => {
            const isActive = currentStep === s.number;
            const isCompleted = currentStep > s.number;
            return (
              <button
                key={s.number}
                type="button"
                onClick={() => setCurrentStep(s.number)}
                className={`p-2 rounded-xl text-left transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[#0F5C7A] text-white border-[#0F5C7A] shadow-2xs'
                    : isCompleted
                    ? 'bg-[#2E7D4F]/10 text-[#2E7D4F] border-[#2E7D4F]/30'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">
                    {s.title}
                  </span>
                  {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                </div>
                <p
                  className={`text-[11px] font-bold truncate mt-0.5 ${
                    isActive ? 'text-white' : isCompleted ? 'text-[#2E7D4F]' : 'text-slate-700'
                  }`}
                >
                  {s.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Validation Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-[#B3261E]/10 border border-[#B3261E]/30 text-[#B3261E] text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-4">
        {/* STEP 1: Personal Information */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#0F5C7A]" />
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F5C7A] block">
                    STEP 1
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Personal Information
                  </h3>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Account & Identity
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:border-[#0F5C7A] focus:bg-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age *</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:border-[#0F5C7A] focus:bg-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-2.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:border-[#0F5C7A] focus:bg-white outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Phone with Country Selector */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Phone Number (Country / Region Code) *
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-36 px-2.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-semibold focus:border-[#0F5C7A] outline-none"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="555-019-2834"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:border-[#0F5C7A] focus:bg-white outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email ID *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:border-[#0F5C7A] focus:bg-white outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Occupation</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:border-[#0F5C7A] focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:border-[#0F5C7A] focus:bg-white outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:border-[#0F5C7A] focus:bg-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Residential Address *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:border-[#0F5C7A] focus:bg-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Preferred Voice Interaction Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as LanguageOption)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:border-[#0F5C7A] focus:bg-white outline-none"
                >
                  <option value="English">English</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Telgish">Telgish</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Next: Health Information</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Health Information */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-[#0F5C7A]" />
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F5C7A] block">
                    STEP 2
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Health Information
                  </h3>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Personalizes AI Check-in
              </span>
            </div>

            {/* Multi-select Health Issues Tags */}
            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">
                Current Health Conditions (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_HEALTH_ISSUES.map((issue) => {
                  const active = selectedIssues.includes(issue);
                  return (
                    <button
                      key={issue}
                      type="button"
                      onClick={() => toggleIssue(issue)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
                        active
                          ? 'bg-[#0F5C7A] text-white border-[#0F5C7A] shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{issue}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add custom tag */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={customIssue}
                  onChange={(e) => setCustomIssue(e.target.value)}
                  placeholder="Add another wellness note or condition..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:border-[#0F5C7A]"
                />
                <button
                  type="button"
                  onClick={addCustomIssueTag}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {selectedIssues.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedIssues.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-[#0F5C7A] border border-sky-200 text-[11px] font-bold"
                    >
                      {tag}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-[#B3261E]"
                        onClick={() => toggleIssue(tag)}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Health Status</label>
                <input
                  type="text"
                  value={healthStatus}
                  onChange={(e) => setHealthStatus(e.target.value)}
                  placeholder="e.g. Stable"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Heart BPM (Resting)</label>
                <div className="relative">
                  <Activity className="w-4 h-4 text-[#2E7D4F] absolute left-3 top-3" />
                  <input
                    type="number"
                    value={heartBpm}
                    onChange={(e) => setHeartBpm(e.target.value)}
                    placeholder="72"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Blood Pressure</label>
                <input
                  type="text"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  placeholder="126/80 mmHg"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                />
              </div>
            </div>

            {/* Interactive BMI Calculator Card */}
            <div className="p-4 rounded-2xl bg-[#F3F7FA] border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0F5C7A] flex items-center gap-1.5">
                  <Calculator className="w-4 h-4" /> Interactive BMI Calculator
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-extrabold text-slate-900">
                  BMI: <strong className="text-[#0F5C7A]">{calculatedBmi}</strong> kg/m²
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  />
                </div>
              </div>
            </div>

            {/* Allergies */}
            <div className="text-xs">
              <label className="block font-bold text-slate-700 mb-1">
                Known Allergies (comma separated)
              </label>
              <input
                type="text"
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                placeholder="e.g. Penicillin, Peanuts, Pollen"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex-1 sm:flex-initial px-6 py-3.5 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Next: Emergency Contact</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Emergency Contact */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#B3261E]" />
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#B3261E] block">
                    STEP 3
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Emergency Contact
                  </h3>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-[#B3261E]">
                SOS Caregiver Dispatch
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Full Name *</label>
                <input
                  type="text"
                  value={ecName}
                  onChange={(e) => setEcName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Relationship *</label>
                <input
                  type="text"
                  value={ecRelationship}
                  onChange={(e) => setEcRelationship(e.target.value)}
                  placeholder="e.g. Daughter, Son, Spouse"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Emergency Phone Number *</label>
                <input
                  type="tel"
                  value={ecPhone}
                  onChange={(e) => setEcPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Emergency Contact Address</label>
                <input
                  type="text"
                  value={ecAddress}
                  onChange={(e) => setEcAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateFields()) {
                    setCurrentStep(4);
                  }
                }}
                className="flex-1 sm:flex-initial px-6 py-3.5 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Review & Complete</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Complete */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-[#2E7D4F]/15 text-[#2E7D4F] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2E7D4F]">
                STEP 4 • COMPLETE
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">
                Your Sanjeevani AI profile is ready.
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Daily AI morning check-ins, symptom options, and safety alerts have been personalized for{' '}
                <strong>{name}</strong>.
              </p>
            </div>

            {/* Profile Summary Card */}
            <div className="p-4 rounded-2xl bg-[#F3F7FA] border border-slate-200 text-left text-xs space-y-2.5">
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-semibold">User Profile:</span>
                <strong className="text-slate-900">
                  {name}, {age} yrs ({gender})
                </strong>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-semibold">Health Conditions:</span>
                <strong className="text-[#0F5C7A]">
                  {selectedIssues.length > 0 ? selectedIssues.join(', ') : 'None listed'}
                </strong>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-semibold">Baseline Vitals:</span>
                <span className="font-bold text-slate-800">
                  {heartBpm} BPM • {bloodPressure} • BMI {calculatedBmi}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Emergency Contact:</span>
                <strong className="text-slate-900">
                  {ecName} ({ecRelationship}) • {ecPhone}
                </strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Edit Details
              </button>
              <button
                type="submit"
                className="flex-1 py-4 rounded-2xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Continue to Sanjeevani AI</span>
              </button>
            </div>
          </div>
        )}

        {/* Privacy & Responsible AI Messaging */}
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-slate-700 space-y-1">
          <p className="font-bold text-[#0F5C7A] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Privacy & Responsible AI Notice
          </p>
          <p className="leading-relaxed">
            Your health profile is stored locally in this demonstration to personalize AI morning check-in questions. Sanjeevani AI provides daily wellness assistance and does not perform medical diagnosis or contact real emergency services.
          </p>
        </div>
      </form>
    </div>
  );
};
