require('dotenv').config();

class WooCommerceClient {
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || process.env.WOO_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');
    this.consumerKey = options.consumerKey || process.env.WOO_CONSUMER_KEY || '';
    this.consumerSecret = options.consumerSecret || process.env.WOO_CONSUMER_SECRET || '';
  }

  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (this.consumerKey && this.consumerSecret) {
      const token = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...(options.headers || {})
    };

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const text = await response.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch (parseErr) {
        data = { raw: text };
      }

      if (!response.ok) {
        const errorMsg = data && data.message ? data.message : `WooCommerce API error (${response.status}): ${response.statusText}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.status) throw err;
      throw new Error(`Failed to communicate with WooCommerce API at ${url}: ${err.message}`);
    }
  }

  // Get products (support ?sku= filter)
  async getProducts(params = {}) {
    let query = '';
    if (params.sku) {
      query = `?sku=${encodeURIComponent(params.sku)}`;
    }
    return this.request(`/wp-json/wc/v3/products${query}`, { method: 'GET' });
  }

  // Get product by WooCommerce ID
  async getProduct(wooId) {
    return this.request(`/wp-json/wc/v3/products/${wooId}`, { method: 'GET' });
  }

  // Create product in WooCommerce
  async createProduct(productData) {
    return this.request('/wp-json/wc/v3/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  // Update existing product in WooCommerce
  async updateProduct(wooId, productData) {
    return this.request(`/wp-json/wc/v3/products/${wooId}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  // Get categories list
  async getCategories() {
    return this.request('/wp-json/wc/v3/products/categories', { method: 'GET' });
  }

  // Create category in WooCommerce
  async createCategory(categoryData) {
    return this.request('/wp-json/wc/v3/products/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  }
}

const defaultWooClient = new WooCommerceClient();

module.exports = defaultWooClient;
module.exports.WooCommerceClient = WooCommerceClient;
module.exports.default = defaultWooClient;
