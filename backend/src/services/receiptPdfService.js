import PDFDocument from 'pdfkit';
import { ENV } from '../config/env.js';

/**
 * Generates a PDF stream for a payment receipt
 * @param {Object} payment - Payment document (populated with student if needed)
 * @param {Object} student - Student document
 * @param {Object} res - Express response stream
 */
export const generateReceiptPdf = (payment, student, res) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `Receipt-${payment.receiptNumber}`,
      Author: ENV.COLLEGE.NAME,
      Subject: 'Fee Payment Receipt'
    }
  });

  // Set headers for inline PDF display / download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="Receipt_${payment.receiptNumber}.pdf"`
  );

  doc.pipe(res);

  const collegeName = ENV.COLLEGE.NAME;
  const collegeAddress = ENV.COLLEGE.ADDRESS;
  const collegePhone = ENV.COLLEGE.PHONE;
  const collegeEmail = ENV.COLLEGE.EMAIL;
  const collegeCode = ENV.COLLEGE.CODE;

  const paymentDate = new Date(payment.paymentDate || payment.createdAt);
  const formattedDate = paymentDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = paymentDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Outer Border
  doc
    .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
    .lineWidth(1.5)
    .strokeColor('#1E3A8A')
    .stroke();

  // Inner Accent Border
  doc
    .rect(24, 24, doc.page.width - 48, doc.page.height - 48)
    .lineWidth(0.5)
    .strokeColor('#93C5FD')
    .stroke();

  // Top Header Banner
  doc.rect(25, 25, doc.page.width - 50, 90).fill('#1E3A8A');

  // College Name & Details in White
  doc
    .fillColor('#FFFFFF')
    .fontSize(18)
    .font('Helvetica-Bold')
    .text(collegeName.toUpperCase(), 35, 38, { align: 'center' });

  doc
    .fontSize(9)
    .font('Helvetica')
    .text(`(Affiliated & Approved Institute | College Code: ${collegeCode})`, 35, 62, { align: 'center' });

  doc
    .fontSize(8.5)
    .font('Helvetica')
    .text(`${collegeAddress} | Tel: ${collegePhone} | Email: ${collegeEmail}`, 35, 78, { align: 'center' });

  // Receipt Title Badge
  doc.rect(170, 125, doc.page.width - 340, 26).fill('#DBEAFE');
  doc
    .fillColor('#1E3A8A')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('FEE PAYMENT RECEIPT (STUDENT COPY)', 170, 132, {
      align: 'center',
      width: doc.page.width - 340
    });

  // Receipt Info Strip (Date, Receipt No, Transaction ID)
  const metaY = 165;
  doc
    .rect(40, metaY, doc.page.width - 80, 48)
    .fillColor('#F8FAFC')
    .fill()
    .strokeColor('#E2E8F0')
    .stroke();

  doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
  doc.text('Receipt No:', 55, metaY + 10);
  doc.font('Helvetica').text(payment.receiptNumber, 130, metaY + 10);

  doc.font('Helvetica-Bold').text('Date & Time:', 360, metaY + 10);
  doc.font('Helvetica').text(`${formattedDate} ${formattedTime}`, 440, metaY + 10);

  doc.font('Helvetica-Bold').text('Transaction ID:', 55, metaY + 28);
  doc.font('Helvetica').text(payment.transactionId, 130, metaY + 28);

  doc.font('Helvetica-Bold').text('Payment Method:', 360, metaY + 28);
  doc.font('Helvetica').text(payment.paymentMethod || 'ONLINE', 460, metaY + 28);

  // Student Details Section Header
  doc
    .fillColor('#1E3A8A')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('STUDENT PARTICULARS', 40, 230);
  doc
    .moveTo(40, 245)
    .lineTo(doc.page.width - 40, 245)
    .strokeColor('#CBD5E1')
    .stroke();

  // Student Details Grid
  const studentY = 255;
  const col1X = 50;
  const col1ValX = 175;
  const col2X = 330;
  const col2ValX = 450;
  const lineSpacing = 18;

  const rows = [
    { label1: 'Student Name:', val1: student.fullName, label2: "Father's Name:", val2: student.fatherName },
    { label1: 'University Roll No:', val1: student.universityRollNumber, label2: 'College Reg No:', val2: student.collegeRegistrationNumber },
    { label1: 'Course / Program:', val1: student.course, label2: 'Semester / Year:', val2: `Sem ${student.semester} (${student.academicYear || 'Current'})` },
    { label1: 'Contact Mobile:', val1: student.mobile, label2: 'Student Email:', val2: student.email }
  ];

  rows.forEach((r, idx) => {
    const y = studentY + (idx * lineSpacing);
    doc.fillColor('#64748B').fontSize(9).font('Helvetica-Bold').text(r.label1, col1X, y);
    doc.fillColor('#0F172A').fontSize(9).font('Helvetica').text(r.val1 || '-', col1ValX, y);

    doc.fillColor('#64748B').fontSize(9).font('Helvetica-Bold').text(r.label2, col2X, y);
    doc.fillColor('#0F172A').fontSize(9).font('Helvetica').text(r.val2 || '-', col2ValX, y);
  });

  // Fee Details Table Header
  const tableY = 345;
  doc
    .fillColor('#1E3A8A')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('PAYMENT & FINANCIAL SUMMARY', 40, tableY);

  const tblHeaderY = tableY + 18;
  doc.rect(40, tblHeaderY, doc.page.width - 80, 22).fill('#1E293B');

  doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
  doc.text('SR', 50, tblHeaderY + 6);
  doc.text('DESCRIPTION', 90, tblHeaderY + 6);
  doc.text('AMOUNT (INR)', doc.page.width - 160, tblHeaderY + 6, { align: 'right', width: 100 });

  const feeStatus = Number(payment.remainingDue || 0) <= 0 ? 'CLEAR' : 'PENDING';

  // Table Body Rows
  const items = [
    { sr: '1', desc: 'Previous Outstanding Balance / Due', amt: `INR ${Number(payment.previousDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
    { sr: '2', desc: `Fee Payment Received (${payment.paymentMethod}) - Ref: ${payment.transactionId}`, amt: `INR ${Number(payment.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, highlight: true },
    { sr: '3', desc: 'Net Remaining Fee Due After Payment', amt: `INR ${Number(payment.remainingDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
    { sr: '4', desc: 'Extra Payment / Credit Balance (if any)', amt: `INR ${Number(payment.extraPayment || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
    { sr: '5', desc: 'Updated Student Fee Account Status', amt: feeStatus, isStatus: true }
  ];

  let curY = tblHeaderY + 22;
  items.forEach((item, index) => {
    const rowBg = item.highlight ? '#F0FDF4' : index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    doc.rect(40, curY, doc.page.width - 80, 24).fill(rowBg);

    doc
      .rect(40, curY, doc.page.width - 80, 24)
      .strokeColor('#E2E8F0')
      .lineWidth(0.5)
      .stroke();

    const textColor = item.isStatus
      ? (feeStatus === 'CLEAR' ? '#15803D' : '#D97706')
      : (item.highlight ? '#15803D' : '#334155');

    doc.fillColor(textColor).fontSize(9).font((item.highlight || item.isStatus) ? 'Helvetica-Bold' : 'Helvetica');
    doc.text(item.sr, 50, curY + 7);
    doc.text(item.desc, 90, curY + 7);
    doc.text(item.amt, doc.page.width - 160, curY + 7, { align: 'right', width: 100 });

    curY += 24;
  });

  // Total Paid Banner Box
  curY += 15;
  doc
    .rect(40, curY, doc.page.width - 80, 36)
    .fillColor('#ECFDF5')
    .fill()
    .strokeColor('#10B981')
    .lineWidth(1)
    .stroke();

  doc.fillColor('#065F46').fontSize(10).font('Helvetica-Bold');
  doc.text('TOTAL AMOUNT PAID:', 55, curY + 12);
  doc.fontSize(13).text(
    `INR ${Number(payment.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    doc.page.width - 240,
    curY + 11,
    { align: 'right', width: 180 }
  );

  // Payment Status Stamp & Seal Box
  const footerY = curY + 60;

  // Status Stamp
  const statusColor = payment.status === 'SUCCESS' ? '#059669' : '#DC2626';
  doc
    .rect(50, footerY, 130, 45)
    .lineWidth(1.5)
    .strokeColor(statusColor)
    .stroke();

  doc
    .fillColor(statusColor)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text(payment.status === 'SUCCESS' ? 'PAID & VERIFIED' : payment.status, 50, footerY + 12, {
      align: 'center',
      width: 130
    });

  doc
    .fontSize(7.5)
    .font('Helvetica')
    .text('STATUS: SUCCESSFUL', 50, footerY + 30, { align: 'center', width: 130 });

  // Signature Block
  const sigX = doc.page.width - 210;
  doc
    .moveTo(sigX, footerY + 35)
    .lineTo(doc.page.width - 60, footerY + 35)
    .strokeColor('#94A3B8')
    .stroke();

  doc
    .fillColor('#475569')
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .text('Accounts Officer / Cashier', sigX, footerY + 40, { align: 'center', width: 150 });

  doc
    .fontSize(7.5)
    .font('Helvetica')
    .text('JB Institute of Technology', sigX, footerY + 52, { align: 'center', width: 150 });

  // Footnote Disclaimer
  const disclaimerY = doc.page.height - 75;
  doc
    .moveTo(40, disclaimerY)
    .lineTo(doc.page.width - 40, disclaimerY)
    .strokeColor('#CBD5E1')
    .lineWidth(0.5)
    .stroke();

  doc
    .fillColor('#64748B')
    .fontSize(7.5)
    .font('Helvetica')
    .text(
      'Note: This is a computer-generated receipt issued by JB Institute of Technology ERP. No physical signature is required. Please retain this receipt for future academic and examination clearance purposes.',
      40,
      disclaimerY + 8,
      { align: 'center', width: doc.page.width - 80 }
    );

  doc.end();
};
