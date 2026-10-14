const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// In-memory data storage for mock WooCommerce instance
let nextCategoryId = 1;
let nextProductId = 100;

const categories = [
  { id: nextCategoryId++, name: 'Clothing', slug: 'clothing', parent: 0, description: '', count: 0 },
  { id: nextCategoryId++, name: 'Accessories', slug: 'accessories', parent: 0, description: '', count: 0 }
];

const products = [];

// Simple request logger for debugging sync actions
app.use((req, res, next) => {
  console.log(`[Mock Woo] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Mock WooCommerce REST API (v3)',
    endpoints: [
      'GET    /wp-json/wc/v3/products/categories',
      'POST   /wp-json/wc/v3/products/categories',
      'GET    /wp-json/wc/v3/products',
      'GET    /wp-json/wc/v3/products?sku={sku}',
      'GET    /wp-json/wc/v3/products/:id',
      'POST   /wp-json/wc/v3/products',
      'PUT    /wp-json/wc/v3/products/:id',
      'DELETE /wp-json/wc/v3/products/:id'
    ]
  });
});

// --- Categories Endpoints (Defined before products/:id to prevent route clash) ---

// 1. GET /wp-json/wc/v3/products/categories
app.get('/wp-json/wc/v3/products/categories', (req, res) => {
  res.json(categories);
});

// 2. POST /wp-json/wc/v3/products/categories
app.post('/wp-json/wc/v3/products/categories', (req, res) => {
  const { name, description = '', parent = 0 } = req.body;
  if (!name) {
    return res.status(400).json({
      code: 'woocommerce_rest_missing_name',
      message: 'Category name is required.',
      data: { status: 400 }
    });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const existing = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    return res.status(200).json(existing);
  }

  const newCategory = {
    id: nextCategoryId++,
    name,
    slug,
    parent,
    description,
    count: 0
  };

  categories.push(newCategory);
  res.status(201).json(newCategory);
});

// --- Products Endpoints ---

// 3. GET /wp-json/wc/v3/products?sku={sku} or all products
app.get('/wp-json/wc/v3/products', (req, res) => {
  const { sku } = req.query;
  if (sku) {
    const matched = products.filter(p => String(p.sku).toLowerCase() === String(sku).toLowerCase());
    return res.json(matched);
  }
  return res.json(products);
});

// 4. POST /wp-json/wc/v3/products
app.post('/wp-json/wc/v3/products', (req, res) => {
  const { name, sku, regular_price, description, categories: prodCategories = [], attributes = [] } = req.body;

  if (!name) {
    return res.status(400).json({
      code: 'woocommerce_rest_missing_name',
      message: 'Product name is required.',
      data: { status: 400 }
    });
  }

  // Validate duplicate SKU if sku provided
  if (sku && products.some(p => String(p.sku).toLowerCase() === String(sku).toLowerCase())) {
    return res.status(400).json({
      code: 'product_invalid_sku',
      message: 'Invalid or duplicated SKU.',
      data: { status: 400, resource_id: 0 }
    });
  }

  const newProduct = {
    id: nextProductId++,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    permalink: `http://localhost:${PORT}/product/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    date_created: new Date().toISOString(),
    date_modified: new Date().toISOString(),
    type: 'simple',
    status: 'publish',
    sku: sku || '',
    price: regular_price !== undefined ? String(regular_price) : '0',
    regular_price: regular_price !== undefined ? String(regular_price) : '0',
    description: description || '',
    short_description: '',
    categories: Array.isArray(prodCategories) ? prodCategories : [],
    attributes: Array.isArray(attributes) ? attributes : []
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// 5. GET /wp-json/wc/v3/products/:id
app.get('/wp-json/wc/v3/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id, 10));
  if (!product) {
    return res.status(404).json({
      code: 'woocommerce_rest_product_invalid_id',
      message: `Product with ID ${req.params.id} does not exist.`,
      data: { status: 404 }
    });
  }
  res.json(product);
});

// 6. PUT /wp-json/wc/v3/products/:id
app.put('/wp-json/wc/v3/products/:id', (req, res) => {
  const productIndex = products.findIndex(p => p.id === parseInt(req.params.id, 10));
  if (productIndex === -1) {
    return res.status(404).json({
      code: 'woocommerce_rest_product_invalid_id',
      message: `Product with ID ${req.params.id} does not exist.`,
      data: { status: 404 }
    });
  }

  const existing = products[productIndex];
  const { name, sku, regular_price, description, categories: prodCategories, attributes } = req.body;

  if (sku && sku !== existing.sku) {
    const isDuplicate = products.some(p => p.id !== existing.id && String(p.sku).toLowerCase() === String(sku).toLowerCase());
    if (isDuplicate) {
      return res.status(400).json({
        code: 'product_invalid_sku',
        message: 'Invalid or duplicated SKU.',
        data: { status: 400, resource_id: existing.id }
      });
    }
  }

  const updatedProduct = {
    ...existing,
    name: name !== undefined ? name : existing.name,
    sku: sku !== undefined ? sku : existing.sku,
    price: regular_price !== undefined ? String(regular_price) : existing.regular_price,
    regular_price: regular_price !== undefined ? String(regular_price) : existing.regular_price,
    description: description !== undefined ? description : existing.description,
    categories: prodCategories !== undefined ? prodCategories : existing.categories,
    attributes: attributes !== undefined ? attributes : existing.attributes,
    date_modified: new Date().toISOString()
  };

  products[productIndex] = updatedProduct;
  res.json(updatedProduct);
});

// 7. DELETE /wp-json/wc/v3/products/:id
app.delete('/wp-json/wc/v3/products/:id', (req, res) => {
  const productIndex = products.findIndex(p => p.id === parseInt(req.params.id, 10));
  if (productIndex === -1) {
    return res.status(404).json({
      code: 'woocommerce_rest_product_invalid_id',
      message: `Product with ID ${req.params.id} does not exist.`,
      data: { status: 404 }
    });
  }

  const [removed] = products.splice(productIndex, 1);
  res.json(removed);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Mock WooCommerce API server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
