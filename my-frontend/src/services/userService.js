/**
 * User API Service
 * 
 * Handles all CRUD operations for Users (Keycloak integration)
 */
import { apiService } from './api';
import { toast } from 'react-toastify';

const USER_ENDPOINT = '/users';

const toList = (data) => (Array.isArray(data) ? data : (data?.content || []));

const buildQueryString = (params = {}) => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    qp.append(k, String(v));
  });
  return qp.toString();
};

export const userService = {
  /**
   * Get all users
   * @returns {Promise<Array>} List of all users from Keycloak
   */
  getAllUsers: async () => {
    try {
      const data = await apiService.get(USER_ENDPOINT);
      return toList(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  getUsersPage: async (params = {}) => {
    try {
      const qs = buildQueryString(params);
      const data = await apiService.get(`${USER_ENDPOINT}${qs ? `?${qs}` : ''}`);
      if (Array.isArray(data)) {
        return {
          content: data,
          page: 0,
          size: data.length,
          totalElements: data.length,
          totalPages: 1,
        };
      }
      return data;
    } catch (error) {
      console.error('Error fetching paged users:', error);
      throw error;
    }
  },

  /**
   * Get a single user by ID
   * @param {string} id - User UUID
   * @returns {Promise<Object>} User object
   */
  getUserById: async (id) => {
    try {
      const data = await apiService.get(`${USER_ENDPOINT}/${id}`);
      return data;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get available roles
   * @returns {Promise<Array>} List of available realm roles
   */
  getAvailableRoles: async () => {
    try {
      const data = await apiService.get(`${USER_ENDPOINT}/roles/available`);
      return data;
    } catch (error) {
      console.error('Error fetching available roles:', error);
      throw error;
    }
  },

  /**
   * Create a new user
   * @param {Object} userData - User data (username, email, firstName, lastName, password, roles)
   * @returns {Promise<Object>} Created user
   */
  createUser: async (userData) => {
    try {
      const data = await apiService.post(USER_ENDPOINT, userData);
      toast.success('User created successfully!');
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Update an existing user
   * @param {string} id - User UUID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user
   */
  updateUser: async (id, userData) => {
    try {
      const data = await apiService.put(`${USER_ENDPOINT}/${id}`, userData);
      toast.success('User updated successfully!');
      return data;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a user
   * @param {string} id - User UUID
   * @returns {Promise<void>}
   */
  deleteUser: async (id) => {
    try {
      await apiService.delete(`${USER_ENDPOINT}/${id}`);
      toast.success('User deleted successfully!');
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  },
};

export default userService;
