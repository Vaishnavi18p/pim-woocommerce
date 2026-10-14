const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

// GET /api/sync/logs
router.get('/logs', (req, res, next) => syncController.getLogs(req, res, next));

// POST /api/sync (sync all pending or failed products)
router.post('/', (req, res, next) => syncController.syncAll(req, res, next));
router.post('/all', (req, res, next) => syncController.syncAll(req, res, next));

// POST /api/sync/:productId (sync single product)
router.post('/:productId', (req, res, next) => syncController.syncProduct(req, res, next));

module.exports = router;
