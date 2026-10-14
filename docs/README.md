# PIM ↔ WooCommerce Integration

A lightweight Product Information Management (PIM) system that manages a product catalog and keeps a WooCommerce store in sync with it.

> Built for the Kilowott hackathon (challenge: **PIM System Integration**).

---

## 🎥 Project Videos

| Video | Description | Link |
|---|---|---|
| **Intro Video** | Introduction to the project, architecture overview, and problem statement | [Watch Intro Video](YOUR_INTRO_VIDEO_LINK_HERE) |
| **Result / Demo Walkthrough** | Live demonstration of product CRUD, dynamic attributes, and sync to WooCommerce | [Watch Result Video](YOUR_RESULT_VIDEO_LINK_HERE) |

> 💡 *Replace `YOUR_INTRO_VIDEO_LINK_HERE` and `YOUR_RESULT_VIDEO_LINK_HERE` with your actual video links (YouTube, Loom, Google Drive, etc.).*

---

## 1. Problem statement

Merchants who sell through WooCommerce often keep product data scattered across spreadsheets and the store admin. This causes inconsistent attributes, duplicated effort, and out-of-date listings.

This project provides a single source of truth (the PIM) where products, categories, and attributes are managed once, and then synchronized to WooCommerce.

---

## 2. Research: integration methods considered

| Method | How it works | Verdict |
|---|---|---|
| **WooCommerce REST API (v3)** | HTTP endpoints for products, categories and attributes, authenticated with a consumer key and secret | **Chosen.** Official, documented, language-agnostic, works with any store |
| Webhooks | WooCommerce notifies an external URL when data changes | Useful for store-to-PIM updates. Out of scope for this version (one-way sync) |
| CSV import/export | Upload or download product files | Manual, not real-time, no per-product status |
| Direct database writes | Write straight to WordPress tables | Fragile, bypasses validation, breaks on upgrades. Rejected |
| Custom WordPress plugin | Add custom endpoints inside WordPress | Heavy for a 4-hour build and ties the PIM to PHP/WordPress |

**Key WooCommerce endpoints used:**
- `POST /wp-json/wc/v3/products` to create a product
- `PUT /wp-json/wc/v3/products/{id}` to update a product
- `GET /wp-json/wc/v3/products?sku={sku}` to look up a product by SKU
- `GET /wp-json/wc/v3/products/{id}` to view a product
- `POST /wp-json/wc/v3/products/categories` to create a category
- `GET /wp-json/wc/v3/products/categories` to list categories

---

## 3. Scope

### In scope
1. **Product catalog management:** Create, view, edit and delete products (SKU, name, description, price, category).
2. **Attribute handling:** Attach custom name/value attributes (e.g. Color, Size, Material) to products, and manage categories.
3. **Data synchronization (PIM → WooCommerce):** Push single products or all pending/failed products. Each product has a sync status badge (`pending`, `synced`, `failed`) and every attempt is logged to an audit table.
4. **Modern web UI:** Product inventory table, KPI metric cards, product creation/edit modal with dynamic attribute rows, single Sync & Sync All buttons, and an audit sync log view.
5. **Automated tests:** Unit tests for sync business logic and Supertest API/E2E integration tests against the live mock server.

### Out of scope (possible future work)
- Two-way sync (WooCommerce → PIM) and webhooks
- Bulk CSV import/export
- Product variations, image upload and hosting
- Multi-user roles and authentication
- Scheduled background sync (cron/queue)

---

## 4. Assumptions & System Constraints

1. **Mock WooCommerce Server:** A WooCommerce store was not provided during the hackathon. A mock WooCommerce server mirroring the v3 REST API (same routes and JSON shape) runs locally on port `4000`.
2. **Environment-driven Switch:** Switching to a real WooCommerce store requires only updating `.env` variables (`WOO_BASE_URL`, `WOO_CONSUMER_KEY`, `WOO_CONSUMER_SECRET`) without modifying code.
3. **PIM is the Source of Truth:** Sync is one-way (PIM → WooCommerce); external modifications in WooCommerce can be overwritten by re-syncing.
4. **Unique SKU Key:** The SKU is unique and acts as the business key matching PIM products with WooCommerce items.
5. **Port Allocation:**
   - **Mock WooCommerce Server:** `http://localhost:4000`
   - **PIM Backend API:** `http://localhost:5000`
   - **Frontend UI (Vite):** `http://localhost:5173`
