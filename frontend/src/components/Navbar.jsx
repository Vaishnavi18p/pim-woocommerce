import React from 'react';

export default function Navbar({ activeTab, setActiveTab, productCount, pendingCount }) {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="brand-logo-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div>
            <div className="brand-title-wrap">
              <h1 className="brand-title">PIM Flow</h1>
              <span className="brand-version-chip">v1.0</span>
            </div>
            <p className="brand-subtitle">Catalog Information ↔ WooCommerce Sync</p>
          </div>
        </div>

        <nav className="navbar-nav">
          <button
            className={`nav-tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <span className="tab-icon">📦</span>
            Products
            {productCount > 0 && (
              <span className={`nav-count ${pendingCount > 0 ? 'nav-count-alert' : ''}`}>
                {productCount}
              </span>
            )}
          </button>

          <button
            className={`nav-tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <span className="tab-icon">⚡</span>
            Sync Logs
          </button>
        </nav>

        <div className="navbar-status-wrap">
          <div className="store-status-pill" title="Connected to Mock WooCommerce REST API v3">
            <span className="pulse-indicator">
              <span className="pulse-dot"></span>
              <span className="pulse-ring"></span>
            </span>
            <span className="store-pill-text">WooCommerce v3</span>
            <span className="port-tag">:4000</span>
          </div>
        </div>
      </div>
    </header>
  );
}
