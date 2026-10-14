import React, { useState } from 'react';

export default function ProductList({
  products,
  categories,
  loading,
  error,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onSyncProduct,
  onSyncAll,
  syncingId,
  syncingAll
}) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p => {
    const matchesStatus = filterStatus === 'all' || p.sync_status === filterStatus;
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category_name && p.category_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const syncedCount = products.filter(p => p.sync_status === 'synced').length;
  const pendingCount = products.filter(p => p.sync_status === 'pending').length;
  const failedCount = products.filter(p => p.sync_status === 'failed').length;
  const totalNeedSync = pendingCount + failedCount;

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Not synced';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="product-view-container">
      {/* Top Metric KPI Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrap icon-blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
          </div>
          <div>
            <span className="metric-label">Total Catalog</span>
            <div className="metric-value">{products.length}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap icon-green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div>
            <span className="metric-label">Synced to Store</span>
            <div className="metric-value text-emerald">{syncedCount}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap icon-amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div>
            <span className="metric-label">Pending Sync</span>
            <div className="metric-value text-amber">{pendingCount}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap icon-purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <div>
            <span className="metric-label">Categories</span>
            <div className="metric-value">{categories ? categories.length : '—'}</div>
          </div>
        </div>
      </div>

      {/* Main Data Card */}
      <div className="modern-card">
        <div className="modern-card-header">
          <div>
            <h2 className="card-title">Products Master Catalog</h2>
            <p className="card-subtitle">Manage catalog items, assign attributes, and synchronize to WooCommerce store</p>
          </div>

          <div className="header-actions-group">
            <button
              className="btn-sync-all-modern"
              onClick={onSyncAll}
              disabled={syncingAll || totalNeedSync === 0}
              title={totalNeedSync === 0 ? 'All catalog items are synced' : `Sync ${totalNeedSync} pending items`}
            >
              {syncingAll ? (
                <>
                  <span className="spinner-white"></span>
                  <span>Syncing Store...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                  <span>Sync All ({totalNeedSync})</span>
                </>
              )}
            </button>

            <button className="btn-primary-modern" onClick={onAddProduct}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="table-toolbar">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="modern-search-input"
              placeholder="Search products by SKU, title, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="search-clear-btn" onClick={() => setSearchTerm('')}>
                &times;
              </button>
            )}
          </div>

          <div className="filter-pill-group">
            {[
              { id: 'all', label: 'All', count: products.length },
              { id: 'synced', label: 'Synced', count: syncedCount },
              { id: 'pending', label: 'Pending', count: pendingCount },
              { id: 'failed', label: 'Failed', count: failedCount }
            ].map(item => (
              <button
                key={item.id}
                className={`filter-pill ${filterStatus === item.id ? 'active' : ''}`}
                onClick={() => setFilterStatus(item.id)}
              >
                {item.label}
                <span className="pill-badge">{item.count}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <div className="alert-modern alert-modern-error">{error}</div>}

        {loading ? (
          <div className="state-container">
            <div className="spinner-large"></div>
            <p className="state-text">Loading catalog inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="state-container">
            <div className="empty-state-icon-wrap">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <h3 className="empty-state-title">No products found</h3>
            <p className="empty-state-subtitle">
              {searchTerm || filterStatus !== 'all'
                ? 'Try tweaking your search term or filter status.'
                : 'Your catalog is empty. Click "+ Add Product" above to create your first item.'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button className="btn-primary-modern" onClick={onAddProduct}>
                + Create First Product
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Attributes</th>
                  <th>Sync Status</th>
                  <th>Last Synced</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const isSyncing = syncingId === product.id;

                  return (
                    <tr key={product.id} className="table-row-hover">
                      <td>
                        <div className="product-info-cell">
                          <span className="product-name">{product.name}</span>
                          {product.description && (
                            <span className="product-desc-snippet" title={product.description}>
                              {product.description.length > 55
                                ? product.description.slice(0, 55) + '...'
                                : product.description}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="sku-badge">{product.sku}</span>
                      </td>

                      <td>
                        {product.category_name ? (
                          <span className="category-tag">
                            <span className="category-dot"></span>
                            {product.category_name}
                          </span>
                        ) : (
                          <span className="empty-dash">—</span>
                        )}
                      </td>

                      <td>
                        <span className="price-display">
                          ${Number(product.price).toFixed(2)}
                        </span>
                      </td>

                      <td>
                        {product.attributes && product.attributes.length > 0 ? (
                          <div className="attributes-chip-wrap">
                            {product.attributes.map(attr => (
                              <span key={attr.id || attr.name} className="attribute-chip">
                                <span className="attr-key">{attr.name}:</span>
                                <span className="attr-val">{attr.value}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="empty-dash">—</span>
                        )}
                      </td>

                      <td>
                        <div className="status-cell">
                          <span className={`status-badge status-${product.sync_status}`}>
                            <span className="status-dot"></span>
                            {product.sync_status}
                          </span>
                          {product.woo_id && (
                            <span className="woo-id-link" title="WooCommerce Product ID">
                              Woo #{product.woo_id}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="timestamp-text">
                          {formatDateTime(product.last_synced_at)}
                        </span>
                      </td>

                      <td className="text-right">
                        <div className="action-buttons-wrap">
                          <button
                            className="btn-sync-action"
                            onClick={() => onSyncProduct(product.id)}
                            disabled={isSyncing || syncingAll}
                            title="Synchronize to WooCommerce"
                          >
                            {isSyncing ? (
                              <span className="spinner-micro"></span>
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                              </svg>
                            )}
                            <span>Sync</span>
                          </button>

                          <button
                            className="action-icon-btn"
                            onClick={() => onEditProduct(product)}
                            title="Edit product"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>

                          <button
                            className="action-icon-btn btn-delete"
                            onClick={() => onDeleteProduct(product.id)}
                            title="Delete product"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
