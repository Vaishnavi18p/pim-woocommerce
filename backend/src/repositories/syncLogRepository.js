const db = require('../config/db');

class SyncLogRepository {
  async create({ product_id, status, message }) {
    const result = await db.query(
      'INSERT INTO sync_logs (product_id, status, message) VALUES (?, ?, ?)',
      [product_id || null, status, message || '']
    );
    return this.findById(result.insertId);
  }

  async findById(id) {
    const rows = await db.query('SELECT * FROM sync_logs WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findAll({ limit = 50, offset = 0 } = {}) {
    return db.query(
      `
      SELECT 
        l.*,
        p.name AS product_name,
        p.sku AS product_sku
      FROM sync_logs l
      LEFT JOIN products p ON l.product_id = p.id
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [Number(limit), Number(offset)]
    );
  }

  async findByProductId(productId) {
    return db.query(
      'SELECT * FROM sync_logs WHERE product_id = ? ORDER BY created_at DESC',
      [productId]
    );
  }
}

module.exports = new SyncLogRepository();
