const syncService = require('../services/syncService');
const syncLogRepository = require('../repositories/syncLogRepository');

class SyncController {
  async syncProduct(req, res, next) {
    try {
      const productId = req.params.id || req.body.productId;
      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required for sync' });
      }

      const result = await syncService.syncProduct(productId);
      if (!result.success) {
        return res.status(500).json(result);
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async syncAll(req, res, next) {
    try {
      const summary = await syncService.syncAllPending();
      res.json(summary);
    } catch (err) {
      next(err);
    }
  }

  async getLogs(req, res, next) {
    try {
      const { limit = 50, offset = 0, productId } = req.query;
      let logs;
      if (productId) {
        logs = await syncLogRepository.findByProductId(productId);
      } else {
        logs = await syncLogRepository.findAll({ limit, offset });
      }
      res.json(logs);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SyncController();
