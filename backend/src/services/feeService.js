import mongoose from 'mongoose';
import { Fee } from '../models/Fee.js';
import { Fine } from '../models/Fine.js';
import { Payment } from '../models/Payment.js';
import { Student } from '../models/Student.js';

/**
 * Calculates authoritative financial status for a student.
 * Never relies on frontend data or unverified due balances.
 */
export const calculateStudentFees = async (studentId) => {
  const sId = typeof studentId === 'string' ? new mongoose.Types.ObjectId(studentId) : studentId;

  // 1. Fetch Student & Fee record
  const student = await Student.findById(sId).lean();
  let feeRecord = await Fee.findOne({ studentId: sId });

  // Fallback defaults if fee not yet populated
  let tuitionFee = feeRecord?.tuitionFee || feeRecord?.academicFee || 0;
  let examinationFee = feeRecord?.examinationFee || 0;
  let registrationFee = feeRecord?.registrationFee || 0;
  let libraryFee = feeRecord?.libraryFee || 0;
  let laboratoryFee = feeRecord?.laboratoryFee || 0;
  let hostelFee = feeRecord?.hostelFee || 0;
  let transportFee = feeRecord?.transportFee || 0;
  let otherCharges = feeRecord?.otherCharges || 0;
  let academicFee = tuitionFee + examinationFee + registrationFee + libraryFee + laboratoryFee;

  const baseTotal = tuitionFee + examinationFee + registrationFee + libraryFee + laboratoryFee + hostelFee + transportFee;

  // 2. Calculate Scholarships, Discounts, and Waivers
  const waivers = feeRecord?.waivers || [];
  let waiverTotal = 0;
  waivers.forEach((w) => {
    waiverTotal += Number(w.amount || 0);
  });

  // 3. Fetch Fines from Fine collection
  const fines = await Fine.find({ studentId: sId }).sort({ createdAt: -1 }).lean();
  let unpaidFineTotal = 0;
  let paidFineTotal = 0;
  let hasOverdueFine = false;
  const now = new Date();

  for (const f of fines) {
    const amt = Number(f.amount || 0);
    if (f.status === 'UNPAID') {
      unpaidFineTotal += amt;
      if (f.dueDate && new Date(f.dueDate) < now) {
        hasOverdueFine = true;
      }
    } else if (f.status === 'PAID') {
      paidFineTotal += amt;
    }
  }

  // 4. Aggregate Total Paid from SUCCESS payments and Total Refunded
  const payments = await Payment.find({ studentId: sId, status: 'SUCCESS' }).lean();
  let totalPaid = 0;
  let totalRefunded = 0;

  for (const p of payments) {
    totalPaid += Number(p.amount || 0);
    if (Array.isArray(p.refunds)) {
      for (const r of p.refunds) {
        totalRefunded += Number(r.refundAmount || 0);
      }
    }
  }

  const netPaid = Math.max(totalPaid - totalRefunded, 0);

  // 5. Manage Installments & Automatic Late Fines
  let installments = feeRecord?.installments || [];
  
  // If installments are uninitialized but fees exist, auto-generate standard 2-term installment schedule
  if (installments.length === 0 && (baseTotal + otherCharges) > 0) {
    const totalCore = baseTotal + otherCharges;
    const term1Amt = Math.round(totalCore * 0.6);
    const term2Amt = totalCore - term1Amt;
    installments = [
      {
        installmentNumber: 1,
        title: 'Installment 1 - Academic & Term 1 Fee',
        amount: term1Amt,
        dueDate: new Date(Date.now() + 30 * 86400000),
        paidAmount: 0,
        remainingAmount: term1Amt,
        lateFine: 0,
        status: 'UPCOMING'
      },
      {
        installmentNumber: 2,
        title: 'Installment 2 - Term 2 & Lab/Exam Fee',
        amount: term2Amt,
        dueDate: new Date(Date.now() + 90 * 86400000),
        paidAmount: 0,
        remainingAmount: term2Amt,
        lateFine: 0,
        status: 'UPCOMING'
      }
    ];
  }

  // Allocate netPaid sequentially across installments
  let unallocated = netPaid;
  let installmentLateFineSum = 0;
  let hasOverdueInstallment = false;
  const lateFineRule = feeRecord?.lateFineRule || { type: 'PER_DAY', amount: 50, graceDays: 5 };

  const updatedInstallments = installments.map((inst) => {
    const instObj = inst.toObject ? inst.toObject() : { ...inst };
    const instAmt = Number(instObj.amount || 0);
    const dueDate = new Date(instObj.dueDate);
    
    // Allocate payment
    const paidForInst = Math.min(unallocated, instAmt);
    unallocated -= paidForInst;
    const remainingForInst = Math.max(instAmt - paidForInst, 0);

    let lateFine = 0;
    let status = 'UPCOMING';

    if (remainingForInst <= 0) {
      status = 'PAID';
    } else {
      // Unpaid or partially paid installment: check due date & calculate automatic late fine
      const graceDays = lateFineRule.graceDays || 0;
      const graceDate = new Date(dueDate.getTime() + graceDays * 86400000);

      if (now > graceDate) {
        status = 'OVERDUE';
        hasOverdueInstallment = true;

        if (lateFineRule.type === 'FIXED') {
          lateFine = Number(lateFineRule.amount || 0);
        } else if (lateFineRule.type === 'PER_DAY') {
          const daysLate = Math.max(Math.floor((now - graceDate) / 86400000), 1);
          lateFine = daysLate * Number(lateFineRule.amount || 50);
        }
        installmentLateFineSum += lateFine;
      } else if (now >= dueDate) {
        status = paidForInst > 0 ? 'PARTIALLY_PAID' : 'DUE';
      } else {
        status = paidForInst > 0 ? 'PARTIALLY_PAID' : 'UPCOMING';
      }
    }

    return {
      ...instObj,
      paidAmount: paidForInst,
      remainingAmount: remainingForInst,
      lateFine,
      status
    };
  });

  const totalLateFines = unpaidFineTotal + installmentLateFineSum;

  // 6. Authoritative Grand Totals:
  // Total Payable = Base Fees + Other Charges + Late Fines - Scholarships/Waivers
  const totalPayable = Math.max(baseTotal + otherCharges + totalLateFines - waiverTotal, 0);
  const pendingAmount = Math.max(totalPayable - netPaid, 0);
  const remainingDue = pendingAmount;
  const extraPayment = Math.max(netPaid - totalPayable, 0);

  // Authoritative Status
  let status = 'PENDING';
  if (pendingAmount <= 0) {
    status = 'CLEAR';
  } else if (hasOverdueInstallment || hasOverdueFine) {
    status = 'OVERDUE';
  } else if (netPaid > 0) {
    status = 'PARTIAL';
  } else {
    status = 'PENDING';
  }

  // 7. Persist into Fee collection
  if (feeRecord) {
    feeRecord.tuitionFee = tuitionFee;
    feeRecord.examinationFee = examinationFee;
    feeRecord.registrationFee = registrationFee;
    feeRecord.libraryFee = libraryFee;
    feeRecord.laboratoryFee = laboratoryFee;
    feeRecord.hostelFee = hostelFee;
    feeRecord.transportFee = transportFee;
    feeRecord.otherCharges = otherCharges;
    feeRecord.academicFee = academicFee;
    feeRecord.baseTotal = baseTotal;
    feeRecord.waiverTotal = waiverTotal;
    feeRecord.lateFineTotal = totalLateFines;
    feeRecord.installments = updatedInstallments;
    feeRecord.totalPayable = totalPayable;
    feeRecord.totalPaid = totalPaid;
    feeRecord.totalRefunded = totalRefunded;
    feeRecord.netPaid = netPaid;
    feeRecord.pendingAmount = pendingAmount;
    feeRecord.status = status;
    await feeRecord.save();
  } else {
    feeRecord = await Fee.create({
      studentId: sId,
      tuitionFee,
      examinationFee,
      registrationFee,
      libraryFee,
      laboratoryFee,
      hostelFee,
      transportFee,
      otherCharges,
      academicFee,
      baseTotal,
      waiverTotal,
      lateFineTotal: totalLateFines,
      installments: updatedInstallments,
      totalPayable,
      totalPaid,
      totalRefunded,
      netPaid,
      pendingAmount,
      status
    });
  }

  return {
    studentId: sId.toString(),
    studentName: student?.fullName || 'Student',
    rollNumber: student?.universityRollNumber || '',
    course: student?.course || '',
    semester: student?.semester || '',
    academicYear: student?.academicYear || '2024-2025',
    // Itemized fees
    tuitionFee,
    examinationFee,
    registrationFee,
    libraryFee,
    laboratoryFee,
    hostelFee,
    transportFee,
    otherCharges,
    academicFee,
    baseTotal,
    // Adjustments
    waivers,
    waiverTotal,
    unpaidFineTotal,
    installmentLateFineSum,
    totalLateFines,
    // Installments
    installments: updatedInstallments,
    lateFineRule,
    // Grand totals
    totalPayable,
    totalPaid,
    totalRefunded,
    netPaid,
    pendingAmount,
    remainingDue,
    extraPayment,
    status,
    feeConfigured: !!feeRecord,
    updatedAt: feeRecord ? feeRecord.updatedAt : new Date()
  };
};

