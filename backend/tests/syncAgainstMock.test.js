const request = require('supertest');
const http = require('http');
const app = require('../src/app');
const productRepository = require('../src/repositories/productRepository');
const syncLogRepository = require('../src/repositories/syncLogRepository');
const mockWooApp = require('../../mock-woocommerce/server');

// Mock repositories so test runs reliably without external MySQL requirement
jest.mock('../src/repositories/productRepository');
jest.mock('../src/repositories/syncLogRepository');

describe('Supertest E2E: Sync against Mock WooCommerce Server', () => {
  let mockServer;
  const mockPort = 4000;
  const baseUrl = `http://localhost:${mockPort}`;

  beforeAll(async () => {
    // Check if mock WooCommerce server is already running on port 4000
    try {
      const ping = await fetch(`${baseUrl}/`);
      if (ping.ok) {
        return; // Already running
      }
    } catch {
      // If not running, start an instance for the test
      mockServer = mockWooApp.listen(mockPort);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  });

  afterAll(async () => {
    if (mockServer) {
      await new Promise(resolve => mockServer.close(resolve));
    }
  });

  const testSku = `HOODIE-TEST-${Date.now()}`;
  let createdWooId;

  it('syncs a new product to the running mock WooCommerce server (create)', async () => {
    const localProduct = {
      id: 101,
      sku: testSku,
      name: 'Red Fleece Hoodie',
      price: 55.00,
      description: 'Cozy red hoodie',
      category_id: null,
      woo_id: null,
      sync_status: 'pending',
      attributes: [{ name: 'Color', value: 'Red' }, { name: 'Size', value: 'M' }]
    };

    productRepository.findById.mockResolvedValue(localProduct);
    productRepository.updateSyncStatus.mockImplementation((id, data) => {
      Object.assign(localProduct, data);
      return Promise.resolve(localProduct);
    });
    syncLogRepository.create.mockResolvedValue({ id: 1 });

    // Call PIM Sync API
    const res = await request(app)
      .post('/api/sync/101')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.action).toBe('created');
    expect(res.body.wooProduct).toBeDefined();
    expect(res.body.wooProduct.sku).toBe(testSku);
    expect(res.body.wooProduct.regular_price).toBe('55');

    createdWooId = res.body.wooProduct.id;

    // Verify product status in PIM was updated to 'synced'
    expect(localProduct.sync_status).toBe('synced');
    expect(localProduct.woo_id).toBe(createdWooId);

    // Verify directly against the Mock WooCommerce server REST API
    const wooVerify = await fetch(`${baseUrl}/wp-json/wc/v3/products?sku=${testSku}`);
    const matchedProducts = await wooVerify.json();

    expect(wooVerify.status).toBe(200);
    expect(matchedProducts.length).toBe(1);
    expect(matchedProducts[0].id).toBe(createdWooId);
    expect(matchedProducts[0].name).toBe('Red Fleece Hoodie');
  });

  it('syncs an existing product to the running mock WooCommerce server (update)', async () => {
    const existingWooId = createdWooId || 100;
    const localProduct = {
      id: 102,
      sku: testSku,
      name: 'Red Fleece Hoodie - Sale',
      price: 45.00,
      description: 'Discounted red hoodie',
      category_id: null,
      woo_id: existingWooId,
      sync_status: 'pending',
      attributes: [{ name: 'Color', value: 'Red' }]
    };

    productRepository.findById.mockResolvedValue(localProduct);
    productRepository.updateSyncStatus.mockImplementation((id, data) => {
      Object.assign(localProduct, data);
      return Promise.resolve(localProduct);
    });
    syncLogRepository.create.mockResolvedValue({ id: 2 });

    const res = await request(app)
      .post('/api/sync/102')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.action).toBe('updated');
    expect(res.body.wooProduct.regular_price).toBe('45');

    // Verify directly against Mock WooCommerce server
    const wooVerify = await fetch(`${baseUrl}/wp-json/wc/v3/products/${existingWooId}`);
    const updated = await wooVerify.json();

    expect(wooVerify.status).toBe(200);
    expect(updated.regular_price).toBe('45');
    expect(updated.name).toBe('Red Fleece Hoodie - Sale');
  });
});
