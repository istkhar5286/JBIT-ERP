import mongoose from 'mongoose';

const paymentSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'DEFAULT',
      unique: true
    },
    qrCode: {
      type: String, // base64 data URI string (PNG/JPEG)
      default: ''
    },
    upiId: {
      type: String,
      trim: true,
      default: 'jbitdehradun@upi'
    },
    paymentName: {
      type: String,
      trim: true,
      default: 'JB Institute of Technology'
    },
    paymentInstructions: {
      type: String,
      default: '1. Scan the QR code using any UPI App (GPay, PhonePe, Paytm, BHIM).\n2. Verify beneficiary name: JB Institute of Technology.\n3. Complete the payment and note down the 12-digit UTR/Transaction reference number.\n4. Upload the screenshot of the payment receipt and click Submit for administrative verification.'
    },
    updatedBy: {
      type: String,
      default: 'System Administration'
    }
  },
  { timestamps: true }
);

export const PaymentSetting = mongoose.model('PaymentSetting', paymentSettingSchema);
