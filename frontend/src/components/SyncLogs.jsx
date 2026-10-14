import React, { useState } from 'react';

export default function SyncLogs({ logs, loading, error, onRefresh }) {
  const [filter, setFilter] = useState('all');

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  const successCount = logs.filter(l => l.status === 'success').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;

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
    <div className="modern-card">
      <div className="modern-card-header">
        <div>
          <h2 className="card-title">WooCommerce Sync Audit Logs</h2>
          <p className="card-subtitle">Real-time sync history, response codes, and error tracebacks</p>
        </div>

        <button className="btn-secondary-modern" onClick={onRefresh} disabled={loading}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'spin-icon' : ''}>
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="table-toolbar">
        <div className="filter-pill-group">
          {[
            { id: 'all', label: 'All Attempts', count: logs.length },
            { id: 'success', label: 'Successful', count: successCount },
            { id: 'failed', label: 'Failed', count: failedCount }
          ].map(item => (
            <button
              key={item.id}
              className={`filter-pill ${filter === item.id ? 'active' : ''}`}
              onClick={() => setFilter(item.id)}
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
          <p className="state-text">Fetching synchronization audit trail...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="state-container">
          <div className="empty-state-icon-wrap">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <h3 className="empty-state-title">No synchronization logs</h3>
          <p className="empty-state-subtitle">Every sync attempt will be permanently logged here with timestamp and payload details.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Target Product</th>
                <th>SKU</th>
                <th>Status</th>
                <th>Response & Audit Message</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} className="table-row-hover">
                  <td>
                    <span className="font-mono text-xs text-muted">
                      {formatDateTime(log.created_at)}
                    </span>
                  </td>

                  <td>
                    <span className="product-name">
                      {log.product_name || `Product #${log.product_id || '—'}`}
                    </span>
                  </td>

                  <td>
                    {log.product_sku ? (
                      <span className="sku-badge">{log.product_sku}</span>
                    ) : (
                      <span className="empty-dash">—</span>
                    )}
                  </td>

                  <td>
                    <span className={`status-badge status-${log.status === 'success' ? 'synced' : 'failed'}`}>
                      <span className="status-dot"></span>
                      {log.status === 'success' ? 'Success' : 'Failed'}
                    </span>
                  </td>

                  <td className="log-col-detail">
                    <div className={`log-detail-box ${log.status === 'failed' ? 'log-detail-error' : 'log-detail-success'}`}>
                      <span className="log-detail-icon">{log.status === 'failed' ? '⚠️' : '✓'}</span>
                      <span className="log-detail-message">{log.message}</span>
                    </div>
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
