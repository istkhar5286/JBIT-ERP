import crypto from 'crypto';

export const generateReceiptNumber = () => {
  const date = new Date();
  const yearMonth = date.toISOString().slice(0, 7).replace('-', '');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `RCP-${yearMonth}-${randomSuffix}`;
};

export const generateTransactionId = (prefix = 'TXN') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};
