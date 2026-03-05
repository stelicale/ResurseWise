/**
 * DataContext — Application Data Store
 *
 * State management for cached API responses using Context API.
 * Stores fetched data in memory, avoids redundant network requests,
 * and exposes fetch/invalidate actions to all components.
 *
 * Cached entities: categories, resources, users, logs
 */
import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { categoryService } from '../services/categoryService';
import { resourceService } from '../services/resourceService';
import { userService } from '../services/userService';
import { logService } from '../services/logService';

// ─── Action Types ─────────────────────────────────────────────────────────────

const ACTIONS = {
  FETCH_START: 'FETCH_START',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_ERROR: 'FETCH_ERROR',
  INVALIDATE: 'INVALIDATE',
  RESET: 'RESET',
};

// ─── Initial State ────────────────────────────────────────────────────────────

const createSlice = () => ({
  data: null,       // cached response (array or object)
  loading: false,   // request in flight
  error: null,      // last error message, null if none
  fetchedAt: null,  // timestamp of last successful fetch (ms)
});

const initialState = {
  categories: createSlice(),
  resources: createSlice(),
  users: createSlice(),
  logs: createSlice(),
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

const dataReducer = (state, action) => {
  const { entity } = action;

  switch (action.type) {
    case ACTIONS.FETCH_START:
      return {
        ...state,
        [entity]: { ...state[entity], loading: true, error: null },
      };

    case ACTIONS.FETCH_SUCCESS:
      return {
        ...state,
        [entity]: {
          data: action.payload,
          loading: false,
          error: null,
          fetchedAt: Date.now(),
        },
      };

    case ACTIONS.FETCH_ERROR:
      return {
        ...state,
        [entity]: { ...state[entity], loading: false, error: action.error },
      };

    case ACTIONS.INVALIDATE:
      return {
        ...state,
        [entity]: createSlice(),
      };

    case ACTIONS.RESET:
      return initialState;

    default:
      return state;
  }
};

// ─── Context ──────────────────────────────────────────────────────────────────

const DataContext = createContext(null);

// Cache TTL — re-fetch after 2 minutes
const CACHE_TTL_MS = 2 * 60 * 1000;

export const DataProvider = ({ children, isAuthenticated }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Reset all cached data when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: ACTIONS.RESET });
    }
  }, [isAuthenticated]);

  // Keep a ref to the latest state so fetchEntity doesn't need state as a dependency
  // (avoids the re-render loop: dispatch → state change → new fetchEntity → new load → dispatch…)
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Track in-flight requests to prevent duplicate concurrent fetches
  const inFlightRef = useRef({});

  /**
   * Generic fetch with caching.
   * Skips network request if cached data is fresh (within TTL).
   * @param {string} entity - key in state: 'categories' | 'resources' | 'users' | 'logs'
   * @param {Function} fetcher - async function that returns data
   * @param {boolean} force - bypass cache and always refetch
   */
  const fetchEntity = useCallback(async (entity, fetcher, force = false) => {
    const slice = stateRef.current[entity];

    // Return cached data if still fresh and not forced
    if (!force && slice.data !== null && slice.fetchedAt !== null) {
      const age = Date.now() - slice.fetchedAt;
      if (age < CACHE_TTL_MS) {
        return slice.data;
      }
    }

    // If a request is already in flight for this entity, wait for it instead of firing again
    if (inFlightRef.current[entity]) {
      return inFlightRef.current[entity];
    }

    dispatch({ type: ACTIONS.FETCH_START, entity });
    const promise = fetcher()
      .then((data) => {
        dispatch({ type: ACTIONS.FETCH_SUCCESS, entity, payload: data });
        return data;
      })
      .catch((error) => {
        const message = error.response?.data?.message || error.message || 'Fetch failed';
        dispatch({ type: ACTIONS.FETCH_ERROR, entity, error: message });
        throw error;
      })
      .finally(() => {
        delete inFlightRef.current[entity];
      });

    inFlightRef.current[entity] = promise;
    return promise;
  }, []); // stable — reads state via ref, no state dependency

  /**
   * Invalidate cache for a specific entity (e.g., after a mutation).
   */
  const invalidate = useCallback((entity) => {
    dispatch({ type: ACTIONS.INVALIDATE, entity });
  }, []);

  // ─── Public fetch actions ──────────────────────────────────────────────────

  const fetchCategories = useCallback(
    (force = false) => fetchEntity('categories', categoryService.getAllCategories, force),
    [fetchEntity]
  );

  const fetchResources = useCallback(
    (force = false) => fetchEntity('resources', resourceService.getAllResources, force),
    [fetchEntity]
  );

  const fetchUsers = useCallback(
    (force = false) => fetchEntity('users', userService.getAllUsers, force),
    [fetchEntity]
  );

  const fetchLogs = useCallback(
    (force = false) => fetchEntity('logs', () => logService.getLogs('24h'), force),
    [fetchEntity]
  );

  const value = {
    // Raw state slices
    categories: state.categories,
    resources: state.resources,
    users: state.users,
    logs: state.logs,

    // Fetch actions (cached)
    fetchCategories,
    fetchResources,
    fetchUsers,
    fetchLogs,

    // Cache invalidation (call after mutations)
    invalidate,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used inside DataProvider');
  }
  return context;
};