6. **Database Defaults:** MySQL database named `pim`, user `root`, empty password (standard XAMPP defaults).

---

## 5. Architecture & Design Patterns

```
React UI (Port 5173)  →  PIM API (Express, Port 5000)  →  MySQL Database ('pim')
                                   │
                                   └→ Sync Service → WooCommerce Client (Adapter) → WooCommerce REST API (Port 4000)
```

### Design Patterns
- **Repository Pattern:** All database queries are isolated in `backend/src/repositories/` (`categoryRepository.js`, `productRepository.js`, `syncLogRepository.js`).
- **Service Layer:** Business rules, validations, and sync decisions live in `backend/src/services/` (`categoryService.js`, `productService.js`, `syncService.js`).
- **Adapter Pattern:** `backend/src/integrations/wooClient.js` encapsulates the WooCommerce REST API and Basic Auth headers, allowing it to be swapped or mocked in tests.
- **Controller & Router Pattern:** Express routes in `backend/src/routes/` delegate HTTP handling to `backend/src/controllers/`.

### Actual Project Structure

```
pim-woocommerce/
├── mock-woocommerce/
│   ├── package.json                   # Mock server dependencies (Express, CORS)
│   └── server.js                      # In-memory WooCommerce v3 REST API (Port 4000)
├── backend/
│   ├── .env.example                   # Environment variable template
│   ├── schema.sql                     # DDL for MySQL (pim database)
│   ├── package.json                   # Backend dependencies and scripts
│   ├── server.js                      # Root server entry delegate
│   ├── src/
│   │   ├── app.js                     # Express setup, middleware, error handler
│   │   ├── server.js                  # Server listener on Port 5000
│   │   ├── config/
│   │   │   ├── db.js                  # mysql2/promise connection pool
│   │   │   └── initDb.js              # Database & table creation script
│   │   ├── integrations/
│   │   │   └── wooClient.js           # Adapter for WooCommerce REST API v3
│   │   ├── repositories/
│   │   │   ├── categoryRepository.js  # Category database queries
│   │   │   ├── productRepository.js   # Product & attribute relational queries
│   │   │   └── syncLogRepository.js   # Sync audit log queries
│   │   ├── services/
│   │   │   ├── categoryService.js    # Category validation and business logic
│   │   │   ├── productService.js      # Product validation (SKU, name, price)
│   │   │   └── syncService.js         # One-way sync algorithm & status handling
│   │   ├── controllers/
│   │   │   ├── categoryController.js  # Category request handlers
│   │   │   ├── productController.js   # Product CRUD request handlers
│   │   │   └── syncController.js      # Sync & log request handlers
│   │   └── routes/
│   │       ├── categoryRoutes.js      # GET/POST /api/categories
│   │       ├── productRoutes.js       # GET/POST /api/products, GET/PUT/DELETE /api/products/:id
│   │       ├── syncRoutes.js          # POST /api/sync/:productId, POST /api/sync, GET /api/sync/logs
│   │       └── index.js               # Master API router
│   └── tests/
│       ├── syncService.test.js        # Unit tests with mocked wooClient
│       ├── api.test.js                # Supertest API endpoint tests
│       └── syncAgainstMock.test.js    # Supertest integration tests against mock WooCommerce
├── frontend/
│   ├── package.json                   # React + Vite dependencies
│   ├── vite.config.js                 # Configured for Port 5173
│   ├── index.html
│   └── src/
│       ├── index.css                  # Modern design tokens and typography
│       ├── App.css                    # Glassmorphism, card, badge, and modal styles
│       ├── App.jsx                    # Root state management, tabs, and toast alerts
│       ├── api.js                     # API client connected to backend on Port 5000
│       └── components/
│           ├── Navbar.jsx             # Header with brand badge and live store status
│           ├── ProductList.jsx        # KPI metric cards, filters, search, and inventory table
│           ├── ProductForm.jsx        # Product create/edit modal with dynamic attributes
│           └── SyncLogs.jsx           # Audit logs view with outcome filters
├── docs/
│   ├── README.md                      # Original specification copy
│   └── AI_USAGE.md                    # Complete log of AI prompts and file changes
├── .gitignore                         # Excludes node_modules and .env files
└── README.md
```

