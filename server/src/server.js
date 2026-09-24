import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import 'dotenv/config';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import billRoutes from './routes/billRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));

// Basic brute-force protection on auth endpoints
app.use(
  '/api/auth/login',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false })
);

// Liveness endpoint — reports DB state, answers even while reconnecting
app.get('/api/health', (req, res) => {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    db: states[mongoose.connection?.readyState] ?? 'unknown',
  });
});

// Gate data routes with a clear 503 while Mongo is (re)connecting
app.use('/api', (req, res, next) => {
  const state = mongoose.connection?.readyState;
  if (state === 1 || state === 2) return next();
  res.status(503).json({
    success: false,
    message: 'Database is reconnecting — please try again in a few seconds.',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number.parseInt(process.env.PORT, 10);
const validPort = Number.isInteger(PORT) && PORT > 0 && PORT <= 65535 ? PORT : 5000;

// Start HTTP immediately; Mongo connects (and retries) in the background.
app.listen(validPort, () => {
  console.log(`✔ MediBook API listening on http://localhost:${validPort}`);
  connectDB({ attempts: Infinity }).then((ok) => {
    if (ok) {
      console.log('✔ Database ready — API serving data.');
    } else {
      console.error(
        '✖ MongoDB authentication failed. Fix credentials in server/.env, then restart. HTTP server stays up.'
      );
    }
  });
});
