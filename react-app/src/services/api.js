const API_BASE_URL = 'http://localhost:8000/api';

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

// Helper function to set auth tokens
export const setAuthTokens = (access, refresh) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

// Helper function to clear auth tokens
export const clearAuthTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  // Déclencher un événement personnalisé pour notifier l'application
  window.dispatchEvent(new CustomEvent('auth:logout'));
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    // Si le token a expiré (401), déconnecter l'utilisateur AVANT de parser la réponse
    if (response.status === 401) {
      clearAuthTokens();
      // Essayer de parser la réponse JSON si possible
      try {
        const data = await response.json();
        throw new Error(data.detail || 'Votre session a expiré. Veuillez vous reconnecter.');
      } catch {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      }
    }
    
    // Pour les réponses DELETE (204 No Content) ou autres réponses sans contenu, retourner null
    if (response.status === 204 || response.status === 201) {
      return null;
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      if (response.status === 404) {
        throw new Error('Endpoint non trouvé. Vérifiez que le serveur Django est démarré.');
      }
      if (response.status >= 500) {
        throw new Error('Erreur serveur. Vérifiez que le serveur Django fonctionne correctement.');
      }
      // Si la réponse est OK mais pas JSON (comme 204), retourner null
      if (response.ok) {
        return null;
      }
      throw new Error('Le serveur a renvoyé une réponse non-JSON. Vérifiez la configuration.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || 'Une erreur est survenue');
    }

    return data;
  } catch (error) {
    // If it's already our custom error, rethrow it
    if (error.message && !error.message.includes('JSON')) {
      throw error;
    }
    // Otherwise, it's likely a network or parsing error
    if (error.message && error.message.includes('JSON')) {
      throw new Error('Impossible de communiquer avec le serveur. Vérifiez que Django est démarré sur http://localhost:8000');
    }
    throw new Error(error.message || 'Erreur de connexion au serveur');
  }
};

// Login API
export const login = async (username, password) => {
  return apiRequest('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
};

// Get user profile
export const getProfile = async () => {
  return apiRequest('/account/profile/');
};

// Dashboard API
export const getDashboardStats = async () => {
  return apiRequest('/dashboard/stats/');
};

// Products API
export const getProducts = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/products/${queryString ? `?${queryString}` : ''}`);
};

export const getProduct = async (id) => {
  return apiRequest(`/products/${id}/`);
};

export const createProduct = async (data) => {
  return apiRequest('/products/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateProduct = async (id, data) => {
  return apiRequest(`/products/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const deleteProduct = async (id) => {
  return apiRequest(`/products/${id}/`, {
    method: 'DELETE',
  });
};

export const updateProductStock = async (id, quantity, action = 'set') => {
  return apiRequest(`/products/${id}/update_stock/`, {
    method: 'POST',
    body: JSON.stringify({ quantity, action }),
  });
};

// Import products from Excel
export const importProductsExcel = async (file) => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}/products/import-excel/`;
  
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      // Ne pas définir Content-Type pour FormData, le navigateur le fera automatiquement
    },
    body: formData,
  });

  // Gérer les erreurs 401 (token expiré)
  if (response.status === 401) {
    clearAuthTokens();
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || 'Votre session a expiré. Veuillez vous reconnecter.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.detail || 'Une erreur est survenue lors de l\'import');
  }

  return data;
};

// Categories API
export const getCategories = async () => {
  return apiRequest('/products/categories/');
};

export const createCategory = async (data) => {
  return apiRequest('/products/categories/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Customers API
export const getCustomers = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/customers/${queryString ? `?${queryString}` : ''}`);
};

export const getCustomer = async (id) => {
  return apiRequest(`/customers/${id}/`);
};

export const createCustomer = async (data) => {
  return apiRequest('/customers/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateCustomer = async (id, data) => {
  return apiRequest(`/customers/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const deleteCustomer = async (id) => {
  return apiRequest(`/customers/${id}/`, {
    method: 'DELETE',
  });
};

// Orders API
export const getOrders = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/orders/${queryString ? `?${queryString}` : ''}`);
};

export const getOrder = async (id) => {
  return apiRequest(`/orders/${id}/`);
};

export const createOrder = async (data) => {
  return apiRequest('/orders/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateOrder = async (id, data) => {
  return apiRequest(`/orders/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const updateOrderStatus = async (id, status) => {
  return apiRequest(`/orders/${id}/update_status/`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
};

export const deleteOrder = async (id) => {
  return apiRequest(`/orders/${id}/`, {
    method: 'DELETE',
  });
};

// Sales API
export const getSales = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/sales/${queryString ? `?${queryString}` : ''}`);
};

export const getSale = async (id) => {
  return apiRequest(`/sales/${id}/`);
};

export const createSale = async (data) => {
  return apiRequest('/sales/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateSale = async (id, data) => {
  return apiRequest(`/sales/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const checkStock = async (items) => {
  return apiRequest('/sales/check_stock/', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
};

export const getOutOfStockSales = async () => {
  return apiRequest('/out-of-stock-sales/');
};



export const exportSalesReport = async (dateFrom, dateTo) => {
  const token = getAuthToken();
  const params = new URLSearchParams();
  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) params.append('date_to', dateTo);
  
  const url = `${API_BASE_URL}/sales/export_report/${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error('Erreur lors du téléchargement du rapport');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `rapport_ventes_${dateFrom || 'all'}_${dateTo || 'all'}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

export const exportExpensesReport = async (dateFrom, dateTo) => {
  const token = getAuthToken();
  const params = new URLSearchParams();
  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) params.append('date_to', dateTo);
  
  const url = `${API_BASE_URL}/expenses/export_report/${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error('Erreur lors du téléchargement du rapport');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `rapport_depenses_${dateFrom || 'all'}_${dateTo || 'all'}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

export const deleteSale = async (id) => {
  return apiRequest(`/sales/${id}/`, {
    method: 'DELETE',
  });
};

// Expenses API
export const getExpenses = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/expenses/${queryString ? `?${queryString}` : ''}`);
};

export const getExpense = async (id) => {
  return apiRequest(`/expenses/${id}/`);
};

export const createExpense = async (data) => {
  return apiRequest('/expenses/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateExpense = async (id, data) => {
  return apiRequest(`/expenses/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const deleteExpense = async (id) => {
  return apiRequest(`/expenses/${id}/`, {
    method: 'DELETE',
  });
};

export const getExpenseCategories = async () => {
  return apiRequest('/expense-categories/');
};

export const createExpenseCategory = async (data) => {
  return apiRequest('/expense-categories/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Invoices API
export const getInvoices = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/invoices/${queryString ? `?${queryString}` : ''}`);
};

export const getInvoice = async (id) => {
  return apiRequest(`/invoices/${id}/`);
};

export const createInvoice = async (data) => {
  return apiRequest('/invoices/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateInvoice = async (id, data) => {
  return apiRequest(`/invoices/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const previewInvoicePDF = async (id) => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}/invoices/${id}/preview_pdf/`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  // Si le token a expiré (401), déconnecter l'utilisateur
  if (response.status === 401) {
    clearAuthTokens();
    throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Erreur lors du chargement de l\'aperçu');
  }

  const blob = await response.blob();
  return window.URL.createObjectURL(blob);
};

export const downloadInvoicePDF = async (id) => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}/invoices/${id}/download_pdf/`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error('Erreur lors du téléchargement du PDF');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `facture_${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

export const deleteInvoice = async (id) => {
  return apiRequest(`/invoices/${id}/`, {
    method: 'DELETE',
  });
};

