import React, { useEffect, useState, useCallback } from 'react';
import DataTable from './DataTable';
import Modal, { FormField, FormActions, inputStyle } from './Modal';
import { categoryService } from '../services/categoryService';
import { toast } from 'react-toastify';

const EMPTY_FORM = { name: '', description: '' };

const CategoriesPage = ({ isAdmin }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [query, setQuery] = useState({ page: 0, size: 10, sortBy: null, sortDir: 'asc', filters: {} });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create mode
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async (q = query) => {
    setLoading(true);
    try {
      const params = {
        page: q.page,
        size: q.size,
        sortBy: q.sortBy,
        sortDir: q.sortDir,
        id: q.filters?.id,
        name: q.filters?.name,
        description: q.filters?.description,
      };
      const pageData = await categoryService.getCategoriesPage(params);
      setCategories(pageData?.content || []);
      setTotalItems(pageData?.totalElements || 0);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { load(query); }, [query, load]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm({ name: row.name || '', description: row.description || '' }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await categoryService.updateCategory(editing.id, form);
      } else {
        await categoryService.createCategory(form);
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
      await categoryService.deleteCategory(deleteTarget.id);
      await load(query);
    } catch {
      // Toast is handled centrally in service/interceptor.
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description', sortable: false },
    {
      key: 'id',
      label: 'ID',
      sortable: false,
      render: (val) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>{val}</span>
      ),
    },
  ];

  const filters = [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
  ];

  const handleServerQueryChange = useCallback((next) => {
    setQuery((prev) => {
      const same = JSON.stringify(prev) === JSON.stringify(next);
      return same ? prev : next;
    });
  }, []);

  return (
    <div>
      <DataTable
        title="Categories"
        columns={columns}
        data={categories}
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
          addLabel: '+ New Category',
        }}
        emptyMessage="No categories found."
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Category' : 'New Category'}
      >
        <form onSubmit={handleSubmit}>
          <FormField label="Name" required>
            <input
              style={inputStyle}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Laptops"
              autoFocus
            />
          </FormField>
          <FormField label="Description">
            <textarea
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional description…"
            />
          </FormField>
          <FormActions onCancel={closeModal} submitLabel={editing ? 'Update' : 'Create'} loading={saving} />
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Delete"
        maxWidth="400px"
      >
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 20px' }}>
          Delete category <strong style={{ color: '#f1f5f9' }}>{deleteTarget?.name}</strong>? This cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            style={{ padding: '9px 18px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </button>
          <button
            style={{ padding: '9px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
            onClick={confirmDelete}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesPage;
