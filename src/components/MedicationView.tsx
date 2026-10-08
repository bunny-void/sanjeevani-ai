import React, { useState, useRef } from 'react';
import {
  Pill,
  Plus,
  ShoppingBag,
  CheckCircle2,
  Upload,
  FileText,
  Image as ImageIcon,
  Bell,
  Clock,
  Pencil,
  Trash2,
  AlertCircle,
  Calendar
} from 'lucide-react';
import {
  useApp,
  ALL_DAYS_OF_WEEK,
  normalizeMedicationDays,
  formatMedicationScheduleDays
} from '../context/AppContext';
import { Medication, MedicationStatus } from '../types';
import { alarmService } from '../services/alarmService';

const DAY_CHIPS: { full: string; short: string }[] = [
  { full: 'Monday', short: 'Mon' },
  { full: 'Tuesday', short: 'Tue' },
  { full: 'Wednesday', short: 'Wed' },
  { full: 'Thursday', short: 'Thu' },
  { full: 'Friday', short: 'Fri' },
  { full: 'Saturday', short: 'Sat' },
  { full: 'Sunday', short: 'Sun' }
];

const parseScheduledTime = (
  timeStr: string
): { hour: string; minute: string; ampm: 'AM' | 'PM' } => {
  const match = (timeStr || '8:00 AM').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return { hour: '8', minute: '00', ampm: 'AM' };
  }
  return {
    hour: String(Number(match[1])),
    minute: match[2],
    ampm: match[3].toUpperCase() as 'AM' | 'PM'
  };
};

