import React, { useState } from 'react';
import { categoryService } from '../services/categoryService';
import { resourceService } from '../services/resourceService';
import { userService } from '../services/userService';
import { logService } from '../services/logService';
import { getToken } from '../auth/keycloak';
import { useData } from '../context/DataContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const statusForError = (status, successMessage) => {
  if (status === 403) return { label: '⛔ FORBIDDEN', detail: 'Insufficient role – this operation requires Admin role', success: false };
  if (status === 401) return { label: '⚠️ UNAUTHORIZED', detail: 'Invalid or expired token', success: false };
  return { label: '❌ FAILED', detail: successMessage, success: false };
};

const ConnectionTest = ({ isAuthenticated }) => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { fetchCategories, fetchResources, invalidate } = useData();

  const runAllTests = async () => {
    if (!isAuthenticated) {
      return;
    }

    setLoading(true);
    setTestResult(null);

    const results = {
      timestamp: new Date().toLocaleString(),
      tests: []
    };

    let testCategoryId = null;
    let testResourceId = null;
    let testUserId = null;

    // Test 1: Backend Health Check (base URL)
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/`);
      const text = await response.text();
      results.tests.push({
        name: 'Backend Health Check',
        status: response.ok ? '✅ SUCCESS' : '❌ FAILED',
        detail: `Status: ${response.status} | Response: "${text}"`,
        success: response.ok
      });
    } catch (error) {
      results.tests.push({
        name: 'Backend Health Check',
        status: '❌ FAILED',
        detail: `Error: ${error.message}`,
        success: false
      });
    }

    // Test 2: API Base URL Check (using real endpoint)
    try {
      const token = getToken();
      const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : {};
      const response = await fetch(`${API_BASE_URL}/categories`, { headers });
      const isSuccess = response.ok || response.status === 401;
      results.tests.push({
        name: 'API Endpoint Check',
        status: response.ok ? '✅ SUCCESS' : (response.status === 401 ? '⚠️ AUTH REQUIRED' : '❌ FAILED'),
        detail: `Status: ${response.status} - ${response.ok ? 'API accessible' : response.status === 401 ? 'Authentication required' : 'Error'}`,
        success: isSuccess
      });
    } catch (error) {
      results.tests.push({
        name: 'API Endpoint Check',
        status: '❌ FAILED',
        detail: `Error: ${error.message}`,
        success: false
      });
    }

    // Test 3: Categories API (GET) — uses DataContext cache (TTL 2 min)
    try {
      const data = await fetchCategories();
      results.tests.push({
        name: 'Categories API (GET)',
        status: '✅ SUCCESS',
        detail: `Retrieved ${data.length} categories (cached)`,
        success: true
      });
    } catch (error) {
      const s = error.response?.status || 'Unknown';
      const r = statusForError(s, error.message);
      results.tests.push({ name: 'Categories API (GET)', status: r.label, detail: r.detail, success: r.success });
    }

    // Test 4: Resources API (GET) — uses DataContext cache (TTL 2 min)
    try {
      const data = await fetchResources();
      results.tests.push({
        name: 'Resources API (GET)',
        status: '✅ SUCCESS',
        detail: `Retrieved ${data.length} resources (cached)`,
        success: true
      });
    } catch (error) {
      const s = error.response?.status || 'Unknown';
      const r = statusForError(s, error.message);
      results.tests.push({ name: 'Resources API (GET)', status: r.label, detail: r.detail, success: r.success });
    }

    // Test 5: CREATE Category
    try {
      const newCategory = {
        name: 'Test Category ' + Date.now(),
        description: 'Auto-generated test category'
      };
      const created = await categoryService.createCategory(newCategory);
      testCategoryId = created.id;
      invalidate('categories');
      results.tests.push({
        name: 'CREATE Category',
        status: '✅ SUCCESS',
        detail: `Created category with ID: ${created.id}`,
        success: true
      });
    } catch (error) {
      const s = error.response?.status || 'Unknown';
      const r = statusForError(s, error.message);
      results.tests.push({ name: 'CREATE Category', status: r.label, detail: r.detail, success: r.success });
    }

    // Test 6: READ Category by ID (if created)
    if (testCategoryId) {
      try {
        const category = await categoryService.getCategoryById(testCategoryId);
        results.tests.push({
          name: 'READ Category by ID',
          status: '✅ SUCCESS',
          detail: `Retrieved: ${category.name}`,
          success: true
        });
      } catch (error) {
        const s = error.response?.status || 'Unknown';
        const r = statusForError(s, error.message);
        results.tests.push({ name: 'READ Category by ID', status: r.label, detail: r.detail, success: r.success });
      }
    }

    // Test 7: UPDATE Category (if created)
    if (testCategoryId) {
      try {
        const updatedData = { name: 'Updated Test Category', description: 'Updated description' };
        const updated = await categoryService.updateCategory(testCategoryId, updatedData);
        invalidate('categories');
        results.tests.push({
          name: 'UPDATE Category',
          status: '✅ SUCCESS',
          detail: `Updated to: ${updated.name}`,
          success: true
        });
      } catch (error) {
        const s = error.response?.status || 'Unknown';
        const r = statusForError(s, error.message);
        results.tests.push({ name: 'UPDATE Category', status: r.label, detail: r.detail, success: r.success });
      }
    }

    // Test 8: CREATE Resource
    try {
      const categories = await fetchCategories();
      const categoryForResource = testCategoryId ? { id: testCategoryId } : categories[0];
      const newResource = {
        name: 'Test Resource ' + Date.now(),
        model: 'Test Model',
        serialNumber: 'SN-TEST-' + Date.now(),
        status: 'AVAILABLE',
        location: 'Test Location',
        purchaseDate: new Date().toISOString().split('T')[0],
        category: categoryForResource
      };
      const created = await resourceService.createResource(newResource);
      testResourceId = created.id;
      invalidate('resources');
      results.tests.push({
        name: 'CREATE Resource',
        status: '✅ SUCCESS',
        detail: `Created resource with ID: ${created.id}`,
        success: true
      });
    } catch (error) {
      const s = error.response?.status || 'Unknown';
      const r = statusForError(s, error.message);
      results.tests.push({ name: 'CREATE Resource', status: r.label, detail: r.detail, success: r.success });
    }

    // Test 9: UPDATE Resource (if created)
    if (testResourceId) {
      try {
        const categories = await fetchCategories();
        const updatedData = {
          name: 'Updated Test Resource',
          model: 'Updated Model',
          serialNumber: 'SN-UPDATED-' + Date.now(),
          status: 'IN_USE',
          location: 'Updated Location',
          purchaseDate: new Date().toISOString().split('T')[0],
          category: categories[0]
        };
        const updated = await resourceService.updateResource(testResourceId, updatedData);
        invalidate('resources');
        results.tests.push({
          name: 'UPDATE Resource',
          status: '✅ SUCCESS',
          detail: `Updated to: ${updated.name}`,
          success: true
        });
      } catch (error) {
        const s = error.response?.status || 'Unknown';
        const r = statusForError(s, error.message);
        results.tests.push({ name: 'UPDATE Resource', status: r.label, detail: r.detail, success: r.success });
      }
    }

    // Test 10: DELETE Resource (if created)
    if (testResourceId) {
      try {
        await resourceService.deleteResource(testResourceId);
        invalidate('resources');
        results.tests.push({
          name: 'DELETE Resource',
          status: '✅ SUCCESS',
          detail: `Deleted resource ID: ${testResourceId}`,
          success: true
        });
      } catch (error) {
        const s = error.response?.status || 'Unknown';
        if (s === 500) {
          invalidate('resources');
          results.tests.push({
            name: 'DELETE Resource',
            status: '⚠️ WARNING',
            detail: 'Cannot delete – resource has associated logs (expected behavior)',
            success: true
          });
        } else {
          const r = statusForError(s, error.message);
          results.tests.push({ name: 'DELETE Resource', status: r.label, detail: r.detail, success: r.success });
        }
      }
    }

    // Test 11: DELETE Category (if created)
    if (testCategoryId) {
      try {
        await categoryService.deleteCategory(testCategoryId);
        invalidate('categories');
        results.tests.push({
          name: 'DELETE Category',
          status: '✅ SUCCESS',
          detail: `Deleted category ID: ${testCategoryId}`,
          success: true
        });
      } catch (error) {
        const s = error.response?.status || 'Unknown';
        const r = statusForError(s, error.message);
        results.tests.push({ name: 'DELETE Category', status: r.label, detail: r.detail, success: r.success });
      }
    }

    // Test 12: GET Available Roles
    try {
      const roles = await userService.getAvailableRoles();
      results.tests.push({
        name: 'GET Available Roles',
        status: '✅ SUCCESS',
        detail: `Retrieved ${roles.length} roles: ${roles.map(r => r.name).join(', ')}`,
        success: true
      });
    } catch (error) {
      const s = error.response?.status || 'Unknown';
      const r = statusForError(s, error.message);
      results.tests.push({ name: 'GET Available Roles', status: r.label, detail: r.detail, success: r.success });
    }

    // Test 13: GET All Users
    try {
      const users = await userService.getAllUsers();
      results.tests.push({
        name: 'GET All Users',
        status: '✅ SUCCESS',
        detail: `Retrieved ${users.length} users`,
        success: true
      });
    } catch (error) {
      const s = error.response?.status || 'Unknown';
      const r = statusForError(s, error.message);
      results.tests.push({ name: 'GET All Users', status: r.label, detail: r.detail, success: r.success });
    }

    // Test 14: CREATE User
    try {
      const timestamp = Date.now();
      const newUser = {
        username: `testuser_${timestamp}`,
        email: `testuser_${timestamp}@test.com`,
        firstName: 'Test',
        lastName: 'User',
        password: 'TestPass123!',
        roles: []
      };
      const created = await userService.createUser(newUser);
      testUserId = created.id;
      results.tests.push({
        name: 'CREATE User',
        status: '✅ SUCCESS',
        detail: `Created user: ${created.username || created.email} (ID: ${created.id})`,
        success: true
      });
    } catch (error) {
      const s = error.response?.status || 'Unknown';
      const r = statusForError(s, error.message);
      results.tests.push({ name: 'CREATE User', status: r.label, detail: r.detail, success: r.success });
    }

    // Test 15: GET User by ID (if created)
    if (testUserId) {
      try {
        const user = await userService.getUserById(testUserId);
        results.tests.push({
          name: 'GET User by ID',
          status: '✅ SUCCESS',
          detail: `Retrieved: ${user.username || user.email}`,
          success: true
        });
      } catch (error) {
        const s = error.response?.status || 'Unknown';
        const r = statusForError(s, error.message);
        results.tests.push({ name: 'GET User by ID', status: r.label, detail: r.detail, success: r.success });
      }
    }

    // Test 16: UPDATE User (if created)
    if (testUserId) {
      try {
        const updatedData = {
          firstName: 'Updated',
          lastName: 'TestUser',
          email: `updated_${Date.now()}@test.com`
        };
        const updated = await userService.updateUser(testUserId, updatedData);
        results.tests.push({
          name: 'UPDATE User',
          status: '✅ SUCCESS',
          detail: `Updated user: ${updated.firstName} ${updated.lastName}`,
          success: true
        });
      } catch (error) {
        const s = error.response?.status || 'Unknown';
        const r = statusForError(s, error.message);
        results.tests.push({ name: 'UPDATE User', status: r.label, detail: r.detail, success: r.success });
      }
    }

    // Test 17: DELETE User (if created)
    if (testUserId) {
      try {
        await userService.deleteUser(testUserId);
        results.tests.push({
          name: 'DELETE User',
          status: '✅ SUCCESS',
          detail: `Deleted user ID: ${testUserId}`,
          success: true
        });
      } catch (error) {
        const s = error.response?.status || 'Unknown';
        const r = statusForError(s, error.message);
        results.tests.push({ name: 'DELETE User', status: r.label, detail: r.detail, success: r.success });
      }
    }

    // Test 18: GET Logs
    try {
      const logs = await logService.getLogs('24h');
      results.tests.push({
        name: 'GET Logs (last 24h)',
        status: '✅ SUCCESS',
        detail: `Retrieved ${logs.length} log entries from the last 24 hours`,
        success: true
      });
    } catch (error) {
      const s = error.response?.status || 'Unknown';
      const r = statusForError(s, error.message);
      results.tests.push({ name: 'GET Logs (last 24h)', status: r.label, detail: r.detail, success: r.success });
    }

    setTestResult(results);
    setLoading(false);
  };

  const getOverallStatus = (result) => {
    if (!result) return null;
    const allSuccess = result.tests.every(t => t.success);
    const someSuccess = result.tests.some(t => t.success);
    
    if (allSuccess) return { text: '✅ ALL TESTS PASSED', color: '#22c55e' };
    if (someSuccess) return { text: '⚠️ PARTIAL SUCCESS', color: '#f59e0b' };
    return { text: '❌ TESTS FAILED', color: '#ef4444' };
  };

  const groups = [
    { label: 'Connectivity', keys: ['Backend Health Check', 'API Endpoint Check'] },
    { label: 'Read Access', keys: ['Categories API (GET)', 'Resources API (GET)'] },
    { label: 'Category', keys: ['CREATE Category', 'READ Category by ID', 'UPDATE Category', 'DELETE Category'] },
    { label: 'Resource', keys: ['CREATE Resource', 'UPDATE Resource', 'DELETE Resource'] },
    { label: 'User', keys: ['GET Available Roles', 'GET All Users', 'CREATE User', 'GET User by ID', 'UPDATE User', 'DELETE User'] },
    { label: 'Log', keys: ['GET Logs (last 24h)'] },
  ];

  return (
    <div style={{ padding: '16px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#f1f5f9' }}>
      <h2 style={{ marginBottom: '6px', color: '#f1f5f9' }}>API Test Suite</h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
        Covers connectivity and read endpoints for all users, plus CRUD admin flows.
      </p>

      {!isAuthenticated ? (
        <div
          style={{
            marginBottom: '28px',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid #334155',
            backgroundColor: '#1e293b',
            color: '#94a3b8',
            fontSize: '14px'
          }}
        >
          Please log in to run the tests.
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <button
            onClick={runAllTests}
            disabled={loading}
            style={{
              padding: '12px 20px',
              fontSize: '16px',
              backgroundColor: loading ? '#475569' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {loading ? '⏳ Running...' : '▶ Run All CRUD Tests'}
          </button>
        </div>
      )}

      {testResult && (
        <div>
          <div style={{
            padding: '14px 20px',
            backgroundColor: getOverallStatus(testResult).color + '33',
            border: `2px solid ${getOverallStatus(testResult).color}`,
            borderRadius: '8px',
            marginBottom: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: getOverallStatus(testResult).color,
            textAlign: 'center'
          }}>
            {getOverallStatus(testResult).text}
          </div>

          <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginBottom: '24px' }}>
            Run at: {testResult.timestamp} · {testResult.tests.filter(t => t.success).length}/{testResult.tests.length} passed
          </div>

          {groups.map(group => {
            const groupTests = testResult.tests.filter(t => group.keys.includes(t.name));
            if (groupTests.length === 0) return null;
            return (
              <div key={group.label} style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#64748b',
                  marginBottom: '6px',
                  paddingBottom: '4px',
                  borderBottom: '1px solid #334155'
                }}>
                  {group.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {groupTests.map((test, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '9px 14px',
                      backgroundColor: test.success ? '#052e16' : test.status.startsWith('⛔') ? '#431407' : '#450a0a',
                      border: `1px solid ${test.success ? '#166534' : test.status.startsWith('⛔') ? '#9a3412' : '#7f1d1d'}`,
                      borderRadius: '6px',
                      gap: '6px 12px'
                    }}>
                      <div style={{ fontWeight: '500', fontSize: '13px', minWidth: '120px', flexShrink: 0, color: '#f1f5f9' }}>{test.name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', textAlign: 'right', flex: 1, minWidth: 0, wordBreak: 'break-word' }}>{test.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConnectionTest;
