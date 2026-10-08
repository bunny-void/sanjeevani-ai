import React, { useState } from 'react';
import {
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  ShieldCheck,
  Truck,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Medication } from '../types';
import {
  MEDICARE_PHARMACY_BASE_URL,
  buildMedicarePharmacyDeepLink,
  extractCleanMedicineName,
  resolveDemoProductId
} from '../services/pharmacyIntegrationService';

export const MEDICARE_PHARMACY_URL = MEDICARE_PHARMACY_BASE_URL;

export const SanjeevaniPharmacyModal: React.FC = () => {
  const {
    patient,
    medications,
    selectedRefillMedicine,
    setSelectedRefillMedicine,
    setActiveModal,
    addPharmacyOrder,
    updateMedicationStatus,
    setActiveView,
    showToast
  } = useApp();

  const [orderStep, setOrderStep] = useState<
    'SELECTED_PRODUCT' | 'DEMO_CHECKOUT' | 'DEMO_ORDER_SUCCESS' | 'CANCELLED'
  >('SELECTED_PRODUCT');

  // Delivery & mock payment fields for the Demo Checkout flow
  const [deliveryName, setDeliveryName] = useState(patient.name || 'Alex Johnson');
  const [deliveryPhone, setDeliveryPhone] = useState(
    `${patient.countryCode || '+1'} ${patient.phone || '555-019-2834'}`
  );
  const [deliveryAddress, setDeliveryAddress] = useState(
    patient.address || '742 Evergreen Terrace, Apt 4B, Springfield'
  );
  const [mockPaymentMethod, setMockPaymentMethod] = useState<'DEMO_WALLET' | 'DEMO_COD'>(
    'DEMO_WALLET'
  );

  // Dynamically identify the medicine needing refill from the current medication record
  const med: Medication =
    selectedRefillMedicine ||
    medications.find((m) => m.status === 'NEEDS_REFILL') ||
    medications[0] || {
      id: 'med-1',
      day: 'Every day',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      name: 'Metformin',
      dosage: '500 mg',
      frequency: '1 tablet',
      timing: 'Morning',
      scheduledTime: '8:00 AM',
      status: 'NEEDS_REFILL'
    };

  const cleanMedicineName = extractCleanMedicineName(med.name);
  const demoProductId = resolveDemoProductId(med.name);
  const pharmacyDeepLink = buildMedicarePharmacyDeepLink(med);

  const handleOpenExternalPharmacy = () => {
    window.open(pharmacyDeepLink, '_blank', 'noopener,noreferrer');
  };

  const handlePlaceDemoOrder = (e: React.FormEvent) => {
    e.preventDefault();

    addPharmacyOrder({
      medicineName: `${med.name} (${med.dosage})`,
      quantity: '1 Pack (30-Day Demo Supply)',
      pharmacy: `Medicare Pharmacy (${demoProductId})`,
      orderDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }),
      status: 'DEMO_ORDERED',
      estimatedCost: '₹0 (Hackathon Prototype / Demo)'
    });

    updateMedicationStatus(med.id, 'ORDERED', 'DEMO_ORDERED');
    setOrderStep('DEMO_ORDER_SUCCESS');
    showToast('Demo order completed successfully');
  };

  const handleCancelOrder = () => {
    updateMedicationStatus(med.id, 'NEEDS_REFILL');
    setOrderStep('CANCELLED');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 text-slate-900 shadow-2xl space-y-4 relative my-auto">
        <button
          onClick={() => setActiveModal('none')}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Demo Prototype Badges */}
        <div className="flex flex-wrap items-center gap-2 pr-7">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0F5C7A] text-white text-[10px] font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            Selected from Sanjeevani AI
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
            Hackathon Prototype / Demo
          </span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0F5C7A]/10 text-[#0F5C7A] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Medicare Pharmacy Deep-Link Refill
            </h3>
            <p className="text-xs text-slate-500">
              Dynamic medicine handoff • Demo checkout only
            </p>
          </div>
        </div>

        {/* Quick Medicine Switcher so judges can test any medication in the schedule */}
        {medications.length > 1 && orderStep === 'SELECTED_PRODUCT' && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Active Medication Selected for Refill:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {medications.map((item) => {
                const isSelected = item.id === med.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedRefillMedicine(item)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0F5C7A] text-white border-[#0F5C7A] shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.name} ({item.dosage})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 1: SELECTED DEMO PRODUCT & DEEP-LINK LAUNCH */}
        {orderStep === 'SELECTED_PRODUCT' && (
          <div className="space-y-4">
            {/* Highlighted Selected Product Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border-2 border-[#0F5C7A] space-y-2.5 text-xs shadow-xs">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-[#0F5C7A] text-white font-extrabold text-[10px]">
                  Selected from Sanjeevani AI
                </span>
                <span className="font-mono text-[10px] font-bold text-[#0F5C7A] bg-white px-2 py-0.5 rounded border border-slate-200">
                  {demoProductId}
                </span>
              </div>

              <div className="pt-1 flex justify-between items-baseline">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    {med.name} {med.dosage}
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Prescribed schedule: {med.frequency || '1 tablet'} • {med.scheduledTime}
                  </p>
                </div>
                <span className="text-xs font-extrabold text-[#2E7D4F]">
                  Demo Product Ready
                </span>
              </div>

              <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-[11px] text-slate-700">
                <span>Query Parameter Passed:</span>
                <code className="font-mono font-bold text-[#0F5C7A] bg-white px-2 py-0.5 rounded border border-slate-200">
                  ?medicine={cleanMedicineName}
                </code>
              </div>
            </div>

            {/* Primary CTA: Open External Medicare Pharmacy Website with ?medicine=... */}
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-2.5">
              <p className="text-xs font-bold text-[#0F5C7A]">
                1. Open Medicare Pharmacy Website (Auto-Scroll &amp; Highlight):
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Opens <strong>Medicare Pharmacy</strong> with{' '}
                <code>?medicine={cleanMedicineName}</code>. The pharmacy automatically scrolls to{' '}
                <strong>{cleanMedicineName}</strong>, highlights it with{' '}
                <em>&quot;Selected from Sanjeevani AI&quot;</em>, and opens the Demo Checkout.
              </p>

              <a
                href={pharmacyDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOpenExternalPharmacy}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>
                  Open Medicare Pharmacy (?medicine={cleanMedicineName})
                </span>
                <ExternalLink className="w-4 h-4 shrink-0" />
              </a>

              <p className="text-[10px] font-mono text-slate-500 break-all text-center">
                {pharmacyDeepLink}
              </p>
            </div>

            {/* Secondary Option: Proceed to Demo Checkout Directly */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setOrderStep('DEMO_CHECKOUT')}
                className="w-full py-3.5 px-4 rounded-xl bg-[#2E7D4F] hover:bg-[#23633D] text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Proceed to Demo Checkout ({cleanMedicineName})</span>
              </button>

              <button
                type="button"
                onClick={handleCancelOrder}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Hackathon Prototype / Demo:</strong> Does not automatically add to a real cart, submit a real order, or process any payment.
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: POLISHED MOCK DEMO CHECKOUT SCREEN */}
        {orderStep === 'DEMO_CHECKOUT' && (
          <form onSubmit={handlePlaceDemoOrder} className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#F3F7FA] border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase text-[#0F5C7A]">
                  Selected from Sanjeevani AI
                </span>
                <span className="font-mono text-[10px] font-bold text-slate-600">
                  {demoProductId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <strong className="text-sm font-extrabold text-slate-900">
                  {med.name} ({med.dosage})
                </strong>
                <span className="font-extrabold text-[#2E7D4F]">
                  ₹0 (Demo Refill)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                1 Pack (30-Day Demo Supply) • Not added to real cart
              </p>
            </div>

            {/* Example Delivery Fields */}
            <div className="space-y-2.5">
              <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#0F5C7A]" />
                <span>Example Delivery Details (Demo)</span>
              </h4>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Recipient Name</label>
                <input
                  type="text"
                  value={deliveryName}
                  onChange={(e) => setDeliveryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={deliveryPhone}
                  onChange={(e) => setDeliveryPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Delivery Address</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-[#0F5C7A]"
                  required
                />
              </div>
            </div>

            {/* Example Payment Fields */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#0F5C7A]" />
                <span>Example Payment Method (No Real Charge)</span>
              </h4>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="mockPayment"
                  checked={mockPaymentMethod === 'DEMO_WALLET'}
                  onChange={() => setMockPaymentMethod('DEMO_WALLET')}
                  className="mt-0.5"
                />
                <div>
                  <strong className="text-slate-900 block">
                    Hackathon Demo Mode (₹0.00 — No Payment Processed)
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    Simulates refill confirmation without real payment processing.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="mockPayment"
                  checked={mockPaymentMethod === 'DEMO_COD'}
                  onChange={() => setMockPaymentMethod('DEMO_COD')}
                  className="mt-0.5"
                />
                <div>
                  <strong className="text-slate-900 block">
                    Mock Pay on Delivery (Simulation Only)
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    Example delivery verification option for demonstration.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setOrderStep('SELECTED_PRODUCT')}
                className="px-4 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-3.5 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-extrabold text-xs shadow-sm cursor-pointer"
              >
                Place Demo Order
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: DEMO ORDER COMPLETED SUCCESSFULLY */}
        {orderStep === 'DEMO_ORDER_SUCCESS' && (
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-full bg-[#2E7D4F]/15 text-[#2E7D4F] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase">
                Hackathon Prototype / Demo
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                Demo order completed successfully
              </h3>
              <p className="text-xs text-slate-600">
                <strong>
                  {med.name} ({med.dosage})
                </strong>{' '}
                was processed in Demo Mode with no real cart or payment.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F3F7FA] border border-slate-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Selected Medicine:</span>
                <strong className="text-slate-900">
                  {med.name} ({med.dosage})
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Demo Product ID:</span>
                <code className="font-mono font-bold text-[#0F5C7A]">{demoProductId}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient (Demo):</span>
                <span className="font-semibold text-slate-800">{deliveryName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Charged:</span>
                <strong className="text-[#2E7D4F]">₹0 (Demo Only)</strong>
              </div>
            </div>

            <a
              href={pharmacyDeepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0F5C7A] border border-sky-200 font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <span>Open Medicare Pharmacy (?medicine={cleanMedicineName})</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => {
                setActiveModal('none');
                setActiveView('dashboard');
              }}
              className="w-full py-3.5 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Return to Sanjeevani AI</span>
            </button>
          </div>
        )}

        {/* STEP 4: CANCELLED */}
        {orderStep === 'CANCELLED' && (
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Demo Refill Cancelled</h3>
              <p className="text-xs text-slate-600 mt-1">
                {med.name} remains marked as <strong>Needs refill</strong> on your dashboard.
              </p>
            </div>

            <button
              onClick={() => setActiveModal('none')}
              className="w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
