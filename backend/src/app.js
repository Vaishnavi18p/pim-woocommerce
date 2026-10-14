const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`[PIM API] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PIM Backend API',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'PIM API',
    description: 'Product Information Management REST API with WooCommerce Synchronization',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      products: 'GET /api/products, POST /api/products, PUT /api/products/:id, DELETE /api/products/:id',
      categories: 'GET /api/categories, POST /api/categories',
      syncProduct: 'POST /api/products/:id/sync (or POST /api/sync/product/:id)',
      syncAll: 'POST /api/sync/all',
      syncLogs: 'GET /api/sync/logs'
    }
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);

  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

module.exports = app;
