const API_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';

const API_BASE_URL = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

/**
 * Custom fetch API wrapper.
 * Handles automatic attachment of Bearer Token.
 */
const api = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Allow passing raw FormData (for uploads) by deleting Content-Type
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config).catch(err => {
    console.error('Fetch network error:', err);
    throw new Error(
      'Server connection failed. Please ensure the backend server is running on http://localhost:5000 or VITE_BACKEND_URL is set.'
    );
  });

  // Handle Unauthorized (expired token)
  if (response.status === 401 && endpoint !== '/auth/login') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export default api;
export { API_URL, API_BASE_URL };
