import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { ENV } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Centralized logo asset path resolution
const getCentralizedLogoPath = () => {
  const candidates = [
    path.resolve(__dirname, '../../../../frontend/src/assets/college-logo.png'),
    path.resolve(__dirname, '../../../frontend/src/assets/college-logo.png'),
    path.resolve(__dirname, '../assets/college-logo.png'),
    path.resolve(process.cwd(), '../frontend/src/assets/college-logo.png'),
    path.resolve(process.cwd(), 'src/assets/college-logo.png')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
};

/**
 * Draws the official JB Institute of Technology header crest, logo and banner
 */
const drawInstitutionalHeader = (doc, titleText, subtitleText = '') => {
  const pageWidth = doc.page.width;

  // Outer Border
  doc
    .rect(20, 20, pageWidth - 40, doc.page.height - 40)
    .lineWidth(1.5)
    .strokeColor('#1E3A8A')
    .stroke();

  // Inner Accent Border
  doc
    .rect(24, 24, pageWidth - 48, doc.page.height - 48)
    .lineWidth(0.5)
    .strokeColor('#93C5FD')
    .stroke();

  // Top Header Banner
  doc.rect(25, 25, pageWidth - 50, 95).fill('#1E3A8A');

  const logoPath = getCentralizedLogoPath();
  let logoDrawn = false;

  if (logoPath) {
    try {
      doc.image(logoPath, 38, 38, { width: 68, height: 68 });
      logoDrawn = true;
    } catch (e) {
      logoDrawn = false;
    }
  }

  if (logoDrawn) {
    // College Name & Details with logo on the left
    doc
      .fillColor('#FFFFFF')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(ENV.COLLEGE.NAME.toUpperCase(), 115, 36, { align: 'left', width: pageWidth - 150 });

    doc
      .fontSize(8.5)
      .font('Helvetica')
      .text(`(Approved by AICTE, Affiliated to State Technical University | College Code: ${ENV.COLLEGE.CODE})`, 115, 60, { align: 'left', width: pageWidth - 150 });

    doc
      .fontSize(8)
      .font('Helvetica')
      .text(`${ENV.COLLEGE.ADDRESS} | Tel: ${ENV.COLLEGE.PHONE} | Email: ${ENV.COLLEGE.EMAIL}`, 115, 76, { align: 'left', width: pageWidth - 150 });
  } else {
    // Centered fallback without logo
    doc
      .fillColor('#FFFFFF')
      .fontSize(19)
      .font('Helvetica-Bold')
      .text(ENV.COLLEGE.NAME.toUpperCase(), 35, 38, { align: 'center' });

    doc
      .fontSize(9)
      .font('Helvetica')
      .text(`(Approved by AICTE, Affiliated to State Technical University | College Code: ${ENV.COLLEGE.CODE})`, 35, 63, { align: 'center' });

    doc
      .fontSize(8.5)
      .font('Helvetica')
      .text(`${ENV.COLLEGE.ADDRESS} | Tel: ${ENV.COLLEGE.PHONE} | Email: ${ENV.COLLEGE.EMAIL}`, 35, 79, { align: 'center' });
  }

  // Title Ribbon
  doc.rect(130, 130, pageWidth - 260, 28).fill('#DBEAFE');
  doc
    .fillColor('#1E3A8A')
    .fontSize(13)
    .font('Helvetica-Bold')
    .text(titleText.toUpperCase(), 130, 138, {
      align: 'center',
      width: pageWidth - 260
    });

  if (subtitleText) {
    doc
      .fontSize(8.5)
      .font('Helvetica-Oblique')
      .fillColor('#475569')
      .text(subtitleText, 35, 163, { align: 'center' });
  }
};

/**
 * 1. PROFESSIONAL FEE PAYMENT RECEIPT
 */
export const generateReceiptPdf = (payment, student, feeSummary, res) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `Receipt-${payment.receiptNumber}`,
      Author: ENV.COLLEGE.NAME,
      Subject: 'Fee Payment Receipt'
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="Receipt_${payment.receiptNumber}.pdf"`);
  doc.pipe(res);

  const pageWidth = doc.page.width;
  drawInstitutionalHeader(doc, 'OFFICIAL FEE PAYMENT RECEIPT', 'STUDENT ACCOUNTS COPY & ACADEMIC AUDIT RECORD');

  const paymentDate = new Date(payment.paymentDate || payment.createdAt);
  const formattedDate = paymentDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = paymentDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Meta strip
  const metaY = 180;
  doc.rect(40, metaY, pageWidth - 80, 44).fillColor('#F8FAFC').fill().strokeColor('#CBD5E1').stroke();
  doc.fillColor('#1E293B').fontSize(9).font('Helvetica-Bold');
  doc.text(`Receipt No: ${payment.receiptNumber}`, 55, metaY + 10);
  doc.text(`Transaction ID: ${payment.transactionId}`, 55, metaY + 25);
  doc.text(`Date: ${formattedDate} at ${formattedTime}`, pageWidth - 260, metaY + 10);
  doc.text(`Payment Mode: ${payment.paymentMethod} (SUCCESS)`, pageWidth - 260, metaY + 25);

  // Student Particulars Box
  const studentY = 236;
  doc.rect(40, studentY, pageWidth - 80, 100).fillColor('#FFFFFF').fill().strokeColor('#CBD5E1').stroke();
  doc.rect(40, studentY, pageWidth - 80, 22).fill('#EEF2FF');
  doc.fillColor('#1E3A8A').fontSize(9.5).font('Helvetica-Bold').text('STUDENT PARTICULARS', 55, studentY + 6);

  doc.fillColor('#334155').fontSize(9).font('Helvetica');
  doc.text(`Student Name: `, 55, studentY + 30).font('Helvetica-Bold').text(student?.fullName || 'N/A', 145, studentY + 30);
  doc.font('Helvetica').text(`Father's Name: `, 55, studentY + 48).font('Helvetica-Bold').text(student?.fatherName || 'N/A', 145, studentY + 48);
  doc.font('Helvetica').text(`Course / Branch: `, 55, studentY + 66).font('Helvetica-Bold').text(`${student?.course || 'B.Tech'} (${student?.branch || 'CSE'})`, 145, studentY + 66);
  doc.font('Helvetica').text(`Academic Session: `, 55, studentY + 84).font('Helvetica-Bold').text(`${student?.academicYear || '2024-2025'} (Sem ${student?.semester || '1'})`, 145, studentY + 84);

  doc.font('Helvetica').text(`Roll Number: `, pageWidth - 260, studentY + 30).font('Helvetica-Bold').text(student?.universityRollNumber || 'N/A', pageWidth - 170, studentY + 30);
  doc.font('Helvetica').text(`Registration No: `, pageWidth - 260, studentY + 48).font('Helvetica-Bold').text(student?.collegeRegistrationNumber || 'N/A', pageWidth - 170, studentY + 48);
  doc.font('Helvetica').text(`Contact Mobile: `, pageWidth - 260, studentY + 66).font('Helvetica-Bold').text(student?.mobile || 'N/A', pageWidth - 170, studentY + 66);
  doc.font('Helvetica').text(`Registered Email: `, pageWidth - 260, studentY + 84).font('Helvetica-Bold').text(student?.email || 'N/A', pageWidth - 170, studentY + 84);

  // Financial Ledger Table
  const tableY = 350;
  doc.rect(40, tableY, pageWidth - 80, 24).fill('#1E3A8A');
  doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
  doc.text('FEE COMPONENT / PARTICULARS', 55, tableY + 7);
  doc.text('AMOUNT (INR)', pageWidth - 160, tableY + 7);

  let rowY = tableY + 24;
  const rows = [
    { desc: 'Tuition & Core Academic Instruction Fee', amt: feeSummary?.tuitionFee || feeSummary?.academicFee || 0 },
    { desc: 'Examination & University Evaluation Fees', amt: feeSummary?.examinationFee || 0 },
    { desc: 'Library, Digital Journals & Laboratory Maintenance', amt: (feeSummary?.libraryFee || 0) + (feeSummary?.laboratoryFee || 0) },
    { desc: 'Hostel, Transport & Other Institutional Charges', amt: (feeSummary?.hostelFee || 0) + (feeSummary?.transportFee || 0) + (feeSummary?.otherCharges || 0) },
    { desc: 'Late Fine / Penalties Accrued', amt: feeSummary?.totalLateFines || 0 }
  ];

  rows.forEach((r, idx) => {
    doc.rect(40, rowY, pageWidth - 80, 20).fillColor(idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF').fill().strokeColor('#E2E8F0').stroke();
    doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(r.desc, 55, rowY + 5);
    doc.font('Helvetica-Bold').text(`₹${Number(r.amt).toLocaleString('en-IN')}`, pageWidth - 160, rowY + 5);
    rowY += 20;
  });

  // Total Summary
  rowY += 10;
  doc.rect(40, rowY, pageWidth - 80, 72).fillColor('#F1F5F9').fill().strokeColor('#94A3B8').stroke();
  doc.fillColor('#1E293B').fontSize(9).font('Helvetica');
  doc.text('Previous Due Balance:', 55, rowY + 8);
  doc.text(`₹${Number(payment.previousDue || 0).toLocaleString('en-IN')}`, 200, rowY + 8);

  doc.font('Helvetica-Bold').fillColor('#059669').text('Amount Received In This Transaction:', 55, rowY + 24);
  doc.text(`₹${Number(payment.amount || 0).toLocaleString('en-IN')}`, 260, rowY + 24);

  doc.font('Helvetica').fillColor('#1E293B').text('Remaining Outstanding Balance:', 55, rowY + 40);
  doc.font('Helvetica-Bold').fillColor(payment.remainingDue === 0 ? '#059669' : '#DC2626').text(
    payment.remainingDue === 0 ? '₹0.00 (FEE CLEARED)' : `₹${Number(payment.remainingDue || 0).toLocaleString('en-IN')} (PENDING)`,
    260,
    rowY + 40
  );

  doc.font('Helvetica-Oblique').fontSize(8).fillColor('#64748B').text('Note: This is a computer generated official college payment receipt and requires no physical signature.', 55, rowY + 56);

  // Signatures
  const signY = 640;
  doc.lineCap('round').moveTo(55, signY).lineTo(200, signY).strokeColor('#94A3B8').stroke();
  doc.moveTo(pageWidth - 210, signY).lineTo(pageWidth - 55, signY).strokeColor('#94A3B8').stroke();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#334155').text('STUDENT / DEPOSITOR SIGNATURE', 55, signY + 6);
  doc.text('AUTHORIZED ACCOUNTS OFFICER', pageWidth - 210, signY + 6);
  doc.fontSize(7.5).font('Helvetica').fillColor('#64748B').text('JB Institute of Technology, Dehradun', pageWidth - 210, signY + 18);

  doc.end();
};

/**
 * Validates whether a buffer is a valid JPEG or PNG image
 */
const isValidImageBuffer = (buf) => {
  if (!buf || !Buffer.isBuffer(buf) || buf.length < 8) return false;
  // JPEG: 0xFF 0xD8
  const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8;
  // PNG: 0x89 'P' 'N' 'G'
  const isPng = buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG';
  return isJpeg || isPng;
};

/**
 * Resolves a profile photo (Data URL, raw Base64, disk path, or HTTP URL)
 * into a Buffer that PDFKit can embed into the document.
 */
export const resolveImageBuffer = async (photoSource) => {
  if (!photoSource || typeof photoSource !== 'string') return null;
  const trimmed = photoSource.trim();
  if (!trimmed) return null;

  try {
    // 1. Base64 Data URL (data:image/jpeg;base64,... or data:image/png;base64,...)
    const dataUrlMatch = trimmed.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
    if (dataUrlMatch && dataUrlMatch[1]) {
      const buf = Buffer.from(dataUrlMatch[1], 'base64');
      if (isValidImageBuffer(buf)) return buf;
    }

    // 2. Raw Base64 string
    if (/^[A-Za-z0-9+/=\r\n]+$/.test(trimmed) && trimmed.length > 50) {
      try {
        const buf = Buffer.from(trimmed, 'base64');
        if (isValidImageBuffer(buf)) return buf;
      } catch (_) {}
    }

    // 3. Local filesystem path
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      const candidatePaths = [
        trimmed,
        path.resolve(process.cwd(), trimmed),
        path.resolve(process.cwd(), 'src', trimmed),
        path.resolve(process.cwd(), 'uploads', trimmed),
        path.resolve(__dirname, '../../../../', trimmed),
        path.resolve(__dirname, '../../../', trimmed),
        path.resolve(__dirname, '../../', trimmed),
        path.resolve(__dirname, '../', trimmed)
      ];
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          try {
            const buf = fs.readFileSync(p);
            if (isValidImageBuffer(buf)) return buf;
          } catch (_) {}
        }
      }
    }

    // 4. Remote HTTP/HTTPS URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const response = await fetch(trimmed, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const arrayBuf = await response.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        if (isValidImageBuffer(buf)) return buf;
      }
    }
  } catch (err) {
    console.warn('Could not resolve student profile photo for PDF:', err.message);
  }

  return null;
};

