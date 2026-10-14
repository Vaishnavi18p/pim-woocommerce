const db = require('../config/db');

class ProductRepository {
  async findAll({ status, search } = {}) {
    let sql = `
      SELECT 
        p.*, 
        c.name AS category_name,
        c.woo_id AS category_woo_id
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND p.sync_status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY p.id DESC';

    const products = await db.query(sql, params);

    if (products.length === 0) return [];

    // Fetch attributes for all returned products
    const productIds = products.map(p => p.id);
    const placeholders = productIds.map(() => '?').join(',');
    const attributes = await db.query(
      `SELECT * FROM product_attributes WHERE product_id IN (${placeholders})`,
      productIds
    );

    const attrMap = {};
    attributes.forEach(attr => {
      if (!attrMap[attr.product_id]) attrMap[attr.product_id] = [];
      attrMap[attr.product_id].push({
        id: attr.id,
        name: attr.name,
        value: attr.value
      });
    });

    return products.map(p => ({
      ...p,
      price: parseFloat(p.price),
      attributes: attrMap[p.id] || []
    }));
  }

  async findById(id) {
    const rows = await db.query(
      `
      SELECT 
        p.*, 
        c.name AS category_name,
        c.woo_id AS category_woo_id
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
      `,
      [id]
    );

    if (rows.length === 0) return null;

    const product = rows[0];
    const attributes = await db.query(
      'SELECT id, name, value FROM product_attributes WHERE product_id = ?',
      [id]
    );

    return {
      ...product,
      price: parseFloat(product.price),
      attributes
    };
  }

  async findBySku(sku) {
    const rows = await db.query('SELECT * FROM products WHERE sku = ?', [sku]);
    if (rows.length === 0) return null;
    return this.findById(rows[0].id);
  }

  async findPending() {
    return this.findAll({ status: 'pending' });
  }

  async create({ sku, name, description = '', price = 0, category_id = null, attributes = [] }) {
    const connection = await db.pool.getConnection();
    try {
      await connection.beginTransaction();

      const [res] = await connection.execute(
        `INSERT INTO products (sku, name, description, price, category_id, sync_status) 
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [sku, name, description, price, category_id || null]
      );

      const productId = res.insertId;

      if (Array.isArray(attributes) && attributes.length > 0) {
        for (const attr of attributes) {
          if (attr.name && attr.value !== undefined) {
            await connection.execute(
              'INSERT INTO product_attributes (product_id, name, value) VALUES (?, ?, ?)',
              [productId, attr.name, String(attr.value)]
            );
          }
        }
      }

      await connection.commit();
      return this.findById(productId);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async update(id, { sku, name, description, price, category_id, attributes }) {
    const connection = await db.pool.getConnection();
    try {
      await connection.beginTransaction();

      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`Product with ID ${id} not found`);
      }

      const updatedSku = sku !== undefined ? sku : existing.sku;
      const updatedName = name !== undefined ? name : existing.name;
      const updatedDescription = description !== undefined ? description : existing.description;
      const updatedPrice = price !== undefined ? price : existing.price;
      const updatedCategoryId = category_id !== undefined ? category_id : existing.category_id;

      // When product is updated, sync_status resets to 'pending' to reflect un-synced local changes
      await connection.execute(
        `UPDATE products 
         SET sku = ?, name = ?, description = ?, price = ?, category_id = ?, sync_status = 'pending'
         WHERE id = ?`,
        [updatedSku, updatedName, updatedDescription, updatedPrice, updatedCategoryId || null, id]
      );

      if (Array.isArray(attributes)) {
        await connection.execute('DELETE FROM product_attributes WHERE product_id = ?', [id]);
        for (const attr of attributes) {
          if (attr.name && attr.value !== undefined) {
            await connection.execute(
              'INSERT INTO product_attributes (product_id, name, value) VALUES (?, ?, ?)',
              [id, attr.name, String(attr.value)]
            );
          }
        }
      }

      await connection.commit();
      return this.findById(id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async updateSyncStatus(id, { woo_id, sync_status, last_synced_at = new Date() }) {
    const fields = ['sync_status = ?'];
    const params = [sync_status];

    if (woo_id !== undefined) {
      fields.push('woo_id = ?');
      params.push(woo_id);
    }

    if (sync_status === 'synced') {
      fields.push('last_synced_at = ?');
      params.push(last_synced_at);
    }

    params.push(id);

    await db.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async delete(id) {
    const result = await db.query('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new ProductRepository();
