const { SyncService } = require('../src/services/syncService');
const productRepository = require('../src/repositories/productRepository');
const categoryRepository = require('../src/repositories/categoryRepository');
const syncLogRepository = require('../src/repositories/syncLogRepository');

jest.mock('../src/repositories/productRepository');
jest.mock('../src/repositories/categoryRepository');
jest.mock('../src/repositories/syncLogRepository');

describe('SyncService (Unit Tests)', () => {
  let mockWooClient;
  let syncService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockWooClient = {
      getProducts: jest.fn(),
      getProduct: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      getCategories: jest.fn(),
      createCategory: jest.fn()
    };

    syncService = new SyncService(mockWooClient);
  });

  describe('buildWooPayload', () => {
    it('correctly maps PIM product, category, and attributes to WooCommerce format', () => {
      const product = {
        name: 'Denim Jacket',
        sku: 'DJ-001',
        price: 49.99,
        description: 'Warm denim jacket',
        category_woo_id: 15,
        attributes: [
          { name: 'Color', value: 'Navy' },
          { name: 'Size', value: 'L' }
        ]
      };

      const payload = syncService.buildWooPayload(product);

      expect(payload).toEqual({
        name: 'Denim Jacket',
        sku: 'DJ-001',
        regular_price: '49.99',
        description: 'Warm denim jacket',
        categories: [{ id: 15 }],
        attributes: [
          {
            name: 'Color',
            position: 0,
            visible: true,
            variation: false,
            options: ['Navy']
          },
          {
            name: 'Size',
            position: 1,
            visible: true,
            variation: false,
            options: ['L']
          }
        ]
      });
    });
  });

  describe('syncProduct - create vs update decisions', () => {
    it('calls createProduct when product has no woo_id and does not exist in WooCommerce', async () => {
      const product = {
        id: 1,
        name: 'Sneakers',
        sku: 'SNK-10',
        price: 89.0,
        description: 'Sport shoes',
        category_id: null,
        woo_id: null,
        attributes: []
      };

      productRepository.findById.mockResolvedValue(product);
      mockWooClient.getProducts.mockResolvedValue([]);
      mockWooClient.createProduct.mockResolvedValue({ id: 999, name: 'Sneakers', sku: 'SNK-10' });
      productRepository.updateSyncStatus.mockResolvedValue({ ...product, woo_id: 999, sync_status: 'synced' });
      syncLogRepository.create.mockResolvedValue({ id: 1 });

      const result = await syncService.syncProduct(1);

      expect(result.success).toBe(true);
      expect(result.action).toBe('created');
      expect(mockWooClient.createProduct).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Sneakers',
        sku: 'SNK-10',
        regular_price: '89'
      }));
      expect(productRepository.updateSyncStatus).toHaveBeenCalledWith(1, expect.objectContaining({
        woo_id: 999,
        sync_status: 'synced'
      }));
      expect(syncLogRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        product_id: 1,
        status: 'success'
      }));
    });

    it('calls updateProduct when product already has a woo_id', async () => {
      const product = {
        id: 2,
        name: 'Sneakers Updated',
        sku: 'SNK-10',
        price: 99.0,
        description: 'Updated shoes',
        category_id: null,
        woo_id: 999,
        attributes: []
      };

      productRepository.findById.mockResolvedValue(product);
      mockWooClient.updateProduct.mockResolvedValue({ id: 999, name: 'Sneakers Updated' });
      productRepository.updateSyncStatus.mockResolvedValue({ ...product, sync_status: 'synced' });
      syncLogRepository.create.mockResolvedValue({ id: 2 });

      const result = await syncService.syncProduct(2);

      expect(result.success).toBe(true);
      expect(result.action).toBe('updated');
      expect(mockWooClient.updateProduct).toHaveBeenCalledWith(999, expect.objectContaining({
        name: 'Sneakers Updated',
        regular_price: '99'
      }));
      expect(mockWooClient.createProduct).not.toHaveBeenCalled();
    });

    it('marks product as failed and logs error if WooCommerce API request throws', async () => {
      const product = {
        id: 3,
        name: 'Faulty Product',
        sku: 'ERR-01',
        price: 10.0,
        category_id: null,
        woo_id: 123,
        attributes: []
      };

      productRepository.findById.mockResolvedValue(product);
      mockWooClient.updateProduct.mockRejectedValue(new Error('Connection timed out'));
      productRepository.updateSyncStatus.mockResolvedValue({ ...product, sync_status: 'failed' });
      syncLogRepository.create.mockResolvedValue({ id: 3 });

      const result = await syncService.syncProduct(3);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection timed out');
      expect(productRepository.updateSyncStatus).toHaveBeenCalledWith(3, { sync_status: 'failed' });
      expect(syncLogRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        product_id: 3,
        status: 'failed',
        message: 'Connection timed out'
      }));
    });
  });
});
