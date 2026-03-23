/**
 * Log API Service
 * 
 * Handles operations for Activity Logs
 */
import { apiService } from './api';

const LOG_ENDPOINT = '/logs';

const toList = (data) => (Array.isArray(data) ? data : (data?.content || []));

const buildQueryString = (params = {}) => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    qp.append(k, String(v));
  });
  return qp.toString();
};

export const logService = {
  /**
   * Get logs from a specific time period
   * @param {string} timeAgo - Time period (e.g., '1h', '6h', '1d', '7d', '30d'). Default: '24h'
   * @returns {Promise<Array>} List of activity logs from the specified time period
   */
  getLogs: async (timeAgo = '24h') => {
    try {
      const data = await apiService.get(`${LOG_ENDPOINT}?timeAgo=${timeAgo}`);
      return toList(data);
    } catch (error) {
      console.error(`Error fetching logs for timeAgo=${timeAgo}:`, error);
      throw error;
    }
  },

  getLogsPage: async (params = {}) => {
    try {
      const qs = buildQueryString(params);
      const data = await apiService.get(`${LOG_ENDPOINT}${qs ? `?${qs}` : ''}`);
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
      console.error('Error fetching paged logs:', error);
      throw error;
    }
  },

};

export default logService;
