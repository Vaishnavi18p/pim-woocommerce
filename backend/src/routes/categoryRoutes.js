const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get('/', (req, res, next) => categoryController.getCategories(req, res, next));
router.get('/:id', (req, res, next) => categoryController.getCategoryById(req, res, next));
router.post('/', (req, res, next) => categoryController.createCategory(req, res, next));

module.exports = router;
