import React from 'react';
import { Modal } from './Modal';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { Download, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { BRANDING } from '../../config/branding';

export const ReceiptModal = ({ isOpen, onClose, payment, student }) => {
  if (!payment) return null;

  const resolvedStudent = student || payment.studentId || {};

  const handleDownloadPdf = async () => {
    try {
      const response = await api.get(`/payments/${payment._id}/receipt`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt_${payment.receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download receipt PDF:', err);
      alert('Error downloading receipt PDF. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Fee Payment Receipt"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Printable Receipt Container */}
        <div
          id="printable-receipt"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm font-sans"
        >
          {/* Header Banner */}
          <div className="border-b-2 border-indigo-900 pb-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <img src={BRANDING.LOGO} alt={BRANDING.LOGO_ALT} className="h-11 w-11 object-contain" />
              <h2 className="text-xl font-extrabold uppercase tracking-wide text-indigo-950">
                {import.meta.env.VITE_COLLEGE_NAME || 'JB Institute of Technology'}
              </h2>
            </div>
            <p className="text-xs font-medium text-slate-500">
              23 Milestone, NH-07, Chakrata Rd, Shankarpur, Uttarakhand 248197 &bull; College Code: {import.meta.env.VITE_COLLEGE_CODE || 'JBIT-101'}
            </p>
            <div className="mt-2 inline-block rounded-md bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-800">
              Student Fee Payment Receipt
            </div>
          </div>

          {/* Receipt Meta Details */}
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
            <div>
              <span className="font-semibold text-slate-500">Receipt No: </span>
              <span className="font-mono font-bold text-slate-900">{payment.receiptNumber}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Date & Time: </span>
              <span className="font-medium text-slate-900">{formatDateTime(payment.paymentDate || payment.createdAt)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Transaction ID: </span>
              <span className="font-mono text-slate-900">{payment.transactionId}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Payment Mode: </span>
              <span className="font-bold text-indigo-700">{payment.paymentMethod || 'ONLINE'}</span>
            </div>
          </div>

          {/* Student Particulars */}
          <div className="mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 border-b pb-1">
              Student Particulars
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <span className="text-slate-500">Student Name: </span>
                <span className="font-semibold text-slate-900">{resolvedStudent.fullName || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">Father's Name: </span>
                <span className="font-semibold text-slate-900">{resolvedStudent.fatherName || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">Roll Number: </span>
                <span className="font-mono font-semibold text-slate-900">{resolvedStudent.universityRollNumber || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">College Reg No: </span>
                <span className="font-mono font-semibold text-slate-900">{resolvedStudent.collegeRegistrationNumber || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">Course / Branch: </span>
                <span className="font-semibold text-slate-900">{resolvedStudent.course || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">Semester: </span>
                <span className="font-semibold text-slate-900">Semester {resolvedStudent.semester || '-'}</span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="px-3 py-2">Item Description</th>
                  <th className="px-3 py-2 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-3 py-2 text-slate-600">Previous Outstanding Due</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-800">{formatCurrency(payment.previousDue)}</td>
                </tr>
                <tr className="bg-emerald-50/50">
                  <td className="px-3 py-2 font-bold text-emerald-800">
                    Amount Paid in this Transaction ({payment.paymentMethod})
                  </td>
                  <td className="px-3 py-2 text-right font-extrabold text-emerald-700 text-sm">
                    {formatCurrency(payment.amount)}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-slate-600">Remaining Balance Due</td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">{formatCurrency(payment.remainingDue)}</td>
                </tr>
                <tr className={payment.remainingDue <= 0 ? 'bg-emerald-50/70' : 'bg-amber-50/70'}>
                  <td className="px-3 py-2 font-bold text-slate-800">Updated Student Fee Status</td>
                  <td className="px-3 py-2 text-right font-black">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-extrabold ${payment.remainingDue <= 0 ? 'text-emerald-700 bg-emerald-100' : 'text-amber-800 bg-amber-100'}`}>
                      {payment.remainingDue <= 0 ? 'CLEAR' : 'PENDING'}
                    </span>
                  </td>
                </tr>
                {payment.extraPayment > 0 && (
                  <tr className="bg-sky-50/50">
                    <td className="px-3 py-2 font-medium text-sky-800">Advance / Extra Credit Balance</td>
                    <td className="px-3 py-2 text-right font-bold text-sky-700">{formatCurrency(payment.extraPayment)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Seal & Sign Footer */}
          <div className="mt-6 flex items-end justify-between pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50/80 px-3 py-2 text-emerald-800">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-[11px] font-bold uppercase leading-none">Status: {payment.status}</p>
                <p className="text-[10px] text-emerald-700">Verified & Reconciled</p>
              </div>
            </div>

            <div className="text-right">
              <div className="h-10 border-b border-dashed border-slate-300 w-36 ml-auto" />
              <p className="mt-1 text-[11px] font-bold text-slate-700">Accounts Department</p>
              <p className="text-[10px] text-slate-400">Computer Generated Receipt</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4 no-print">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download PDF Receipt
          </button>
        </div>
      </div>
    </Modal>
  );
};
