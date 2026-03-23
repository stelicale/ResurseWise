/**
 * Resource API Service
 * 
 * Handles all CRUD operations for Resources
 */
import { apiService } from './api';
import { toast } from 'react-toastify';

const RESOURCE_ENDPOINT = '/resources';

const toList = (data) => (Array.isArray(data) ? data : (data?.content || []));

const buildQueryString = (params = {}) => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    qp.append(k, String(v));
  });
  return qp.toString();
};

export const resourceService = {
  /**
   * Get all resources
   * @returns {Promise<Array>} List of all resources
   */
  getAllResources: async () => {
    try {
      const data = await apiService.get(RESOURCE_ENDPOINT);
      return toList(data);
    } catch (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }
  },

  getResourcesPage: async (params = {}) => {
    try {
      const qs = buildQueryString(params);
      const data = await apiService.get(`${RESOURCE_ENDPOINT}${qs ? `?${qs}` : ''}`);
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
      console.error('Error fetching paged resources:', error);
      throw error;
    }
  },

  /**
   * Get a single resource by ID
   * @param {string} id - Resource UUID
   * @returns {Promise<Object>} Resource object
   */
  getResourceById: async (id) => {
    try {
      const data = await apiService.get(`${RESOURCE_ENDPOINT}/${id}`);
      return data;
    } catch (error) {
      console.error(`Error fetching resource ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new resource
   * @param {Object} resourceData - Resource data
   * @returns {Promise<Object>} Created resource
   */
  createResource: async (resourceData) => {
    try {
      const data = await apiService.post(RESOURCE_ENDPOINT, resourceData);
      toast.success('Resource created successfully!');
      return data;
    } catch (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
  },

  /**
   * Update an existing resource
   * @param {string} id - Resource UUID
   * @param {Object} resourceData - Updated resource data
   * @returns {Promise<Object>} Updated resource
   */
  updateResource: async (id, resourceData) => {
    try {
      const data = await apiService.put(`${RESOURCE_ENDPOINT}/${id}`, resourceData);
      toast.success('Resource updated successfully!');
      return data;
    } catch (error) {
      console.error(`Error updating resource ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a resource
   * @param {string} id - Resource UUID
   * @returns {Promise<void>}
   */
  deleteResource: async (id) => {
    try {
      await apiService.delete(`${RESOURCE_ENDPOINT}/${id}`);
      toast.success('Resource deleted successfully!');
    } catch (error) {
      console.error(`Error deleting resource ${id}:`, error);
      throw error;
    }
  },
};

export default resourceService;
