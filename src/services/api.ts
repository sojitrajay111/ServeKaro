// Base API service with authentication and error handling
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Types
export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Token management
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
};

const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
};

// Request interceptor
const getHeaders = (includeAuth = true, method = 'GET'): HeadersInit => {
  const headers: HeadersInit = {};

  // Always set Content-Type for POST/PUT/PATCH requests (server requires it)
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    headers['Content-Type'] = 'application/json';
  }

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Error handler
const handleError = async (response: Response): Promise<ApiError> => {
  let errorData: any;
  
  try {
    errorData = await response.json();
  } catch {
    errorData = { message: response.statusText || 'An error occurred' };
  }

  const error: ApiError = {
    message: errorData.message || errorData.error || 'An error occurred',
    status: response.status,
    errors: errorData.errors,
  };

  // Handle 401 Unauthorized - clear token and redirect to login only on admin paths
  if (response.status === 401) {
    removeAuthToken();
    if (
      typeof window !== 'undefined' &&
      window.location.pathname.startsWith('/admin') &&
      !window.location.pathname.includes('/admin/login') &&
      !window.location.pathname.includes('/admin/forgot-password')
    ) {
      window.location.href = '/admin/login';
    }
  }

  return error;
};

// Base fetch wrapper
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const includeAuth = options.credentials !== 'omit';
  const method = options.method || 'GET';
  const isFormData = options.body instanceof FormData;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(includeAuth, isFormData ? 'GET' : method),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await handleError(response);
      throw error;
    }

    // Safely parse body — backend may return empty body, plain text, or JSON
    const text = await response.text();
    let data: any = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        // Plain-text success message (e.g. "Settings updated successfully")
        data = { message: text };
      }
    }
    return {
      data,
      success: true,
      message: data?.message,
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error) {
      throw error;
    }
    throw {
      message: error instanceof Error ? error.message : 'Network error occurred',
      status: 0,
    } as ApiError;
  }
};

// HTTP Methods
export const api = {
  get: <T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> => {
    // Always stringify data, even if empty object (server requires Content-Type)
    const body = data !== undefined ? JSON.stringify(data) : JSON.stringify({});
    
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body,
    });
  },

  put: <T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  // File upload
  upload: <T>(endpoint: string, formData: FormData, options?: RequestInit): Promise<ApiResponse<T>> => {
    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      headers,
      body: formData,
    });
  },
};

// Token management functions
export const authService = {
  setToken: setAuthToken,
  getToken: getAuthToken,
  removeToken: removeAuthToken,
};

export default api;

