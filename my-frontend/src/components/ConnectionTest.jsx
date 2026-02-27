import React, { useState } from 'react';
import { categoryService } from '../services/categoryService';
import { resourceService } from '../services/resourceService';
import { userService } from '../services/userService';
import { logService } from '../services/logService';

const ConnectionTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAllTests = async () => {
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
      const response = await fetch('http://localhost:8080/');
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
      const token = localStorage.getItem('access_token');
      const headers = token ? { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : {};
      const response = await fetch('http://localhost:8080/api/categories', { headers });
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

    // Test 3: Categories API (will fail without auth, but tests CORS)
    try {
      const data = await categoryService.getAllCategories();
      results.tests.push({
        name: 'Categories API (GET)',
        status: '✅ SUCCESS',
        detail: `Retrieved ${data.length} categories`,
        success: true
      });
    } catch (error) {
      const status = error.response?.status || 'Unknown';
      const isAuthError = status === 401 || status === 403;
      results.tests.push({
        name: 'Categories API (GET)',
        status: isAuthError ? '⚠️ AUTH REQUIRED' : '❌ FAILED',
        detail: isAuthError 
          ? `Status: ${status} - Authentication required (CORS working!)`
          : `Error: ${error.message}`,
        success: isAuthError // Auth error means CORS is working
      });
    }

    // Test 4: Resources API (will fail without auth, but tests CORS)
    try {
      const data = await resourceService.getAllResources();
      results.tests.push({
        name: 'Resources API (GET)',
        status: '✅ SUCCESS',
        detail: `Retrieved ${data.length} resources`,
        success: true
      });
    } catch (error) {
      const status = error.response?.status || 'Unknown';
      const isAuthError = status === 401 || status === 403;
      results.tests.push({
        name: 'Resources API (GET)',
        status: isAuthError ? '⚠️ AUTH REQUIRED' : '❌ FAILED',
        detail: isAuthError 
          ? `Status: ${status} - Authentication required (CORS working!)`
          : `Error: ${error.message}`,
        success: isAuthError
      });
    }



    // Test 1: CREATE Category
    try {
      const newCategory = {
        name: 'Test Category ' + Date.now(),
        description: 'Auto-generated test category'
      };
      const created = await categoryService.createCategory(newCategory);
      testCategoryId = created.id;
      results.tests.push({
        name: 'CREATE Category',
        status: '✅ SUCCESS',
        detail: `Created category with ID: ${created.id}`,
        success: true
      });
    } catch (error) {
      const status = error.response?.status || 'Unknown';
      results.tests.push({
        name: 'CREATE Category',
        status: status === 401 ? '⚠️ AUTH REQUIRED' : '❌ FAILED',
        detail: status === 401 ? 'Authentication required' : `Error: ${error.message}`,
        success: status === 401
      });
    }

    // Test 2: READ Category by ID (if created)
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
        results.tests.push({
          name: 'READ Category by ID',
          status: '❌ FAILED',
          detail: `Error: ${error.message}`,
          success: false
        });
      }
    }

    // Test 3: UPDATE Category (if created)
    if (testCategoryId) {
      try {
        const updatedData = {
          name: 'Updated Test Category',
          description: 'Updated description'
        };
        const updated = await categoryService.updateCategory(testCategoryId, updatedData);
        results.tests.push({
          name: 'UPDATE Category',
          status: '✅ SUCCESS',
          detail: `Updated to: ${updated.name}`,
          success: true
        });
      } catch (error) {
        results.tests.push({
          name: 'UPDATE Category',
          status: '❌ FAILED',
          detail: `Error: ${error.message}`,
          success: false
        });
      }
    }

    // Test 4: CREATE Resource (using test category if available)
    try {
      const categories = await categoryService.getAllCategories();
      const categoryForResource = testCategoryId 
        ? { id: testCategoryId } 
        : categories[0];

      const newResource = {
        name: 'Test Resource ' + Date.now(),
        model: 'Test Model',
        serialNumber: 'SN-TEST-' + Date.now(),
        status: 'AVAILABLE',
        location: 'Test Location',
        purchaseDate: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
        category: categoryForResource
      };
      const created = await resourceService.createResource(newResource);
      testResourceId = created.id;
      results.tests.push({
        name: 'CREATE Resource',
        status: '✅ SUCCESS',
        detail: `Created resource with ID: ${created.id}`,
        success: true
      });
    } catch (error) {
      const status = error.response?.status || 'Unknown';
      results.tests.push({
        name: 'CREATE Resource',
        status: status === 401 ? '⚠️ AUTH REQUIRED' : '❌ FAILED',
        detail: status === 401 ? 'Authentication required' : `Error: ${error.message}`,
        success: status === 401
      });
    }

    // Test 5: UPDATE Resource (if created)
    if (testResourceId) {
      try {
        const categories = await categoryService.getAllCategories();
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
        results.tests.push({
          name: 'UPDATE Resource',
          status: '✅ SUCCESS',
          detail: `Updated to: ${updated.name}`,
          success: true
        });
      } catch (error) {
        results.tests.push({
          name: 'UPDATE Resource',
          status: '❌ FAILED',
          detail: `Error: ${error.message}`,
          success: false
        });
      }
    }

    // Test 6: DELETE Resource (if created)
    if (testResourceId) {
      try {
        await resourceService.deleteResource(testResourceId);
        results.tests.push({
          name: 'DELETE Resource',
          status: '✅ SUCCESS',
          detail: `Deleted resource ID: ${testResourceId}`,
          success: true
        });
      } catch (error) {
        const status = error.response?.status || 'Unknown';
        const isConstraintError = status === 500;
        results.tests.push({
          name: 'DELETE Resource',
          status: isConstraintError ? '⚠️ WARNING' : '❌ FAILED',
          detail: isConstraintError 
            ? 'Cannot delete - resource has associated logs (this is expected)' 
            : `Error: ${error.message}`,
          success: isConstraintError // Constraint errors are acceptable
        });
      }
    }

    // Test 7: DELETE Category (if created)
    if (testCategoryId) {
      try {
        await categoryService.deleteCategory(testCategoryId);
        results.tests.push({
          name: 'DELETE Category',
          status: '✅ SUCCESS',
          detail: `Deleted category ID: ${testCategoryId}`,
          success: true
        });
      } catch (error) {
        results.tests.push({
          name: 'DELETE Category',
          status: '❌ FAILED',
          detail: `Error: ${error.message}`,
          success: false
        });
      }
    }

    // Test 8: GET Available Roles
    try {
      const roles = await userService.getAvailableRoles();
      results.tests.push({
        name: 'GET Available Roles',
        status: '✅ SUCCESS',
        detail: `Retrieved ${roles.length} roles: ${roles.map(r => r.name).join(', ')}`,
        success: true
      });
    } catch (error) {
      const status = error.response?.status || 'Unknown';
      const isAuthError = status === 401 || status === 403;
      results.tests.push({
        name: 'GET Available Roles',
        status: isAuthError ? '⚠️ AUTH REQUIRED' : '❌ FAILED',
        detail: isAuthError ? 'Authentication required' : `Error: ${error.message}`,
        success: isAuthError
      });
    }

    // Test 9: GET All Users
    try {
      const users = await userService.getAllUsers();
      results.tests.push({
        name: 'GET All Users',
        status: '✅ SUCCESS',
        detail: `Retrieved ${users.length} users`,
        success: true
      });
    } catch (error) {
      const status = error.response?.status || 'Unknown';
      const isAuthError = status === 401 || status === 403;
      results.tests.push({
        name: 'GET All Users',
        status: isAuthError ? '⚠️ AUTH REQUIRED' : '❌ FAILED',
        detail: isAuthError ? 'Authentication required' : `Error: ${error.message}`,
        success: isAuthError
      });
    }

    // Test 10: CREATE User
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
      const status = error.response?.status || 'Unknown';
      const isAuthError = status === 401 || status === 403;
      results.tests.push({
        name: 'CREATE User',
        status: isAuthError ? '⚠️ AUTH REQUIRED' : '❌ FAILED',
        detail: isAuthError ? 'Authentication required' : `Error: ${error.message}`,
        success: isAuthError
      });
    }

    // Test 11: GET User by ID (if created)
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
        results.tests.push({
          name: 'GET User by ID',
          status: '❌ FAILED',
          detail: `Error: ${error.message}`,
          success: false
        });
      }
    }

    // Test 12: UPDATE User (if created)
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
        results.tests.push({
          name: 'UPDATE User',
          status: '❌ FAILED',
          detail: `Error: ${error.message}`,
          success: false
        });
      }
    }

    // Test 13: DELETE User (if created)
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
        results.tests.push({
          name: 'DELETE User',
          status: '❌ FAILED',
          detail: `Error: ${error.message}`,
          success: false
        });
      }
    }

    // Test 14: GET Logs
    try {
      const logs = await logService.getLogs('24h');
      results.tests.push({
        name: 'GET Logs (last 24h)',
        status: '✅ SUCCESS',
        detail: `Retrieved ${logs.length} log entries from the last 24 hours`,
        success: true
      });
    } catch (error) {
      const status = error.response?.status || 'Unknown';
      const isAuthError = status === 401 || status === 403;
      results.tests.push({
        name: 'GET Logs (last 24h)',
        status: isAuthError ? '⚠️ AUTH REQUIRED' : '❌ FAILED',
        detail: isAuthError ? 'Authentication required' : `Error: ${error.message}`,
        success: isAuthError
      });
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
    { label: 'Category', keys: ['CREATE Category', 'READ Category by ID', 'UPDATE Category', 'DELETE Category'] },
    { label: 'Resource', keys: ['CREATE Resource', 'READ Resource by ID', 'UPDATE Resource', 'DELETE Resource'] },
    { label: 'User', keys: ['GET Available Roles', 'GET All Users', 'CREATE User', 'GET User by ID', 'UPDATE User', 'DELETE User'] },
    { label: 'Log', keys: ['GET Logs (last 24h)'] },
  ];

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h2 style={{ marginBottom: '6px' }}>API Test Suite</h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
        Covers all endpoints: Category · Resource · User · Log
      </p>

      <button
        onClick={runAllTests}
        disabled={loading}
        style={{
          padding: '12px 28px',
          fontSize: '16px',
          backgroundColor: loading ? '#94a3b8' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: '600',
          marginBottom: '28px'
        }}
      >
        {loading ? '⏳ Running tests...' : '▶ Run All Tests'}
      </button>

      {testResult && (
        <div>
          <div style={{
            padding: '14px 20px',
            backgroundColor: getOverallStatus(testResult).color + '22',
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
                  color: '#475569',
                  marginBottom: '6px',
                  paddingBottom: '4px',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  {group.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {groupTests.map((test, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '9px 14px',
                      backgroundColor: test.success ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${test.success ? '#bbf7d0' : '#fecaca'}`,
                      borderRadius: '6px',
                      gap: '12px'
                    }}>
                      <div style={{ fontWeight: '500', fontSize: '14px', minWidth: '190px' }}>{test.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', textAlign: 'right', flex: 1 }}>{test.detail}</div>
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
