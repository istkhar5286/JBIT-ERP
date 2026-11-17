import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import wardenRoutes from './routes/wardenRoutes.js';
import hostelRoutes from './routes/hostelRoutes.js';
import transportServiceRoutes from './routes/transportServiceRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sendSuccess, sendError } from './utils/apiResponse.js';

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Health Check
app.get('/api/health', (req, res) => {
  return sendSuccess(res, 'College ERP API is operating normally', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/warden', wardenRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hostel', hostelRoutes);
app.use('/api/transport', transportServiceRoutes);
app.use('/api/transport-service', transportServiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  return sendError(res, `API route not found: ${req.method} ${req.originalUrl}`, 404);
});

// Global Error Handler
app.use(errorHandler);

export default app;
