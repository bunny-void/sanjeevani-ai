import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Bell,
  CheckCircle2,
  Stethoscope,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { alarmService } from '../services/alarmService';
import { speechService } from '../services/speechService';

export const AppointmentView: React.FC = () => {
  const {
    appointments,
    addAppointment,
    updateAppointmentStatus,
    setTargetAppointment,
    setAppointmentReminderStage,
    setActiveModal,
    setActiveView
  } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('General Medicine');
  const [date, setDate] = useState('2026-10-15');
  const [hour, setHour] = useState('10');
  const [minute, setMinute] = useState('30');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [address, setAddress] = useState('');

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim() || !address.trim()) return;

    addAppointment({
      doctorName: doctorName.trim(),
      specialty: specialty.trim() || 'Physician Consultation',
      date,
      time: `${hour}:${minute} ${ampm}`,
      address: address.trim(),
      status: 'UPCOMING'
    });

    setDoctorName('');
    setAddress('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2E7D4F]/10 text-[#2E7D4F] flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Doctor Appointments</h2>
            <p className="text-xs text-slate-500">
              Schedule visits & test 3-step AI voice appointment reminders
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-2.5 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Appointment</span>
          </button>
        </div>
      </div>

      {/* Create Appointment Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateAppointment}
          className="bg-white rounded-2xl p-5 border-2 border-[#0F5C7A]/30 shadow-md space-y-4 text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-extrabold text-slate-900">Schedule Doctor Appointment</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-700 font-bold"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Doctor Name *</label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Priya Nair, MD"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Specialty / Department</label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Cardiology"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date (Calendar Picker) *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Time (12-Hour Format) *</label>
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
                  {['00', '15', '30', '45'].map((m) => (
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

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Clinic / Hospital Address *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Sanjeevani Heart Clinic, Suite 302, Green Park"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-extrabold text-xs shadow-sm cursor-pointer"
          >
            Save Appointment
          </button>
        </form>
      )}

      {/* Appointments List */}
      <div className="space-y-3">
        {appointments.map((appt) => (
          <div
            key={appt.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{appt.doctorName}</h3>
                <p className="text-xs font-semibold text-[#0F5C7A]">{appt.specialty}</p>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                  appt.status === 'ACKNOWLEDGED'
                    ? 'bg-[#2E7D4F]/15 text-[#2E7D4F] border border-[#2E7D4F]/30'
                    : 'bg-sky-100 text-[#0F5C7A] border border-sky-200'
                }`}
              >
                {appt.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-slate-700 font-semibold">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#0F5C7A]" />
                {appt.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#0F5C7A]" />
                {appt.time}
              </span>
            </div>

            <div className="flex items-start gap-2 text-slate-600 pt-1">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>{appt.address}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
              {appt.status !== 'ACKNOWLEDGED' && (
                <button
                  onClick={() => updateAppointmentStatus(appt.id, 'ACKNOWLEDGED')}
                  className="px-3 py-2 rounded-xl bg-[#2E7D4F] hover:bg-[#23633D] text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Acknowledge</span>
                </button>
              )}

              <button
                onClick={() => {
                  alarmService.unlockAudio();
                  speechService.warmupAudio();
                  setTargetAppointment(appt);
                  setAppointmentReminderStage(1);
                  setActiveModal('appointment_reminder');
                }}
                className="px-3.5 py-2 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Run 3-Step Reminder Demo</span>
              </button>
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
