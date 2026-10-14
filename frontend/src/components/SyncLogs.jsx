import React from 'react';

export default function SyncLogs({ logs, loading, error, onRefresh }) {
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="header-left">
          <h2 className="section-title">WooCommerce Synchronization Logs</h2>
          <span className="section-count">{logs.length} audit entries</span>
        </div>

        <button className="btn btn-secondary" onClick={onRefresh} disabled={loading}>
          <span>🔄</span> Refresh Logs
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner large"></div>
          <p>Fetching synchronization logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No sync logs yet</h3>
          <p>Sync logs will appear here each time a product is pushed to WooCommerce.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Outcome</th>
                <th>Audit Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="text-muted text-sm whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </td>

                  <td>
                    <span className="product-title">{log.product_name || `Product #${log.product_id || '—'}`}</span>
                  </td>

                  <td>
                    {log.product_sku ? (
                      <span className="sku-tag">{log.product_sku}</span>
                    ) : (
                      <span className="text-light">—</span>
                    )}
                  </td>

                  <td>
                    <span className={`badge badge-${log.status === 'success' ? 'synced' : 'failed'}`}>
                      <span className="badge-dot"></span>
                      {log.status === 'success' ? 'Success' : 'Failed'}
                    </span>
                  </td>

                  <td className="log-message-cell">
                    <span className={`log-text ${log.status === 'failed' ? 'log-text-error' : ''}`}>
                      {log.message}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
