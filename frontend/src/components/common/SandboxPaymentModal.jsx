import React, { useState } from 'react';
import { Modal } from './Modal';
import { formatCurrency } from '../../utils/formatters';
import { CreditCard, QrCode, Building2, CheckCircle, XCircle, Loader2, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';

export const SandboxPaymentModal = ({
  isOpen,
  onClose,
  orderData,
  onPaymentComplete
}) => {
  const [activeTab, setActiveTab] = useState('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null); // { success: true/false, payment, updatedFees }

  if (!orderData) return null;

  const handleProcessPayment = async (simulateSuccess = true) => {
    setIsProcessing(true);
    try {
      // Simulate minor gateway network delay for realism
      await new Promise((resolve) => setTimeout(resolve, 800));

      const status = simulateSuccess ? 'SUCCESS' : 'FAILED';
      const res = await api.post('/payments/verify', {
        paymentId: orderData.paymentId,
        status,
        paymentMethod: activeTab,
        gatewayResponse: {
          simulated: true,
          method: activeTab,
          timestamp: new Date().toISOString(),
          reason: simulateSuccess ? 'Transaction approved by bank sandbox' : 'Transaction rejected: Insufficient mock funds or user cancelled'
        }
      });

      if (res.data?.success) {
        setPaymentResult({
          success: simulateSuccess,
          data: res.data.data
        });

        if (simulateSuccess) {
          try {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 }
            });
          } catch (e) {
            // ignore confetti error
          }
        }

        if (onPaymentComplete) {
          onPaymentComplete(res.data.data);
        }
      }
    } catch (err) {
      console.error('Payment processing failed:', err);
      alert(err.response?.data?.message || 'Payment simulation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetAndClose = () => {
    setPaymentResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={paymentResult ? 'Payment Status' : 'Gateway Checkout (Sandbox)'}
      maxWidth="max-w-lg"
    >
      {paymentResult ? (
        <div className="text-center py-4 space-y-4">
          {paymentResult.success ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Payment Successful!</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Your fee payment of <span className="font-bold text-slate-900">{formatCurrency(orderData.amount)}</span> has been received and verified.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt Number:</span>
                  <span className="font-mono font-bold text-slate-800">{orderData.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono text-slate-800">{orderData.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-semibold text-indigo-700">{activeTab}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
                  <span className="text-slate-700">Remaining Balance:</span>
                  <span className="text-emerald-600">
                    {formatCurrency(paymentResult.data?.updatedFees?.remainingDue || 0)}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleResetAndClose}
                  className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
                >
                  View Updated Dashboard & Receipts
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <XCircle className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Payment Failed / Cancelled</h3>
                <p className="text-sm text-slate-500 mt-1">
                  The payment attempt was declined or cancelled. Your fee dues remain unchanged.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setPaymentResult(null)}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Try Again
                </button>
                <button
                  onClick={handleResetAndClose}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Order Summary Header */}
          <div className="rounded-xl bg-gradient-to-r from-indigo-900 to-indigo-800 p-4 text-white shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-indigo-200 uppercase font-semibold">Paying to</p>
                <p className="text-sm font-bold truncate">
                  {import.meta.env.VITE_COLLEGE_NAME || 'College ERP'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-indigo-200">Amount</p>
                <p className="text-xl font-extrabold">{formatCurrency(orderData.amount)}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-indigo-200 border-t border-indigo-700/60 pt-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Sandbox Mode &bull; Order Ref: {orderData.transactionId}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('UPI')}
                className={`flex flex-col items-center justify-center rounded-xl p-3 border transition-all text-xs font-semibold ${
                  activeTab === 'UPI'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <QrCode className="h-5 w-5 mb-1" />
                UPI / QR
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('CARD')}
                className={`flex flex-col items-center justify-center rounded-xl p-3 border transition-all text-xs font-semibold ${
                  activeTab === 'CARD'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <CreditCard className="h-5 w-5 mb-1" />
                Cards
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('NETBANKING')}
                className={`flex flex-col items-center justify-center rounded-xl p-3 border transition-all text-xs font-semibold ${
                  activeTab === 'NETBANKING'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Building2 className="h-5 w-5 mb-1" />
                Net Banking
              </button>
            </div>
          </div>

          {/* Method Content */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            {activeTab === 'UPI' && (
              <div className="space-y-3">
                <p className="font-semibold text-slate-800">Scan QR or enter UPI VPA</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue="student@upi"
                    readOnly
                    className="rounded bg-white border border-slate-300 px-2.5 py-1.5 font-mono text-slate-700 w-full"
                  />
                </div>
              </div>
            )}

            {activeTab === 'CARD' && (
              <div className="space-y-2">
                <p className="font-semibold text-slate-800">Card Payment Gateway</p>
                <div className="font-mono bg-white p-2.5 rounded border border-slate-300 text-slate-700 flex justify-between items-center">
                  <span>•••• •••• •••• 4242</span>
                  <span className="text-slate-400 text-[11px]">Valid Thru: 12/28</span>
                </div>
              </div>
            )}

            {activeTab === 'NETBANKING' && (
              <div className="space-y-2">
                <p className="font-semibold text-slate-800">Select Bank</p>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div className="p-2 bg-white rounded border border-slate-300 font-medium">State Bank of India</div>
                  <div className="p-2 bg-white rounded border border-slate-300 font-medium">HDFC Bank</div>
                  <div className="p-2 bg-white rounded border border-slate-300 font-medium">ICICI Bank</div>
                  <div className="p-2 bg-white rounded border border-slate-300 font-medium">Punjab National Bank</div>
                </div>
              </div>
            )}
          </div>

          {/* Simulation Action Triggers */}
          <div className="space-y-2 pt-2">
            <button
              disabled={isProcessing}
              onClick={() => handleProcessPayment(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying with Sandbox...
                </>
              ) : (
                `Simulate Successful Payment (${formatCurrency(orderData.amount)})`
              )}
            </button>

            <button
              disabled={isProcessing}
              onClick={() => handleProcessPayment(false)}
              className="w-full rounded-xl border border-rose-200 bg-rose-50/50 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
            >
              Simulate Failed / Cancelled Payment
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
