import React, { useEffect, useState, useCallback } from 'react';
import DataTable from './DataTable';
import { logService } from '../services/logService';
import { toast } from 'react-toastify';

const TIME_OPTIONS = [
  { value: '1h', label: 'Last 1 hour' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

const formatUtcPlus2 = (rawValue) => {
  if (!rawValue) return '—';

  const normalized = String(rawValue).replace(' ', 'T');
  const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(normalized);
  const utcDate = new Date(hasTimezone ? normalized : `${normalized}Z`);

  if (Number.isNaN(utcDate.getTime())) {
    return rawValue;
  }

  const shifted = new Date(utcDate.getTime() + (2 * 60 * 60 * 1000));

  const time = shifted.toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const date = shifted.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });

  return `${time} (UTC+2) ${date}.`;
};

const actionBadge = (action) => {
  const map = {
    CREATE: { bg: '#052e16', border: '#166534', color: '#4ade80' },
    UPDATE: { bg: '#1e1b4b', border: '#3730a3', color: '#818cf8' },
    DELETE: { bg: '#450a0a', border: '#7f1d1d', color: '#f87171' },
    ACCESS_DENIED: { bg: '#431407', border: '#9a3412', color: '#fb923c' },
  };
  const c = map[action] || { bg: '#1e293b', border: '#334155', color: '#94a3b8' };
  return (
    <span
      style={{
        padding: '2px 9px',
        borderRadius: '12px',
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
        fontSize: '12px',
        fontWeight: '600',
      }}
    >
      {action || '—'}
    </span>
  );
};

const statusBadge = (success) => {
  const ok = success === true || success === 'true';
  const c = ok
    ? { bg: '#052e16', border: '#166534', color: '#4ade80', text: 'SUCCESS' }
    : { bg: '#450a0a', border: '#7f1d1d', color: '#f87171', text: 'FAILED' };

  return (
    <span
      style={{
        padding: '2px 9px',
        borderRadius: '12px',
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
        fontSize: '12px',
        fontWeight: '700',
      }}
    >
      {c.text}
    </span>
  );
};

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeAgo, setTimeAgo] = useState('24h');
  const [totalItems, setTotalItems] = useState(0);
  const [query, setQuery] = useState({ page: 0, size: 25, sortBy: 'timestampDisplay', sortDir: 'desc', filters: {} });

  const load = useCallback(async (t, q = query) => {
    setLoading(true);
    try {
      const params = {
        timeAgo: t,
        page: q.page,
        size: q.size,
        sortBy: q.sortBy === 'timestampDisplay' ? 'actionDate'
          : q.sortBy === 'actionDisplay' ? 'actionType'
            : q.sortBy === 'successDisplay' ? 'success'
              : q.sortBy === 'idDisplay' ? 'id'
                : q.sortBy === 'commentsDisplay' ? 'comments'
                  : q.sortBy,
        sortDir: q.sortDir,
        actionType: q.filters?.actionDisplay,
        success: q.filters?.successDisplay,
        id: q.filters?.idDisplay,
        comments: q.filters?.commentsDisplay,
      };
      const data = await logService.getLogsPage(params);
      setLogs(data?.content || []);
      setTotalItems(data?.totalElements || 0);
    } catch {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { load(timeAgo, query); }, [timeAgo, query, load]);

  // Map backend field names (actionType, actionDate, comments, createdByKeycloakId)
  // to stable display keys used by the table.
  const flatLogs = logs.map((l) => ({
    ...l,
    idDisplay: l.id || '—',
    timestampDisplay: l.actionDate || '',
    actionDisplay: l.actionType || '',
    commentsDisplay: l.comments || '',
    successDisplay: String(l.success === true),
  }));

  const columns = [
    {
      key: 'timestampDisplay',
      label: 'Timestamp',
      sortable: true,
      render: (val) => {
        return formatUtcPlus2(val);
      },
    },
    {
      key: 'actionDisplay',
      label: 'Action',
      sortable: true,
      render: (val) => actionBadge(val),
    },
    {
      key: 'successDisplay',
      label: 'Status',
      sortable: true,
      render: (val) => statusBadge(val),
    },
    { key: 'idDisplay', label: 'ID', sortable: true },
    { key: 'commentsDisplay', label: 'Comments', sortable: false },
  ];

  const filters = [
    {
      key: 'actionDisplay',
      label: 'Action',
      type: 'select',
      options: [
        { value: 'CREATE', label: 'CREATE' },
        { value: 'UPDATE', label: 'UPDATE' },
        { value: 'DELETE', label: 'DELETE' },
        { value: 'ACCESS_DENIED', label: 'ACCESS_DENIED' },
      ],
    },
    {
      key: 'successDisplay',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'true', label: 'SUCCESS' },
        { value: 'false', label: 'FAILED' },
      ],
    },
    { key: 'idDisplay', label: 'ID', type: 'text' },
    { key: 'commentsDisplay', label: 'Comments', type: 'text' },
  ];

  const handleServerQueryChange = useCallback((next) => {
    const normalizedNext = {
      ...next,
      sortBy: next?.sortBy || 'timestampDisplay',
      sortDir: next?.sortBy ? next.sortDir : 'desc',
    };

    setQuery((prev) => {
      const same = JSON.stringify(prev) === JSON.stringify(normalizedNext);
      return same ? prev : normalizedNext;
    });
  }, []);

  return (
    <div>
      {/* Time range selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Time range:</span>
        {TIME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTimeAgo(opt.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${timeAgo === opt.value ? '#3b82f6' : '#334155'}`,
              backgroundColor: timeAgo === opt.value ? '#1d4ed820' : '#1e293b',
              color: timeAgo === opt.value ? '#60a5fa' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: timeAgo === opt.value ? '600' : '400',
            }}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => load(timeAgo, query)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #334155',
            backgroundColor: '#1e293b',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '13px',
            marginLeft: 'auto',
          }}
        >
          ↻ Refresh
        </button>
      </div>

      <DataTable
        title="Activity Logs"
        columns={columns}
        data={flatLogs}
        filters={filters}
        loading={loading}
        serverMode
        totalItems={totalItems}
        onQueryChange={handleServerQueryChange}
        isAdmin={false}
        actions={{}}
        emptyMessage="No logs found for this time range."
        defaultPageSize={25}
      />
    </div>
  );
};

export default LogsPage;
