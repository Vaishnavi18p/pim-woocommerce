# PIM ↔ WooCommerce Integration

A lightweight Product Information Management (PIM) system that manages a product catalog and keeps a WooCommerce store in sync with it.

> Built for the Kilowott hackathon (challenge: **PIM System Integration**).

---

## 1. Problem statement

Merchants who sell through WooCommerce often keep product data scattered across spreadsheets and the store admin. This causes inconsistent attributes, duplicated effort, and out-of-date listings.

This project provides a single source of truth (the PIM) where products, categories and attributes are managed once, and then synchronized to WooCommerce.

## 2. Research: integration methods considered

| Method | How it works | Verdict |
|---|---|---|
| **WooCommerce REST API (v3)** | HTTP endpoints for products, categories and attributes, authenticated with a consumer key and secret | **Chosen.** Official, documented, language-agnostic, works with any store |
| Webhooks | WooCommerce notifies an external URL when data changes | Useful for store-to-PIM updates. Out of scope for this version (one-way sync) |
| CSV import/export | Upload or download product files | Manual, not real-time, no per-product status |
| Direct database writes | Write straight to WordPress tables | Fragile, bypasses validation, breaks on upgrades. Rejected |
| Custom WordPress plugin | Add custom endpoints inside WordPress | Heavy for a 4-hour build and ties the PIM to PHP/WordPress |

**Key WooCommerce endpoints used**
- `POST /wp-json/wc/v3/products` to create a product
- `PUT /wp-json/wc/v3/products/{id}` to update a product
- `GET /wp-json/wc/v3/products?sku={sku}` to look up a product by SKU
- `POST /wp-json/wc/v3/products/categories` to create a category
- `GET /wp-json/wc/v3/products/categories` to list categories

## 3. Scope

### In scope
1. **Product catalog management:** create, view, edit and delete products (SKU, name, description, price, category).
2. **Attribute handling:** attach attributes (for example Color, Size, Material) to products, and manage categories.
3. **Data synchronization (PIM → WooCommerce):** push one product or all pending products. Each product has a sync status (`pending`, `synced`, `failed`) and every attempt is logged.
4. **Simple web UI:** product list, product form, sync button, status badges and a sync log view.
5. **Automated tests:** unit tests for business logic and API-level (end-to-end) tests.

### Out of scope (possible future work)
- Two-way sync (WooCommerce → PIM) and webhooks
- Bulk CSV import
- Product variations, image upload and hosting
- Multi-user roles and permissions
- Scheduled background sync (cron/queue)

## 4. Assumptions

1. A WooCommerce store was **not provided** during the hackathon. A **mock WooCommerce server** that mirrors the v3 REST API (same routes and JSON shape for the endpoints above) is used for development and testing.
2. Switching to a real store requires **only environment variables** (`WOO_BASE_URL`, `WOO_CONSUMER_KEY`, `WOO_CONSUMER_SECRET`). No code changes.
3. The **PIM is the source of truth.** Sync is **one-way** (PIM → WooCommerce); changes made directly in WooCommerce can be overwritten.
4. The **SKU is unique** and is the key used to match PIM products with WooCommerce products.
5. Prices are a single currency and a single price per product (regular price).
6. Attributes are simple name/value pairs (no variations).
7. Credentials are stored in environment variables and never committed to Git.
8. A single store and a single admin user (no authentication layer in this version).

## 5. Architecture

```
React UI  →  PIM API (Express)  →  MySQL (source of truth)
                  │
                  └→ Sync Service → WooCommerce Client (adapter) → WooCommerce REST API
                                                                   (mock server or real store)
```

**Design patterns**
- **Repository pattern:** all database access is isolated in `repositories/`.
- **Service layer:** business rules (validation, sync decisions) live in `services/`.
- **Adapter pattern:** `wooClient.js` hides the WooCommerce API details, so it can be swapped or mocked in tests.
- **Configuration via environment variables** for all credentials and URLs.

## 6. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Backend | Node.js + Express | Fast to build, one language across the stack |
| Database | MySQL | Relational fit for products, categories and attributes |
| Frontend | React (Vite) | Quick, component-based UI |
| Testing | Jest + Supertest | Unit tests and API tests with little setup |
| Integration target | WooCommerce REST API v3 (mock server locally) | Official API, no store required to develop |

## 7. Data model

- `categories` (id, name, woo_id)
- `products` (id, sku, name, description, price, category_id, woo_id, sync_status, last_synced_at)
- `product_attributes` (id, product_id, name, value)
- `sync_logs` (id, product_id, status, message, created_at)

## 8. Sync strategy

1. Load the product (with its category and attributes) from the database.
2. If the product has no `woo_id`, **create** it in WooCommerce; otherwise **update** it.
3. Map fields: `name`, `sku`, `regular_price`, `description`, `categories`, `attributes`.
4. On success, store `woo_id`, set `sync_status = synced` and write a log entry.
5. On failure, set `sync_status = failed` and log the error message so it can be retried.

## 9. Testing strategy

- **Unit tests:** sync service decisions (create vs update, status changes) with the WooCommerce client mocked.
- **API / end-to-end tests:** create a product through the API, sync it against the mock WooCommerce server, and verify the status and the stored `woo_id`.

## 10. How AI tools were used

See [`docs/AI_USAGE.md`](./docs/AI_USAGE.md) for the prompts used and what was changed or verified by hand.

## 11. Setup and run

```bash
# backend
cd backend && npm install && cp .env.example .env && npm run dev

# mock WooCommerce
cd mock-woocommerce && npm install && node server.js

# frontend
cd frontend && npm install && npm run dev
```

**Environment variables**

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `WOO_BASE_URL` | WooCommerce (or mock) base URL |
| `WOO_CONSUMER_KEY`, `WOO_CONSUMER_SECRET` | WooCommerce API credentials |

## 12. Known limitations

- One-way sync only; no conflict resolution.
- No retries on failure beyond a manual re-sync.
- Mock server does not replicate every WooCommerce validation rule.
