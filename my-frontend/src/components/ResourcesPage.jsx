import React, { useEffect, useState, useCallback } from 'react';
import DataTable from './DataTable';
import Modal, { FormField, FormActions, inputStyle } from './Modal';
import { resourceService } from '../services/resourceService';
import { useData } from '../context/DataContext';
import { toast } from 'react-toastify';

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'IN_USE', label: 'In Use' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'RETIRED', label: 'Retired' },
];

const EMPTY_FORM = {
  name: '',
  model: '',
  serialNumber: '',
  status: 'AVAILABLE',
  location: '',
  purchaseDate: '',
  categoryId: '',
};

const statusBadge = (status) => {
  const map = {
    AVAILABLE: { bg: '#052e16', border: '#166534', text: '#4ade80' },
    IN_USE: { bg: '#1e1b4b', border: '#3730a3', text: '#818cf8' },
    MAINTENANCE: { bg: '#451a03', border: '#92400e', text: '#fbbf24' },
    RETIRED: { bg: '#1c1917', border: '#44403c', text: '#a8a29e' },
  };
  const c = map[status] || map.RETIRED;
  return (
    <span
      style={{
        padding: '2px 9px',
        borderRadius: '12px',
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        fontSize: '12px',
        fontWeight: '600',
        whiteSpace: 'nowrap',
      }}
    >
      {status?.replace('_', ' ') || '—'}
    </span>
  );
};

const ResourcesPage = ({ isAdmin }) => {
  const { fetchResources, fetchCategories, invalidate } = useData();
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const [res, cats] = await Promise.all([fetchResources(force), fetchCategories(force)]);
      setResources(res || []);
      setCategories(cats || []);
    } catch {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  }, [fetchResources, fetchCategories]);

  useEffect(() => { load(); }, [load]);

  // Flatten category name for display / filtering
  const flatResources = resources.map((r) => ({
    ...r,
    categoryName: r.category?.name || '—',
    categoryId: r.category?.id || '',
  }));

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id || '' });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || '',
      model: row.model || '',
      serialNumber: row.serialNumber || '',
      status: row.status || 'AVAILABLE',
      location: row.location || '',
      purchaseDate: row.purchaseDate ? row.purchaseDate.split('T')[0] : '',
      categoryId: row.category?.id || row.categoryId || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const buildPayload = () => ({
    name: form.name,
    model: form.model,
    serialNumber: form.serialNumber,
    status: form.status,
    location: form.location,
    purchaseDate: form.purchaseDate,
    category: form.categoryId ? { id: form.categoryId } : null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.serialNumber.trim()) { toast.error('Serial number is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await resourceService.updateResource(editing.id, buildPayload());
      } else {
        await resourceService.createResource(buildPayload());
      }
      invalidate('resources');
      await load(true);
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
      await resourceService.deleteResource(deleteTarget.id);
      toast.success('Resource deleted');
      invalidate('resources');
      await load(true);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete resource';
      if (err?.response?.status === 500) {
        toast.error('Cannot delete: resource has associated logs');
      } else {
        toast.error(msg);
      }
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'model', label: 'Model', sortable: true },
    { key: 'serialNumber', label: 'Serial #', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => statusBadge(val),
    },
    { key: 'categoryName', label: 'Category', sortable: true },
    { key: 'location', label: 'Location', sortable: true },
    {
      key: 'purchaseDate',
      label: 'Purchase Date',
      sortable: true,
      render: (val) => val ? new Date(val).toLocaleDateString() : '—',
    },
  ];

  const filters = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'serialNumber', label: 'Serial #', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    {
      key: 'categoryName',
      label: 'Category',
      type: 'select',
      options: categories.map((c) => ({ value: c.name, label: c.name })),
    },
    { key: 'location', label: 'Location', type: 'text' },
  ];

  const f = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div>
      <DataTable
        title="Resources"
        columns={columns}
        data={flatResources}
        filters={filters}
        loading={loading}
        isAdmin={isAdmin}
        actions={{
          onAdd: openAdd,
          onEdit: openEdit,
          onDelete: setDeleteTarget,
          addLabel: '+ New Resource',
        }}
        emptyMessage="No resources found."
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Resource' : 'New Resource'}
        maxWidth="560px"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <FormField label="Name" required>
              <input style={inputStyle} value={form.name} onChange={f('name')} placeholder="e.g. Dell XPS 15" autoFocus />
            </FormField>
            <FormField label="Model">
              <input style={inputStyle} value={form.model} onChange={f('model')} placeholder="e.g. XPS 15 9530" />
            </FormField>
            <FormField label="Serial Number" required>
              <input style={inputStyle} value={form.serialNumber} onChange={f('serialNumber')} placeholder="e.g. SN-00123" />
            </FormField>
            <FormField label="Status">
              <select style={inputStyle} value={form.status} onChange={f('status')}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Location">
              <input style={inputStyle} value={form.location} onChange={f('location')} placeholder="e.g. Office 3B" />
            </FormField>
            <FormField label="Purchase Date">
              <input type="date" style={inputStyle} value={form.purchaseDate} onChange={f('purchaseDate')} />
            </FormField>
          </div>
          <FormField label="Category">
            <select style={inputStyle} value={form.categoryId} onChange={f('categoryId')}>
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>
          <FormActions onCancel={closeModal} submitLabel={editing ? 'Update' : 'Create'} loading={saving} />
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" maxWidth="400px">
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 20px' }}>
          Delete resource <strong style={{ color: '#f1f5f9' }}>{deleteTarget?.name}</strong>? This cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button style={{ padding: '9px 18px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button style={{ padding: '9px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: '600' }} onClick={confirmDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
};

export default ResourcesPage;
