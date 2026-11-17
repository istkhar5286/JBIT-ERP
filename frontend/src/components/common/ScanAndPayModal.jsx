import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  QrCode,
  Copy,
  Check,
  UploadCloud,
  FileCheck,
  AlertCircle,
  Loader2,
  X,
  ShieldCheck,
  Info
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const ScanAndPayModal = ({
  isOpen,
  onClose,
  amount,
  purpose,
  onSubmitPayment,
  onSubmit,
  submitting = false,
  isSubmitting = false,
  extraDetails = null
}) => {
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [screenshotName, setScreenshotName] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchSettings = async () => {
      try {
        setLoadingSettings(true);
        const res = await api.get('/payments/settings');
        if (res.data?.success) {
          setSettings(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load payment settings:', err);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
    setValidationError('');
    setUtrNumber('');
    setScreenshotBase64('');
    setScreenshotName('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    if (!settings?.upiId) return;
    navigator.clipboard.writeText(settings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setValidationError('Please upload a valid image file (PNG, JPG, or JPEG only).');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setValidationError('Screenshot image size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    setValidationError('');
    setScreenshotName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotBase64(reader.result);
    };
    reader.onerror = () => {
      setValidationError('Failed to read image file. Please try selecting again.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotBase64('');
    setScreenshotName('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setValidationError('Please enter a valid Transaction / UTR Number (minimum 6 digits).');
      return;
    }

    if (!screenshotBase64) {
      setValidationError('Please upload a clear screenshot of your successful UPI payment.');
      return;
    }

    const callback = onSubmitPayment || onSubmit;
    if (callback) {
      callback({
        utrNumber: cleanUtr,
        paymentScreenshot: screenshotBase64,
        screenshotBase64
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <QrCode className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Scan &amp; Pay</h3>
              <p className="text-[11px] text-blue-200/90">Official Institutional UPI Payment Desk</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {validationError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Amount & Purpose Badge */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Payment Purpose
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {purpose || 'Fee Payment'}
              </span>
              {extraDetails && (
                <span className="block text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                  {extraDetails}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Amount to Pay
              </span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {formatCurrency(amount || 0)}
              </span>
            </div>
          </div>

          {/* QR Code Display Card */}
          <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-indigo-50/50 to-slate-50 dark:from-slate-800/40 dark:to-slate-800/80 rounded-3xl border border-indigo-100 dark:border-slate-700/80 text-center">
            {loadingSettings ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                <span className="text-xs">Loading secure college payment QR...</span>
              </div>
            ) : settings?.qrCode ? (
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 inline-block">
                  <img
                    src={settings.qrCode}
                    alt="College UPI QR Code"
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {settings.paymentName || 'JB Institute of Technology'}
                  </p>
                  <p className="text-[11px] text-slate-500">Scan using GPay, PhonePe, Paytm, or BHIM</p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-xs text-slate-400">QR code is currently being configured by administration.</div>
            )}

            {/* UPI ID Copy Bar */}
            {settings?.upiId && (
              <div className="mt-3.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-mono">
                <span className="text-slate-500 text-[11px]">UPI ID:</span>
                <strong className="text-slate-800 dark:text-slate-200">{settings.upiId}</strong>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
                  title="Copy UPI ID"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Payment Verification Submission Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Transaction / UTR Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="e.g. 427819028341 (12-digit UPI reference)"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="block text-[11px] text-slate-500 mt-1">
                Found under transaction details in your UPI application after successful payment.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Screenshot <span className="text-rose-500">*</span>
              </label>
              {!screenshotBase64 ? (
                <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50/20 transition">
                  <UploadCloud className="w-7 h-7 text-indigo-600 dark:text-indigo-400 mb-1.5" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Click to browse or drag &amp; drop
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, or JPEG (Max 5MB)</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleScreenshotChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3">
                  <img
                    src={screenshotBase64}
                    alt="Receipt Preview"
                    className="w-14 h-14 object-cover rounded-xl border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {screenshotName || 'payment_receipt.png'}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                      <FileCheck className="w-3.5 h-3.5" /> Image attached successfully
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveScreenshot}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="Remove Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Verification Notice */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800 rounded-2xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Important:</strong> Your payment status will be marked <strong>PENDING</strong> immediately. Official seat/room confirmation takes effect once the Accounts Office verifies the UTR and settlement.
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || isSubmitting || !utrNumber.trim() || !screenshotBase64}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(submitting || isSubmitting) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting for Approval...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit Payment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScanAndPayModal;
