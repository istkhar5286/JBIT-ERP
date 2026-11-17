import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ENV } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolves logo path safely
const getLogoPath = () => {
  const backendAsset = path.resolve(__dirname, '../assets/college-logo.png');
  if (fs.existsSync(backendAsset)) return backendAsset;
  const frontendAsset = path.resolve(__dirname, '../../../frontend/public/assets/college-logo.png');
  if (fs.existsSync(frontendAsset)) return frontendAsset;
  return null;
};

/**
 * Draws standard official JBIT header on the PDF document
 */
const drawOfficialHeader = (doc, title, subtitle) => {
  const collegeName = ENV.COLLEGE.NAME;
  const collegeAddress = ENV.COLLEGE.ADDRESS;
  const collegePhone = ENV.COLLEGE.PHONE;
  const collegeEmail = ENV.COLLEGE.EMAIL;

  // Outer Border
  doc
    .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
    .lineWidth(1.5)
    .strokeColor('#0F172A')
    .stroke();

  // Inner Border
  doc
    .rect(24, 24, doc.page.width - 48, doc.page.height - 48)
    .lineWidth(0.5)
    .strokeColor('#64748B')
    .stroke();

  // Top Header Banner
  doc.rect(25, 25, doc.page.width - 50, 85).fill('#0F172A');

  // Try draw logo
  const logo = getLogoPath();
  if (logo) {
    try {
      doc.image(logo, 38, 33, { width: 68, height: 68 });
    } catch (e) {
      // ignore logo draw failure
    }
  }

  // Header Titles
  doc
    .fillColor('#FFFFFF')
    .fontSize(17)
    .font('Helvetica-Bold')
    .text(collegeName.toUpperCase(), 115, 36, { width: doc.page.width - 150, align: 'center' });

  doc
    .fontSize(8.5)
    .font('Helvetica')
    .text(`${collegeAddress}`, 115, 60, { width: doc.page.width - 150, align: 'center' });

  doc
    .fontSize(8)
    .font('Helvetica')
    .text(`Tel: ${collegePhone} | Email: ${collegeEmail} | Web: www.jbitdoon.edu.in`, 115, 75, {
      width: doc.page.width - 150,
      align: 'center'
    });

  // Badge Ribbon
  doc.rect(120, 120, doc.page.width - 240, 28).fill('#F1F5F9');
  doc
    .rect(120, 120, doc.page.width - 240, 28)
    .lineWidth(1)
    .strokeColor('#0F172A')
    .stroke();

  doc
    .fillColor('#0F172A')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text(title.toUpperCase(), 120, 128, {
      align: 'center',
      width: doc.page.width - 240
    });
};

/**
 * 1. Generate Hostel Fee Receipt PDF
 */
