/**
 * API Service Layer
 * 
 * Centralized service for all backend API calls using Axios.
 * Includes error handling, authentication, and toast notifications.
 */
import axios from 'axios';
import { toast } from 'react-toastify';
import { refreshToken } from '../auth/keycloak';

// Base API URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

/**
 * Axios instance with default configuration
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor
 * Add authentication token to requests if available
 */
apiClient.interceptors.request.use(
  async (config) => {
    const token = await refreshToken(30);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Handle errors globally and show toast notifications
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          toast.error(data?.message || 'Unauthorized. Please login again.');
          // Optionally redirect to login
          // window.location.href = '/login';
          break;
        case 403:
          toast.error(data?.message || 'Access forbidden. You do not have permission.');
          break;
        case 404:
          toast.error(data?.message || 'Resource not found.');
          break;
        case 500:
          toast.error(data?.message || 'Server error. Please try again later.');
          break;
        default:
          toast.error(data?.message || 'An error occurred.');
      }
    } else if (error.request) {
      // Request was made but no response received
      toast.error('Network error. Please check your connection.');
    } else {
      // Something else happened
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

/**
 * Generic API service methods
 */
export const apiService = {
  // GET request
  get: async (endpoint) => {
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  // POST request
  post: async (endpoint, data) => {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  },

  // PUT request
  put: async (endpoint, data) => {
    const response = await apiClient.put(endpoint, data);
    return response.data;
  },

  // DELETE request
  delete: async (endpoint) => {
    const response = await apiClient.delete(endpoint);
    return response.data;
  },
};

export default apiClient;
