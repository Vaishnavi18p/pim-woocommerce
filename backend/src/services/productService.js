const productRepository = require('../repositories/productRepository');
const categoryRepository = require('../repositories/categoryRepository');

class ProductService {
  async getAllProducts(filters = {}) {
    return productRepository.findAll(filters);
  }

  async getProductById(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      const err = new Error(`Product with ID ${id} not found`);
      err.statusCode = 404;
      throw err;
    }
    return product;
  }

  async createProduct(data) {
    const { sku, name, price, description, category_id, attributes } = data;

    if (!sku || !String(sku).trim()) {
      const err = new Error('Product SKU is required');
      err.statusCode = 400;
      throw err;
    }

    if (!name || !String(name).trim()) {
      const err = new Error('Product name is required');
      err.statusCode = 400;
      throw err;
    }

    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      const err = new Error('Product price must be a valid non-negative number');
      err.statusCode = 400;
      throw err;
    }

    const trimmedSku = String(sku).trim();
    const existing = await productRepository.findBySku(trimmedSku);
    if (existing) {
      const err = new Error(`Product with SKU '${trimmedSku}' already exists`);
      err.statusCode = 400;
      throw err;
    }

    if (category_id) {
      const category = await categoryRepository.findById(category_id);
      if (!category) {
        const err = new Error(`Category with ID ${category_id} does not exist`);
        err.statusCode = 400;
        throw err;
      }
    }

    return productRepository.create({
      sku: trimmedSku,
      name: String(name).trim(),
      description: description ? String(description).trim() : '',
      price: Number(price),
      category_id: category_id ? Number(category_id) : null,
      attributes: Array.isArray(attributes) ? attributes : []
    });
  }

  async updateProduct(id, data) {
    const existing = await this.getProductById(id);

    const { sku, name, price, description, category_id, attributes } = data;

    if (sku !== undefined) {
      const trimmedSku = String(sku).trim();
      if (!trimmedSku) {
        const err = new Error('Product SKU cannot be empty');
        err.statusCode = 400;
        throw err;
      }

      if (trimmedSku.toLowerCase() !== existing.sku.toLowerCase()) {
        const duplicate = await productRepository.findBySku(trimmedSku);
        if (duplicate && duplicate.id !== Number(id)) {
          const err = new Error(`Product with SKU '${trimmedSku}' already exists`);
          err.statusCode = 400;
          throw err;
        }
      }
    }

    if (name !== undefined && !String(name).trim()) {
      const err = new Error('Product name cannot be empty');
      err.statusCode = 400;
      throw err;
    }

    if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
      const err = new Error('Product price must be a valid non-negative number');
      err.statusCode = 400;
      throw err;
    }

    if (category_id) {
      const category = await categoryRepository.findById(category_id);
      if (!category) {
        const err = new Error(`Category with ID ${category_id} does not exist`);
        err.statusCode = 400;
        throw err;
      }
    }

    return productRepository.update(id, {
      sku: sku !== undefined ? String(sku).trim() : undefined,
      name: name !== undefined ? String(name).trim() : undefined,
      description: description !== undefined ? String(description).trim() : undefined,
      price: price !== undefined ? Number(price) : undefined,
      category_id: category_id !== undefined ? (category_id ? Number(category_id) : null) : undefined,
      attributes
    });
  }

  async deleteProduct(id) {
    await this.getProductById(id);
    return productRepository.delete(id);
  }
}

module.exports = new ProductService();
