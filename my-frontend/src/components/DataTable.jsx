import React, { useState, useMemo } from 'react';

/**
 * DataTable — reusable table with sorting, filtering, and pagination.
 *
 * Props:
 *   columns       {Array}    [{ key, label, sortable?, render?, width? }]
 *   data          {Array}    rows
 *   filters       {Array}    [{ key, label, type: 'text'|'select', options?: [{value,label}] }]
 *   actions       {Object}   { onAdd?, onEdit?, onDelete?, addLabel? }
 *   loading       {boolean}
 *   defaultPageSize {number} default 10
 *   pageSizeOptions {Array}  default [5, 10, 25, 50]
 *   title         {string}
 *   isAdmin       {boolean}  hide write actions when false
 */
const DataTable = ({
  columns = [],
  data = [],
  filters = [],
  actions = {},
  loading = false,
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  title = '',
  isAdmin = false,
  emptyMessage = 'No records found.',
}) => {
  const [filterValues, setFilterValues] = useState({});
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Filtering
  const filtered = useMemo(() => {
    let rows = data;
    for (const f of filters) {
      const val = filterValues[f.key];
      if (!val || val === '') continue;
      rows = rows.filter((row) => {
        const cellVal = row[f.key];
        if (cellVal == null) return false;
        if (f.type === 'select') return String(cellVal) === String(val);
        return String(cellVal).toLowerCase().includes(val.toLowerCase());
      });
    }
    return rows;
  }, [data, filterValues, filters]);

  // Sorting
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const paginated = sorted.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleFilter = (key, value) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handlePageSize = (e) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  const pageNumbers = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(1, clampedPage - delta); i <= Math.min(totalPages, clampedPage + delta); i++) {
      range.push(i);
    }
    if (range[0] > 1) range.unshift('...');
    if (!range.includes(1) || range[0] === '...') range.unshift(1);
    if (range[range.length - 1] < totalPages) range.push('...');
    if (!range.includes(totalPages)) range.push(totalPages);
    return range;
  };

  // Styles
  const s = {
    wrapper: {
      backgroundColor: '#0f172a',
      color: '#f1f5f9',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
      flexWrap: 'wrap',
      gap: '10px',
    },
    title: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#f1f5f9',
      margin: 0,
    },
    addBtn: {
      padding: '8px 16px',
      backgroundColor: '#3b82f6',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      whiteSpace: 'nowrap',
    },
    filtersRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      marginBottom: '14px',
      alignItems: 'flex-end',
    },
    filterGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    filterLabel: {
      fontSize: '11px',
      fontWeight: '600',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    filterInput: {
      padding: '7px 10px',
      borderRadius: '6px',
      border: '1px solid #334155',
      backgroundColor: '#1e293b',
      color: '#f1f5f9',
      fontSize: '13px',
      minWidth: '120px',
      maxWidth: '100%',
    },
    tableWrapper: {
      overflowX: 'auto',
      borderRadius: '8px',
      border: '1px solid #1e293b',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px',
    },
    th: {
      padding: '11px 14px',
      backgroundColor: '#1e293b',
      color: '#94a3b8',
      fontWeight: '600',
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      textAlign: 'left',
      borderBottom: '1px solid #334155',
      whiteSpace: 'nowrap',
      userSelect: 'none',
    },
    thSortable: {
      cursor: 'pointer',
    },
    td: {
      padding: '11px 14px',
      borderBottom: '1px solid #1e293b',
      color: '#e2e8f0',
      verticalAlign: 'middle',
    },
    trHover: {
      backgroundColor: '#1e293b',
    },
    actionsBtnRow: {
      display: 'flex',
      gap: '6px',
    },
    editBtn: {
      padding: '4px 10px',
      backgroundColor: '#1d4ed8',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
    },
    deleteBtn: {
      padding: '4px 10px',
      backgroundColor: '#991b1b',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
    },
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '14px',
      flexWrap: 'wrap',
      gap: '10px',
    },
    footerInfo: {
      fontSize: '13px',
      color: '#64748b',
    },
    pagination: {
      display: 'flex',
      gap: '4px',
      alignItems: 'center',
      overflowX: 'auto',
      maxWidth: '100%',
    },
    pageBtn: (active, disabled) => ({
      padding: '6px 11px',
      borderRadius: '5px',
      border: '1px solid #334155',
      backgroundColor: active ? '#3b82f6' : '#1e293b',
      color: active ? '#fff' : disabled ? '#334155' : '#94a3b8',
      cursor: disabled ? 'default' : 'pointer',
      fontSize: '13px',
      fontWeight: active ? '600' : '400',
      pointerEvents: disabled ? 'none' : undefined,
    }),
    pageSizeSelect: {
      padding: '5px 8px',
      borderRadius: '6px',
      border: '1px solid #334155',
      backgroundColor: '#1e293b',
      color: '#94a3b8',
      fontSize: '13px',
    },
    loadingOverlay: {
      textAlign: 'center',
      padding: '40px',
      color: '#64748b',
      fontSize: '14px',
    },
    emptyRow: {
      textAlign: 'center',
      padding: '40px',
      color: '#64748b',
      fontSize: '14px',
    },
  };

  return (
    <div style={s.wrapper}>
      {/* Header */}
      <div style={s.header}>
        <h2 style={s.title}>{title}</h2>
        {isAdmin && actions.onAdd && (
          <button style={s.addBtn} onClick={actions.onAdd}>
            {actions.addLabel || '+ Add'}
          </button>
        )}
      </div>

      {/* Filters */}
      {filters.length > 0 && (
        <div style={s.filtersRow}>
          {filters.map((f) => (
            <div key={f.key} style={s.filterGroup}>
              <span style={s.filterLabel}>{f.label}</span>
              {f.type === 'select' ? (
                <select
                  style={s.filterInput}
                  value={filterValues[f.key] || ''}
                  onChange={(e) => handleFilter(f.key, e.target.value)}
                >
                  <option value="">All</option>
                  {(f.options || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  style={s.filterInput}
                  placeholder={`Filter by ${f.label.toLowerCase()}…`}
                  value={filterValues[f.key] || ''}
                  onChange={(e) => handleFilter(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
          {Object.values(filterValues).some(Boolean) && (
            <div style={s.filterGroup}>
              <span style={s.filterLabel}>&nbsp;</span>
              <button
                style={{ ...s.filterInput, cursor: 'pointer', color: '#94a3b8', background: '#1e293b', border: '1px solid #334155' }}
                onClick={() => { setFilterValues({}); setPage(1); }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div style={s.tableWrapper}>
        <table style={s.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    ...s.th,
                    ...(col.sortable ? s.thSortable : {}),
                    width: col.width || undefined,
                  }}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span style={{ marginLeft: '5px', fontSize: '10px' }}>
                      {sortDir === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                  {col.sortable && sortKey !== col.key && (
                    <span style={{ marginLeft: '5px', fontSize: '10px', opacity: 0.3 }}>⇅</span>
                  )}
                </th>
              ))}
              {(actions.onEdit || actions.onDelete) && isAdmin && (
                <th style={{ ...s.th, width: '100px' }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} style={s.loadingOverlay}>
                  Loading…
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} style={s.emptyRow}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <TableRow
                  key={row.id || idx}
                  row={row}
                  columns={columns}
                  actions={actions}
                  isAdmin={isAdmin}
                  s={s}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: count + pagination + page size */}
      <div style={s.footer}>
        <span style={s.footerInfo}>
          {sorted.length === 0
            ? 'No records'
            : `Showing ${(clampedPage - 1) * pageSize + 1}–${Math.min(clampedPage * pageSize, sorted.length)} of ${sorted.length}`}
          {data.length !== sorted.length && ` (filtered from ${data.length})`}
        </span>

        {totalPages > 1 && (
          <div style={s.pagination}>
            <button
              style={s.pageBtn(false, clampedPage === 1)}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹ Prev
            </button>
            {pageNumbers().map((n, i) =>
              n === '...' ? (
                <span key={`ellipsis-${i}`} style={{ color: '#475569', padding: '0 4px' }}>
                  …
                </span>
              ) : (
                <button
                  key={n}
                  style={s.pageBtn(clampedPage === n, false)}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              )
            )}
            <button
              style={s.pageBtn(false, clampedPage === totalPages)}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next ›
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={s.footerInfo}>Rows per page:</span>
          <select style={s.pageSizeSelect} value={pageSize} onChange={handlePageSize}>
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

// TableRow with hover effect
const TableRow = ({ row, columns, actions, isAdmin, s }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <tr
      style={hovered ? s.trHover : {}}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {columns.map((col) => (
        <td key={col.key} style={s.td}>
          {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
        </td>
      ))}
      {(actions.onEdit || actions.onDelete) && isAdmin && (
        <td style={s.td}>
          <div style={s.actionsBtnRow}>
            {actions.onEdit && (
              <button style={s.editBtn} onClick={() => actions.onEdit(row)}>
                Edit
              </button>
            )}
            {actions.onDelete && (
              <button style={s.deleteBtn} onClick={() => actions.onDelete(row)}>
                Delete
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
};

export default DataTable;