/**
 * Calculates financial summaries across all students for Admin analytics.
 */
export const calculateGlobalFinancials = async () => {
  const allStudents = await Student.find().select('_id').lean();

  let clearStudentsCount = 0;
  let pendingStudentsCount = 0;
  let overdueStudentsCount = 0;
  let partialStudentsCount = 0;

  let totalFeesConfigured = 0;
  let totalOutstanding = 0;
  let totalScholarships = 0;

  await Promise.all(
    allStudents.map(async (st) => {
      const summary = await calculateStudentFees(st._id);
      totalFeesConfigured += summary.totalPayable;
      totalOutstanding += summary.pendingAmount;
      totalScholarships += summary.waiverTotal;

      if (summary.status === 'CLEAR') {
        clearStudentsCount++;
      } else if (summary.status === 'OVERDUE') {
        overdueStudentsCount++;
        pendingStudentsCount++;
      } else if (summary.status === 'PARTIAL') {
        partialStudentsCount++;
        pendingStudentsCount++;
      } else {
        pendingStudentsCount++;
      }
    })
  );

  // Aggregate payments by status
  const paymentsAgg = await Payment.aggregate([
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  let totalCollected = 0;
  let successfulPaymentsCount = 0;
  let pendingPaymentsCount = 0;
  let failedPaymentsCount = 0;

  paymentsAgg.forEach((p) => {
    if (p._id === 'SUCCESS') {
      totalCollected = p.totalAmount;
      successfulPaymentsCount = p.count;
    } else if (p._id === 'PENDING') {
      pendingPaymentsCount = p.count;
    } else if (p._id === 'FAILED') {
      failedPaymentsCount = p.count;
    }
  });

  // Calculate total refunds across all payments
  const refundsAgg = await Payment.aggregate([
    { $unwind: { path: '$refunds', preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: null,
        totalRefunds: { $sum: '$refunds.refundAmount' },
        refundCount: { $sum: 1 }
      }
    }
  ]);
  const totalRefunds = refundsAgg[0]?.totalRefunds || 0;

  // Today's collection
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayPaymentsAgg = await Payment.aggregate([
    {
      $match: {
        status: 'SUCCESS',
        paymentDate: { $gte: startOfToday }
      }
    },
    {
      $group: {
        _id: null,
        todayCollection: { $sum: '$amount' }
      }
    }
  ]);
  const todayCollection = todayPaymentsAgg[0]?.todayCollection || 0;

  // Monthly collection (1st of current month)
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthPaymentsAgg = await Payment.aggregate([
    {
      $match: {
        status: 'SUCCESS',
        paymentDate: { $gte: startOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        monthCollection: { $sum: '$amount' }
      }
    }
  ]);
  const monthlyCollection = monthPaymentsAgg[0]?.monthCollection || 0;

  return {
    totalStudents: allStudents.length,
    clearStudentsCount,
    pendingStudentsCount,
    overdueStudentsCount,
    partialStudentsCount,
    totalFeesConfigured,
    totalCollected,
    netCollected: Math.max(totalCollected - totalRefunds, 0),
    totalPending: totalOutstanding,
    totalPendingFees: totalOutstanding,
    totalOutstanding,
    todayCollection,
    monthlyCollection,
    totalScholarships,
    totalRefunds,
    successfulPaymentsCount,
    pendingPaymentsCount,
    failedPaymentsCount
  };
};
