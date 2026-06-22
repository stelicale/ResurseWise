/**
 * Category API Service
 * 
 * Handles all CRUD operations for Categories
 */
import { apiService } from './api';
import { toast } from 'react-toastify';

const CATEGORY_ENDPOINT = '/categories';

const toList = (data) => (Array.isArray(data) ? data : (data?.content || []));

const buildQueryString = (params = {}) => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    qp.append(k, String(v));
  });
  return qp.toString();
};

export const categoryService = {
  /**
   * Get all categories
   * @returns {Promise<Array>} List of all categories
   */
  getAllCategories: async () => {
    try {
      const data = await apiService.get(CATEGORY_ENDPOINT);
      return toList(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  getCategoriesPage: async (params = {}) => {
    try {
      const qs = buildQueryString(params);
      const data = await apiService.get(`${CATEGORY_ENDPOINT}${qs ? `?${qs}` : ''}`);
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
      console.error('Error fetching paged categories:', error);
      throw error;
    }
  },

  /**
   * Get a single category by ID
   * @param {string} id - Category UUID
   * @returns {Promise<Object>} Category object
   */
  getCategoryById: async (id) => {
    try {
      const data = await apiService.get(`${CATEGORY_ENDPOINT}/${id}`);
      return data;
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new category
   * @param {Object} categoryData - Category data (name, description)
   * @returns {Promise<Object>} Created category
   */
  createCategory: async (categoryData) => {
    try {
      const data = await apiService.post(CATEGORY_ENDPOINT, categoryData);
      toast.success('Category created successfully!');
      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  /**
   * Update an existing category
   * @param {string} id - Category UUID
   * @param {Object} categoryData - Updated category data
   * @returns {Promise<Object>} Updated category
   */
  updateCategory: async (id, categoryData) => {
    try {
      const data = await apiService.put(`${CATEGORY_ENDPOINT}/${id}`, categoryData);
      toast.success('Category updated successfully!');
      return data;
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a category
   * @param {string} id - Category UUID
   * @returns {Promise<void>}
   */
  deleteCategory: async (id) => {
    try {
      await apiService.delete(`${CATEGORY_ENDPOINT}/${id}`);
      toast.success('Category deleted successfully!');
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  },
};

export default categoryService;
