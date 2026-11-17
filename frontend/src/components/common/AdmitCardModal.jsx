import React from 'react';
import { Modal } from './Modal';
import { Download, Printer, Award, CheckCircle2, User } from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const AdmitCardModal = ({ isOpen, onClose, student, onDownload, isDownloading }) => {
  if (!student) return null;

  const admitCardNumber = `JBIT/AC/${student.academicYear?.replace('-', '') || '2025'}/${student.universityRollNumber || 'N/A'}`;
  const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const subjects = [
    { code: 'CS-401', name: 'Operating Systems & Architecture', date: '20-May-2025', time: '10:00 AM - 01:00 PM' },
    { code: 'CS-402', name: 'Database Management Systems', date: '23-May-2025', time: '10:00 AM - 01:00 PM' },
    { code: 'CS-403', name: 'Theory of Computation & Automata', date: '26-May-2025', time: '10:00 AM - 01:00 PM' },
    { code: 'CS-404', name: 'Computer Networks & Protocols', date: '29-May-2025', time: '10:00 AM - 01:00 PM' },
    { code: 'CS-405', name: 'Design & Analysis of Algorithms', date: '02-Jun-2025', time: '10:00 AM - 01:00 PM' }
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Examination Admit Card Preview"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Printable Card Area */}
        <div
          id="printable-admit-card"
          className="rounded-xl border-2 border-indigo-900/40 bg-white p-5 shadow-sm font-sans text-slate-800"
        >
          {/* Official Crest Header */}
          <div className="rounded-lg bg-indigo-900 p-4 text-white">
            <div className="flex items-center gap-3">
              <img
                src={BRANDING.LOGO}
                alt={BRANDING.LOGO_ALT}
                className="h-14 w-14 object-contain rounded bg-white p-1 shrink-0"
              />
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-black tracking-wide uppercase">
                  {import.meta.env.VITE_COLLEGE_NAME || 'JB Institute of Technology'}
                </h2>
                <p className="text-[10.5px] text-indigo-200">
                  (Approved by AICTE, Affiliated to State Technical University | College Code: {import.meta.env.VITE_COLLEGE_CODE || 'JBIT-101'})
                </p>
                <p className="text-[10px] text-indigo-300 mt-0.5">
                  23 Milestone, NH-07, Chakrata Rd, Shankarpur, Uttarakhand 248197 | Tel: +91 9876543210
                </p>
              </div>
            </div>
          </div>

          {/* Document Title Banner */}
          <div className="mt-3 rounded bg-indigo-100 py-1.5 text-center">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-indigo-950">
              EXAMINATION ADMIT CARD
            </h3>
            <p className="text-[10px] text-indigo-800 italic">
              ACADEMIC SESSION: {student.academicYear || '2024-2025'} &bull; SEMESTER EXAMINATIONS
            </p>
          </div>

          {/* Verification Status Ribbon */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-300 bg-emerald-50/80 px-3 py-2 text-xs">
            <div className="font-bold text-emerald-900">
              <span>Admit Card No: </span>
              <span className="font-mono text-emerald-950">{admitCardNumber}</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Fee Clearance Status: VERIFIED / CLEAR (₹0 Dues)</span>
            </div>
          </div>

          {/* Student Particulars & Passport Photo Box */}
          <div className="mt-3 rounded-lg border border-slate-300 bg-slate-50/40 p-4">
            <div className="flex flex-col-reverse sm:flex-row items-start justify-between gap-4">
              {/* Student Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs flex-1">
                <div>
                  <span className="text-slate-500">Candidate Full Name: </span>
                  <span className="font-bold text-slate-900 block sm:inline">{student.fullName?.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-slate-500">Father's Name: </span>
                  <span className="font-bold text-slate-900 block sm:inline">{student.fatherName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500">University Roll No: </span>
                  <span className="font-mono font-bold text-slate-900 block sm:inline">{student.universityRollNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">College Reg. Number: </span>
                  <span className="font-mono font-bold text-slate-900 block sm:inline">{student.collegeRegistrationNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Enrolled Course: </span>
                  <span className="font-bold text-slate-900 block sm:inline">{student.course}</span>
                </div>
                <div>
                  <span className="text-slate-500">Semester / Branch: </span>
                  <span className="font-bold text-slate-900 block sm:inline">
                    Semester {student.semester} &bull; {student.branch || 'Engineering'}
                  </span>
                </div>
              </div>

              {/* Passport Photo Box */}
              <div className="shrink-0 self-center sm:self-start">
                <div className="h-32 w-28 rounded-lg border-2 border-slate-300 bg-white p-1 shadow-inner flex flex-col items-center justify-center overflow-hidden">
                  {student.profilePhoto ? (
                    <img
                      src={student.profilePhoto}
                      alt={`${student.fullName} Profile`}
                      className="h-full w-full object-contain rounded"
                    />
                  ) : (
                    <div className="h-full w-full rounded border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-2 text-center">
                      <User className="h-8 w-8 text-slate-400 mb-1" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                        AFFIX PASSPORT
                      </span>
                      <span className="text-[8.5px] text-slate-400">
                        PHOTO HERE
                      </span>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-center text-[10px] font-semibold text-slate-500">
                  {student.profilePhoto ? 'Candidate Photo' : 'No Photo Affixed'}
                </p>
              </div>
            </div>
          </div>

          {/* Exam Timetable */}
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-indigo-900 text-white font-bold uppercase text-[10.5px]">
                <tr>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Subject / Course Title</th>
                  <th className="px-3 py-2">Exam Date</th>
                  <th className="px-3 py-2">Session</th>
                  <th className="px-3 py-2 text-right">Invigilator Sign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subjects.map((sub, idx) => (
                  <tr key={sub.code} className={idx % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'}>
                    <td className="px-3 py-2 font-mono font-bold text-slate-900">{sub.code}</td>
                    <td className="px-3 py-2 text-slate-800">{sub.name}</td>
                    <td className="px-3 py-2 text-slate-700 font-medium">{sub.date}</td>
                    <td className="px-3 py-2 text-slate-600">{sub.time}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="h-4 w-20 border-b border-dashed border-slate-300 ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Candidate Instructions */}
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/90 p-3 text-[10px] text-slate-600 space-y-1">
            <h4 className="font-bold text-indigo-950 uppercase tracking-wide">
              Important Instructions for Candidate:
            </h4>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Candidates must carry this printed Admit Card along with their official College ID Card to each examination session.</li>
              <li>Entry to the examination hall will not be permitted after 15 minutes from the commencement of the examination.</li>
              <li>Electronic gadgets, smartphones, programmable calculators, and smart watches are strictly prohibited.</li>
              <li>This admit card is valid only when all institutional semester fees are fully cleared.</li>
            </ol>
            <p className="text-[9.5px] text-slate-500 pt-1 border-t border-slate-200 mt-2">
              Issue Date: {issueDate} &bull; Verified by Registrar Office, JB Institute of Technology
            </p>
          </div>

          {/* Signatures */}
          <div className="mt-6 flex items-end justify-between px-3 pt-4 border-t border-slate-300">
            <div className="text-center">
              <div className="h-8 border-b border-slate-400 w-36" />
              <p className="mt-1 text-[10px] font-bold uppercase text-slate-700">Candidate Signature</p>
            </div>
            <div className="text-center">
              <div className="h-8 border-b border-slate-400 w-44" />
              <p className="mt-1 text-[10px] font-bold uppercase text-slate-700">Controller of Examinations</p>
              <p className="text-[9px] text-slate-500">JB Institute of Technology, Dehradun</p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4 no-print">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print Admit Card
          </button>
          <button
            disabled={isDownloading}
            onClick={onDownload}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Generating PDF...' : 'Download Admit Card (PDF)'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
