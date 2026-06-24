require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { startReminderCron } = require('./services/reminderService');

// Initialize database connection
connectDB();

const app = express();

// CORS middleware configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // default Vite dev server
  credentials: true
}));

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom lightweight Cookie Parser middleware
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        req.cookies[name] = decodeURIComponent(val);
      }
    });
  }
  next();
});

// Serve uploaded medical reports statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route registrations
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/plans', require('./routes/planRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Start progress logger cron job
startReminderCron();

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'VitalPlan Backend is running smoothly.' });
});

// Custom 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
});

// Global central error handler middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`VitalPlan Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