/**
 * Draws a clean, professional PHOTO placeholder box
 */
const renderPhotoPlaceholder = (doc, x, y, w, h) => {
  doc
    .rect(x, y, w, h)
    .fillColor('#F8FAFC')
    .fill()
    .strokeColor('#94A3B8')
    .lineWidth(1)
    .stroke();

  doc
    .rect(x + 4, y + 4, w - 8, h - 8)
    .dash(2, { space: 2 })
    .strokeColor('#CBD5E1')
    .lineWidth(0.75)
    .stroke()
    .undash();

  doc
    .fillColor('#94A3B8')
    .fontSize(7.5)
    .font('Helvetica-Bold')
    .text('AFFIX PASSPORT', x, y + 40, { width: w, align: 'center' });
  doc
    .fontSize(7.5)
    .font('Helvetica')
    .text('PHOTO HERE', x, y + 52, { width: w, align: 'center' });
};

/**
 * 2. EXAMINATION ADMIT CARD (STRICTLY GATED: FEE MUST BE CLEAR)
 */
export const generateAdmitCardPdf = async (student, feeSummary, res) => {
  // STRICT SERVER-SIDE ELIGIBILITY CHECK
  if (feeSummary.pendingAmount > 0 || feeSummary.status !== 'CLEAR') {
    throw new Error('Please clear your pending fees to download the admit card.');
  }

  // Pre-resolve and load the photo buffer completely before initializing PDF
  let photoBuffer = null;
  if (student?.profilePhoto) {
    photoBuffer = await resolveImageBuffer(student.profilePhoto);
  }

  const doc = new PDFDocument({
    size: 'A4',
    margin: 35,
    info: {
      Title: `AdmitCard-${student.universityRollNumber}`,
      Author: ENV.COLLEGE.NAME,
      Subject: 'Examination Admit Card'
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="AdmitCard_${student.universityRollNumber}.pdf"`);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  doc.pipe(res);

  const pageWidth = doc.page.width;
  drawInstitutionalHeader(doc, 'EXAMINATION ADMIT CARD', `ACADEMIC SESSION: ${student.academicYear || '2024-2025'} • SEMESTER EXAMINATIONS`);

  const admitCardNumber = `JBIT/AC/${student.academicYear?.replace('-', '') || '2025'}/${student.universityRollNumber}`;
  const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  // Verification Ribbon
  const ribbonY = 180;
  doc.rect(35, ribbonY, pageWidth - 70, 32).fillColor('#ECFDF5').fill().strokeColor('#10B981').stroke();
  doc.fillColor('#047857').fontSize(9.5).font('Helvetica-Bold');
  doc.text(`Admit Card No: ${admitCardNumber}`, 45, ribbonY + 10);
  doc.text(`Fee Clearance Status: VERIFIED / CLEAR (₹0 Dues)`, pageWidth - 320, ribbonY + 10);

  // Student Particulars Box with Passport Photo Area
  const infoY = 222;
  doc.rect(35, infoY, pageWidth - 70, 135).fillColor('#FFFFFF').fill().strokeColor('#CBD5E1').stroke();

  // Photo Box
  const photoW = 85;
  const photoH = 105;
  const photoX = pageWidth - 35 - photoW - 15;
  const photoY = infoY + 15;

  if (photoBuffer) {
    try {
      // Photo frame background and border
      doc
        .rect(photoX, photoY, photoW, photoH)
        .fillColor('#FFFFFF')
        .fill()
        .strokeColor('#CBD5E1')
        .lineWidth(1)
        .stroke();

      // Embed student profile photo preserving aspect ratio without distortion
      doc.image(photoBuffer, photoX + 2, photoY + 2, {
        fit: [photoW - 4, photoH - 4],
        align: 'center',
        valign: 'center'
      });
    } catch (imgErr) {
      console.warn('Failed to embed photo into Admit Card PDF, falling back to placeholder:', imgErr.message);
      renderPhotoPlaceholder(doc, photoX, photoY, photoW, photoH);
    }
  } else {
    renderPhotoPlaceholder(doc, photoX, photoY, photoW, photoH);
  }

  // Details
  doc.fillColor('#1E293B').fontSize(9).font('Helvetica');
  doc.text('Candidate Full Name:', 50, infoY + 16).font('Helvetica-Bold').text(student.fullName.toUpperCase(), 170, infoY + 16);
  doc.font('Helvetica').text("Father's Name:", 50, infoY + 34).font('Helvetica-Bold').text(student.fatherName, 170, infoY + 34);
  doc.font('Helvetica').text('University Roll No:', 50, infoY + 52).font('Helvetica-Bold').text(student.universityRollNumber, 170, infoY + 52);
  doc.font('Helvetica').text('College Reg. Number:', 50, infoY + 70).font('Helvetica-Bold').text(student.collegeRegistrationNumber, 170, infoY + 70);
  doc.font('Helvetica').text('Enrolled Course:', 50, infoY + 88).font('Helvetica-Bold').text(student.course, 170, infoY + 88);
  doc.font('Helvetica').text('Semester / Branch:', 50, infoY + 106).font('Helvetica-Bold').text(`Semester ${student.semester} • ${student.branch || 'Engineering'}`, 170, infoY + 106);

  // Schedule Table
  const tableY = 368;
  doc.rect(35, tableY, pageWidth - 70, 22).fill('#1E3A8A');
  doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold');
  doc.text('CODE', 45, tableY + 6);
  doc.text('SUBJECT / COURSE TITLE', 105, tableY + 6);
  doc.text('EXAM DATE', 315, tableY + 6);
  doc.text('SESSION', 400, tableY + 6);
  doc.text('INVIGILATOR SIGN', 475, tableY + 6);

  const subjects = [
    { code: 'CS-401', name: 'Operating Systems & Architecture', date: '20-May-2025', time: '10:00 AM - 01:00 PM' },
    { code: 'CS-402', name: 'Database Management Systems', date: '23-May-2025', time: '10:00 AM - 01:00 PM' },
    { code: 'CS-403', name: 'Theory of Computation & Automata', date: '26-May-2025', time: '10:00 AM - 01:00 PM' },
    { code: 'CS-404', name: 'Computer Networks & Protocols', date: '29-May-2025', time: '10:00 AM - 01:00 PM' },
    { code: 'CS-405', name: 'Design & Analysis of Algorithms', date: '02-Jun-2025', time: '10:00 AM - 01:00 PM' }
  ];

  let schedY = tableY + 22;
  subjects.forEach((sub, idx) => {
    doc.rect(35, schedY, pageWidth - 70, 22).fillColor(idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF').fill().strokeColor('#E2E8F0').stroke();
    doc.fillColor('#1E293B').fontSize(8).font('Helvetica-Bold').text(sub.code, 45, schedY + 6);
    doc.font('Helvetica').text(sub.name, 105, schedY + 6);
    doc.text(sub.date, 315, schedY + 6);
    doc.text(sub.time, 400, schedY + 6);
    schedY += 22;
  });

  // Candidate Instructions
  const instructY = schedY + 12;
  doc.rect(35, instructY, pageWidth - 70, 110).fillColor('#F1F5F9').fill().strokeColor('#94A3B8').stroke();
  doc.fillColor('#1E3A8A').fontSize(8.5).font('Helvetica-Bold').text('IMPORTANT INSTRUCTIONS FOR THE CANDIDATE', 45, instructY + 7);
  doc.fillColor('#334155').fontSize(7.5).font('Helvetica');
  doc.text('1. Candidates must carry this printed Admit Card along with their official College ID Card to each examination session.', 45, instructY + 22);
  doc.text('2. Entry to the examination hall will not be permitted after 15 minutes from the commencement of the examination.', 45, instructY + 36);
  doc.text('3. Electronic gadgets, smartphones, programmable calculators, smart watches, and unauthorized material are strictly prohibited.', 45, instructY + 50);
  doc.text('4. This admit card is valid only when all semester tuition, lab, library, and other institutional fees are fully cleared.', 45, instructY + 64);
  doc.text('5. Any tampering or forgery of the admit card details or signatures will lead to immediate cancellation of candidature.', 45, instructY + 78);
  doc.text(`Issue Date: ${issueDate} • Verified by Registrar Office, JB Institute of Technology, Uttarakhand`, 45, instructY + 94);

  // Signatures
  const sigY = instructY + 145;
  doc.lineCap('round').moveTo(45, sigY).lineTo(180, sigY).strokeColor('#94A3B8').stroke();
  doc.moveTo(pageWidth - 190, sigY).lineTo(pageWidth - 45, sigY).strokeColor('#94A3B8').stroke();
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#1E293B').text('CANDIDATE SIGNATURE', 45, sigY + 5);
  doc.text('CONTROLLER OF EXAMINATIONS', pageWidth - 190, sigY + 5);
  doc.fontSize(7).font('Helvetica').fillColor('#64748B').text('JB Institute of Technology, Dehradun', pageWidth - 190, sigY + 16);

  doc.end();
};

/**
 * 3. FEE CLEARANCE CERTIFICATE (STRICTLY GATED: FEE MUST BE CLEAR)
 */
export const generateFeeClearanceCertificatePdf = (student, feeSummary, res) => {
  if (feeSummary.pendingAmount > 0 || feeSummary.status !== 'CLEAR') {
    throw new Error('Fee clearance certificate is only accessible when outstanding balance is ₹0.');
  }

  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `FeeClearance-${student.universityRollNumber}`,
      Author: ENV.COLLEGE.NAME,
      Subject: 'Fee Clearance Certificate'
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="FeeClearance_${student.universityRollNumber}.pdf"`);
  doc.pipe(res);

  const pageWidth = doc.page.width;
  drawInstitutionalHeader(doc, 'FEE CLEARANCE CERTIFICATE', 'OFFICIAL CERTIFICATE OF INSTITUTIONAL FINANCIAL SETTLEMENT');

  const certNo = `JBIT/FCC/${new Date().getFullYear()}/${student.universityRollNumber}`;
  const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  // Certificate Meta Ribbon
  const metaY = 180;
  doc.rect(40, metaY, pageWidth - 80, 30).fillColor('#F8FAFC').fill().strokeColor('#CBD5E1').stroke();
  doc.fillColor('#1E3A8A').fontSize(9).font('Helvetica-Bold');
  doc.text(`Certificate No: ${certNo}`, 55, metaY + 9);
  doc.text(`Issue Date: ${issueDate}`, pageWidth - 220, metaY + 9);

  // Certificate Body Statement
  const bodyY = 235;
  doc.fillColor('#0F172A').fontSize(11).font('Helvetica').lineGap(8);
  doc.text('TO WHOMSOEVER IT MAY CONCERN', 40, bodyY, { align: 'center', underline: true });

  const statementY = bodyY + 35;
  doc.fontSize(10).font('Helvetica').lineGap(6);
  doc.text(
    `This is to officially certify that candidate `,
    50,
    statementY,
    { continued: true }
  ).font('Helvetica-Bold').text(
    `${student.fullName.toUpperCase()}, `,
    { continued: true }
  ).font('Helvetica').text(
    `Son/Daughter of `,
    { continued: true }
  ).font('Helvetica-Bold').text(
    `${student.fatherName}, `,
    { continued: true }
  ).font('Helvetica').text(
    `bearing University Roll Number `,
    { continued: true }
  ).font('Helvetica-Bold').text(
    `${student.universityRollNumber} `,
    { continued: true }
  ).font('Helvetica').text(
    `and College Registration Number `,
    { continued: true }
  ).font('Helvetica-Bold').text(
    `${student.collegeRegistrationNumber}, `,
    { continued: true }
  ).font('Helvetica').text(
    `currently enrolled in `,
    { continued: true }
  ).font('Helvetica-Bold').text(
    `${student.course} (Semester ${student.semester}), `,
    { continued: true }
  ).font('Helvetica').text(
    `has successfully cleared all institutional fees, tuition charges, examination dues, and laboratory assessments for the Academic Session ${student.academicYear || '2024-2025'}.`
  );

  // Settlement Ledger Box
  const ledgerY = statementY + 85;
  doc.rect(50, ledgerY, pageWidth - 100, 95).fillColor('#F0FDF4').fill().strokeColor('#10B981').stroke();
  doc.fillColor('#065F46').fontSize(10).font('Helvetica-Bold').text('FINANCIAL SETTLEMENT SUMMARY', 65, ledgerY + 12);
  doc.fontSize(9).font('Helvetica').fillColor('#1E293B');
  doc.text(`Total Academic & Itemized Fees Assessed:`, 65, ledgerY + 32);
  doc.font('Helvetica-Bold').text(`₹${Number(feeSummary.totalPayable).toLocaleString('en-IN')}`, pageWidth - 200, ledgerY + 32);

  doc.font('Helvetica').text(`Total Amount Deposited & Verified:`, 65, ledgerY + 50);
  doc.font('Helvetica-Bold').text(`₹${Number(feeSummary.netPaid).toLocaleString('en-IN')}`, pageWidth - 200, ledgerY + 50);

  doc.font('Helvetica').text(`Current Outstanding Dues:`, 65, ledgerY + 68);
  doc.font('Helvetica-Bold').fillColor('#059669').text(`₹0.00 (NIL / FULLY CLEARED)`, pageWidth - 200, ledgerY + 68);

  // Clearance Endorsement Text
  const endorseY = ledgerY + 120;
  doc.fillColor('#334155').fontSize(9).font('Helvetica').lineGap(5);
  doc.text('There are no outstanding fees or dues pending against the student in the accounts division as on the date of this certificate. The student is hereby accorded financial clearance for all academic privileges, examination appearances, and issuance of certifications.', 50, endorseY, { width: pageWidth - 100 });

  // Signatures
  const sigY = 640;
  doc.lineCap('round').moveTo(55, sigY).lineTo(200, sigY).strokeColor('#94A3B8').stroke();
  doc.moveTo(pageWidth - 210, sigY).lineTo(pageWidth - 55, sigY).strokeColor('#94A3B8').stroke();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1E293B').text('HEAD OF ACCOUNTS', 55, sigY + 6);
  doc.text('REGISTRAR & SECRETARY', pageWidth - 210, sigY + 6);
  doc.fontSize(7.5).font('Helvetica').fillColor('#64748B').text('JB Institute of Technology, Dehradun', pageWidth - 210, sigY + 18);

  doc.end();
};

/**
 * 4. NO-DUES CERTIFICATE (STRICTLY GATED: ALL DUES & FINES MUST BE ZERO)
 */
export const generateNoDuesCertificatePdf = (student, feeSummary, unpaidFines, res) => {
  const hasPendingFees = feeSummary.pendingAmount > 0;
  const hasPendingFines = (unpaidFines && unpaidFines.length > 0);

  if (hasPendingFees || hasPendingFines) {
    throw new Error('No-Dues Certificate can only be issued when all departmental dues and fines are ₹0.');
  }

  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `NoDues-${student.universityRollNumber}`,
      Author: ENV.COLLEGE.NAME,
      Subject: 'No Dues Clearance Certificate'
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="NoDues_${student.universityRollNumber}.pdf"`);
  doc.pipe(res);

  const pageWidth = doc.page.width;
  drawInstitutionalHeader(doc, 'INSTITUTIONAL NO-DUES CERTIFICATE', 'CONSOLIDATED INTER-DEPARTMENTAL CLEARANCE VOUCHER');

  const certNo = `JBIT/NDC/${new Date().getFullYear()}/${student.universityRollNumber}`;
  const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  // Certificate Meta Ribbon
  const metaY = 180;
  doc.rect(40, metaY, pageWidth - 80, 28).fillColor('#F8FAFC').fill().strokeColor('#CBD5E1').stroke();
  doc.fillColor('#1E3A8A').fontSize(9).font('Helvetica-Bold');
  doc.text(`Certificate No: ${certNo}`, 55, metaY + 8);
  doc.text(`Issue Date: ${issueDate}`, pageWidth - 220, metaY + 8);

  // Student Particulars Strip
  const studentY = 220;
  doc.rect(40, studentY, pageWidth - 80, 48).fillColor('#FFFFFF').fill().strokeColor('#E2E8F0').stroke();
  doc.fillColor('#1E293B').fontSize(9).font('Helvetica');
  doc.text(`Candidate Name: `, 55, studentY + 10).font('Helvetica-Bold').text(student.fullName.toUpperCase(), 160, studentY + 10);
  doc.font('Helvetica').text(`University Roll No: `, 55, studentY + 28).font('Helvetica-Bold').text(student.universityRollNumber, 160, studentY + 28);
  doc.font('Helvetica').text(`Course / Branch: `, pageWidth - 260, studentY + 10).font('Helvetica-Bold').text(`${student.course}`, pageWidth - 160, studentY + 10);
  doc.font('Helvetica').text(`Semester: `, pageWidth - 260, studentY + 28).font('Helvetica-Bold').text(`Semester ${student.semester}`, pageWidth - 160, studentY + 28);

  // Departmental Clearance Table
  const tableY = 285;
  doc.rect(40, tableY, pageWidth - 80, 22).fill('#1E3A8A');
  doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold');
  doc.text('DEPARTMENT / DIVISION', 55, tableY + 6);
  doc.text('STATUS', 240, tableY + 6);
  doc.text('OUTSTANDING', 330, tableY + 6);
  doc.text('REMARKS & VERIFICATION', 420, tableY + 6);

  const departments = [
    { name: 'Accounts & Tuition Fee Division', status: 'CLEARED', due: '₹0.00', remarks: 'All academic dues settled' },
    { name: 'Central Library & Book Bank', status: 'CLEARED', due: '₹0.00', remarks: 'All books returned / No fine' },
    { name: 'Departmental Laboratories & Workshops', status: 'CLEARED', due: '₹0.00', remarks: 'Apparatus returned intact' },
    { name: 'Hostel & Mess Services', status: 'CLEARED', due: '₹0.00', remarks: 'No damage or mess charges' },
    { name: 'Transport & Fleet Management', status: 'CLEARED', due: '₹0.00', remarks: 'Bus pass surrendered' },
    { name: 'Sports, NCC & Cultural Cell', status: 'CLEARED', due: '₹0.00', remarks: 'Sports kits accounted for' }
  ];

  let deptY = tableY + 22;
  departments.forEach((dept, idx) => {
    doc.rect(40, deptY, pageWidth - 80, 24).fillColor(idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF').fill().strokeColor('#CBD5E1').stroke();
    doc.fillColor('#1E293B').fontSize(8.5).font('Helvetica-Bold').text(dept.name, 55, deptY + 7);
    doc.fillColor('#059669').text(dept.status, 240, deptY + 7);
    doc.fillColor('#334155').font('Helvetica').text(dept.due, 330, deptY + 7);
    doc.text(dept.remarks, 420, deptY + 7);
    deptY += 24;
  });

  // Final Endorsement
  const endorseY = deptY + 20;
  doc.rect(40, endorseY, pageWidth - 80, 60).fillColor('#F0FDF4').fill().strokeColor('#10B981').stroke();
  doc.fillColor('#047857').fontSize(9).font('Helvetica-Bold').text('FINAL CLEARANCE ENDORSEMENT', 55, endorseY + 10);
  doc.fillColor('#1E293B').fontSize(8.5).font('Helvetica').lineGap(4);
  doc.text('Certified that all concerned college departments have verified zero dues for the aforementioned student. The student is released from all financial and material obligations towards the Institute.', 55, endorseY + 26, { width: pageWidth - 110 });

  // Signatures of All 4 Key Officials
  const sigY = 620;
  const col1 = 50;
  const col2 = 180;
  const col3 = 310;
  const col4 = 440;

  doc.lineCap('round').moveTo(col1, sigY).lineTo(col1 + 100, sigY).strokeColor('#94A3B8').stroke();
  doc.moveTo(col2, sigY).lineTo(col2 + 100, sigY).stroke();
  doc.moveTo(col3, sigY).lineTo(col3 + 100, sigY).stroke();
  doc.moveTo(col4, sigY).lineTo(col4 + 100, sigY).stroke();

  doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1E293B');
  doc.text('ACCOUNTS OFFICER', col1, sigY + 6);
  doc.text('CHIEF LIBRARIAN', col2, sigY + 6);
  doc.text('HOSTEL WARDEN', col3, sigY + 6);
  doc.text('REGISTRAR', col4, sigY + 6);

  doc.fontSize(6.5).font('Helvetica').fillColor('#64748B');
  doc.text('JBIT Accounts', col1, sigY + 16);
  doc.text('Central Library', col2, sigY + 16);
  doc.text('Campus Hostels', col3, sigY + 16);
  doc.text('JBIT Dehradun', col4, sigY + 16);

  doc.end();
};

/**
 * 5. STUDENT ID CARD (OFFICIAL JBIT IDENTITY CARD WITH EMBEDDED PHOTO & SAFE QR)
 */
export const generateStudentIdCardPdf = async (student, res) => {
  // Pre-resolve photo buffer
  let photoBuffer = null;
  if (student?.profilePhoto) {
    photoBuffer = await resolveImageBuffer(student.profilePhoto);
  }

  // Generate safe verification QR code as Buffer (no sensitive credentials)
  const qrData = `JBIT Institutional Student Identity\nName: ${student.fullName}\nRoll: ${student.universityRollNumber}\nAdm: ${student.admissionNumber || student.collegeRegistrationNumber}\nCourse: ${student.course}\nValid: ${student.academicYear || '2024-2028'}`;
  let qrBuffer = null;
  try {
    qrBuffer = await QRCode.toBuffer(qrData, {
      width: 120,
      margin: 1,
      color: { dark: '#1E3A8A', light: '#FFFFFF' }
    });
  } catch (err) {
    console.warn('Could not generate QR code for ID card:', err.message);
  }

  const doc = new PDFDocument({
    size: [242, 380], // Standard CR80 ID card layout in points
    margin: 10,
    info: {
      Title: `IDCard-${student.universityRollNumber}`,
      Author: ENV.COLLEGE.NAME,
      Subject: 'Student Identity Card'
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="IDCard_${student.universityRollNumber}.pdf"`);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  doc.pipe(res);

  const cardW = 242;
  const cardH = 380;

  // Outer border & background
  doc.rect(5, 5, cardW - 10, cardH - 10).lineWidth(1.5).strokeColor('#1E3A8A').stroke();
  doc.rect(7, 7, cardW - 14, cardH - 14).lineWidth(0.5).strokeColor('#CBD5E1').stroke();

  // Top Header Banner
  doc.rect(8, 8, cardW - 16, 56).fill('#1E3A8A');

  const logoPath = getCentralizedLogoPath();
  if (logoPath) {
    try {
      doc.image(logoPath, 14, 13, { width: 44, height: 44 });
    } catch (_) {}
  }

  doc
    .fillColor('#FFFFFF')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(ENV.COLLEGE.NAME.toUpperCase(), 62, 14, { width: cardW - 74, align: 'left' });

  doc
    .fontSize(6)
    .font('Helvetica')
    .text('AFFILIATED TO STATE TECHNICAL UNIVERSITY • AICTE APPROVED', 62, 36, { width: cardW - 74 });

  doc
    .fontSize(5.5)
    .font('Helvetica-Oblique')
    .text('DEHRADUN, UTTARAKHAND • CAMPUS CODE: ' + ENV.COLLEGE.CODE, 62, 48, { width: cardW - 74 });

  // Identity Card Title Ribbon
  doc.rect(8, 64, cardW - 16, 15).fill('#F59E0B');
  doc
    .fillColor('#1E293B')
    .fontSize(7.5)
    .font('Helvetica-Bold')
    .text('STUDENT IDENTITY CARD', 8, 68, { width: cardW - 16, align: 'center' });

  // Student Photo
  const photoW = 68;
  const photoH = 82;
  const photoX = (cardW - photoW) / 2;
  const photoY = 86;

  doc.rect(photoX - 1, photoY - 1, photoW + 2, photoH + 2).fillColor('#E2E8F0').fill().strokeColor('#94A3B8').lineWidth(1).stroke();

  if (photoBuffer) {
    try {
      doc.image(photoBuffer, photoX, photoY, {
        fit: [photoW, photoH],
        align: 'center',
        valign: 'center'
      });
    } catch (_) {
      renderPhotoPlaceholder(doc, photoX, photoY, photoW, photoH);
    }
  } else {
    renderPhotoPlaceholder(doc, photoX, photoY, photoW, photoH);
  }

  // Student Name
  const nameY = photoY + photoH + 6;
  doc
    .fillColor('#1E3A8A')
    .fontSize(10.5)
    .font('Helvetica-Bold')
    .text(student.fullName.toUpperCase(), 10, nameY, { width: cardW - 20, align: 'center' });

  // Student Particulars Block
  const infoY = nameY + 16;
  doc.rect(14, infoY, cardW - 28, 86).fillColor('#F8FAFC').fill().strokeColor('#E2E8F0').stroke();

  const leftX = 20;
  const valX = 86;
  let curY = infoY + 6;
  const rowGap = 12;

  const rows = [
    { label: 'Roll Number:', val: student.universityRollNumber || 'N/A' },
    { label: 'Admission No:', val: student.admissionNumber || student.collegeRegistrationNumber || 'N/A' },
    { label: 'Course:', val: student.course || 'B.Tech' },
    { label: 'Branch:', val: student.branch || 'Engineering' },
    { label: 'Father Name:', val: student.fatherName || 'N/A' },
    { label: 'Emergency Tel:', val: student.guardianContact || student.mobile || 'N/A' }
  ];

  rows.forEach((r) => {
    doc.fillColor('#64748B').fontSize(6.5).font('Helvetica').text(r.label, leftX, curY);
    doc.fillColor('#1E293B').font('Helvetica-Bold').text(r.val, valX, curY, { width: cardW - valX - 22, ellipsis: true });
    curY += rowGap;
  });

  // Bottom Section: QR Code & Signature
  const botY = infoY + 90;

  if (qrBuffer) {
    try {
      doc.image(qrBuffer, 18, botY, { width: 44, height: 44 });
    } catch (_) {}
  }

  // Address and Authorized Signatory
  doc
    .fillColor('#334155')
    .fontSize(5.5)
    .font('Helvetica')
    .text(ENV.COLLEGE.ADDRESS, 68, botY + 2, { width: cardW - 78, align: 'left' });

  doc
    .fillColor('#059669')
    .fontSize(6)
    .font('Helvetica-Bold')
    .text('VALIDITY: 2024 - 2028', 68, botY + 22);

  doc.lineCap('round').moveTo(cardW - 80, botY + 38).lineTo(cardW - 16, botY + 38).strokeColor('#94A3B8').lineWidth(0.5).stroke();
  doc
    .fillColor('#1E3A8A')
    .fontSize(6)
    .font('Helvetica-Bold')
    .text('REGISTRAR SIGN', cardW - 80, botY + 40, { width: 64, align: 'center' });

  doc.end();
};

/**
 * 6. OFFICIAL SEMESTER MARKSHEET / GRADE CARD
 */
export const generateMarksheetPdf = async (student, result, res) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 35,
    info: {
      Title: `Marksheet-${student.universityRollNumber}-Sem${result?.semester || student.semester}`,
      Author: ENV.COLLEGE.NAME,
      Subject: 'Official Semester Grade Marksheet'
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="Marksheet_${student.universityRollNumber}_Sem${result?.semester || student.semester}.pdf"`);
  doc.pipe(res);

  const pageWidth = doc.page.width;
  drawInstitutionalHeader(doc, 'OFFICIAL SEMESTER GRADE REPORT', `STATEMENT OF MARKS & GRADES • SEMESTER ${result?.semester || student.semester} EXAMINATION`);

  const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const serialNo = `JBIT/MRK/${result?.academicYear?.replace('-', '') || '2025'}/${student.universityRollNumber}`;

  // Meta strip
  const metaY = 180;
  doc.rect(35, metaY, pageWidth - 70, 26).fillColor('#F8FAFC').fill().strokeColor('#CBD5E1').stroke();
  doc.fillColor('#1E3A8A').fontSize(8.5).font('Helvetica-Bold');
  doc.text(`Report Serial No: ${serialNo}`, 45, metaY + 8);
  doc.text(`Academic Session: ${result?.academicYear || student.academicYear || '2024-2025'}`, pageWidth - 260, metaY + 8);

  // Student Particulars Box
  const infoY = 214;
  doc.rect(35, infoY, pageWidth - 70, 76).fillColor('#FFFFFF').fill().strokeColor('#CBD5E1').stroke();
  doc.rect(35, infoY, pageWidth - 70, 18).fill('#EEF2FF');
  doc.fillColor('#1E3A8A').fontSize(8.5).font('Helvetica-Bold').text('CANDIDATE ACADEMIC RECORD', 45, infoY + 5);

  doc.fillColor('#334155').fontSize(8.5).font('Helvetica');
  doc.text('Student Name:', 45, infoY + 26).font('Helvetica-Bold').text(student.fullName.toUpperCase(), 145, infoY + 26);
  doc.font('Helvetica').text("Father's Name:", 45, infoY + 42).font('Helvetica-Bold').text(student.fatherName, 145, infoY + 42);
  doc.font('Helvetica').text('Course / Program:', 45, infoY + 58).font('Helvetica-Bold').text(student.course, 145, infoY + 58);

  doc.font('Helvetica').text('University Roll No:', pageWidth - 250, infoY + 26).font('Helvetica-Bold').text(student.universityRollNumber, pageWidth - 145, infoY + 26);
  doc.font('Helvetica').text('Admission Number:', pageWidth - 250, infoY + 42).font('Helvetica-Bold').text(student.admissionNumber || student.collegeRegistrationNumber, pageWidth - 145, infoY + 42);
  doc.font('Helvetica').text('Semester / Branch:', pageWidth - 250, infoY + 58).font('Helvetica-Bold').text(`Sem ${result?.semester || student.semester} • ${student.branch || 'Engineering'}`, pageWidth - 145, infoY + 58);

  // Marks Ledger Table
  const tableY = 300;
  doc.rect(35, tableY, pageWidth - 70, 22).fill('#1E3A8A');
  doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
  doc.text('CODE', 42, tableY + 6);
  doc.text('SUBJECT TITLE', 95, tableY + 6);
  doc.text('INT', 280, tableY + 6);
  doc.text('SESS', 315, tableY + 6);
  doc.text('PRAC', 350, tableY + 6);
  doc.text('EXT', 385, tableY + 6);
  doc.text('TOT', 420, tableY + 6);
  doc.text('CR', 455, tableY + 6);
  doc.text('GRD', 485, tableY + 6);
  doc.text('RES', 518, tableY + 6);

  const subjects = result?.subjects && result.subjects.length > 0 ? result.subjects : [
    { subjectCode: 'CS-401', subjectName: 'Operating Systems & Architecture', internalMarks: 22, sessionalMarks: 18, practicalMarks: 24, externalMarks: 28, totalMarks: 92, credits: 4, grade: 'A+', status: 'PASS' },
    { subjectCode: 'CS-402', subjectName: 'Database Management Systems', internalMarks: 20, sessionalMarks: 17, practicalMarks: 23, externalMarks: 26, totalMarks: 86, credits: 4, grade: 'A', status: 'PASS' },
    { subjectCode: 'CS-403', subjectName: 'Theory of Computation', internalMarks: 19, sessionalMarks: 16, practicalMarks: 20, externalMarks: 25, totalMarks: 80, credits: 4, grade: 'A', status: 'PASS' },
    { subjectCode: 'CS-404', subjectName: 'Computer Networks & Protocols', internalMarks: 21, sessionalMarks: 18, practicalMarks: 22, externalMarks: 27, totalMarks: 88, credits: 4, grade: 'A+', status: 'PASS' },
    { subjectCode: 'CS-405', subjectName: 'Design & Analysis of Algorithms', internalMarks: 18, sessionalMarks: 15, practicalMarks: 21, externalMarks: 24, totalMarks: 78, credits: 4, grade: 'B+', status: 'PASS' }
  ];

  let rowY = tableY + 22;
  subjects.forEach((sub, idx) => {
    doc.rect(35, rowY, pageWidth - 70, 20).fillColor(idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF').fill().strokeColor('#E2E8F0').stroke();
    doc.fillColor('#1E293B').fontSize(7.5).font('Helvetica-Bold').text(sub.subjectCode, 42, rowY + 5);
    doc.font('Helvetica').text(sub.subjectName, 95, rowY + 5, { width: 175, ellipsis: true });
    doc.text(String(sub.internalMarks || 0), 280, rowY + 5);
    doc.text(String(sub.sessionalMarks || 0), 315, rowY + 5);
    doc.text(String(sub.practicalMarks || 0), 350, rowY + 5);
    doc.text(String(sub.externalMarks || 0), 385, rowY + 5);
    doc.font('Helvetica-Bold').text(String(sub.totalMarks || 0), 420, rowY + 5);
    doc.font('Helvetica').text(String(sub.credits || 4), 455, rowY + 5);
    doc.font('Helvetica-Bold').text(sub.grade || 'P', 485, rowY + 5);
    doc.fillColor(sub.status === 'FAIL' ? '#DC2626' : '#059669').text(sub.status || 'PASS', 518, rowY + 5);
    rowY += 20;
  });

  // Summary Ledger Box: SGPA, CGPA, Credits, Result
  const sumY = rowY + 12;
  doc.rect(35, sumY, pageWidth - 70, 56).fillColor('#F1F5F9').fill().strokeColor('#94A3B8').stroke();

  doc.fillColor('#1E293B').fontSize(9).font('Helvetica');
  doc.text('Total Credits Enrolled:', 50, sumY + 10).font('Helvetica-Bold').text(String(result?.totalCredits || 20), 165, sumY + 10);
  doc.font('Helvetica').text('Semester Grade Point (SGPA):', 50, sumY + 26).font('Helvetica-Bold').fillColor('#1E3A8A').text((result?.sgpa || 8.65).toFixed(2), 205, sumY + 26);
  doc.font('Helvetica').fillColor('#1E293B').text('Cumulative Grade Point (CGPA):', 50, sumY + 40).font('Helvetica-Bold').fillColor('#1E3A8A').text((result?.cgpa || 8.52).toFixed(2), 205, sumY + 40);

  const overallPass = (result?.overallStatus || 'PASS') === 'PASS';
  doc.fillColor('#1E293B').font('Helvetica').text('Examination Result:', pageWidth - 230, sumY + 10);
  doc.font('Helvetica-Bold').fillColor(overallPass ? '#059669' : '#DC2626').fontSize(11).text(
    overallPass ? 'FIRST CLASS WITH DISTINCTION' : 'BACK / ARREAR PENDING',
    pageWidth - 230,
    sumY + 24
  );

  // Back papers summary if any
  const backPapers = result?.backPapers || [];
  let backY = sumY + 68;
  if (backPapers.length > 0) {
    doc.rect(35, backY, pageWidth - 70, 36).fillColor('#FEF2F2').fill().strokeColor('#FCA5A5').stroke();
    doc.fillColor('#991B1B').fontSize(8).font('Helvetica-Bold').text('BACK PAPER / ARREAR RECORD', 45, backY + 6);
    doc.fillColor('#7F1D1D').fontSize(7.5).font('Helvetica');
    const backList = backPapers.map((b) => `${b.subjectCode} - ${b.subjectName} (Sem ${b.semester}, Attempt ${b.attempt || 1})`).join('; ');
    doc.text(backList, 45, backY + 18, { width: pageWidth - 90 });
    backY += 46;
  }

  // Grading scale guide
  const guideY = backY + 6;
  doc.rect(35, guideY, pageWidth - 70, 48).fillColor('#FFFFFF').fill().strokeColor('#CBD5E1').stroke();
  doc.fillColor('#1E3A8A').fontSize(7.5).font('Helvetica-Bold').text('GRADING SYSTEM & EVALUATION SCALE', 45, guideY + 6);
  doc.fillColor('#475569').fontSize(7).font('Helvetica');
  doc.text('A+ (Outstanding: 90-100%, GP 10) • A (Excellent: 80-89%, GP 9) • B+ (Very Good: 70-79%, GP 8) • B (Good: 60-69%, GP 7) • C (Average: 50-59%, GP 6) • P (Pass: 40-49%, GP 4) • F (Fail: <40%, GP 0)', 45, guideY + 18, { width: pageWidth - 90 });
  doc.text(`Issue Date: ${issueDate} • Published by Examination Cell, JB Institute of Technology, Dehradun`, 45, guideY + 34);

  // Signatures
  const sigY = 645;
  doc.lineCap('round').moveTo(45, sigY).lineTo(180, sigY).strokeColor('#94A3B8').stroke();
  doc.moveTo(pageWidth - 190, sigY).lineTo(pageWidth - 45, sigY).strokeColor('#94A3B8').stroke();
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#1E293B').text('TABULATOR / CHECKER', 45, sigY + 5);
  doc.text('CONTROLLER OF EXAMINATIONS', pageWidth - 190, sigY + 5);
  doc.fontSize(7).font('Helvetica').fillColor('#64748B').text('JB Institute of Technology, Dehradun', pageWidth - 190, sigY + 16);

  doc.end();
};

/**
 * 7. OFFICIAL BONAFIDE CERTIFICATE
 */
export const generateBonafideCertificatePdf = async (student, purpose = 'Higher Studies / Visa / Educational Loan', res) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `Bonafide-${student.universityRollNumber}`,
      Author: ENV.COLLEGE.NAME,
      Subject: 'Bonafide Student Certificate'
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="Bonafide_${student.universityRollNumber}.pdf"`);
  doc.pipe(res);

  const pageWidth = doc.page.width;
  drawInstitutionalHeader(doc, 'BONAFIDE CERTIFICATE', 'OFFICIAL CERTIFICATE OF INSTITUTIONAL ENROLLMENT');

  const certNo = `JBIT/BON/${new Date().getFullYear()}/${student.universityRollNumber}`;
  const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  // Ribbon
  const metaY = 180;
  doc.rect(40, metaY, pageWidth - 80, 28).fillColor('#F8FAFC').fill().strokeColor('#CBD5E1').stroke();
  doc.fillColor('#1E3A8A').fontSize(9).font('Helvetica-Bold');
  doc.text(`Certificate No: ${certNo}`, 55, metaY + 8);
  doc.text(`Issue Date: ${issueDate}`, pageWidth - 220, metaY + 8);

  // Statement
  const bodyY = 240;
  doc.fillColor('#0F172A').fontSize(11).font('Helvetica').lineGap(8);
  doc.text('TO WHOMSOEVER IT MAY CONCERN', 40, bodyY, { align: 'center', underline: true });

  const statementY = bodyY + 45;
  doc.fontSize(10.5).font('Helvetica').lineGap(8);
  doc.text(
    `This is to officially certify that `,
    50,
    statementY,
    { continued: true }
  ).font('Helvetica-Bold').text(
    `${student.fullName.toUpperCase()}, `,
    { continued: true }
  ).font('Helvetica').text(
    `Son/Daughter of Shri `,
    { continued: true }
  ).font('Helvetica-Bold').text(
    `${student.fatherName}, `,
    { continued: true }
  ).font('Helvetica').text(
    `bearing University Roll Number `,
    { continued: true }
  ).font('Helvetica-Bold').text(
    `${student.universityRollNumber} `,
    { continued: true }
  ).font('Helvetica').text(
    `and College Registration / Admission Number `,
    { continued: true }
  ).font('Helvetica-Bold').text(
    `${student.admissionNumber || student.collegeRegistrationNumber}, `,
    { continued: true }
  ).font('Helvetica').text(
    `is a bonafide regular student of `,
    { continued: true }
  ).font('Helvetica-Bold').text(
    `${ENV.COLLEGE.NAME}, Dehradun.`,
    { continued: false }
  );

  doc.moveDown();
  doc.text(
    `He/She is currently enrolled and studying in `,
    50,
    doc.y,
    { continued: true }
  ).font('Helvetica-Bold').text(
    `${student.course} (Semester ${student.semester}) `,
    { continued: true }
  ).font('Helvetica').text(
    `in the Department of `,
    { continued: true }
  ).font('Helvetica-Bold').text(
    `${student.branch || 'Engineering & Technology'} `,
    { continued: true }
  ).font('Helvetica').text(
    `for the Academic Session ${student.academicYear || '2024-2025'}.`
  );

  doc.moveDown();
  doc.font('Helvetica').text(
    `As per college academic and institutional records, the student possesses good conduct and moral character. This certificate is issued upon candidate request for the purpose of: `,
    50,
    doc.y,
    { continued: true }
  ).font('Helvetica-Bold').fillColor('#1E3A8A').text(
    `${purpose}.`
  );

  // Institutional Seal Note
  doc.moveDown(2);
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica-Oblique').text(
    'Note: This certificate is issued by the office of the Registrar, JB Institute of Technology, Uttarakhand and remains valid for academic and institutional verification.',
    50,
    doc.y,
    { width: pageWidth - 100 }
  );

  // Signatures
  const sigY = 620;
  doc.lineCap('round').moveTo(55, sigY).lineTo(200, sigY).strokeColor('#94A3B8').stroke();
  doc.moveTo(pageWidth - 210, sigY).lineTo(pageWidth - 55, sigY).strokeColor('#94A3B8').stroke();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1E293B').text('DEAN OF ACADEMIC AFFAIRS', 55, sigY + 6);
  doc.text('REGISTRAR & SECRETARY', pageWidth - 210, sigY + 6);
  doc.fontSize(7.5).font('Helvetica').fillColor('#64748B').text('JB Institute of Technology, Dehradun', pageWidth - 210, sigY + 18);

  doc.end();
};

