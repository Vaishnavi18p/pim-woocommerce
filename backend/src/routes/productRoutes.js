const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const syncController = require('../controllers/syncController');

router.get('/', (req, res, next) => productController.getProducts(req, res, next));
router.get('/:id', (req, res, next) => productController.getProductById(req, res, next));
router.post('/', (req, res, next) => productController.createProduct(req, res, next));
router.put('/:id', (req, res, next) => productController.updateProduct(req, res, next));
router.delete('/:id', (req, res, next) => productController.deleteProduct(req, res, next));

// Direct sync convenience route on product
router.post('/:id/sync', (req, res, next) => syncController.syncProduct(req, res, next));

module.exports = router;
