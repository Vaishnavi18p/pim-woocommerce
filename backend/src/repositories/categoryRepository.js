const db = require('../config/db');

class CategoryRepository {
  async findAll() {
    return db.query('SELECT * FROM categories ORDER BY name ASC');
  }

  async findById(id) {
    const rows = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findByName(name) {
    const rows = await db.query('SELECT * FROM categories WHERE LOWER(name) = LOWER(?)', [name]);
    return rows[0] || null;
  }

  async create({ name, woo_id = null }) {
    const result = await db.query(
      'INSERT INTO categories (name, woo_id) VALUES (?, ?)',
      [name, woo_id]
    );
    return this.findById(result.insertId);
  }

  async updateWooId(id, woo_id) {
    await db.query('UPDATE categories SET woo_id = ? WHERE id = ?', [woo_id, id]);
    return this.findById(id);
  }

  async update(id, { name, woo_id = null }) {
    await db.query(
      'UPDATE categories SET name = ?, woo_id = ? WHERE id = ?',
      [name, woo_id, id]
    );
    return this.findById(id);
  }

  async delete(id) {
    const result = await db.query('DELETE FROM categories WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new CategoryRepository();
