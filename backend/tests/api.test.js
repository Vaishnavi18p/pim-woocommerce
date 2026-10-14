const request = require('supertest');
const app = require('../src/app');
const productRepository = require('../src/repositories/productRepository');
const categoryRepository = require('../src/repositories/categoryRepository');
const syncLogRepository = require('../src/repositories/syncLogRepository');
const syncService = require('../src/services/syncService');

jest.mock('../src/repositories/productRepository');
jest.mock('../src/repositories/categoryRepository');
jest.mock('../src/repositories/syncLogRepository');
jest.mock('../src/services/syncService');

describe('PIM REST API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('returns 200 with health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('POST /api/products validation', () => {
    it('rejects product without SKU', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ name: 'Test Product', price: 20 });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/SKU is required/i);
    });

    it('rejects product without name', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ sku: 'TEST-SKU', price: 20 });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/name is required/i);
    });

    it('rejects product with invalid price', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ sku: 'TEST-SKU', name: 'Test', price: -5 });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/valid non-negative number/i);
    });
  });

  describe('GET /api/products', () => {
    it('returns list of products', async () => {
      const mockList = [
        { id: 1, name: 'Prod 1', sku: 'P1', price: 10, sync_status: 'synced', attributes: [] }
      ];
      productRepository.findAll.mockResolvedValue(mockList);

      const res = await request(app).get('/api/products');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockList);
    });
  });

  describe('POST /api/products/:id/sync', () => {
    it('triggers syncService.syncProduct', async () => {
      syncService.syncProduct.mockResolvedValue({
        success: true,
        action: 'created',
        wooProduct: { id: 101 }
      });

      const res = await request(app).post('/api/products/1/sync');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(syncService.syncProduct).toHaveBeenCalledWith('1');
    });
  });
});
