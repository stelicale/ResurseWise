import React, { useState } from 'react';
import { categoryService } from '../services/categoryService';
import { resourceService } from '../services/resourceService';
import { userService } from '../services/userService';
import { logService } from '../services/logService';
import { getUserRoles, refreshToken } from '../auth/keycloak';
import { useData } from '../context/DataContext';

const statusForError = (status, detail) => {
  if (status === 403) return { label: '⛔ FORBIDDEN', detail: detail || 'Insufficient role – this operation requires Admin role', success: false };
  if (status === 401) return { label: '⚠️ UNAUTHORIZED', detail: detail || 'Invalid or expired token', success: false };
  return { label: '❌ FAILED', detail, success: false };
};

const backendMessage = (error) => {
  const status = error?.response?.status;
  const url = error?.config?.url;
  const server = error?.response?.headers?.server;

  const detailsSuffix = [
    status ? `status=${status}` : null,
    url ? `url=${url}` : null,
    server ? `server=${server}` : null,
  ].filter(Boolean).join(' | ');

  if (error?.response?.data?.message) {
    return detailsSuffix
      ? `${error.response.data.message} | ${detailsSuffix}`
      : error.response.data.message;
  }
  if (error?.response?.data?.details) {
    return detailsSuffix
      ? `${error.response.data.details} | ${detailsSuffix}`
      : error.response.data.details;
  }
  if (error?.response?.data?.error) {
    return detailsSuffix
      ? `${error.response.data.error} | ${detailsSuffix}`
      : error.response.data.error;
  }
  const base = error?.message || 'Unknown error';
  return detailsSuffix ? `${base} | ${detailsSuffix}` : base;
};

const skippedResult = (name, detail) => ({
  name,
  status: '⏭ SKIPPED',
  detail,
  success: false,
});