export const generateHostelReceiptPdf = ({ payment, application, student, res }) => {
  const doc = new PDFDocument({ size: 'A4', margin: 30 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="Hostel_Receipt_${payment.receiptNumber || 'HOSTEL'}.pdf"`
  );

  doc.pipe(res);

  drawOfficialHeader(doc, 'Hostel Fee Payment Receipt', 'Student & Accounts Record');

  // Metadata Strip
  const paymentDate = new Date(payment.paymentDate || payment.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  let y = 165;
  doc.rect(40, y, doc.page.width - 80, 42).fillColor('#F8FAFC').fill().strokeColor('#E2E8F0').stroke();

  doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('RECEIPT NO:', 55, y + 10);
  doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text(payment.receiptNumber || 'JBIT-HST-0001', 135, y + 10);

  doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('DATE:', 55, y + 24);
  doc.fillColor('#0F172A').fontSize(9).font('Helvetica').text(paymentDate, 135, y + 24);

  doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('TRANSACTION ID:', 320, y + 10);
  doc.fillColor('#0F172A').fontSize(9.5).font('Courier-Bold').text(payment.transactionId || 'TXN_HST_001', 420, y + 10);

  doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('PAYMENT STATUS:', 320, y + 24);
  doc.fillColor('#047857').fontSize(9).font('Helvetica-Bold').text('SUCCESS / CLEARED', 420, y + 24);

  // Student & Hostel Information Box
  y = 225;
  doc.rect(40, y, doc.page.width - 80, 115).fillColor('#FFFFFF').fill().strokeColor('#CBD5E1').stroke();
  doc.rect(40, y, doc.page.width - 80, 22).fill('#E2E8F0');
  doc.fillColor('#1E293B').fontSize(9.5).font('Helvetica-Bold').text('STUDENT & RESIDENTIAL ALLOCATION PARTICULARS', 50, y + 6);

  const col1 = 55;
  const col1Val = 160;
  const col2 = 320;
  const col2Val = 425;

  let rowY = y + 30;
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Student Name:', col1, rowY);
  doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(student.fullName || application.studentName, col1Val, rowY);
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Hostel Assigned:', col2, rowY);
  doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(application.hostelName || 'Campus Hostel', col2Val, rowY);

  rowY += 18;
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('University Roll No:', col1, rowY);
  doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(student.universityRollNumber || application.studentRoll, col1Val, rowY);
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Block & Floor:', col2, rowY);
  doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(`${application.allocationDetails?.block || application.preferredBlock || 'Block A'}, ${application.allocationDetails?.floor || '1st Floor'}`, col2Val, rowY);

  rowY += 18;
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Course & Branch:', col1, rowY);
  doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica').text(`${student.course || 'B.Tech'} - Sem ${student.semester || '1'}`, col1Val, rowY);
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Room & Bed:', col2, rowY);
  doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(`Room ${application.allocationDetails?.roomNumber || '101'} / Bed ${application.allocationDetails?.bedNumber || 'A'}`, col2Val, rowY);

  rowY += 18;
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Registered Mobile:', col1, rowY);
  doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica').text(student.mobile || application.studentMobile, col1Val, rowY);
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Academic Session:', col2, rowY);
  doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica').text(application.academicYear || '2024-2025', col2Val, rowY);

  // Fee Details Table
  y = 355;
  doc.rect(40, y, doc.page.width - 80, 24).fill('#0F172A');
  doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
  doc.text('S.NO', 55, y + 7);
  doc.text('HOSTEL FEE COMPONENT DESCRIPTION', 105, y + 7);
  doc.text('AMOUNT (INR)', doc.page.width - 150, y + 7, { align: 'right', width: 90 });

  const items = [
    { name: 'Hostel Room Admission & Administrative Charges', amt: 5000 },
    { name: 'Hostel Room Rent & Accommodation (Annual / Semester)', amt: 20000 },
    { name: 'Mess & Dining Charges (Breakfast, Lunch, Dinner & Evening Snacks)', amt: 15000 },
    { name: 'Refundable Hostel Security Caution Deposit', amt: 5000 }
  ];

  let totalAmt = payment.amount || 45000;
  let tableY = y + 24;

  items.forEach((item, index) => {
    const bg = index % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
    doc.rect(40, tableY, doc.page.width - 80, 22).fill(bg).strokeColor('#E2E8F0').stroke();
    doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(String(index + 1), 55, tableY + 6);
    doc.fillColor('#1E293B').fontSize(8.5).font('Helvetica').text(item.name, 105, tableY + 6);
    doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(`Rs. ${item.amt.toLocaleString('en-IN')}.00`, doc.page.width - 150, tableY + 6, { align: 'right', width: 90 });
    tableY += 22;
  });

  // Total Paid Row
  doc.rect(40, tableY, doc.page.width - 80, 28).fill('#E2E8F0').strokeColor('#0F172A').stroke();
  doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('TOTAL AMOUNT PAID:', 105, tableY + 9);
  doc.fillColor('#047857').fontSize(11).font('Helvetica-Bold').text(`Rs. ${totalAmt.toLocaleString('en-IN')}.00`, doc.page.width - 160, tableY + 8, { align: 'right', width: 100 });

  // Signatures
  const sigY = doc.page.height - 130;
  doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(60, sigY).lineTo(200, sigY).stroke();
  doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(doc.page.width - 200, sigY).lineTo(doc.page.width - 60, sigY).stroke();

  doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold').text('STUDENT SIGNATURE', 60, sigY + 6, { width: 140, align: 'center' });
  doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold').text('ACCOUNTS & WARDEN DESK', doc.page.width - 200, sigY + 6, { width: 140, align: 'center' });
  doc.fontSize(7.5).font('Helvetica').text('JB Institute of Technology', doc.page.width - 200, sigY + 18, { width: 140, align: 'center' });

  // Footer
  doc.fillColor('#94A3B8').fontSize(7.5).font('Helvetica').text(
    'This is an authorized system-generated fee payment receipt. No physical signature required.',
    40,
    doc.page.height - 48,
    { align: 'center', width: doc.page.width - 80 }
  );

  doc.end();
};

/**
 * 2. Generate Hostel Allocation Card PDF
 */
export const generateHostelAllocationCardPdf = ({ allocation, student, res }) => {
  const doc = new PDFDocument({ size: 'A4', margin: 30 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="Hostel_Allocation_Card_${allocation.bedNumber || 'JBIT'}.pdf"`
  );

  doc.pipe(res);

  drawOfficialHeader(doc, 'Official Hostel Resident Allocation Card', 'Residential Pass');

  let y = 165;

  // Student Card Outer Container
  doc.rect(40, y, doc.page.width - 80, 240).fillColor('#FFFFFF').fill().strokeColor('#0F172A').lineWidth(1).stroke();

  // Banner
  doc.rect(41, y + 1, doc.page.width - 82, 28).fill('#1E3A8A');
  doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold').text('RESIDENTIAL ALLOCATION IDENTITY', 41, y + 9, {
    align: 'center',
    width: doc.page.width - 82
  });

  // Photo Frame on Left
  const photoBoxX = 60;
  const photoBoxY = y + 42;
  const photoW = 100;
  const photoH = 120;

  doc.rect(photoBoxX, photoBoxY, photoW, photoH).fillColor('#F8FAFC').fill().strokeColor('#CBD5E1').stroke();

  // If student profile photo exists and is valid data URL or path
  let photoDrawn = false;
  if (student.profilePhoto && student.profilePhoto.startsWith('data:image')) {
    try {
      const base64Data = student.profilePhoto.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      doc.image(buffer, photoBoxX + 2, photoBoxY + 2, { width: photoW - 4, height: photoH - 4, fit: [photoW - 4, photoH - 4], align: 'center', valign: 'center' });
      photoDrawn = true;
    } catch (err) {
      // Fallback to placeholder
    }
  }

  if (!photoDrawn) {
    doc.fillColor('#94A3B8').fontSize(10).font('Helvetica-Bold').text('PASSPORT\nPHOTO', photoBoxX, photoBoxY + 45, {
      width: photoW,
      align: 'center'
    });
  }

  // Stamp badge below photo
  doc.rect(photoBoxX, photoBoxY + photoH + 10, photoW, 22).fill('#ECFDF5').strokeColor('#10B981').stroke();
  doc.fillColor('#047857').fontSize(8).font('Helvetica-Bold').text('STATUS: ALLOCATED', photoBoxX, photoBoxY + photoH + 16, {
    width: photoW,
    align: 'center'
  });

  // Allocation Details on Right
  const detailsX = 185;
  let lineY = y + 42;

  const renderField = (label, val, highlight = false) => {
    doc.fillColor('#64748B').fontSize(9).font('Helvetica-Bold').text(label, detailsX, lineY);
    doc.fillColor(highlight ? '#1E3A8A' : '#0F172A').fontSize(9.5).font(highlight ? 'Helvetica-Bold' : 'Helvetica').text(String(val || 'N/A'), detailsX + 130, lineY);
    lineY += 19;
  };

  renderField('Student Name:', student.fullName || allocation.studentName, true);
  renderField('University Roll No:', student.universityRollNumber || allocation.rollNumber, true);
  renderField('Course & Branch:', `${student.course || 'B.Tech'} - ${student.branch || 'CSE'}`);
  renderField('Academic Year:', allocation.academicYear || '2024-2025');
  renderField('Hostel Building:', allocation.hostelName, true);
  renderField('Block & Floor:', `${allocation.block}, ${allocation.floor}`);
  renderField('Allocated Room:', `Room ${allocation.roomNumber}`);
  renderField('Assigned Bed ID:', allocation.bedNumber, true);
  renderField('Allocation Date:', new Date(allocation.allocationDate || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }));

  // Resident Rules & Terms Box
  y = 425;
  doc.rect(40, y, doc.page.width - 80, 110).fillColor('#F8FAFC').fill().strokeColor('#E2E8F0').stroke();
  doc.fillColor('#1E293B').fontSize(9).font('Helvetica-Bold').text('TERMS & RESIDENT CONDUCT GUIDELINES:', 55, y + 10);

  const rules = [
    '1. This allocation card must be presented upon entering or exiting the hostel gate.',
    '2. Bed allocation is strictly non-transferable and valid for the current academic session.',
    '3. Students must adhere to hostel curfew timings (08:30 PM). Gate passes must be applied online via ERP.',
    '4. Misconduct, damage to campus property, or unauthorized guests will lead to immediate cancellation of boarding.'
  ];

  let ruleY = y + 26;
  rules.forEach((rule) => {
    doc.fillColor('#475569').fontSize(7.8).font('Helvetica').text(rule, 55, ruleY, { width: doc.page.width - 110 });
    ruleY += 17;
  });

  // Signatures
  const sigY = doc.page.height - 120;
  doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(60, sigY).lineTo(200, sigY).stroke();
  doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(doc.page.width - 200, sigY).lineTo(doc.page.width - 60, sigY).stroke();

  doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold').text('STUDENT SIGNATURE', 60, sigY + 6, { width: 140, align: 'center' });
  doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold').text('CHIEF HOSTEL WARDEN', doc.page.width - 200, sigY + 6, { width: 140, align: 'center' });
  doc.fontSize(7.5).font('Helvetica').text('JB Institute of Technology', doc.page.width - 200, sigY + 18, { width: 140, align: 'center' });

  doc.end();
};

