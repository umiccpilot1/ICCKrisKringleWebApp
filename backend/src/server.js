require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');
const { initializeDatabase } = require('./config/database');
const authMiddleware = require('./middleware/auth');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const employeeRoutes = require('./routes/employee.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const previewRoutes = require('./routes/preview.routes');

initializeDatabase();

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const employeePhotoPath = path.join(__dirname, '../../frontend/public/images/employees');
app.use('/images/employees', express.static(employeePhotoPath));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/preview', previewRoutes);

if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

const port = process.env.PORT || 3060;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
