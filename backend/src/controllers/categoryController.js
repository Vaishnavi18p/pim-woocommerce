const categoryRepository = require('../repositories/categoryRepository');

class CategoryController {
  async getCategories(req, res, next) {
    try {
      const categories = await categoryRepository.findAll();
      res.json(categories);
    } catch (err) {
      next(err);
    }
  }

  async getCategoryById(req, res, next) {
    try {
      const category = await categoryRepository.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: `Category with ID ${req.params.id} not found` });
      }
      res.json(category);
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req, res, next) {
    try {
      const { name, woo_id } = req.body;
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      const existing = await categoryRepository.findByName(name.trim());
      if (existing) {
        return res.status(400).json({ error: `Category '${name.trim()}' already exists` });
      }

      const category = await categoryRepository.create({
        name: name.trim(),
        woo_id: woo_id ? Number(woo_id) : null
      });

      res.status(201).json(category);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CategoryController();