---

## 6. Tech stack

| Layer | Choice | Why |
|---|---|---|
| **Backend** | Node.js + Express (Port 5000) | Fast, modular, uniform JavaScript stack |
| **Database** | MySQL via `mysql2/promise` ('pim') | Relational structure for products, categories, attributes, and logs |
| **Frontend** | React (Vite, Port 5173) | Fast hot module reloading, component-based modern UI |
| **Testing** | Jest + Supertest | Unit testing business logic and E2E API integration |
| **Store Target**| WooCommerce REST API v3 (Mock on Port 4000) | Official REST format, zero real-store lock-in |

---

## 7. Data model

The database schema (`backend/schema.sql`) implements four relational tables:

1. **`categories`**:
   - `id` (INT, PK, Auto Increment)
   - `name` (VARCHAR 255, NOT NULL)
   - `woo_id` (INT, NULL)
   - `created_at`, `updated_at` (TIMESTAMP)

2. **`products`**:
   - `id` (INT, PK, Auto Increment)
   - `sku` (VARCHAR 100, UNIQUE, NOT NULL)
   - `name` (VARCHAR 255, NOT NULL)
   - `description` (TEXT, NULL)
   - `price` (DECIMAL 10,2, NOT NULL DEFAULT 0.00)
   - `category_id` (INT, FK → `categories.id` ON DELETE SET NULL)
   - `woo_id` (INT, NULL)
   - `sync_status` (ENUM `'pending'`, `'synced'`, `'failed'`, DEFAULT `'pending'`)
   - `last_synced_at` (TIMESTAMP, NULL)
   - `created_at`, `updated_at` (TIMESTAMP)

3. **`product_attributes`**:
   - `id` (INT, PK, Auto Increment)
   - `product_id` (INT, FK → `products.id` ON DELETE CASCADE)
   - `name` (VARCHAR 100, NOT NULL)
   - `value` (VARCHAR 255, NOT NULL)

4. **`sync_logs`**:
   - `id` (INT, PK, Auto Increment)
   - `product_id` (INT, FK → `products.id` ON DELETE CASCADE)
   - `status` (ENUM `'success'`, `'failed'`)
   - `message` (TEXT, NULL)
   - `created_at` (TIMESTAMP)

---

## 8. Sync Strategy

1. **Retrieve Product:** Load product record including relational attributes and category details from MySQL.
2. **Category Sync:** If the product has a category without a `woo_id`, sync or link the category to WooCommerce first.
3. **Determine Operation:**
   - If the product has a `woo_id`: Update via `PUT /wp-json/wc/v3/products/{woo_id}`.
   - If the product has no `woo_id`: Check if SKU exists on WooCommerce via `GET /wp-json/wc/v3/products?sku={sku}`. If found, link and update; otherwise create via `POST /wp-json/wc/v3/products`.
4. **Field Mapping:**
   - `name` → `product.name`
   - `sku` → `product.sku`
   - `regular_price` → `String(product.price)`
   - `description` → `product.description`
   - `categories` → `[{ id: category_woo_id }]`
   - `attributes` → `[{ name, position, visible: true, variation: false, options: [value] }]`
5. **Success Handling:** Save `woo_id`, set `sync_status = 'synced'`, record `last_synced_at = NOW()`, and write a success entry to `sync_logs`.
6. **Failure Handling:** Set `sync_status = 'failed'` and write the error message to `sync_logs` for easy retry.

---

## 9. Testing Strategy

