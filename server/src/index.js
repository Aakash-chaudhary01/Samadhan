require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectDB } = require('./db');
const { ensureDefaultDepartments } = require('./routes/departments');

const app = express();
const PORT = process.env.PORT || 5001;

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // allow static images to be displayed in client
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiter for security hardening
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
});
app.use('/api/', apiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'SAMADHAN API',
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// Mount Routes
const authRoutes = require('./routes/auth');
const complaintsRoutes = require('./routes/complaints');
const { router: departmentsRoutes } = require('./routes/departments');
const adminRoutes = require('./routes/admin');
const notificationsRoutes = require('./routes/notifications');
const aiRoutes = require('./routes/ai');
const uploadRoutes = require('./routes/upload');

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start server
async function startServer() {
  try {
    await connectDB();
    await ensureDefaultDepartments();

    // Check if initial complaints exist; if not, populate demo dataset
    const Complaint = require('./models/Complaint');
    const compCount = await Complaint.countDocuments();
    if (compCount === 0) {
      console.log('[SAMADHAN] Empty dataset detected. Seeding demo dataset...');
      const { populateInitialData } = require('./seed');
      if (populateInitialData) {
        await populateInitialData();
      }
    }

    app.listen(PORT, () => {
      console.log(`[SAMADHAN] Server active and listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
