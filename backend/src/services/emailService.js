

import { ENV } from '../config/env.js';

export let lastSentOtpForTesting = {};

export const getSenderAddress = () => {
  return `"${ENV.COLLEGE.NAME}" <${ENV.EMAIL.USER}>`;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const recipient = (to || '').trim().toLowerCase();
  const apiKey = process.env.BREVO_API_KEY;

  if (!recipient || !apiKey || !ENV.EMAIL.USER) {
    console.error('[EmailService] Missing recipient, Brevo API key, or verified sender.');
    return false;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: ENV.COLLEGE.NAME,
          email: ENV.EMAIL.USER
        },
        to: [{ email: recipient }],
        subject,
        textContent: text,
        htmlContent: html
      })
    });

    if (!response.ok) {
      console.error(`[EmailService] Brevo delivery failed. HTTP status: ${response.status}`);
      return false;
    }

    console.log(`[EmailService] Email accepted by Brevo for ${recipient}`);
    return true;
  } catch (err) {
    console.error('[EmailService] Brevo API connection failed:', err.message);
    return false;
  }
};

/**
 * Send Student Registration Verification OTP
 */
export const sendRegistrationOtpEmail = async (email, otp, studentName = 'Student') => {
  const normEmail = (email || '').trim().toLowerCase();
  lastSentOtpForTesting[normEmail] = otp;
  lastSentOtpForTesting.otp = otp;
  lastSentOtpForTesting.email = normEmail;
  lastSentOtpForTesting.purpose = 'REGISTRATION';
  const subject = `${ENV.COLLEGE.NAME} - Email Verification Code`;
  const text = `Dear ${studentName},\n\nYour 6-digit verification code for JB Institute of Technology Student ERP registration is: ${otp}\n\nThis code will expire in 10 minutes. If you did not initiate this registration, please disregard this message.\n\nWarm regards,\nRegistrar Office\n${ENV.COLLEGE.NAME}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 30px; color: #1e293b;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #312e81); padding: 25px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">${ENV.COLLEGE.NAME.toUpperCase()}</h1>
          <p style="margin: 6px 0 0; font-size: 12px; opacity: 0.85;">Student Information & ERP Services Portal</p>
        </div>
        <div style="padding: 30px 25px;">
          <h2 style="font-size: 17px; font-weight: 700; color: #0f172a; margin-top: 0;">Email Verification Required</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Hello <strong>${studentName}</strong>,<br>
            Thank you for registering with the <strong>${ENV.COLLEGE.NAME}</strong> Student ERP. To confirm your Gmail address and activate your student account, please use the 6-digit verification code below:
          </p>
          <div style="margin: 25px 0; text-align: center;">
            <div style="display: inline-block; background: #eef2ff; border: 2px dashed #4f46e5; border-radius: 12px; padding: 16px 36px;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #3730a3;">${otp}</span>
            </div>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 5px;">
            ⏰ <strong>Expiry:</strong> This verification code is valid for <strong>10 minutes</strong>.
          </p>
          <p style="font-size: 12px; color: #dc2626; line-height: 1.5; margin-top: 0;">
            🔒 <strong>Security Warning:</strong> Never share this OTP with anyone, including college staff.
          </p>
        </div>
        <div style="background: #f1f5f9; padding: 15px 25px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          ${ENV.COLLEGE.NAME} &bull; ${ENV.COLLEGE.ADDRESS} &bull; Tel: ${ENV.COLLEGE.PHONE}
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send Faculty Registration Verification OTP
 */
export const sendFacultyRegistrationOtpEmail = async (email, otp, facultyName = 'Faculty Member') => {
  const normEmail = (email || '').trim().toLowerCase();
  lastSentOtpForTesting[normEmail] = otp;
  lastSentOtpForTesting.otp = otp;
  lastSentOtpForTesting.email = normEmail;
  lastSentOtpForTesting.purpose = 'FACULTY_REGISTRATION';
  const subject = `${ENV.COLLEGE.NAME} - Faculty Email Verification`;
  const text = `JB Institute of Technology\nFaculty Email Verification\n\nDear ${facultyName},\n\nYour verification OTP is:\n${otp}\n\nThis verification code will expire in 10 minutes. If you did not initiate this registration, please contact administration.\n\nWarm regards,\nRegistrar & Academic Dean\n${ENV.COLLEGE.NAME}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 30px; color: #1e293b;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #1e1b4b, #312e81); padding: 25px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">JB Institute of Technology</h1>
          <p style="margin: 6px 0 0; font-size: 12px; opacity: 0.9;">Faculty Information &amp; ERP Services Portal</p>
        </div>
        <div style="padding: 30px 25px;">
          <h2 style="font-size: 17px; font-weight: 700; color: #0f172a; margin-top: 0;">Faculty Email Verification</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Hello <strong>${facultyName}</strong>,<br>
            Welcome to the <strong>JB Institute of Technology</strong> Faculty Portal. To confirm your email address and activate your Faculty ERP account, please use the verification code below:
          </p>
          <div style="margin: 25px 0; text-align: center;">
            <p style="font-size: 13px; font-weight: 600; color: #4338ca; margin-bottom: 8px;">Your verification OTP is:</p>
            <div style="display: inline-block; background: #eef2ff; border: 2px dashed #4f46e5; border-radius: 12px; padding: 16px 36px;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #312e81;">${otp}</span>
            </div>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 5px;">
            ⏰ <strong>Expiry:</strong> The OTP will expire after <strong>10 minutes</strong>.
          </p>
          <p style="font-size: 12px; color: #dc2626; line-height: 1.5; margin-top: 0;">
            🔒 <strong>Security Warning:</strong> Never share this OTP with anyone, including college staff.
          </p>
        </div>
        <div style="background: #f1f5f9; padding: 15px 25px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          JB Institute of Technology &bull; 23 Milestone, NH-07, Chakrata Rd, Shankarpur, Uttarakhand 248197 &bull; Tel: ${ENV.COLLEGE.PHONE}
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send Password Reset OTP Email
 */
export const sendPasswordResetOtpEmail = async (email, otp, userName = 'User') => {
  const normEmail = (email || '').trim().toLowerCase();
  lastSentOtpForTesting[normEmail] = otp;
  lastSentOtpForTesting.otp = otp;
  lastSentOtpForTesting.email = normEmail;
  lastSentOtpForTesting.purpose = 'PASSWORD_RESET';
  const subject = `${ENV.COLLEGE.NAME} - Password Reset Request`;
  const text = `Dear ${userName},\n\nWe received a request to reset your password for your ${ENV.COLLEGE.NAME} ERP account.\n\nYour 6-digit password reset OTP is: ${otp}\n\nThis code will expire in 10 minutes. If you did not make this request, you can safely ignore this email.\n\nWarm regards,\nIT Support\n${ENV.COLLEGE.NAME}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 30px; color: #1e293b;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #0f172a, #1e3a8a); padding: 25px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">${ENV.COLLEGE.NAME.toUpperCase()}</h1>
          <p style="margin: 6px 0 0; font-size: 12px; opacity: 0.85;">Account Security & Recovery Services</p>
        </div>
        <div style="padding: 30px 25px;">
          <h2 style="font-size: 17px; font-weight: 700; color: #0f172a; margin-top: 0;">Password Reset Code</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Hello <strong>${userName}</strong>,<br>
            A request was submitted to reset your login password for your <strong>${ENV.COLLEGE.NAME}</strong> ERP account. Use the one-time code below to verify your account and set a new password:
          </p>
          <div style="margin: 25px 0; text-align: center;">
            <div style="display: inline-block; background: #fef2f2; border: 2px dashed #dc2626; border-radius: 12px; padding: 16px 36px;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #991b1b;">${otp}</span>
            </div>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 5px;">
            ⏰ <strong>Expiry:</strong> This code is valid for <strong>10 minutes</strong>.
          </p>
          <p style="font-size: 12px; color: #b45309; line-height: 1.5; margin-top: 0;">
            ⚠️ If you did not request this password reset, please ignore this email or notify IT administration immediately.
          </p>
        </div>
        <div style="background: #f1f5f9; padding: 15px 25px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          ${ENV.COLLEGE.NAME} &bull; ${ENV.COLLEGE.ADDRESS} &bull; Tel: ${ENV.COLLEGE.PHONE}
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send Successful Fee Payment Confirmation Email
 */
export const sendPaymentConfirmationEmail = async ({ email, studentName, payment, remainingDue }) => {
  const subject = `${ENV.COLLEGE.NAME} - Fee Payment Receipt Confirmation [${payment.receiptNumber}]`;
  const text = `Dear ${studentName},\n\nWe have successfully received your payment of ₹${Number(payment.amount).toLocaleString('en-IN')}.\n\nReceipt Number: ${payment.receiptNumber}\nTransaction ID: ${payment.transactionId}\nRemaining Balance: ₹${Number(remainingDue).toLocaleString('en-IN')}\n\nYou can download the official PDF receipt anytime from your student ERP dashboard.\n\nWarm regards,\nAccounts Office\n${ENV.COLLEGE.NAME}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 25px; color: #1e293b;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #059669, #047857); padding: 25px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 19px; font-weight: 800;">${ENV.COLLEGE.NAME.toUpperCase()}</h1>
          <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.9;">Fee Payment Receipt & Confirmation</p>
        </div>
        <div style="padding: 25px;">
          <p style="font-size: 14px; color: #334155;">Hello <strong>${studentName}</strong>,</p>
          <p style="font-size: 13.5px; color: #475569; line-height: 1.6;">
            Your fee payment has been successfully credited and verified in the JBIT institutional accounts ledger.
          </p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 15px; margin: 20px 0;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; color: #64748b;">Amount Paid:</td><td style="text-align: right; font-weight: 800; color: #065f46; font-size: 16px;">₹${Number(payment.amount).toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Receipt Number:</td><td style="text-align: right; font-family: monospace; font-weight: 700;">${payment.receiptNumber}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Transaction ID:</td><td style="text-align: right; font-family: monospace;">${payment.transactionId}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Remaining Balance:</td><td style="text-align: right; font-weight: 700; color: ${remainingDue === 0 ? '#059669' : '#dc2626'};">${remainingDue === 0 ? '₹0.00 (Fully Cleared)' : `₹${Number(remainingDue).toLocaleString('en-IN')}`}</td></tr>
            </table>
          </div>
          <p style="font-size: 12px; color: #64748b;">
            Official printable PDF receipt is generated and available in your student portal under <strong>Receipts & Payments</strong>.
          </p>
        </div>
        <div style="background: #f1f5f9; padding: 12px 25px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          ${ENV.COLLEGE.NAME} &bull; ${ENV.COLLEGE.ADDRESS}
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send Fee Reminder Email (Upcoming, Due Date, or Overdue)
 */
export const sendFeeReminderEmail = async ({ email, studentName, reminderType, installment, remainingDue }) => {
  const isOverdue = reminderType === 'OVERDUE';
  const dueDateStr = installment?.dueDate ? new Date(installment.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Soon';

  const subject = isOverdue
    ? `⚠️ URGENT: Overdue Fee Notice - ${ENV.COLLEGE.NAME}`
    : `Institutional Fee Notice: Payment Reminder - ${ENV.COLLEGE.NAME}`;

  const headerGradient = isOverdue
    ? 'linear-gradient(135deg, #b91c1c, #7f1d1d)'
    : 'linear-gradient(135deg, #1e3a8a, #1d4ed8)';

  const text = `Dear ${studentName},\n\nThis is an institutional notice from ${ENV.COLLEGE.NAME} regarding your pending semester fee.\n\nInstallment: ${installment?.title || 'Academic Fee'}\nAmount Due: ₹${Number(installment?.remainingAmount || remainingDue).toLocaleString('en-IN')}\nDue Date: ${dueDateStr}\n\n${isOverdue ? 'Please settle this immediately to avoid compounding daily late fines and restriction on examination admit card generation.' : 'Please ensure payment is completed before the due date to ensure uninterrupted academic services.'}\n\nWarm regards,\nAccounts Office\n${ENV.COLLEGE.NAME}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 25px; color: #1e293b;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="background: ${headerGradient}; padding: 25px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 19px; font-weight: 800;">${ENV.COLLEGE.NAME.toUpperCase()}</h1>
          <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.9;">
            ${isOverdue ? 'CRITICAL OVERDUE FEE NOTICE' : 'FEE PAYMENT DUE REMINDER'}
          </p>
        </div>
        <div style="padding: 25px;">
          <p style="font-size: 14px; color: #334155;">Hello <strong>${studentName}</strong>,</p>
          <p style="font-size: 13.5px; color: #475569; line-height: 1.6;">
            ${isOverdue
              ? 'Our records show that your semester fee installment is past its due date. In accordance with university guidelines, outstanding dues restrict Examination Admit Card generation and may accrue late fines.'
              : 'This is a gentle reminder that your scheduled college fee installment is approaching its due date. Please ensure timely clearance.'
            }
          </p>
          <div style="background: ${isOverdue ? '#fef2f2' : '#f0f9ff'}; border: 1px solid ${isOverdue ? '#fecaca' : '#bae6fd'}; border-radius: 12px; padding: 15px; margin: 20px 0;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; color: #64748b;">Fee Category:</td><td style="text-align: right; font-weight: 700;">${installment?.title || 'Academic Semester Fee'}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Due Date:</td><td style="text-align: right; font-weight: 700; color: ${isOverdue ? '#dc2626' : '#0284c7'};">${dueDateStr}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Outstanding Due:</td><td style="text-align: right; font-weight: 800; font-size: 16px; color: #b91c1c;">₹${Number(installment?.remainingAmount || remainingDue).toLocaleString('en-IN')}</td></tr>
            </table>
          </div>
          <p style="font-size: 12px; color: #64748b;">
            You can pay securely via UPI, Netbanking, or Debit/Credit card through your <strong>Student ERP Portal</strong>.
          </p>
        </div>
        <div style="background: #f1f5f9; padding: 12px 25px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          ${ENV.COLLEGE.NAME} &bull; ${ENV.COLLEGE.ADDRESS}
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send Warden Registration Verification OTP
 */
export const sendWardenRegistrationOtpEmail = async (email, otp, wardenName = 'Hostel Warden') => {
  const normEmail = (email || '').trim().toLowerCase();
  lastSentOtpForTesting[normEmail] = otp;
  lastSentOtpForTesting.otp = otp;
  lastSentOtpForTesting.email = normEmail;
  lastSentOtpForTesting.purpose = 'WARDEN_REGISTRATION';
  const subject = `${ENV.COLLEGE.NAME} - Hostel Warden Email Verification Code`;
  const text = `JB Institute of Technology\nHostel Warden Portal Registration\n\nDear ${wardenName},\n\nYour 6-digit verification code is: ${otp}\n\nThis verification code will expire in 10 minutes. If you did not initiate this registration, please notify college administration.\n\nWarm regards,\nOffice of the Registrar\n${ENV.COLLEGE.NAME}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 30px; color: #1e293b;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #0f766e, #042f2e); padding: 25px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">${ENV.COLLEGE.NAME.toUpperCase()}</h1>
          <p style="margin: 6px 0 0; font-size: 12px; opacity: 0.9;">Hostel Administration &amp; Warden Desk</p>
        </div>
        <div style="padding: 30px 25px;">
          <h2 style="font-size: 17px; font-weight: 700; color: #0f172a; margin-top: 0;">Warden Account Verification</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Hello <strong>${wardenName}</strong>,<br>
            Welcome to the <strong>${ENV.COLLEGE.NAME}</strong> Hostel Management System. To confirm your email address and activate your Warden credentials, please enter the verification code below:
          </p>
          <div style="margin: 25px 0; text-align: center;">
            <p style="font-size: 13px; font-weight: 600; color: #0f766e; margin-bottom: 8px;">Your 6-Digit One-Time Password (OTP):</p>
            <div style="display: inline-block; background: #f0fdfa; border: 2px dashed #0d9488; border-radius: 12px; padding: 16px 36px;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #115e59;">${otp}</span>
            </div>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 5px;">
            ⏰ <strong>Expiry:</strong> This OTP is strictly valid for <strong>10 minutes</strong>.
          </p>
          <p style="font-size: 12px; color: #dc2626; line-height: 1.5; margin-top: 0;">
            🔒 <strong>Security Reminder:</strong> Never share this code with anyone.
          </p>
        </div>
        <div style="background: #f1f5f9; padding: 15px 25px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          ${ENV.COLLEGE.NAME} &bull; ${ENV.COLLEGE.ADDRESS}
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send Hostel Bed Allocation Confirmation Email
 */
export const sendHostelAllocationEmail = async ({ email, studentName, allocation }) => {
  const subject = `${ENV.COLLEGE.NAME} - Hostel Room & Bed Allocated [${allocation.bedNumber}]`;
  const text = `Dear ${studentName},\n\nCongratulations! Your hostel accommodation application has been approved and a bed has been successfully allocated.\n\nHostel: ${allocation.hostelName}\nBlock & Floor: ${allocation.block}, ${allocation.floor}\nRoom: ${allocation.roomNumber}\nBed Number: ${allocation.bedNumber}\n\nYou can download your official Hostel Allocation Card from your Student ERP Portal.\n\nWarm regards,\nHostel Warden Office\n${ENV.COLLEGE.NAME}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 25px; color: #1e293b;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #4338ca, #1e1b4b); padding: 25px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 19px; font-weight: 800;">${ENV.COLLEGE.NAME.toUpperCase()}</h1>
          <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.9;">Hostel Residence Allocation Notice</p>
        </div>
        <div style="padding: 25px;">
          <p style="font-size: 14px; color: #334155;">Hello <strong>${studentName}</strong>,</p>
          <p style="font-size: 13.5px; color: #475569; line-height: 1.6;">
            Your hostel application has been approved and an available room/bed has been officially assigned to you:
          </p>
          <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 15px; margin: 20px 0;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; color: #64748b;">Hostel:</td><td style="text-align: right; font-weight: 800; color: #3730a3;">${allocation.hostelName}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Block & Floor:</td><td style="text-align: right; font-weight: 700;">${allocation.block} &bull; ${allocation.floor}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Room Number:</td><td style="text-align: right; font-weight: 700;">Room ${allocation.roomNumber}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Allotted Bed:</td><td style="text-align: right; font-weight: 800; color: #047857; font-size: 15px;">${allocation.bedNumber}</td></tr>
            </table>
          </div>
          <p style="font-size: 12px; color: #64748b;">
            Your digital <strong>Hostel Allocation Card</strong> with QR code is ready for download in your Student Dashboard.
          </p>
        </div>
        <div style="background: #f1f5f9; padding: 12px 25px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          ${ENV.COLLEGE.NAME} &bull; ${ENV.COLLEGE.ADDRESS}
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send Transport Bus Seat Allocation Confirmation Email
 */
export const sendTransportAllocationEmail = async ({ email, studentName, allocation }) => {
  const subject = `${ENV.COLLEGE.NAME} - Campus Transport Bus Seat Assigned [Bus ${allocation.busNumber}, Seat ${allocation.seatNumber}]`;
  const text = `Dear ${studentName},\n\nYour transport service application has been confirmed and a bus seat has been allocated.\n\nBus Number: ${allocation.busNumber}\nRoute: ${allocation.routeName}\nDesignated Stop: ${allocation.stopName}\nSeat Number: ${allocation.seatNumber}\n\nYou can download your Transport Pass from the student portal.\n\nWarm regards,\nTransport Office\n${ENV.COLLEGE.NAME}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 25px; color: #1e293b;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #0284c7, #082f49); padding: 25px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 19px; font-weight: 800;">${ENV.COLLEGE.NAME.toUpperCase()}</h1>
          <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.9;">College Transport Allocation Confirmation</p>
        </div>
        <div style="padding: 25px;">
          <p style="font-size: 14px; color: #334155;">Hello <strong>${studentName}</strong>,</p>
          <p style="font-size: 13.5px; color: #475569; line-height: 1.6;">
            Your transport seat booking has been successfully confirmed:
          </p>
          <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 15px; margin: 20px 0;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; color: #64748b;">Bus Number:</td><td style="text-align: right; font-weight: 800; color: #0369a1; font-family: monospace;">${allocation.busNumber}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Route:</td><td style="text-align: right; font-weight: 700;">${allocation.routeName}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Boarding Stop:</td><td style="text-align: right; font-weight: 700;">${allocation.stopName}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Allocated Seat:</td><td style="text-align: right; font-weight: 800; color: #0284c7; font-size: 15px;">Seat #${allocation.seatNumber}</td></tr>
            </table>
          </div>
        </div>
        <div style="background: #f1f5f9; padding: 12px 25px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          ${ENV.COLLEGE.NAME} &bull; ${ENV.COLLEGE.ADDRESS}
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

