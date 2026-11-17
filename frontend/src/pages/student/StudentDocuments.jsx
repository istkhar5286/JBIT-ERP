import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { AdmitCardModal } from '../../components/common/AdmitCardModal';
import {
  Award,
  FileCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Lock,
  CreditCard,
  Building2,
  ShieldCheck,
  Eye,
  CreditCard as IdCardIcon,
  Upload,
  Trash2,
  Plus
} from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const StudentDocuments = () => {
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingDoc, setDownloadingDoc] = useState(null);
  const [showAdmitCardModal, setShowAdmitCardModal] = useState(false);

  // Uploaded docs repository
  const [myDocs, setMyDocs] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    documentType: 'ACADEMIC_CERTIFICATE',
    fileData: '',
    fileName: '',
    fileType: 'application/pdf'
  });

  const fetchEligibility = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/documents/eligibility');
      if (res.data?.success) {
        setEligibility(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check document eligibility');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyDocs = async () => {
    try {
      const res = await api.get('/student/documents');
      if (res.data?.success) {
        setMyDocs(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEligibility();
    fetchMyDocs();
  }, []);

  const handleDownload = async (docType, endpoint, filename, params = {}) => {
    try {
      setDownloadingDoc(docType);
      const res = await api.get(endpoint, {
        params,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Document download failed.');
    } finally {
      setDownloadingDoc(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('File size must be under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadForm((prev) => ({
        ...prev,
        fileData: event.target.result,
        fileName: file.name,
        fileType: file.type || 'application/pdf'
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDocument = async (e) => {
    e.preventDefault();
    if (!uploadForm.fileData) {
      alert('Please select a file to upload');
      return;
    }

    setUploadingDoc(true);
    try {
      const res = await api.post('/student/documents', uploadForm);
      if (res.data?.success) {
        setShowUploadModal(false);
        setUploadForm({
          title: '',
          documentType: 'ACADEMIC_CERTIFICATE',
          fileData: '',
          fileName: '',
          fileType: 'application/pdf'
        });
        fetchMyDocs();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!window.confirm('Delete this uploaded document?')) return;
    try {
      const res = await api.delete(`/student/documents/${id}`);
      if (res.data?.success) {
        setMyDocs((prev) => prev.filter((d) => d._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const canAdmitCard = eligibility?.canDownloadAdmitCard;
  const canClearance = eligibility?.canDownloadClearance;
  const canNoDues = eligibility?.canDownloadNoDues;
  const pendingAmt = Number(eligibility?.pendingAmount || 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3.5">
          <img
            src={BRANDING.LOGO}
            alt={BRANDING.LOGO_ALT}
            className="h-12 w-12 object-contain rounded-xl bg-slate-50 p-1 border border-slate-200 shrink-0"
          />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Award className="h-6 w-6 text-indigo-600" />
              Admit Card & Institutional Certificates
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {BRANDING.INSTITUTE_NAME} &bull; Official Digital Examination & Accounts Credentials
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchEligibility}
          className="self-start sm:self-auto rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
        >
          Refresh Eligibility
        </button>
      </div>

      {/* High-priority Banner if Fee is Pending */}
      {!canAdmitCard && (
        <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/90 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-rose-950">
                Examination Admit Card Locked &bull; Outstanding Fee Dues
              </h3>
              <p className="mt-1 text-xs font-semibold text-rose-800 leading-relaxed">
                Please clear your pending fees to download the admit card.
              </p>
              <p className="mt-0.5 text-xs text-rose-700">
                University examination regulations require complete financial settlement (₹0 balance) prior to issuing examination admit cards and fee clearance vouchers.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <Link
                  to="/pay-fees"
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition-all"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Pay Outstanding Fees (₹{pendingAmt.toLocaleString('en-IN')})</span>
                </Link>
                <Link
                  to="/fees"
                  className="text-xs font-bold text-rose-900 underline hover:text-rose-700"
                >
                  View Breakdown
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: Official Institutional Certificates */}
      <div>
        <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-600" />
          <span>Official Institutional Certificates Suite</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Examination Admit Card */}
          <div className={`rounded-2xl border bg-white p-6 shadow-sm flex flex-col justify-between transition-all ${
            canAdmitCard ? 'border-emerald-200 ring-2 ring-emerald-500/10' : 'border-slate-200 opacity-95'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  canAdmitCard ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {canAdmitCard ? <CheckCircle2 className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider ${
                  canAdmitCard ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {canAdmitCard ? 'CLEAR & ELIGIBLE' : 'LOCKED'}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Examination Admit Card
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Official JBIT Hall Ticket for upcoming university semester exams. Physically embeds student passport photo.
              </p>

              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs space-y-1.5 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fee Status:</span>
                  <span className={`font-bold ${canAdmitCard ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {canAdmitCard ? 'CLEAR (₹0 Due)' : `PENDING (₹${pendingAmt.toLocaleString('en-IN')})`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Academic Session:</span>
                  <span className="font-semibold text-slate-800">2024-2025</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              {canAdmitCard ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAdmitCardModal(true)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50/80 py-3 text-xs font-bold text-emerald-800 shadow-sm hover:bg-emerald-100 transition-all cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                  <button
                    type="button"
                    disabled={downloadingDoc === 'ADMIT_CARD'}
                    onClick={() => handleDownload('ADMIT_CARD', '/student/documents/admit-card', 'JBIT_Admit_Card.pdf')}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {downloadingDoc === 'ADMIT_CARD' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>PDF</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-200 py-3 text-xs font-bold text-slate-500 cursor-not-allowed"
                  >
                    <Lock className="h-4 w-4" />
                    Locked (Clear Dues)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. Fee Clearance Certificate */}
          <div className={`rounded-2xl border bg-white p-6 shadow-sm flex flex-col justify-between transition-all ${
            canClearance ? 'border-emerald-200 ring-2 ring-emerald-500/10' : 'border-slate-200 opacity-95'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  canClearance ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {canClearance ? <FileCheck className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider ${
                  canClearance ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {canClearance ? 'VERIFIED' : 'RESTRICTED'}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Fee Clearance Certificate
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Official accounts division statement certifying ₹0 balance for scholarships, visas, or placements.
              </p>

              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs space-y-1.5 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Clearance Status:</span>
                  <span className={`font-bold ${canClearance ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {canClearance ? 'NIL OUTSTANDING' : `₹${pendingAmt.toLocaleString('en-IN')} Due`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Issued By:</span>
                  <span className="font-semibold text-slate-800">Accounts Office, JBIT</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              {canClearance ? (
                <button
                  disabled={downloadingDoc === 'CLEARANCE'}
                  onClick={() => handleDownload('CLEARANCE', '/student/documents/clearance-certificate', 'JBIT_Fee_Clearance_Certificate.pdf')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {downloadingDoc === 'CLEARANCE' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>Download Clearance (PDF)</span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-200 py-3 text-xs font-bold text-slate-500 cursor-not-allowed"
                >
                  <Lock className="h-4 w-4" />
                  Locked (Fee Pending)
                </button>
              )}
            </div>
          </div>

          {/* 3. Institutional No-Dues Certificate */}
          <div className={`rounded-2xl border bg-white p-6 shadow-sm flex flex-col justify-between transition-all ${
            canNoDues ? 'border-emerald-200 ring-2 ring-emerald-500/10' : 'border-slate-200 opacity-95'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  canNoDues ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {canNoDues ? <ShieldCheck className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider ${
                  canNoDues ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {canNoDues ? 'ALL CLEARED' : 'DUES PENDING'}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                No-Dues Certificate
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Multi-departmental voucher confirming 0 dues across Tuition, Library, Hostels, Labs, and Transport.
              </p>

              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs space-y-1.5 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Unpaid Fines:</span>
                  <span className={`font-bold ${eligibility?.unpaidFinesCount === 0 ? 'text-emerald-700' : 'text-amber-600'}`}>
                    {eligibility?.unpaidFinesCount === 0 ? '0 Unpaid' : `${eligibility?.unpaidFinesCount} Pending`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Departments:</span>
                  <span className="font-semibold text-slate-800">5 Verified</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              {canNoDues ? (
                <button
                  disabled={downloadingDoc === 'NO_DUES'}
                  onClick={() => handleDownload('NO_DUES', '/student/documents/no-dues-certificate', 'JBIT_No_Dues_Certificate.pdf')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-700 py-3 text-xs font-bold text-white shadow-md hover:bg-sky-800 transition-all disabled:opacity-50"
                >
                  {downloadingDoc === 'NO_DUES' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>Download No-Dues (PDF)</span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-200 py-3 text-xs font-bold text-slate-500 cursor-not-allowed"
                >
                  <Lock className="h-4 w-4" />
                  Locked (Dues Pending)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Student ID Card & Academic Credentials */}
      <div>
        <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
          <IdCardIcon className="h-5 w-5 text-indigo-600" />
          <span>Identity Cards & Academic Endorsements</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Official Student ID Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-all">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-4">
                <IdCardIcon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Official Student ID Card
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Laminated photo ID card format with embedded high-res student photo, verified barcode/QR code, and emergency contact details.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={downloadingDoc === 'ID_CARD'}
                onClick={() => handleDownload('ID_CARD', '/student/documents/id-card', 'JBIT_Student_ID_Card.pdf')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 py-3 text-xs font-bold text-white shadow-md transition-all disabled:opacity-50"
              >
                {downloadingDoc === 'ID_CARD' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>Download ID Card (PDF)</span>
              </button>
            </div>
          </div>

          {/* Bonafide Student Certificate */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-all">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Bonafide Certificate
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Institutional certification confirming active bona fide student status for bank education loans, passport, bus passes, or scholarships.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={downloadingDoc === 'BONAFIDE'}
                onClick={() => handleDownload('BONAFIDE', '/student/documents/bonafide', 'JBIT_Bonafide_Certificate.pdf')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 py-3 text-xs font-bold text-white shadow-md transition-all disabled:opacity-50"
              >
                {downloadingDoc === 'BONAFIDE' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>Download Bonafide (PDF)</span>
              </button>
            </div>
          </div>

          {/* Character Certificate */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-all">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Character Certificate
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Formal conduct certificate certifying good moral character and disciplinary standing during academic tenure at JBIT.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={downloadingDoc === 'CHARACTER'}
                onClick={() => handleDownload('CHARACTER', '/student/documents/character', 'JBIT_Character_Certificate.pdf')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-bold text-white shadow-md transition-all disabled:opacity-50"
              >
                {downloadingDoc === 'CHARACTER' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>Download Character (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Student Uploaded Documents Repository */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Upload className="h-5 w-5 text-indigo-600" />
              <span>Personal Documents Archive</span>
            </h2>
            <p className="text-xs text-slate-500">
              Upload and securely maintain your Aadhaar, 10th/12th marksheets, and previous diplomas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          {myDocs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileText className="h-8 w-8 mx-auto text-slate-300 mb-1.5" />
              <p className="text-xs font-bold text-slate-700">No documents uploaded yet</p>
              <p className="text-[11px] text-slate-400">Store academic certificates for quick institutional verification.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myDocs.map((doc) => (
                <div key={doc._id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{doc.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {doc.fileName} &bull; {doc.documentType} &bull; Uploaded {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={doc.fileData}
                      download={doc.fileName}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc._id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h2 className="text-base font-black text-slate-900 mb-1">Upload Student Document</h2>
            <p className="text-xs text-slate-500 mb-4">Supported formats: PDF, PNG, JPEG (up to 8MB).</p>

            <form onSubmit={handleSaveDocument} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="e.g. 10th Board Certificate / Aadhaar Card"
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Type</label>
                <select
                  value={uploadForm.documentType}
                  onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="ACADEMIC_CERTIFICATE">Academic Certificate</option>
                  <option value="ID_PROOF">ID Proof / Aadhaar</option>
                  <option value="MARKSHEET">Previous Marksheet</option>
                  <option value="ADMISSION">Admission Offer Letter</option>
                  <option value="OTHER">Other Official Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Select File</label>
                <input
                  type="file"
                  required
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingDoc}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {uploadingDoc && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admit Card Preview Modal */}
      <AdmitCardModal
        isOpen={showAdmitCardModal}
        onClose={() => setShowAdmitCardModal(false)}
        student={user}
        isDownloading={downloadingDoc === 'ADMIT_CARD'}
        onDownload={() => handleDownload('ADMIT_CARD', '/student/documents/admit-card', 'JBIT_Admit_Card.pdf')}
      />
    </div>
  );
};
