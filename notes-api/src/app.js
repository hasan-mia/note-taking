const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const globalErrorHandler = require('./middleware/error');
const { UPLOAD_DIR } = require('./config/paths');

dotenv.config();

const app = express();

// Connect to database
connectDB();

// CORS: read origins from CORS_ORIGIN env var (comma-separated), fallback to all
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : '*';

// Middleware
app.use(morgan('dev'));
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
app.use('/files', express.static(UPLOAD_DIR));

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, status: 404, message: 'Route not found' });
});

// Global error handler
app.use(globalErrorHandler);

module.exports = app;