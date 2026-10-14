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

  describe('Categories API', () => {
    it('GET /api/categories returns all categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Footwear', woo_id: null },
        { id: 2, name: 'Clothing', woo_id: 10 }
      ];
      categoryRepository.findAll.mockResolvedValue(mockCategories);

      const res = await request(app).get('/api/categories');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockCategories);
    });

    it('POST /api/categories creates a category', async () => {
      categoryRepository.findByName.mockResolvedValue(null);
      categoryRepository.create.mockResolvedValue({ id: 3, name: 'Electronics', woo_id: null });

      const res = await request(app)
        .post('/api/categories')
        .send({ name: 'Electronics' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({ id: 3, name: 'Electronics', woo_id: null });
    });

    it('POST /api/categories rejects missing name', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/category name is required/i);
    });
  });

  describe('POST /api/products validation & creation', () => {
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

    it('creates product with category and attributes', async () => {
      const newProductData = {
        sku: 'RUN-01',
        name: 'Running Shoes',
        price: 79.99,
        category_id: 1,
        attributes: [
          { name: 'Color', value: 'Red' },
          { name: 'Size', value: '42' }
        ]
      };

      categoryRepository.findById.mockResolvedValue({ id: 1, name: 'Footwear' });
      productRepository.findBySku.mockResolvedValue(null);
      productRepository.create.mockResolvedValue({
        id: 10,
        ...newProductData,
        category_name: 'Footwear',
        sync_status: 'pending'
      });

      const res = await request(app)
        .post('/api/products')
        .send(newProductData);

      expect(res.statusCode).toBe(201);
      expect(res.body.category_name).toBe('Footwear');
      expect(res.body.attributes).toHaveLength(2);
    });
  });

  describe('GET /api/products and /api/products/:id', () => {
    it('returns list of products including category_name and attributes', async () => {
      const mockList = [
        {
          id: 1,
          name: 'Prod 1',
          sku: 'P1',
          price: 10,
          category_id: 1,
          category_name: 'Footwear',
          sync_status: 'synced',
          attributes: [{ id: 1, name: 'Color', value: 'Blue' }]
        }
      ];
      productRepository.findAll.mockResolvedValue(mockList);

      const res = await request(app).get('/api/products');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockList);
      expect(res.body[0].category_name).toBe('Footwear');
      expect(res.body[0].attributes).toEqual([{ id: 1, name: 'Color', value: 'Blue' }]);
    });

    it('returns a single product with category_name and attributes', async () => {
      const mockProduct = {
        id: 1,
        name: 'Prod 1',
        sku: 'P1',
        price: 10,
        category_id: 1,
        category_name: 'Footwear',
        attributes: [{ id: 1, name: 'Color', value: 'Blue' }]
      };
      productRepository.findById.mockResolvedValue(mockProduct);

      const res = await request(app).get('/api/products/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.category_name).toBe('Footwear');
      expect(res.body.attributes).toEqual([{ id: 1, name: 'Color', value: 'Blue' }]);
    });
  });

  describe('Sync API', () => {
    it('POST /api/sync/:productId triggers single product sync', async () => {
      syncService.syncProduct.mockResolvedValue({
        success: true,
        action: 'created',
        wooProduct: { id: 101 }
      });

      const res = await request(app).post('/api/sync/5');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(syncService.syncProduct).toHaveBeenCalledWith('5');
    });

    it('POST /api/sync triggers sync all pending or failed products', async () => {
      syncService.syncAllPending.mockResolvedValue({
        total: 2,
        synced: 2,
        failed: 0,
        results: [{ success: true }, { success: true }]
      });

      const res = await request(app).post('/api/sync');
      expect(res.statusCode).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.synced).toBe(2);
      expect(syncService.syncAllPending).toHaveBeenCalled();
    });

    it('GET /api/sync/logs returns sync logs', async () => {
      const mockLogs = [
        { id: 1, product_id: 5, status: 'success', message: 'Synced', created_at: new Date() }
      ];
      syncLogRepository.findAll.mockResolvedValue(mockLogs);

      const res = await request(app).get('/api/sync/logs');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(JSON.parse(JSON.stringify(mockLogs)));
    });
  });
});
