const defaultWooClient = require('../integrations/wooClient');
const productRepository = require('../repositories/productRepository');
const categoryRepository = require('../repositories/categoryRepository');
const syncLogRepository = require('../repositories/syncLogRepository');

class SyncService {
  constructor(wooClient = defaultWooClient) {
    this.wooClient = wooClient;
  }

  // Build WooCommerce product payload from local PIM product record
  buildWooPayload(product, categoryWooId = null) {
    const payload = {
      name: product.name,
      sku: product.sku,
      regular_price: String(product.price),
      description: product.description || ''
    };

    if (categoryWooId) {
      payload.categories = [{ id: categoryWooId }];
    } else if (product.category_woo_id) {
      payload.categories = [{ id: product.category_woo_id }];
    }

    if (Array.isArray(product.attributes) && product.attributes.length > 0) {
      payload.attributes = product.attributes.map((attr, index) => ({
        name: attr.name,
        position: index,
        visible: true,
        variation: false,
        options: [attr.value]
      }));
    } else {
      payload.attributes = [];
    }

    return payload;
  }

  // Ensure category is synced to WooCommerce and has a valid woo_id
  async ensureCategorySynced(categoryId) {
    if (!categoryId) return null;

    const category = await categoryRepository.findById(categoryId);
    if (!category) return null;

    if (category.woo_id) {
      return category.woo_id;
    }

    // Try finding or creating category in WooCommerce
    try {
      const wooCategories = await this.wooClient.getCategories();
      const existingWoo = Array.isArray(wooCategories) 
        ? wooCategories.find(c => c.name.toLowerCase() === category.name.toLowerCase())
        : null;

      if (existingWoo) {
        await categoryRepository.updateWooId(category.id, existingWoo.id);
        return existingWoo.id;
      }

      const created = await this.wooClient.createCategory({
        name: category.name
      });

      if (created && created.id) {
        await categoryRepository.updateWooId(category.id, created.id);
        return created.id;
      }
    } catch (err) {
      console.warn(`[SyncService] Warning syncing category ${category.name}:`, err.message);
    }

    return null;
  }

  // Synchronize a single product to WooCommerce
  async syncProduct(productId) {
    const product = await productRepository.findById(productId);
    if (!product) {
      const err = new Error(`Product with ID ${productId} not found`);
      err.statusCode = 404;
      throw err;
    }

    try {
      // 1. Ensure category is synced if present
      let categoryWooId = null;
      if (product.category_id) {
        categoryWooId = await this.ensureCategorySynced(product.category_id);
      }

      // 2. Prepare payload
      const payload = this.buildWooPayload(product, categoryWooId);

      let wooProductResponse = null;
      let actionTaken = 'created';

      // 3. Decide whether to create or update
      if (product.woo_id) {
        // Product already has WooCommerce ID -> update
        wooProductResponse = await this.wooClient.updateProduct(product.woo_id, payload);
        actionTaken = 'updated';
      } else {
        // No woo_id locally: check if product exists on WooCommerce with this SKU
        const existingProducts = await this.wooClient.getProducts({ sku: product.sku });
        const matched = Array.isArray(existingProducts) && existingProducts.length > 0 
          ? existingProducts.find(p => String(p.sku).toLowerCase() === product.sku.toLowerCase()) 
          : null;

        if (matched) {
          wooProductResponse = await this.wooClient.updateProduct(matched.id, payload);
          actionTaken = 'linked and updated';
        } else {
          wooProductResponse = await this.wooClient.createProduct(payload);
          actionTaken = 'created';
        }
      }

      const wooId = wooProductResponse.id;

      // 4. On success: update product status in database
      const updatedProduct = await productRepository.updateSyncStatus(product.id, {
        woo_id: wooId,
        sync_status: 'synced',
        last_synced_at: new Date()
      });

      // 5. Write success log
      await syncLogRepository.create({
        product_id: product.id,
        status: 'success',
        message: `Product successfully ${actionTaken} in WooCommerce (WooCommerce ID: ${wooId})`
      });

      return {
        success: true,
        action: actionTaken,
        product: updatedProduct,
        wooProduct: wooProductResponse
      };
    } catch (error) {
      // 6. On failure: mark product as failed and log error
      await productRepository.updateSyncStatus(product.id, {
        sync_status: 'failed'
      });

      const errorMessage = error.message || 'Unknown synchronization error';

      await syncLogRepository.create({
        product_id: product.id,
        status: 'failed',
        message: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        product_id: product.id
      };
    }
  }

  // Synchronize all pending (or failed) products
  async syncAllPending() {
    const products = await productRepository.findAll();
    const toSync = products.filter(p => p.sync_status === 'pending' || p.sync_status === 'failed');

    const results = [];
    for (const product of toSync) {
      const result = await this.syncProduct(product.id);
      results.push(result);
    }

    return {
      total: toSync.length,
      synced: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }
}

module.exports = new SyncService();
module.exports.SyncService = SyncService;