Run the test suite using `npm test` inside `backend/`:
- **Unit Tests (`tests/syncService.test.js`):** Tests `syncService` decisions (create vs. update, success vs. failure, payload mapping, and log creation) with `wooClient` mocked.
- **API Tests (`tests/api.test.js`):** Tests Express routing, validation (missing SKU, name, invalid price), product CRUD, and category endpoints via Supertest.
- **E2E Integration Tests (`tests/syncAgainstMock.test.js`):** Creates and synchronizes products directly against the running mock WooCommerce REST API v3 server and confirms the mock store payload.

---

## 10. How AI Tools Were Used

All AI prompts, changes, and hand verifications are documented chronologically in [`docs/AI_USAGE.md`](./docs/AI_USAGE.md).

---

## 11. Setup and Run Instructions

### Prerequisites
1. **Node.js** (v18 or higher; verified on Node v24)
2. **XAMPP / MySQL** running on port `3306` with default credentials (user `root`, no password).

---

### Step 1: Install packages

Install dependencies in all three folders (`mock-woocommerce`, `backend`, and `frontend`):

```bash
# Option A: From the repository root
npm install --prefix mock-woocommerce
npm install --prefix backend
npm install --prefix frontend

# Option B: Navigate into each folder individually
cd mock-woocommerce && npm install && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

---

### Step 2: Create the database from schema.sql

Make sure the MySQL service is started in your XAMPP Control Panel (running on port `3306`). Then create the database and tables using one of the following methods:

**Method 1 — Automated Script (Recommended):**
```bash
cd backend
npm run init-db
```
*(This script connects to MySQL, executes `CREATE DATABASE IF NOT EXISTS pim;`, and runs `backend/schema.sql` to initialize all 4 tables).*

**Method 2 — MySQL Command Line:**
```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS pim;"
mysql -u root pim < backend/schema.sql
```

**Method 3 — phpMyAdmin:**
1. Open [http://localhost/phpmyadmin](http://localhost/phpmyadmin) in your browser.
2. Click **New** in the left sidebar and create a database named `pim` with collation `utf8mb4_unicode_ci`.
3. Select the `pim` database, click the **Import** tab, choose `backend/schema.sql`, and click **Import**.

---

### Step 3: Copy .env.example to .env

Create the backend environment file from the provided example template:

```bash
cd backend

# Windows Command Prompt:
copy .env.example .env

# Windows PowerShell:
Copy-Item .env.example .env

# Bash / macOS / Linux:
cp .env.example .env
```

The default values in `backend/.env` are pre-configured for local development with XAMPP MySQL and the mock WooCommerce server:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=pim

WOO_BASE_URL=http://localhost:4000
WOO_CONSUMER_KEY=ck_mock_key
WOO_CONSUMER_SECRET=cs_mock_secret
```

---

### Step 4: Start the mock server

Start the mock WooCommerce REST API v3 server (in terminal 1):

```bash
cd mock-woocommerce
npm start
```
> Running at: **[http://localhost:4000](http://localhost:4000)**  
> Endpoints: `/wp-json/wc/v3/products`, `/wp-json/wc/v3/products/categories`

---

### Step 5: Start the backend

Start the PIM Express API server (in terminal 2):

```bash
cd backend
npm run dev
```
> Running at: **[http://localhost:5000](http://localhost:5000)**  
> API Base: [http://localhost:5000/api](http://localhost:5000/api)  
> Health check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### Step 6: Start the frontend

Start the React (Vite) user interface (in terminal 3):

```bash
cd frontend
npm run dev
```
> Running at: **[http://localhost:5173](http://localhost:5173)**  
> Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

### Step 7: Run the tests

Run the automated test suite containing 19 unit, API, and E2E integration tests:

```bash
cd backend
npm test
```

*(Note: To run the integration tests against the live mock store in `tests/syncAgainstMock.test.js`, ensure the mock server is running on port 4000 as started in Step 4).*

---

## 12. Known Limitations

- **One-way sync only:** Synchronization flows PIM → WooCommerce. Store-side edits in WooCommerce are not fetched back.
- **Manual sync trigger:** Products sync on demand (per-product or bulk "Sync All"), not on scheduled background cron jobs.
- **Mock server scope:** The mock server mirrors the WooCommerce v3 REST API endpoints used by this integration; it does not implement entire WordPress user or tax systems.
