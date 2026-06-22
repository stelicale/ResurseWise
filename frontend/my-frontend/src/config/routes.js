/**
 * Central route definitions.
 * Keeping routes and role requirements here (not hardcoded in components)
 * makes it easy to add, remove, or restrict routes in one place.
 */

export const NAV_ROUTES = [
  { path: '/resources',  label: 'Resources',  adminOnly: false },
  { path: '/categories', label: 'Categories', adminOnly: false },
  { path: '/users',      label: 'Users',      adminOnly: true  },
  { path: '/logs',       label: 'Logs',       adminOnly: true  },
];
