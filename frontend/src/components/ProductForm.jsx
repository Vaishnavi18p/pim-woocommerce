import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function ProductForm({ product, categories, onSave, onCancel }) {
  const [sku, setSku] = useState(product ? product.sku : '');
  const [name, setName] = useState(product ? product.name : '');
  const [price, setPrice] = useState(product ? product.price : '');
  const [description, setDescription] = useState(product ? product.description || '' : '');
  const [categoryId, setCategoryId] = useState(product && product.category_id ? String(product.category_id) : '');
  const [attributes, setAttributes] = useState(
    product && Array.isArray(product.attributes) && product.attributes.length > 0
      ? product.attributes.map(a => ({ name: a.name, value: a.value }))
      : []
  );

  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [availableCategories, setAvailableCategories] = useState(categories || []);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAvailableCategories(categories || []);
  }, [categories]);

  const handleAddAttribute = () => {
    setAttributes([...attributes, { name: '', value: '' }]);
  };

  const handleAttributeChange = (index, field, value) => {
    const updated = [...attributes];
    updated[index][field] = value;
    setAttributes(updated);
  };

  const handleRemoveAttribute = (index) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const created = await api.createCategory({ name: newCategoryName.trim() });
      setAvailableCategories([...availableCategories, created]);
      setCategoryId(String(created.id));
      setNewCategoryName('');
      setIsAddingCategory(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!sku.trim()) {
      setError('Product SKU is required');
      return;
    }
    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    if (price === '' || isNaN(Number(price)) || Number(price) < 0) {
      setError('Please provide a valid non-negative price');
      return;
    }

    const cleanAttributes = attributes.filter(a => a.name.trim() && a.value.trim());

    setLoading(true);
    try {
      const payload = {
        sku: sku.trim(),
        name: name.trim(),
        price: Number(price),
        description: description.trim(),
        category_id: categoryId ? Number(categoryId) : null,
        attributes: cleanAttributes
      };

      if (product) {
        await api.updateProduct(product.id, payload);
      } else {
        await api.createProduct(payload);
      }

      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modern-modal-card">
        <div className="modal-card-header">
          <div className="modal-title-wrap">
            <div className="modal-badge-icon">
              {product ? '✏️' : '✨'}
            </div>
            <div>
              <h2 className="modal-heading">{product ? 'Edit Product' : 'Add New Product'}</h2>
              <p className="modal-subheading">Fill in catalog details to push to WooCommerce</p>
            </div>
          </div>
          <button className="modal-close-button" onClick={onCancel}>&times;</button>
        </div>

        {error && (
          <div className="alert-modern alert-modern-error modal-alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modern-form-body">
          <div className="form-row-grid">
            <div className="input-group">
              <label htmlFor="prod-sku">SKU Code <span className="label-required">*</span></label>
              <input
                id="prod-sku"
                type="text"
                className="modern-input font-mono"
                placeholder="e.g. TSHIRT-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="prod-price">Price ($) <span className="label-required">*</span></label>
              <div className="price-input-wrapper">
                <span className="price-currency-symbol">$</span>
                <input
                  id="prod-price"
                  type="number"
                  step="0.01"
                  min="0"
                  className="modern-input price-input font-mono"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="prod-name">Product Title <span className="label-required">*</span></label>
            <input
              id="prod-name"
              type="text"
              className="modern-input"
              placeholder="e.g. Classic Organic Cotton Crewneck"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <div className="label-with-action">
              <label htmlFor="prod-category">Catalog Category</label>
              {!isAddingCategory && (
                <button
                  type="button"
                  className="text-action-link"
                  onClick={() => setIsAddingCategory(true)}
                >
                  + Quick Add Category
                </button>
              )}
            </div>

            {isAddingCategory ? (
              <div className="category-quick-create-box">
                <input
                  type="text"
                  className="modern-input"
                  placeholder="Category name (e.g. Outerwear)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  autoFocus
                />
                <button type="button" className="btn-secondary-modern" onClick={handleCreateCategory}>
                  Save
                </button>
                <button type="button" className="btn-ghost-modern" onClick={() => setIsAddingCategory(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <select
                id="prod-category"
                className="modern-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">-- Select Category (Optional) --</option>
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="prod-desc">Description</label>
            <textarea
              id="prod-desc"
              rows={3}
              className="modern-textarea"
              placeholder="Write a clear summary of product materials, sizing, and details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Dynamic Attributes Section */}
          <div className="attributes-card-wrapper">
            <div className="attributes-header-row">
              <div>
                <label className="attributes-title">Product Attributes</label>
                <p className="attributes-subtitle">Attach custom specs synced to WooCommerce (e.g. Color, Size, Fit)</p>
              </div>
              <button
                type="button"
                className="btn-add-attribute"
                onClick={handleAddAttribute}
              >
                + Add Spec
              </button>
            </div>

            {attributes.length === 0 ? (
              <div className="attributes-empty-banner">
                <span>No custom attributes yet. Click "+ Add Spec" to attach colors, sizes, or materials.</span>
              </div>
            ) : (
              <div className="attributes-rows-container">
                {attributes.map((attr, idx) => (
                  <div key={idx} className="attribute-edit-row">
                    <input
                      type="text"
                      className="modern-input attr-input"
                      placeholder="Name (e.g. Color)"
                      value={attr.name}
                      onChange={(e) => handleAttributeChange(idx, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      className="modern-input attr-input"
                      placeholder="Value (e.g. Heather Grey)"
                      value={attr.value}
                      onChange={(e) => handleAttributeChange(idx, 'value', e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-remove-attr"
                      onClick={() => handleRemoveAttribute(idx)}
                      title="Remove specification"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer-actions">
            <button type="button" className="btn-secondary-modern" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-modern" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-white"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{product ? 'Save Changes' : 'Create Product'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