export const MedicationView: React.FC = () => {
  const {
    medications,
    addMedication,
    updateMedication,
    deleteMedication,
    updateMedicationStatus,
    setSelectedRefillMedicine,
    setActiveModal,
    setTargetMedication,
    setMedicationReminderStage,
    showToast
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [medPendingDelete, setMedPendingDelete] = useState<Medication | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [uploadedPrescriptions, setUploadedPrescriptions] = useState<
    { name: string; type: string; time: string }[]
  >([
    {
      name: 'Dr_Priya_Nair_Prescription_Oct2026.pdf',
      type: 'PDF Document',
      time: 'Uploaded Oct 1, 2026'
    }
  ]);

  // Medicine Form State (Add & Edit)
  const [selectedDays, setSelectedDays] = useState<string[]>([
    'Monday',
    'Wednesday',
    'Friday'
  ]);
  const [hour, setHour] = useState('8');
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('1 tablet');
  const [status, setStatus] = useState<MedicationStatus>('REMINDER');

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const isEveryDaySelected = selectedDays.length === ALL_DAYS_OF_WEEK.length;

  const toggleDaySelection = (dayFull: string) => {
    setFormError(null);
    setSelectedDays((prev) => {
      if (prev.includes(dayFull)) {
        return prev.filter((d) => d !== dayFull);
      }
      const next = [...prev, dayFull];
      return ALL_DAYS_OF_WEEK.filter((d) => next.includes(d));
    });
  };

  const selectEveryDay = () => {
    setFormError(null);
    setSelectedDays([...ALL_DAYS_OF_WEEK]);
  };

  const clearAllDays = () => {
    setSelectedDays([]);
  };

  const openAddMedicineForm = () => {
    setEditingMedId(null);
    setName('');
    setDosage('');
    setFrequency('1 tablet');
    setSelectedDays([...ALL_DAYS_OF_WEEK]);
    setHour('8');
    setMinute('00');
    setAmpm('AM');
    setStatus('REMINDER');
    setFormError(null);
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const openEditMedicineForm = (med: Medication) => {
    setEditingMedId(med.id);
    setName(med.name);
    setDosage(med.dosage);
    setFrequency(med.frequency || '1 tablet');
    setSelectedDays(normalizeMedicationDays(med));
    const parsedTime = parseScheduledTime(med.scheduledTime);
    setHour(parsedTime.hour);
    setMinute(parsedTime.minute);
    setAmpm(parsedTime.ampm);
    setStatus(med.status);
    setFormError(null);
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    labelType: 'Prescription Image' | 'Prescription PDF'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedPrescriptions((prev) => [
      {
        name: file.name,
        type: labelType,
        time: 'Just now'
      },
      ...prev
    ]);
    showToast(`${labelType} "${file.name}" attached to your medicine records.`);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !dosage.trim()) {
      setFormError('Please enter both the medicine name and dosage.');
      return;
    }

    if (selectedDays.length === 0) {
      setFormError('Please select at least one day of the week for this medication.');
      return;
    }

    const orderedDays = ALL_DAYS_OF_WEEK.filter((d) => selectedDays.includes(d));
    const formattedDaysLabel = formatMedicationScheduleDays(orderedDays);
    const formattedTime = `${hour}:${minute} ${ampm}`;
    const timing =
      ampm === 'AM'
        ? 'Morning'
        : Number(hour) < 5 || Number(hour) === 12
        ? 'Afternoon'
        : 'Evening';

    if (editingMedId) {
      updateMedication(editingMedId, {
        days: orderedDays,
        day: formattedDaysLabel,
        name: name.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim() || '1 tablet',
        timing,
        scheduledTime: formattedTime,
        status,
        refillStatus: status === 'NEEDS_REFILL' ? 'NEEDS_REFILL' : 'NORMAL'
      });
    } else {
      addMedication({
        days: orderedDays,
        day: formattedDaysLabel,
        name: name.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim() || '1 tablet',
        timing,
        scheduledTime: formattedTime,
        status,
        refillStatus: status === 'NEEDS_REFILL' ? 'NEEDS_REFILL' : 'NORMAL',
        orderStatus: 'NONE'
      });
    }

    setEditingMedId(null);
    setName('');
    setDosage('');
    setFrequency('1 tablet');
    setShowForm(false);
  };

  const getStatusBadge = (medStatus: MedicationStatus) => {
    switch (medStatus) {
      case 'TAKEN':
        return (
          <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-[#2E7D4F]/15 text-[#2E7D4F] border border-[#2E7D4F]/30">
            Taken
          </span>
        );
      case 'NEEDS_REFILL':
        return (
          <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-[#B3261E]/15 text-[#B3261E] border border-[#B3261E]/30">
            Needs refill
          </span>
        );
      case 'ORDERED':
        return (
          <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-sky-100 text-[#0F5C7A] border border-sky-300">
            Refill Ordered
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-amber-100 text-amber-800 border border-amber-300">
            Reminder
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0F5C7A]/10 text-[#0F5C7A] flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Medicines & Prescriptions</h2>
            <p className="text-xs text-slate-500">
              Multi-day schedule, audible alarms & Medicare Pharmacy refills
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (showForm && !editingMedId) {
              setShowForm(false);
            } else {
              openAddMedicineForm();
            }
          }}
          className="px-3.5 py-2.5 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* Prescription Upload Card (Image & PDF) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F5C7A] flex items-center gap-1.5">
          <Upload className="w-4 h-4" /> Upload Doctor Prescription
        </h3>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e, 'Prescription Image')}
        />
        <input
          ref={pdfInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleFileUpload(e, 'Prescription PDF')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="p-3.5 rounded-2xl bg-[#F3F7FA] hover:bg-sky-50 border border-dashed border-[#0F5C7A]/40 text-slate-800 font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-[#0F5C7A]" />
            <span>Upload Prescription Image</span>
          </button>

          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            className="p-3.5 rounded-2xl bg-[#F3F7FA] hover:bg-sky-50 border border-dashed border-[#0F5C7A]/40 text-slate-800 font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <FileText className="w-4 h-4 text-[#0F5C7A]" />
            <span>Upload Prescription PDF</span>
          </button>
        </div>

        {uploadedPrescriptions.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {uploadedPrescriptions.map((item, idx) => (
              <div
                key={idx}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-800 truncate flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#2E7D4F] shrink-0" />
                  {item.name}
                </span>
                <span className="text-[11px] text-slate-500 shrink-0 ml-2">
                  {item.type} • {item.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Medicine Form with Multiple-Day Selection */}
      {showForm && (
        <form
          ref={formRef}
          onSubmit={handleFormSubmit}
          className="bg-white rounded-2xl p-5 border-2 border-[#0F5C7A]/35 shadow-md space-y-4 text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-extrabold text-slate-900">
              {editingMedId ? 'Edit Medication & Schedule' : 'Add Medicine to Schedule'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingMedId(null);
                setFormError(null);
              }}
              className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-[#B3261E]/10 border border-[#B3261E]/30 text-[#B3261E] font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Medicine Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Metformin"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Dosage *</label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 500 mg"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                required
              />
            </div>

            {/* MULTIPLE DAY SELECTION */}
            <div className="sm:col-span-2 space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0F5C7A]" />
                  <span>Days of Week (Select one or more days) *</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectEveryDay}
                    className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] border transition-colors cursor-pointer ${
                      isEveryDaySelected
                        ? 'bg-[#0F5C7A] text-white border-[#0F5C7A]'
                        : 'bg-sky-50 text-[#0F5C7A] border-sky-200 hover:bg-sky-100'
                    }`}
                  >
                    Every day
                  </button>
                  <button
                    type="button"
                    onClick={clearAllDays}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[11px] cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {DAY_CHIPS.map((d) => {
                  const isSelected = selectedDays.includes(d.full);
                  return (
                    <button
                      key={d.full}
                      type="button"
                      onClick={() => toggleDaySelection(d.full)}
                      className={`py-2.5 px-1 rounded-xl font-extrabold text-xs border transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'bg-[#0F5C7A] text-white border-[#0F5C7A] shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {d.short}
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-500">
                Selected schedule:{' '}
                <strong className="text-[#0F5C7A]">
                  {selectedDays.length === 0
                    ? 'None selected (choose at least 1 day)'
                    : formatMedicationScheduleDays(selectedDays)}
                </strong>
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Time (12-Hour Format)</label>
              <div className="flex gap-1.5">
                <select
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  className="flex-1 px-2.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-semibold"
                >
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <select
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  className="flex-1 px-2.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-semibold"
                >
                  {['00', '05', '15', '30', '45'].map((m) => (
                    <option key={m} value={m}>
                      :{m}
                    </option>
                  ))}
                </select>
                <select
                  value={ampm}
                  onChange={(e) => setAmpm(e.target.value as 'AM' | 'PM')}
                  className="w-20 px-2.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Frequency</label>
              <input
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="e.g. 1 tablet"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MedicationStatus)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
              >
                <option value="REMINDER">Reminder</option>
                <option value="TAKEN">Taken</option>
                <option value="NEEDS_REFILL">Needs refill</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-extrabold text-xs shadow-sm cursor-pointer"
            >
              {editingMedId ? 'Save Changes to Medication' : 'Save Medicine to Schedule'}
            </button>
            {editingMedId && (
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingMedId(null);
                  setFormError(null);
                }}
                className="px-4 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Medicines List */}
      <div className="space-y-3">
        {medications.map((med) => {
          const scheduleDaysLabel = formatMedicationScheduleDays(med.days, med.day);
          return (
            <div
              key={med.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">{med.name}</h3>
                    <span className="text-xs font-bold text-[#0F5C7A] bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                      {med.dosage}
                    </span>
                  </div>

                  {/* Clear Multi-Day Schedule Display */}
                  <p className="text-xs font-extrabold text-slate-800 pt-0.5">
                    {scheduleDaysLabel}
                  </p>
                  <p className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 font-bold text-[#0F5C7A]">
                      <Clock className="w-3.5 h-3.5" />
                      {med.scheduledTime}
                    </span>
                    <span>•</span>
                    <span>{med.frequency || '1 tablet'}</span>
                  </p>
                </div>

                {/* Status Badge + Subtle Edit/Delete Controls */}
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(med.status)}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditMedicineForm(med)}
                      className="px-2 py-1 rounded-lg text-slate-500 hover:text-[#0F5C7A] hover:bg-slate-100 font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                      title={`Edit ${med.name}`}
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMedPendingDelete(med)}
                      className="px-2 py-1 rounded-lg text-slate-500 hover:text-[#B3261E] hover:bg-red-50 font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                      title={`Delete ${med.name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100">
                {med.status !== 'TAKEN' && (
                  <button
                    onClick={() => updateMedicationStatus(med.id, 'TAKEN')}
                    className="px-3 py-2 rounded-xl bg-[#2E7D4F] hover:bg-[#24663F] font-bold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Taken</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    alarmService.unlockAudio();
                    setTargetMedication(med);
                    setMedicationReminderStage(1);
                    setActiveModal('medication_reminder');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 text-[#0F5C7A]" />
                  <span>Run 3-Step Reminder Demo</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedRefillMedicine(med);
                    setActiveModal('pharmacy_handoff');
                  }}
                  className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0F5C7A] font-bold border border-sky-200 flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Request Refill</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Medication Confirmation Modal */}
      {medPendingDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-white border border-slate-200 rounded-3xl p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#B3261E]/10 text-[#B3261E] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete medication?</h3>
                <p className="text-xs text-slate-500">
                  {medPendingDelete.name} ({medPendingDelete.dosage})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove this medication and its reminder schedule?
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setMedPendingDelete(null)}
                className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteMedication(medPendingDelete.id);
                  if (editingMedId === medPendingDelete.id) {
                    setEditingMedId(null);
                    setShowForm(false);
                  }
                  setMedPendingDelete(null);
                }}
                className="py-3 rounded-xl bg-[#B3261E] hover:bg-red-800 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