const ConnectionTest = ({ isAuthenticated, isAdmin, username, roles }) => {
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

    await refreshToken(0);
    const tokenRoles = getUserRoles();
    const tokenRolesText = tokenRoles.length ? tokenRoles.join(', ') : 'none';
    let testCategoryId = null;
    let testResourceId = null;
    let testUserId = null;
    let usersForFallbackRead = [];

    let categoriesForFallbackRead = [];
    let resourcesForFallbackRead = [];

    // Test 1: GET Categories (force network call, no cache)
    try {
      const data = await fetchCategories(true);
      categoriesForFallbackRead = Array.isArray(data) ? data : [];
      results.tests.push({
        name: 'GET Categories',
        status: '✅ SUCCESS',
        detail: `Retrieved ${data.length} categories`,
        success: true
      });
    } catch (error) {
      const s = error.response?.status || 'Unknown';
      const r = statusForError(s, error.message);
      results.tests.push({ name: 'GET Categories', status: r.label, detail: r.detail, success: r.success });
    }

    // Test 2: GET Resources (force network call, no cache)
    try {
      const data = await fetchResources(true);
      resourcesForFallbackRead = Array.isArray(data) ? data : [];
      results.tests.push({
        name: 'GET Resources',
        status: '✅ SUCCESS',
        detail: `Retrieved ${data.length} resources`,
        success: true
      });
    } catch (error) {
      const s = error.response?.status || 'Unknown';
      const r = statusForError(s, error.message);
      results.tests.push({ name: 'GET Resources', status: r.label, detail: r.detail, success: r.success });
    }

    // Test 3: POST Category
    try {
      const newCategory = {
        name: 'Test Category ' + Date.now(),
        description: 'Auto-generated test category'
      };
      const created = await categoryService.createCategory(newCategory);
      testCategoryId = created.id;
      invalidate('categories');
      results.tests.push({
        name: 'POST Category',
        status: '✅ SUCCESS',
        detail: `Created category with ID: ${created.id}`,
        success: true
      });
    } catch (error) {
      const s = error.response?.status || 'Unknown';
      const detail = s === 403
        ? `${backendMessage(error)} | Roles(token): ${tokenRolesText}`
        : backendMessage(error);
      const r = statusForError(s, detail);
      results.tests.push({ name: 'POST Category', status: r.label, detail: r.detail, success: r.success });
    }

    // Test 4: GET Category by ID
    // If POST failed, fallback to an existing category so GET can still be validated.
    const categoryIdForRead = testCategoryId || categoriesForFallbackRead?.[0]?.id;
    if (categoryIdForRead) {
      try {
        const category = await categoryService.getCategoryById(categoryIdForRead);
        const readSource = testCategoryId ? 'created in this run' : 'existing category';
        results.tests.push({
          name: 'GET Category by ID',
          status: '✅ SUCCESS',
          detail: `Retrieved: ${category.name} (${readSource})`,
          success: true
        });
      } catch (error) {
        const s = error.response?.status || 'Unknown';
        const r = statusForError(s, backendMessage(error));
        results.tests.push({ name: 'GET Category by ID', status: r.label, detail: r.detail, success: r.success });
      }
    } else {
      results.tests.push(skippedResult('GET Category by ID', 'Skipped because no category is available to read (POST failed and list is empty).'));
    }

    // Test 5: PUT Category (if created)
    if (testCategoryId) {
      try {
        const updatedData = { name: 'Updated Test Category', description: 'Updated description' };
        const updated = await categoryService.updateCategory(testCategoryId, updatedData);
        invalidate('categories');
        results.tests.push({
          name: 'PUT Category',
          status: '✅ SUCCESS',
          detail: `Updated to: ${updated.name}`,
          success: true
        });
      } catch (error) {
        const s = error.response?.status || 'Unknown';
        const r = statusForError(s, backendMessage(error));
        results.tests.push({ name: 'PUT Category', status: r.label, detail: r.detail, success: r.success });
      }
    } else {
      results.tests.push(skippedResult('PUT Category', 'Skipped because POST Category did not succeed in this run.'));
    }

    // Test 6: POST Resource (strict dependency: only use category created in this run)
    if (testCategoryId) {
      try {
        const newResource = {
          name: 'Test Resource ' + Date.now(),
          model: 'Test Model',
          serialNumber: 'SN-TEST-' + Date.now(),
          status: 'AVAILABLE',
          location: 'Test Location',
          purchaseDate: new Date().toISOString().split('T')[0],
          category: { id: testCategoryId }
        };
        const created = await resourceService.createResource(newResource);
        testResourceId = created.id;
        invalidate('resources');
        results.tests.push({
          name: 'POST Resource',
          status: '✅ SUCCESS',
          detail: `Created resource with ID: ${created.id}`,
          success: true
        });
      } catch (error) {
        const s = error.response?.status || 'Unknown';
        const detail = s === 403
          ? `${backendMessage(error)} | Roles(token): ${tokenRolesText}`
          : backendMessage(error);
        const r = statusForError(s, detail);
        results.tests.push({ name: 'POST Resource', status: r.label, detail: r.detail, success: r.success });
      }
    } else {
      results.tests.push(skippedResult('POST Resource', 'Skipped because POST Category did not succeed in this run.'));
    }

    // Test 7: GET Resource by ID
    // If POST failed, fallback to an existing resource so GET can still be validated.
    const resourceIdForRead = testResourceId || resourcesForFallbackRead?.[0]?.id;
    if (resourceIdForRead) {
      try {
        const resource = await resourceService.getResourceById(resourceIdForRead);
        const readSource = testResourceId ? 'created in this run' : 'existing resource';
        results.tests.push({
          name: 'GET Resource by ID',
          status: '✅ SUCCESS',
          detail: `Retrieved: ${resource.name} (${readSource})`,
          success: true
        });
      } catch (error) {
        const s = error.response?.status || 'Unknown';
        const r = statusForError(s, backendMessage(error));
        results.tests.push({ name: 'GET Resource by ID', status: r.label, detail: r.detail, success: r.success });
      }
    } else {
      results.tests.push(skippedResult('GET Resource by ID', 'Skipped because no resource is available to read (POST failed and list is empty).'));
    }

    // Test 8: PUT Resource (if created)
    if (testResourceId) {
      try {
        const updatedData = {
          name: 'Updated Test Resource',
          model: 'Updated Model',
          serialNumber: 'SN-UPDATED-' + Date.now(),
          status: 'IN_USE',
          location: 'Updated Location',
          purchaseDate: new Date().toISOString().split('T')[0],
          category: { id: testCategoryId }
        };
        const updated = await resourceService.updateResource(testResourceId, updatedData);
        invalidate('resources');
        results.tests.push({
          name: 'PUT Resource',
          status: '✅ SUCCESS',
          detail: `Updated to: ${updated.name}`,
          success: true
        });
      } catch (error) {
        const s = error.response?.status || 'Unknown';
        const r = statusForError(s, backendMessage(error));
        results.tests.push({ name: 'PUT Resource', status: r.label, detail: r.detail, success: r.success });
      }
    } else {
      results.tests.push(skippedResult('PUT Resource', 'Skipped because POST Resource did not succeed in this run.'));
    }

    // Test 11: DELETE Resource (if created)
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
        const r = statusForError(s, backendMessage(error));
        results.tests.push({ name: 'DELETE Resource', status: r.label, detail: r.detail, success: r.success });
      }
    } else {
      results.tests.push(skippedResult('DELETE Resource', 'Skipped because POST Resource did not succeed in this run.'));
    }

    // Test 12: DELETE Category (if created)
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
        const r = statusForError(s, backendMessage(error));
        results.tests.push({ name: 'DELETE Category', status: r.label, detail: r.detail, success: r.success });
      }
    } else {
      results.tests.push(skippedResult('DELETE Category', 'Skipped because POST Category did not succeed in this run.'));
    }

    // Test 13: GET Available Roles
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
      const r = statusForError(s, backendMessage(error));
      results.tests.push({ name: 'GET Available Roles', status: r.label, detail: r.detail, success: r.success });
    }

    // Test 14: GET All Users
    try {
      const users = await userService.getAllUsers();
      usersForFallbackRead = Array.isArray(users) ? users : [];
      results.tests.push({
        name: 'GET All Users',
        status: '✅ SUCCESS',
        detail: `Retrieved ${users.length} users`,
        success: true
      });
    } catch (error) {
      const s = error.response?.status || 'Unknown';
      const r = statusForError(s, backendMessage(error));
      results.tests.push({ name: 'GET All Users', status: r.label, detail: r.detail, success: r.success });
    }

    // Test 12: POST User
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
        name: 'POST User',
        status: '✅ SUCCESS',
        detail: `Created user: ${created.username || created.email} (ID: ${created.id})`,
        success: true
      });
    } catch (error) {
      const s = error.response?.status || 'Unknown';
      const detail = s === 403
        ? `${backendMessage(error)} | Roles(token): ${tokenRolesText}`
        : backendMessage(error);
      const r = statusForError(s, detail);
      results.tests.push({ name: 'POST User', status: r.label, detail: r.detail, success: r.success });
    }

    // Test 13: GET User by ID
    // If POST failed, fallback to an existing user so GET can still be validated.
    const userIdForRead = testUserId || usersForFallbackRead?.[0]?.id;
    if (userIdForRead) {
      try {
        const user = await userService.getUserById(userIdForRead);
        const readSource = testUserId ? 'created in this run' : 'existing user';
        results.tests.push({
          name: 'GET User by ID',
          status: '✅ SUCCESS',
          detail: `Retrieved: ${user.username || user.email} (${readSource})`,
          success: true
        });
      } catch (error) {
        const s = error.response?.status || 'Unknown';
        const r = statusForError(s, backendMessage(error));
        results.tests.push({ name: 'GET User by ID', status: r.label, detail: r.detail, success: r.success });
      }
    } else {
      results.tests.push(skippedResult('GET User by ID', 'Skipped because no user is available to read (POST failed and list is empty).'));
    }

    // Test 14: PUT User (if created)
    if (testUserId) {
      try {
        const updatedData = {
          firstName: 'Updated',
          lastName: 'TestUser',
          email: `updated_${Date.now()}@test.com`
        };
        const updated = await userService.updateUser(testUserId, updatedData);
        results.tests.push({
          name: 'PUT User',
          status: '✅ SUCCESS',
          detail: `Updated user: ${updated.firstName} ${updated.lastName}`,
          success: true
        });
      } catch (error) {
        const s = error.response?.status || 'Unknown';
        const r = statusForError(s, backendMessage(error));
        results.tests.push({ name: 'PUT User', status: r.label, detail: r.detail, success: r.success });
      }
    } else {
      results.tests.push(skippedResult('PUT User', 'Skipped because POST User did not succeed in this run.'));
    }

    // Test 18: DELETE User (if created)
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
        const r = statusForError(s, backendMessage(error));
        results.tests.push({ name: 'DELETE User', status: r.label, detail: r.detail, success: r.success });
      }
    } else {
      results.tests.push(skippedResult('DELETE User', 'Skipped because POST User did not succeed in this run.'));
    }

    // Test 19: GET Logs
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
      const r = statusForError(s, backendMessage(error));
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
    { label: 'GET', keys: ['GET Categories', 'GET Resources', 'GET Category by ID', 'GET Resource by ID', 'GET All Users', 'GET User by ID', 'GET Available Roles', 'GET Logs (last 24h)'] },
    { label: 'POST', keys: ['POST Category', 'POST Resource', 'POST User'] },
    { label: 'PUT', keys: ['PUT Category', 'PUT Resource', 'PUT User'] },
    { label: 'DELETE', keys: ['DELETE Resource', 'DELETE Category', 'DELETE User'] },
  ];

  return (
    <div style={{ padding: '16px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#f1f5f9' }}>
      <h2 style={{ marginBottom: '6px', color: '#f1f5f9' }}>API Test Suite</h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
        Verifies permissions by HTTP method: GET, POST, PUT and DELETE.
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
            {loading ? '⏳ Running...' : '▶ Run Permission Matrix Tests'}
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
            const groupTests = group.keys
              .map((key) => testResult.tests.find((t) => t.name === key))
              .filter(Boolean);
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
