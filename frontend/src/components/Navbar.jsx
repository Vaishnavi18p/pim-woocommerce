import React from 'react';

export default function Navbar({ activeTab, setActiveTab, productCount, pendingCount }) {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="brand-icon">📦</div>
          <div>
            <h1 className="brand-title">PIM Sync Studio</h1>
            <span className="brand-subtitle">Product Information Management ↔ WooCommerce</span>
          </div>
        </div>

        <nav className="navbar-nav">
          <button
            className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Products
            {productCount > 0 && <span className="nav-badge">{productCount}</span>}
          </button>

          <button
            className={`nav-link ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Sync Logs
          </button>
        </nav>

        <div className="navbar-actions">
          <div className="store-pill">
            <span className="pill-dot"></span>
            WooCommerce Mock (Port 4000)
          </div>
        </div>
      </div>
    </header>
  );
}
