const express = require('express');
const router = express.Router();

const productRoutes = require('./productRoutes');
const categoryRoutes = require('./categoryRoutes');
const syncRoutes = require('./syncRoutes');

router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/sync', syncRoutes);

module.exports = router;
