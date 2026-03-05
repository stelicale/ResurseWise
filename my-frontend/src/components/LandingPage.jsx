import React from 'react';

const FEATURES = [
  {
    icon: '📦',
    title: 'Resource Tracking',
    desc: 'Keep a complete inventory of company assets — laptops, monitors, equipment — with serial numbers, locations and purchase dates.',
  },
  {
    icon: '🗂️',
    title: 'Category Management',
    desc: 'Organise resources into categories. Create, update or remove categories at any time without disrupting existing records.',
  },
  {
    icon: '👥',
    title: 'User & Role Management',
    desc: 'Manage Keycloak users directly from the interface. Assign Admin or Employee roles to control access across the platform.',
  },
  {
    icon: '📋',
    title: 'Audit Logs',
    desc: 'Every CREATE, UPDATE and DELETE action is automatically recorded. Filter by time range to review what changed and when.',
  },
  {
    icon: '🔍',
    title: 'Advanced Filtering',
    desc: 'Filter any table by multiple criteria simultaneously — by status, category, name or serial number.',
  },
  {
    icon: '↕️',
    title: 'Sorting & Pagination',
    desc: 'Sort any column ascending or descending. Navigate large datasets with configurable page sizes (5 / 10 / 25 / 50 rows).',
  },
];

const LandingPage = ({ isAuthenticated, onGetStarted }) => {
  return (
    <div style={{ color: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Hero ── */}
      <section style={{
        textAlign: 'center',
        padding: '80px 24px 72px',
        background: 'linear-gradient(180deg, #0f172a 0%, #0d1f38 100%)',
        borderBottom: '1px solid #1e293b',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 14px',
          borderRadius: '20px',
          border: '1px solid #1e3a5f',
          backgroundColor: '#0c2340',
          color: '#60a5fa',
          fontSize: '12px',
          fontWeight: '600',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '28px',
        }}>
          Resource Management Platform
        </div>

        <h1 style={{
          margin: '0 0 20px',
          fontSize: 'clamp(32px, 6vw, 56px)',
          fontWeight: '800',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
        }}>
          <span style={{ color: '#60a5fa' }}>Resurse</span>Wise
        </h1>

        <p style={{
          margin: '0 auto 36px',
          maxWidth: '520px',
          fontSize: '17px',
          color: '#94a3b8',
          lineHeight: 1.65,
        }}>
          A centralised platform for tracking company assets, managing users and reviewing audit activity — all in one place.
        </p>

        {!isAuthenticated ? (
          <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>
            Sign in with your credentials using the fields in the top-right corner.
          </p>
        ) : (
          <button
            onClick={onGetStarted}
            style={{
              padding: '12px 28px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 0 24px #3b82f640',
              letterSpacing: '-0.01em',
            }}
          >
            Go to Resources →
          </button>
        )}
      </section>

      {/* ── Stats bar ── */}
      <section style={{
        borderBottom: '1px solid #1e293b',
        backgroundColor: '#0f172a',
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          padding: '0',
        }}>
          {[
            { value: 'CRUD', label: 'Full Operations' },
            { value: 'Role-based', label: 'Access Control' },
            { value: 'Real-time', label: 'Audit Logging' },
          ].map((stat, i) => (
            <div key={i} style={{
              textAlign: 'center',
              padding: '28px 24px',
              borderRight: i < 2 ? '1px solid #1e293b' : 'none',
            }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#60a5fa', marginBottom: '4px', letterSpacing: '-0.02em' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '64px 24px', backgroundColor: '#0f172a' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: '700',
            color: '#e2e8f0',
            marginBottom: '8px',
            letterSpacing: '-0.02em',
          }}>
            Everything you need
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginBottom: '44px' }}>
            Built for IT teams that need clarity over their physical and digital assets.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
          }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{
                padding: '24px',
                borderRadius: '10px',
                border: '1px solid #1e293b',
                backgroundColor: '#0d1825',
                transition: 'border-color 0.2s',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{f.icon}</div>
                <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: '700', color: '#f1f5f9' }}>
                  {f.title}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer strip ── */}
      <div style={{
        borderTop: '1px solid #1e293b',
        padding: '20px 24px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#334155',
        backgroundColor: '#0f172a',
      }}>
        ResurseWise · dvloper.io · {new Date().getFullYear()}
      </div>
    </div>
  );
};

export default LandingPage;
