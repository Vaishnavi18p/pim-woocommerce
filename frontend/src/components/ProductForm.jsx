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

    // Filter out incomplete attribute rows
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
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="close-btn" onClick={onCancel}>&times;</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="prod-sku">SKU <span className="required">*</span></label>
              <input
                id="prod-sku"
                type="text"
                placeholder="e.g. TSHIRT-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="prod-price">Price ($) <span className="required">*</span></label>
              <input
                id="prod-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="prod-name">Product Name <span className="required">*</span></label>
            <input
              id="prod-name"
              type="text"
              placeholder="e.g. Classic Cotton Crewneck"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div className="category-label-row">
              <label htmlFor="prod-category">Category</label>
              {!isAddingCategory && (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setIsAddingCategory(true)}
                >
                  + Quick Add Category
                </button>
              )}
            </div>

            {isAddingCategory ? (
              <div className="inline-add-category">
                <input
                  type="text"
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  autoFocus
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleCreateCategory}>Save</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsAddingCategory(false)}>Cancel</button>
              </div>
            ) : (
              <select
                id="prod-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">-- No Category --</option>
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="prod-desc">Description</label>
            <textarea
              id="prod-desc"
              rows={3}
              placeholder="Product description and features..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Dynamic Attributes Section */}
          <div className="attributes-section">
            <div className="attributes-header">
              <label>Attributes (Name / Value pairs)</label>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleAddAttribute}
              >
                + Add Attribute
              </button>
            </div>

            {attributes.length === 0 ? (
              <p className="empty-hint">No custom attributes added (e.g., Color: Blue, Size: XL).</p>
            ) : (
              <div className="attributes-list">
                {attributes.map((attr, idx) => (
                  <div key={idx} className="attribute-row">
                    <input
                      type="text"
                      placeholder="Name (e.g. Color)"
                      value={attr.name}
                      onChange={(e) => handleAttributeChange(idx, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. Navy)"
                      value={attr.value}
                      onChange={(e) => handleAttributeChange(idx, 'value', e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-icon delete-icon"
                      onClick={() => handleRemoveAttribute(idx)}
                      title="Remove attribute"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
