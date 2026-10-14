import React, { useState } from 'react';

export default function ProductList({
  products,
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
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = products.filter(p => p.sync_status === 'pending' || p.sync_status === 'failed').length;

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Never';
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
    <div className="card">
      <div className="card-header">
        <div className="header-left">
          <h2 className="section-title">Catalog Inventory</h2>
          <span className="section-count">{products.length} {products.length === 1 ? 'product' : 'products'}</span>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-sync-all"
            onClick={onSyncAll}
            disabled={syncingAll || pendingCount === 0}
            title={pendingCount === 0 ? 'All products are up to date' : `Sync ${pendingCount} products to WooCommerce`}
          >
            {syncingAll ? (
              <>
                <span className="spinner"></span> Syncing Store...
              </>
            ) : (
              <>
                <span>⚡</span> Sync All Pending ({pendingCount})
              </>
            )}
          </button>

          <button className="btn btn-primary" onClick={onAddProduct}>
            <span>+</span> Add Product
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>&times;</button>
          )}
        </div>

        <div className="status-filters">
          {['all', 'pending', 'synced', 'failed'].map(status => (
            <button
              key={status}
              className={`filter-chip ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="chip-count">
                  {products.filter(p => p.sync_status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner large"></div>
          <p>Loading catalog products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No products found</h3>
          <p>
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'Start by creating your first product in the PIM catalog.'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button className="btn btn-primary" onClick={onAddProduct}>
              + Create Product
            </button>
          )}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
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
                  <tr key={product.id}>
                    <td>
                      <div className="product-cell">
                        <span className="product-title">{product.name}</span>
                        {product.description && (
                          <span className="product-desc-snippet">
                            {product.description.length > 55
                              ? product.description.slice(0, 55) + '...'
                              : product.description}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="sku-tag">{product.sku}</span>
                    </td>

                    <td>
                      {product.category_name ? (
                        <span className="category-chip">{product.category_name}</span>
                      ) : (
                        <span className="text-light">—</span>
                      )}
                    </td>

                    <td className="price-cell">
                      ${Number(product.price).toFixed(2)}
                    </td>

                    <td>
                      {product.attributes && product.attributes.length > 0 ? (
                        <div className="attributes-cell">
                          {product.attributes.map(attr => (
                            <span key={attr.id || attr.name} className="attr-tag">
                              <strong>{attr.name}:</strong> {attr.value}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-light">—</span>
                      )}
                    </td>

                    <td>
                      <span className={`badge badge-${product.sync_status}`}>
                        <span className="badge-dot"></span>
                        {product.sync_status}
                      </span>
                      {product.woo_id && (
                        <span className="woo-id-sub">Woo #{product.woo_id}</span>
                      )}
                    </td>

                    <td className="text-muted text-sm">
                      {formatDateTime(product.last_synced_at)}
                    </td>

                    <td className="text-right action-cell">
                      <button
                        className="btn btn-sync-single"
                        onClick={() => onSyncProduct(product.id)}
                        disabled={isSyncing || syncingAll}
                        title="Push changes to WooCommerce"
                      >
                        {isSyncing ? <span className="spinner-sm"></span> : '⚡ Sync'}
                      </button>

                      <button
                        className="btn-icon"
                        onClick={() => onEditProduct(product)}
                        title="Edit product"
                      >
                        ✏️
                      </button>

                      <button
                        className="btn-icon text-danger"
                        onClick={() => onDeleteProduct(product.id)}
                        title="Delete product"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
