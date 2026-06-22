/**
 * API service layer – success and error states
 *
 * Tests cover:
 *   - apiService.get/post/put/delete success paths (returns response.data)
 *   - Response-interceptor error handling:
 *       401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error,
 *       network error (no response), unexpected error
 *
 * All HTTP communication is mocked – no real endpoints are called.
 */

// Hoist mocks before any imports
jest.mock('axios', () => {
  // Single shared instance returned by every axios.create() call
  const mockInstance = {
    get:    jest.fn(),
    post:   jest.fn(),
    put:    jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request:  { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return { create: jest.fn(() => mockInstance) };
});

jest.mock('../../auth/keycloak', () => ({
  refreshToken: jest.fn().mockResolvedValue(null),
}));

jest.mock('react-toastify', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

// ── Imports (after mock setup) ────────────────────────────────────────────────
import axios from 'axios';
import { toast } from 'react-toastify';
import { apiService } from '../api';

// ── Shared references ─────────────────────────────────────────────────────────
// The mock instance api.js received when it called axios.create()
const axiosInstance = axios.create.mock.results[0].value;

// The error handler registered by api.js on the response interceptor
const responseErrorFn =
  axiosInstance.interceptors.response.use.mock.calls[0]?.[1];

// ──────────────────────────────────────────────────────────────────────────────
describe('apiService – success states', () => {
  beforeEach(() => jest.clearAllMocks());

  test('GET request returns response.data', async () => {
    axiosInstance.get.mockResolvedValueOnce({ data: [{ id: 1 }] });
    const result = await apiService.get('/categories');
    expect(axiosInstance.get).toHaveBeenCalledWith('/categories');
    expect(result).toEqual([{ id: 1 }]);
  });

  test('POST request returns response.data', async () => {
    const payload = { name: 'Electronics' };
    axiosInstance.post.mockResolvedValueOnce({ data: { id: 2, ...payload } });
    const result = await apiService.post('/categories', payload);
    expect(axiosInstance.post).toHaveBeenCalledWith('/categories', payload);
    expect(result).toEqual({ id: 2, name: 'Electronics' });
  });

  test('PUT request returns response.data', async () => {
    axiosInstance.put.mockResolvedValueOnce({ data: { id: 2, name: 'Updated' } });
    const result = await apiService.put('/categories/2', { name: 'Updated' });
    expect(result).toEqual({ id: 2, name: 'Updated' });
  });

  test('DELETE request returns response.data', async () => {
    axiosInstance.delete.mockResolvedValueOnce({ data: null });
    const result = await apiService.delete('/categories/2');
    expect(axiosInstance.delete).toHaveBeenCalledWith('/categories/2');
    expect(result).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('apiService – response interceptor error states', () => {
  beforeEach(() => jest.clearAllMocks());

  test('401 response shows "Unauthorized" toast and rejects', async () => {
    const err = { response: { status: 401, data: {} } };
    await expect(responseErrorFn(err)).rejects.toBe(err);
    expect(toast.error).toHaveBeenCalledWith('Unauthorized. Please login again.');
  });

  test('403 response shows "Access forbidden" toast and rejects', async () => {
    const err = { response: { status: 403, data: {} } };
    await expect(responseErrorFn(err)).rejects.toBe(err);
    expect(toast.error).toHaveBeenCalledWith(
      'Access forbidden. You do not have permission.'
    );
  });

  test('404 response shows "Resource not found" toast and rejects', async () => {
    const err = { response: { status: 404, data: {} } };
    await expect(responseErrorFn(err)).rejects.toBe(err);
    expect(toast.error).toHaveBeenCalledWith('Resource not found.');
  });

  test('500 response shows "Server error" toast and rejects', async () => {
    const err = { response: { status: 500, data: {} } };
    await expect(responseErrorFn(err)).rejects.toBe(err);
    expect(toast.error).toHaveBeenCalledWith(
      'Server error. Please try again later.'
    );
  });

  test('network error (no response) shows network toast and rejects', async () => {
    const err = { request: {} }; // request made, no response received
    await expect(responseErrorFn(err)).rejects.toBe(err);
    expect(toast.error).toHaveBeenCalledWith(
      'Network error. Please check your connection.'
    );
  });

  test('unexpected error shows generic toast and rejects', async () => {
    const err = {}; // neither response nor request
    await expect(responseErrorFn(err)).rejects.toBe(err);
    expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred.');
  });

  test('server-provided message takes precedence over default', async () => {
    const err = { response: { status: 403, data: { message: 'Custom deny message' } } };
    await expect(responseErrorFn(err)).rejects.toBe(err);
    expect(toast.error).toHaveBeenCalledWith('Custom deny message');
  });
});
