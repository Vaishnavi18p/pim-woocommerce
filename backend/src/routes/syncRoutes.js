const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

router.post('/product/:id', (req, res, next) => syncController.syncProduct(req, res, next));
router.post('/all', (req, res, next) => syncController.syncAll(req, res, next));
router.get('/logs', (req, res, next) => syncController.getLogs(req, res, next));

module.exports = router;