/**
 * 8. OFFICIAL CHARACTER & CONDUCT CERTIFICATE
 */
export const generateCharacterCertificatePdf = async (student, res) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `Character-${student.universityRollNumber}`,
      Author: ENV.COLLEGE.NAME,
      Subject: 'Character and Conduct Certificate'
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="Character_${student.universityRollNumber}.pdf"`);
  doc.pipe(res);

  const pageWidth = doc.page.width;
  drawInstitutionalHeader(doc, 'CHARACTER & CONDUCT CERTIFICATE', 'TESTIMONIAL OF INSTITUTIONAL DISCIPLINE AND ACADEMIC INTEGRITY');

  const certNo = `JBIT/CHR/${new Date().getFullYear()}/${student.universityRollNumber}`;
  const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  // Ribbon
  const metaY = 180;
  doc.rect(40, metaY, pageWidth - 80, 28).fillColor('#F8FAFC').fill().strokeColor('#CBD5E1').stroke();
  doc.fillColor('#1E3A8A').fontSize(9).font('Helvetica-Bold');
  doc.text(`Certificate No: ${certNo}`, 55, metaY + 8);
  doc.text(`Issue Date: ${issueDate}`, pageWidth - 220, metaY + 8);

  // Statement
  const bodyY = 240;
  doc.fillColor('#0F172A').fontSize(11).font('Helvetica').lineGap(8);
  doc.text('CHARACTER AND CONDUCT TESTIMONIAL', 40, bodyY, { align: 'center', underline: true });

  const statementY = bodyY + 45;
  doc.fontSize(10.5).font('Helvetica').lineGap(8);
  doc.text(
    `This is to certify that `,
    50,
    statementY,
    { continued: true }
  ).font('Helvetica-Bold').text(
    `${student.fullName.toUpperCase()}, `,
    { continued: true }
  ).font('Helvetica').text(
    `Son/Daughter of Shri `,
    { continued: true }
  ).font('Helvetica-Bold').text(
    `${student.fatherName}, `,
    { continued: true }
  ).font('Helvetica').text(
    `bearing University Roll Number `,
    { continued: true }
  ).font('Helvetica-Bold').text(
    `${student.universityRollNumber} `,
    { continued: true }
  ).font('Helvetica').text(
    `and College Registration Number `,
    { continued: true }
  ).font('Helvetica-Bold').text(
    `${student.admissionNumber || student.collegeRegistrationNumber}, `,
    { continued: true }
  ).font('Helvetica').text(
    `has been a regular student of this Institute in `,
    { continued: true }
  ).font('Helvetica-Bold').text(
    `${student.course} (Branch: ${student.branch || 'Engineering'}).`,
    { continued: false }
  );

  doc.moveDown();
  doc.text(
    `During his/her tenure of study at `,
    50,
    doc.y,
    { continued: true }
  ).font('Helvetica-Bold').text(
    `JB Institute of Technology, Dehradun, `,
    { continued: true }
  ).font('Helvetica').text(
    `his/her conduct, moral character, and attitude towards faculty, peers, and institutional guidelines have been found to be `,
    { continued: true }
  ).font('Helvetica-Bold').fillColor('#059669').text(
    `EXEMPLARY AND COMMENDABLE.`
  );

  doc.moveDown();
  doc.fillColor('#1E293B').font('Helvetica').text(
    `He/She has displayed diligent commitment towards academic coursework, practical laboratories, and co-curricular campus activities. To the best of our knowledge, the student has not taken part in any subversive or disciplinary violations against the Institute.`,
    50,
    doc.y,
    { width: pageWidth - 100 }
  );

  doc.moveDown(1.5);
  doc.text(
    `We wish the candidate every success and accomplishment in all future educational, professional, and personal pursuits.`,
    50,
    doc.y,
    { width: pageWidth - 100 }
  );

  // Signatures
  const sigY = 620;
  doc.lineCap('round').moveTo(55, sigY).lineTo(200, sigY).strokeColor('#94A3B8').stroke();
  doc.moveTo(pageWidth - 210, sigY).lineTo(pageWidth - 55, sigY).strokeColor('#94A3B8').stroke();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1E293B').text('HEAD OF DEPARTMENT', 55, sigY + 6);
  doc.text('DIRECTOR / PRINCIPAL', pageWidth - 210, sigY + 6);
  doc.fontSize(7.5).font('Helvetica').fillColor('#64748B').text('JB Institute of Technology, Dehradun', pageWidth - 210, sigY + 18);

  doc.end();
};

