import React, { useState, useEffect } from 'react';
import { api } from './api';
import Navbar from './components/Navbar';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import SyncLogs from './components/SyncLogs';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [logs, setLogs] = useState([]);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [productError, setProductError] = useState('');
  const [logsError, setLogsError] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [syncingId, setSyncingId] = useState(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    setProductError('');
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      setProductError(err.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.warn('Failed to load categories:', err.message);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    setLogsError('');
    try {
      const data = await api.getSyncLogs();
      setLogs(data);
    } catch (err) {
      setLogsError(err.message);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab]);

  const handleOpenAddForm = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleFormSave = () => {
    handleCloseForm();
    loadProducts();
    showToast(editingProduct ? 'Product updated successfully' : 'Product created successfully');
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    try {
      await api.deleteProduct(id);
      showToast('Product deleted');
      loadProducts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSyncProduct = async (id) => {
    setSyncingId(id);
    try {
      const result = await api.syncProduct(id);
      if (result.success) {
        showToast(`Product synced to WooCommerce! (ID: #${result.wooProduct?.id || id})`, 'success');
      } else {
        showToast(`Sync failed: ${result.error}`, 'error');
      }
      await loadProducts();
      if (activeTab === 'logs') loadLogs();
    } catch (err) {
      showToast(`Sync error: ${err.message}`, 'error');
      await loadProducts();
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const result = await api.syncAll();
      showToast(`Batch sync finished: ${result.synced} synced, ${result.failed} failed of ${result.total} items.`, result.failed === 0 ? 'success' : 'warning');
      await loadProducts();
      if (activeTab === 'logs') loadLogs();
    } catch (err) {
      showToast(`Batch sync error: ${err.message}`, 'error');
      await loadProducts();
    } finally {
      setSyncingAll(false);
    }
  };

  const pendingCount = products.filter(p => p.sync_status === 'pending' || p.sync_status === 'failed').length;

  return (
    <div className="app-layout">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        productCount={products.length}
        pendingCount={pendingCount}
      />

      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          <span>{toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      <main className="main-content">
        {activeTab === 'products' ? (
          <ProductList
            products={products}
            categories={categories}
            loading={loadingProducts}
            error={productError}
            onAddProduct={handleOpenAddForm}
            onEditProduct={handleOpenEditForm}
            onDeleteProduct={handleDeleteProduct}
            onSyncProduct={handleSyncProduct}
            onSyncAll={handleSyncAll}
            syncingId={syncingId}
            syncingAll={syncingAll}
          />
        ) : (
          <SyncLogs
            logs={logs}
            loading={loadingLogs}
            error={logsError}
            onRefresh={loadLogs}
          />
        )}
      </main>

      {isFormOpen && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onSave={handleFormSave}
          onCancel={handleCloseForm}
        />
      )}
    </div>
  );
}
