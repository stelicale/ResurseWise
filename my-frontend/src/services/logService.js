/**
 * Log API Service
 * 
 * Handles operations for Activity Logs
 */
import { apiService } from './api';

const LOG_ENDPOINT = '/logs';

export const logService = {
  /**
   * Get logs from a specific time period
   * @param {string} timeAgo - Time period (e.g., '1h', '6h', '1d', '7d', '30d'). Default: '24h'
   * @returns {Promise<Array>} List of activity logs from the specified time period
   */
  getLogs: async (timeAgo = '24h') => {
    try {
      const data = await apiService.get(`${LOG_ENDPOINT}?timeAgo=${timeAgo}`);
      return data;
    } catch (error) {
      console.error(`Error fetching logs for timeAgo=${timeAgo}:`, error);
      throw error;
    }
  },

};

export default logService;
