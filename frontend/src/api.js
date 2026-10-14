const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data && data.error ? data.error : `Request failed with status ${res.status}`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) throw err;
    throw new Error(`Cannot connect to PIM Backend at ${API_BASE}. Make sure it is running.`);
  }
}

export const api = {
  // Products
  getProducts: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return request(`/api/products${query ? `?${query}` : ''}`);
  },
  getProduct: (id) => request(`/api/products/${id}`),
  createProduct: (data) => request('/api/products', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateProduct: (id, data) => request(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteProduct: (id) => request(`/api/products/${id}`, {
    method: 'DELETE'
  }),

  // Categories
  getCategories: () => request('/api/categories'),
  createCategory: (data) => request('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Sync
  syncProduct: (id) => request(`/api/sync/${id}`, {
    method: 'POST'
  }),
  syncAll: () => request('/api/sync', {
    method: 'POST'
  }),
  getSyncLogs: () => request('/api/sync/logs')
};
