const categoryRepository = require('../repositories/categoryRepository');

class CategoryService {
  async getAllCategories() {
    return categoryRepository.findAll();
  }

  async getCategoryById(id) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      const err = new Error(`Category with ID ${id} not found`);
      err.statusCode = 404;
      throw err;
    }
    return category;
  }

  async createCategory(data) {
    const { name, woo_id } = data;

    if (!name || !String(name).trim()) {
      const err = new Error('Category name is required');
      err.statusCode = 400;
      throw err;
    }

    const trimmedName = String(name).trim();
    const existing = await categoryRepository.findByName(trimmedName);
    if (existing) {
      const err = new Error(`Category '${trimmedName}' already exists`);
      err.statusCode = 400;
      throw err;
    }

    return categoryRepository.create({
      name: trimmedName,
      woo_id: woo_id ? Number(woo_id) : null
    });
  }

  async updateCategory(id, data) {
    const existing = await this.getCategoryById(id);
    const { name, woo_id } = data;

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        const err = new Error('Category name cannot be empty');
        err.statusCode = 400;
        throw err;
      }

      if (trimmedName.toLowerCase() !== existing.name.toLowerCase()) {
        const duplicate = await categoryRepository.findByName(trimmedName);
        if (duplicate && duplicate.id !== Number(id)) {
          const err = new Error(`Category '${trimmedName}' already exists`);
          err.statusCode = 400;
          throw err;
        }
      }
    }

    return categoryRepository.update(id, {
      name: name !== undefined ? String(name).trim() : existing.name,
      woo_id: woo_id !== undefined ? (woo_id ? Number(woo_id) : null) : existing.woo_id
    });
  }

  async deleteCategory(id) {
    await this.getCategoryById(id);
    return categoryRepository.delete(id);
  }
}

module.exports = new CategoryService();
