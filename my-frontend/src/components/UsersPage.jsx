import React, { useEffect, useState, useCallback } from 'react';
import DataTable from './DataTable';
import Modal, { FormField, FormActions, inputStyle } from './Modal';
import { userService } from '../services/userService';
import { toast } from 'react-toastify';

const EMPTY_FORM = {
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  roles: [],
};

const UsersPage = ({ isAdmin }) => {
  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [query, setQuery] = useState({ page: 0, size: 10, sortBy: null, sortDir: 'asc', filters: {} });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async (q = query) => {
    setLoading(true);
    try {
      const params = {
        page: q.page,
        size: q.size,
        sortBy: q.sortBy === 'fullName' ? 'name' : (q.sortBy === 'idDisplay' ? 'id' : q.sortBy),
        sortDir: q.sortDir,
        id: q.filters?.id,
        username: q.filters?.username,
        email: q.filters?.email,
        name: q.filters?.name,
      };

      const [data, roles] = await Promise.all([
        userService.getUsersPage(params),
        userService.getAvailableRoles().catch(() => []),
      ]);
      setUsers(data?.content || []);
      setTotalItems(data?.totalElements || 0);
      setAvailableRoles(roles || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { load(query); }, [query, load]);

  const flatUsers = users.map((u) => ({
    ...u,
    idDisplay: u.id || '—',
    rolesDisplay: Array.isArray(u.roles) ? u.roles.map((r) => (typeof r === 'string' ? r : r.name)).join(', ') : '—',
    fullName: [u.firstName, u.lastName].filter(Boolean).join(' ') || '—',
  }));

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    setForm({
      username: row.username || '',
      email: row.email || '',
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      password: '',
      roles: Array.isArray(row.roles) ? row.roles.map((r) => (typeof r === 'string' ? r : r.name)) : [],
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const toggleRole = (roleName) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(roleName)
        ? prev.roles.filter((r) => r !== roleName)
        : [...prev.roles, roleName],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) { toast.error('Email is required'); return; }
    setSaving(true);
    try {
      const payload = {
        username: form.username,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        roles: form.roles,
        ...(form.password ? { password: form.password } : {}),
      };
      if (editing) {
        await userService.updateUser(editing.id, payload);
      } else {
        if (!form.password.trim()) { toast.error('Password is required for new users'); setSaving(false); return; }
        await userService.createUser(payload);
      }
      await load(query);
      closeModal();
    } catch {
      // toast shown by service
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await userService.deleteUser(deleteTarget.id);
      await load(query);
    } catch {
      // toast shown by service
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns = [
    { key: 'idDisplay', label: 'ID', sortable: true },
    { key: 'username', label: 'Username', sortable: true },
    { key: 'fullName', label: 'Full Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'rolesDisplay',
      label: 'Roles',
      sortable: false,
      render: (val) => (
        val && val !== '—'
          ? val.split(', ').map((r) => (
              <span
                key={r}
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: r.toLowerCase().includes('admin') ? '#1e1b4b' : '#0c1a2e',
                  border: `1px solid ${r.toLowerCase().includes('admin') ? '#3730a3' : '#1d4ed8'}`,
                  color: r.toLowerCase().includes('admin') ? '#818cf8' : '#60a5fa',
                  fontSize: '11px',
                  fontWeight: '600',
                  marginRight: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {r}
              </span>
            ))
          : <span style={{ color: '#475569', fontStyle: 'italic', fontSize: '12px' }}>No roles</span>
      ),
    },
  ];

  const filters = [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'username', label: 'Username', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'name', label: 'Name', type: 'text' },
  ];

  const handleServerQueryChange = useCallback((next) => {
    setQuery((prev) => {
      const same = JSON.stringify(prev) === JSON.stringify(next);
      return same ? prev : next;
    });
  }, []);

  const f = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div>
      <DataTable
        title="Users"
        columns={columns}
        data={flatUsers}
        filters={filters}
        loading={loading}
        serverMode
        totalItems={totalItems}
        onQueryChange={handleServerQueryChange}
        isAdmin={isAdmin}
        actions={{
          onAdd: openAdd,
          onEdit: openEdit,
          onDelete: setDeleteTarget,
          addLabel: '+ New User',
        }}
        emptyMessage="No users found."
      />

      {/* Add / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit User' : 'New User'} maxWidth="540px">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <FormField label="Username">
              <input style={inputStyle} value={form.username} onChange={f('username')} placeholder="john.doe" autoFocus />
            </FormField>
            <FormField label="Email" required>
              <input type="email" style={inputStyle} value={form.email} onChange={f('email')} placeholder="john@example.com" />
            </FormField>
            <FormField label="First Name">
              <input style={inputStyle} value={form.firstName} onChange={f('firstName')} placeholder="John" />
            </FormField>
            <FormField label="Last Name">
              <input style={inputStyle} value={form.lastName} onChange={f('lastName')} placeholder="Doe" />
            </FormField>
          </div>
          <FormField label={editing ? 'New Password (leave blank to keep)' : 'Password'} required={!editing}>
            <input type="password" style={inputStyle} value={form.password} onChange={f('password')} placeholder={editing ? 'Leave blank to keep current' : 'Min 8 characters'} />
          </FormField>

          {availableRoles.length > 0 && (
            <FormField label="Roles">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                {availableRoles.map((role) => {
                  const name = typeof role === 'string' ? role : role.name;
                  const checked = form.roles.includes(name);
                  return (
                    <label
                      key={name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${checked ? '#3b82f6' : '#334155'}`,
                        backgroundColor: checked ? '#1d4ed820' : '#0f172a',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: checked ? '#60a5fa' : '#94a3b8',
                        userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRole(name)}
                        style={{ display: 'none' }}
                      />
                      {checked ? '☑' : '☐'} {name}
                    </label>
                  );
                })}
              </div>
            </FormField>
          )}

          <FormActions onCancel={closeModal} submitLabel={editing ? 'Update' : 'Create'} loading={saving} />
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" maxWidth="400px">
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 20px' }}>
          Delete user <strong style={{ color: '#f1f5f9' }}>{deleteTarget?.username || deleteTarget?.email}</strong>? This cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button style={{ padding: '9px 18px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button style={{ padding: '9px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: '600' }} onClick={confirmDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;
