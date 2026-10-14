const productService = require('../services/productService');

class ProductController {
  async getProducts(req, res, next) {
    try {
      const { status, search } = req.query;
      const products = await productService.getAllProducts({ status, search });
      res.json(products);
    } catch (err) {
      next(err);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      res.json(product);
    } catch (err) {
      next(err);
    }
  }

  async createProduct(req, res, next) {
    try {
      const created = await productService.createProduct(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const updated = await productService.updateProduct(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      await productService.deleteProduct(req.params.id);
      res.json({ message: `Product ${req.params.id} deleted successfully` });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProductController();
