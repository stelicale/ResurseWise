import React, { useEffect } from 'react';

/**
 * Modal — generic dialog overlay.
 *
 * Props:
 *   isOpen    {boolean}
 *   onClose   {Function}
 *   title     {string}
 *   children  {ReactNode}
 *   maxWidth  {string}  default '520px'
 */
const Modal = ({ isOpen, onClose, title, children, maxWidth = '520px' }) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '10px',
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 20px 14px',
            borderBottom: '1px solid #334155',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#f1f5f9' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '20px',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  );
};

/** Reusable field wrapper */
export const FormField = ({ label, required, children, error }) => (
  <div style={{ marginBottom: '14px' }}>
    <label
      style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: '600',
        color: '#94a3b8',
        marginBottom: '5px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {label}
      {required && <span style={{ color: '#f87171', marginLeft: '3px' }}>*</span>}
    </label>
    {children}
    {error && <span style={{ color: '#f87171', fontSize: '12px', marginTop: '3px', display: 'block' }}>{error}</span>}
  </div>
);

/** Shared input style */
export const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '6px',
  border: '1px solid #334155',
  backgroundColor: '#0f172a',
  color: '#f1f5f9',
  fontSize: '14px',
  boxSizing: 'border-box',
};

/** Submit / Cancel button row */
export const FormActions = ({ onCancel, submitLabel = 'Save', loading = false }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
    <button
      type="button"
      onClick={onCancel}
      style={{
        padding: '9px 18px',
        borderRadius: '6px',
        border: '1px solid #334155',
        backgroundColor: 'transparent',
        color: '#94a3b8',
        cursor: 'pointer',
        fontSize: '14px',
      }}
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={loading}
      style={{
        padding: '9px 20px',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: loading ? '#475569' : '#3b82f6',
        color: '#fff',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: '600',
        fontSize: '14px',
      }}
    >
      {loading ? 'Saving…' : submitLabel}
    </button>
  </div>
);

export default Modal;
