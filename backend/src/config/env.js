import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college_erp',
  USE_IN_MEMORY_DB: process.env.USE_IN_MEMORY_DB === 'true',
  JWT_SECRET: process.env.JWT_SECRET || 'college_erp_jwt_secret_secure_key_998877',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COLLEGE: {
    NAME: process.env.COLLEGE_NAME || 'JB Institute of Technology',
    CODE: process.env.COLLEGE_CODE || 'JBIT-101',
    ADDRESS: process.env.COLLEGE_ADDRESS || '23 Milestone, NH-07, Chakrata Rd, Shankarpur, Uttarakhand 248197',
    EMAIL: process.env.COLLEGE_EMAIL || 'support@jbit.edu.in',
    PHONE: process.env.COLLEGE_PHONE || '+91 9876543210'
  },
  EMAIL: {
    HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
    SECURE: process.env.SMTP_SECURE === 'true',
    USER: process.env.EMAIL_USER || '',
    PASS: process.env.EMAIL_PASS || '',
    FROM: process.env.EMAIL_FROM || 'JB Institute of Technology <noreply@jbit.edu.in>'
  },
  ADMIN: {
    EMAIL: (process.env.ADMIN_EMAIL || 'jbinstitute.erp@gmail.com').trim().toLowerCase(),
    PASSWORD: process.env.ADMIN_PASSWORD || 'jbit@123'
  }
};