/**
 * 3. Generate Transport Fee Receipt PDF
 */
export const generateTransportReceiptPdf = ({ payment, application, student, res }) => {
  const doc = new PDFDocument({ size: 'A4', margin: 30 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="Transport_Receipt_${payment.receiptNumber || 'BUS'}.pdf"`
  );

  doc.pipe(res);

  drawOfficialHeader(doc, 'College Transport Fee Payment Receipt', 'Bus Service Receipt');

  const paymentDate = new Date(payment.paymentDate || payment.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  let y = 165;
  doc.rect(40, y, doc.page.width - 80, 42).fillColor('#F8FAFC').fill().strokeColor('#E2E8F0').stroke();

  doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('RECEIPT NO:', 55, y + 10);
  doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text(payment.receiptNumber || 'JBIT-TRN-001', 135, y + 10);

  doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('DATE:', 55, y + 24);
  doc.fillColor('#0F172A').fontSize(9).font('Helvetica').text(paymentDate, 135, y + 24);

  doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('TRANSACTION ID:', 320, y + 10);
  doc.fillColor('#0F172A').fontSize(9.5).font('Courier-Bold').text(payment.transactionId || 'TXN_TRN_001', 420, y + 10);

  doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('PAYMENT STATUS:', 320, y + 24);
  doc.fillColor('#047857').fontSize(9).font('Helvetica-Bold').text('SUCCESS / CLEARED', 420, y + 24);

  // Student & Bus Info Box
  y = 225;
  doc.rect(40, y, doc.page.width - 80, 105).fillColor('#FFFFFF').fill().strokeColor('#CBD5E1').stroke();
  doc.rect(40, y, doc.page.width - 80, 22).fill('#E2E8F0');
  doc.fillColor('#1E293B').fontSize(9.5).font('Helvetica-Bold').text('STUDENT & COMMUTER ROUTE PARTICULARS', 50, y + 6);

  const col1 = 55;
  const col1Val = 160;
  const col2 = 320;
  const col2Val = 425;

  let rowY = y + 30;
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Student Name:', col1, rowY);
  doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(student.fullName || application.studentName, col1Val, rowY);
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Bus Number:', col2, rowY);
  doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(application.busNumber, col2Val, rowY);

  rowY += 18;
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('University Roll No:', col1, rowY);
  doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(student.universityRollNumber || application.studentRoll, col1Val, rowY);
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Bus Route:', col2, rowY);
  doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(application.routeName, col2Val, rowY);

  rowY += 18;
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Boarding Stop:', col1, rowY);
  doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(application.stopName, col1Val, rowY);
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Allocated Seat:', col2, rowY);
  doc.fillColor('#047857').fontSize(9).font('Helvetica-Bold').text(`Seat #${application.allocatedSeatNumber || '1'}`, col2Val, rowY);

  rowY += 18;
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Academic Session:', col1, rowY);
  doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica').text(application.academicYear || '2024-2025', col1Val, rowY);
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Contact Mobile:', col2, rowY);
  doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica').text(student.mobile || application.studentMobile, col2Val, rowY);

  // Fee Details Table
  y = 350;
  doc.rect(40, y, doc.page.width - 80, 24).fill('#0F172A');
  doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
  doc.text('S.NO', 55, y + 7);
  doc.text('TRANSPORTATION FEE DESCRIPTION', 105, y + 7);
  doc.text('AMOUNT (INR)', doc.page.width - 150, y + 7, { align: 'right', width: 90 });

  const items = [
    { name: `Campus Commuter Daily Bus Route (${application.routeName})`, amt: payment.amount || 18000 }
  ];

  let tableY = y + 24;
  items.forEach((item, index) => {
    doc.rect(40, tableY, doc.page.width - 80, 22).fill('#F8FAFC').strokeColor('#E2E8F0').stroke();
    doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(String(index + 1), 55, tableY + 6);
    doc.fillColor('#1E293B').fontSize(8.5).font('Helvetica').text(item.name, 105, tableY + 6);
    doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(`Rs. ${item.amt.toLocaleString('en-IN')}.00`, doc.page.width - 150, tableY + 6, { align: 'right', width: 90 });
    tableY += 22;
  });

  // Total
  doc.rect(40, tableY, doc.page.width - 80, 28).fill('#E2E8F0').strokeColor('#0F172A').stroke();
  doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('TOTAL AMOUNT PAID:', 105, tableY + 9);
  doc.fillColor('#047857').fontSize(11).font('Helvetica-Bold').text(`Rs. ${(payment.amount || 18000).toLocaleString('en-IN')}.00`, doc.page.width - 160, tableY + 8, { align: 'right', width: 100 });

  // Signatures
  const sigY = doc.page.height - 120;
  doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(60, sigY).lineTo(200, sigY).stroke();
  doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(doc.page.width - 200, sigY).lineTo(doc.page.width - 60, sigY).stroke();

  doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold').text('STUDENT SIGNATURE', 60, sigY + 6, { width: 140, align: 'center' });
  doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold').text('TRANSPORT SUPERVISOR', doc.page.width - 200, sigY + 6, { width: 140, align: 'center' });
  doc.fontSize(7.5).font('Helvetica').text('JB Institute of Technology', doc.page.width - 200, sigY + 18, { width: 140, align: 'center' });

  doc.end();
};

/**
 * 4. Generate Transport Allocation Card PDF
 */
export const generateTransportAllocationCardPdf = ({ allocation, student, res }) => {
  const doc = new PDFDocument({ size: 'A4', margin: 30 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="Transport_Pass_Seat_${allocation.seatNumber || 'BUS'}.pdf"`
  );

  doc.pipe(res);

  drawOfficialHeader(doc, 'Official Campus Bus Commuter Card', 'Transport Identity Card');

  let y = 165;

  doc.rect(40, y, doc.page.width - 80, 230).fillColor('#FFFFFF').fill().strokeColor('#0F172A').lineWidth(1).stroke();

  doc.rect(41, y + 1, doc.page.width - 82, 28).fill('#0369A1');
  doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold').text('STUDENT BUS COMMUTER IDENTITY PASS', 41, y + 9, {
    align: 'center',
    width: doc.page.width - 82
  });

  const photoBoxX = 60;
  const photoBoxY = y + 42;
  const photoW = 100;
  const photoH = 120;

  doc.rect(photoBoxX, photoBoxY, photoW, photoH).fillColor('#F8FAFC').fill().strokeColor('#CBD5E1').stroke();

  let photoDrawn = false;
  if (student.profilePhoto && student.profilePhoto.startsWith('data:image')) {
    try {
      const base64Data = student.profilePhoto.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      doc.image(buffer, photoBoxX + 2, photoBoxY + 2, { width: photoW - 4, height: photoH - 4, fit: [photoW - 4, photoH - 4], align: 'center', valign: 'center' });
      photoDrawn = true;
    } catch (err) {
      // Fallback
    }
  }

  if (!photoDrawn) {
    doc.fillColor('#94A3B8').fontSize(10).font('Helvetica-Bold').text('PASSPORT\nPHOTO', photoBoxX, photoBoxY + 45, {
      width: photoW,
      align: 'center'
    });
  }

  doc.rect(photoBoxX, photoBoxY + photoH + 10, photoW, 22).fill('#E0F2FE').strokeColor('#0284C7').stroke();
  doc.fillColor('#0369A1').fontSize(8.5).font('Helvetica-Bold').text(`SEAT #${allocation.seatNumber}`, photoBoxX, photoBoxY + photoH + 16, {
    width: photoW,
    align: 'center'
  });

  const detailsX = 185;
  let lineY = y + 42;

  const renderField = (label, val, highlight = false) => {
    doc.fillColor('#64748B').fontSize(9).font('Helvetica-Bold').text(label, detailsX, lineY);
    doc.fillColor(highlight ? '#0369A1' : '#0F172A').fontSize(9.5).font(highlight ? 'Helvetica-Bold' : 'Helvetica').text(String(val || 'N/A'), detailsX + 130, lineY);
    lineY += 19;
  };

  renderField('Student Name:', student.fullName || allocation.studentName, true);
  renderField('University Roll No:', student.universityRollNumber || allocation.rollNumber, true);
  renderField('Course & Branch:', `${student.course || 'B.Tech'} - Sem ${student.semester || '1'}`);
  renderField('Bus Number:', allocation.busNumber, true);
  renderField('Designated Route:', allocation.routeName, true);
  renderField('Designated Stop:', allocation.stopName, true);
  renderField('Allocated Seat No:', `Seat #${allocation.seatNumber}`, true);
  renderField('Academic Year:', allocation.academicYear || '2024-2025');
  renderField('Issued On:', new Date(allocation.allocationDate || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }));

  // Transport Terms
  y = 415;
  doc.rect(40, y, doc.page.width - 80, 110).fillColor('#F8FAFC').fill().strokeColor('#E2E8F0').stroke();
  doc.fillColor('#1E293B').fontSize(9).font('Helvetica-Bold').text('TRANSPORT SERVICE INSTRUCTIONS & SAFETY RULES:', 55, y + 10);

  const rules = [
    '1. Students must carry this identity pass daily and show it to the bus conductor/driver when boarding.',
    '2. Arrive at your designated stop at least 5 minutes prior to scheduled pickup time.',
    '3. Seats are reserved; swapping seats or travelling on another bus route without permission is prohibited.',
    '4. Strictly follow safety guidelines. Any unruly behavior will lead to forfeiture of bus pass.'
  ];

  let ruleY = y + 26;
  rules.forEach((rule) => {
    doc.fillColor('#475569').fontSize(7.8).font('Helvetica').text(rule, 55, ruleY, { width: doc.page.width - 110 });
    ruleY += 17;
  });

  // Signatures
  const sigY = doc.page.height - 120;
  doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(60, sigY).lineTo(200, sigY).stroke();
  doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(doc.page.width - 200, sigY).lineTo(doc.page.width - 60, sigY).stroke();

  doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold').text('STUDENT SIGNATURE', 60, sigY + 6, { width: 140, align: 'center' });
  doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold').text('TRANSPORT IN-CHARGE', doc.page.width - 200, sigY + 6, { width: 140, align: 'center' });
  doc.fontSize(7.5).font('Helvetica').text('JB Institute of Technology', doc.page.width - 200, sigY + 18, { width: 140, align: 'center' });

  doc.end();
};
