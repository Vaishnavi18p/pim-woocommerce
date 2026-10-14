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

  // 1. Get products (optionally filter by sku)
  async getProducts(params = {}) {
    let query = '';
    if (params.sku) {
      query = `?sku=${encodeURIComponent(params.sku)}`;
    }
    return this.request(`/wp-json/wc/v3/products${query}`, { method: 'GET' });
  }

  // 2. Get single product by WooCommerce ID
  async getProduct(wooId) {
    return this.request(`/wp-json/wc/v3/products/${wooId}`, { method: 'GET' });
  }

  // 3. Create a product in WooCommerce
  async createProduct(productData) {
    return this.request('/wp-json/wc/v3/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  // 4. Update an existing product in WooCommerce
  async updateProduct(wooId, productData) {
    return this.request(`/wp-json/wc/v3/products/${wooId}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  // 5. Get categories list
  async getCategories() {
    return this.request('/wp-json/wc/v3/products/categories', { method: 'GET' });
  }

  // 6. Create category
  async createCategory(categoryData) {
    return this.request('/wp-json/wc/v3/products/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  }
}

// Export class for dependency injection/mocking, plus default instance
const defaultWooClient = new WooCommerceClient();

module.exports = defaultWooClient;
module.exports.WooCommerceClient = WooCommerceClient;
