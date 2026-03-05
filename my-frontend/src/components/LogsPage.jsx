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

const actionBadge = (action) => {
  const map = {
    CREATE: { bg: '#052e16', border: '#166534', color: '#4ade80' },
    UPDATE: { bg: '#1e1b4b', border: '#3730a3', color: '#818cf8' },
    DELETE: { bg: '#450a0a', border: '#7f1d1d', color: '#f87171' },
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

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeAgo, setTimeAgo] = useState('24h');

  // Logs always fetched directly with the current timeAgo — DataContext cache
  // uses a fixed '24h' window so would be wrong for other ranges; bypass it here.
  const load = useCallback(async (t) => {
    setLoading(true);
    try {
      const data = await logService.getLogs(t);
      setLogs(data || []);
    } catch {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(timeAgo); }, [timeAgo, load]);

  // Map backend field names (actionType, actionDate, comments, createdByKeycloakId)
  // to stable display keys used by the table.
  const flatLogs = logs.map((l) => ({
    ...l,
    performedByDisplay: l.createdByKeycloakId || '—',
    timestampDisplay: l.actionDate || '',
    actionDisplay: l.actionType || '',
    commentsDisplay: l.comments || '',
  }));

  const columns = [
    {
      key: 'timestampDisplay',
      label: 'Timestamp',
      sortable: true,
      render: (val) => {
        if (!val) return '—';
        try {
          return new Date(val).toLocaleString();
        } catch {
          return val;
        }
      },
    },
    {
      key: 'actionDisplay',
      label: 'Action',
      sortable: true,
      render: (val) => actionBadge(val),
    },
    { key: 'performedByDisplay', label: 'Performed By (Keycloak ID)', sortable: true },
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
      ],
    },
    { key: 'commentsDisplay', label: 'Comments', type: 'text' },
  ];

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
          onClick={() => load(timeAgo)}
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
        isAdmin={false}
        actions={{}}
        emptyMessage="No logs found for this time range."
        defaultPageSize={25}
      />
    </div>
  );
};

export default LogsPage;
