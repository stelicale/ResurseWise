# Frontend

A React single-page application for tracking company assets, managing users, and reviewing audit logs.
Communicates with a Spring Boot REST API secured by Keycloak.

## Tech Stack

- React 19.2.4 (Create React App)
- React Router DOM v6 - client-side routing (`BrowserRouter`, `Routes`, `NavLink`, `useNavigate`)
- Axios 1.x - HTTP client with token interceptor
- keycloak-js - OpenID Connect authentication (Resource Owner Password Credentials flow)
- react-toastify - Toast notifications
- Jest + React Testing Library - unit and integration tests
- ESLint + Prettier - linting and formatting

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Backend API running on port 8080 (see `backend/README.md`)
- Keycloak running on port 8081


The `.env` file must never be committed - it is listed in `.gitignore`.

## Running

Start the development server:

```bash
npm start
```

The app is served at http://localhost:3000. API calls are proxied to http://localhost:8080 via `src/setupProxy.js`.

Build for production:

```bash
npm run build
```

## Available Scripts

```bash
npm start          # Start development server
npm run build      # Build for production (output: build/)
npm test           # Run tests in watch mode
npm run lint       # Check for lint errors
npm run format     # Format code with Prettier
```

## Docker: Static Build + Nginx

The frontend is containerized with a multi-stage Docker build:

1. Build stage (`node:20-alpine`) runs `npm ci` and `npm run build`.
2. Runtime stage (`nginx:alpine`) serves the generated static files from `/usr/share/nginx/html`.

### Build image

```bash
cd frontend/my-frontend
docker build -t dvloper-frontend:local .
```

### Run container

```bash
docker run --rm -p 8088:80 dvloper-frontend:local
```

Open `http://localhost:8088` in the browser.

### Notes

- Container exposes only port `80`.
- Nginx is configured for SPA fallback (`/index.html`) so React routes work on refresh.
- Static assets under `/static/` are cached aggressively for performance.

## Run Entire Stack with Compose

From repository root, start frontend + backend + database (and Keycloak dependency):

```bash
docker compose --env-file backend/.env up -d --build
```

Then open:

* `http://localhost:8088`

Stop stack:

```bash
docker compose --env-file backend/.env down
```

---

## Architecture

### Component Structure

```
src/
  App.js                   # Root layout; BrowserRouter + Routes + role-based pages
  App.css                  # Global styles and responsive media queries (breakpoint: 900 px)
  auth/
    keycloak.js            # Keycloak adapter initialisation
  config/
    routes.js              # Central route definitions with adminOnly flags
  context/
    AuthContext.js         # login, logout, isAuthenticated, isAdmin, username
    DataContext.js         # In-memory TTL cache for resources and categories
  components/
    Navbar.jsx             # Sticky navbar: brand, desktop nav tabs, hamburger, auth area
    ProtectedRoute.jsx     # Auth + role guard; redirects unauthorised users
    DataTable.jsx          # Reusable table with filtering, sorting, pagination
    ResourcesPage.jsx      # /resources (uses DataTable)
    CategoriesPage.jsx     # /categories (uses DataTable)
    UsersPage.jsx          # /users - admin only (uses DataTable)
    LogsPage.jsx           # /logs   - admin only (uses DataTable)
    LandingPage.jsx        # / home screen shown before login
    Modal.jsx              # Generic modal dialog with form helpers
    ConnectionTest.jsx     # Automated API test panel (floating, bottom-right)
  services/
    api.js                 # Axios instance with Bearer token interceptor
    resourceService.js     # CRUD for resources
    categoryService.js     # CRUD for categories
    userService.js         # User and role management via Keycloak REST
    logService.js          # Read-only audit log retrieval
    index.js               # Re-exports all services
```

### Authentication

Login uses the Resource Owner Password Credentials flow - no browser redirect is required.
The form sends `username` and `password` to the Keycloak token endpoint through a dev proxy (`/keycloak`).

- `access_token` and `refresh_token` are stored in memory only (module-level variables) - never in `localStorage` or `sessionStorage`.
- `api.js` refreshes the token automatically before every protected request if it expires within 30 seconds.
- `AuthContext` runs a background interval every 25 seconds to proactively refresh the token.
- If the refresh token itself expires the user is automatically logged out.
- Page refresh = logged out by design - tokens are not persisted to disk.

Required Keycloak client settings:
- Direct Access Grants must be enabled on client `spring-backend`.
- `Web Origins`: `http://localhost:3000`

### State Management

The app uses React Context API. Two providers are defined in `src/context/`:

| Context | File | Purpose |
|---------|------|---------|
| `AuthContext` | `AuthContext.js` | Authentication state - `isAuthenticated`, `token`, `roles`, `username`, `isAdmin`, `login`, `logout` |
| `DataContext` | `DataContext.js` | Application data cache - categories, resources, users, logs with TTL-based caching |

Provider tree (inside `App.js`):

```
BrowserRouter
  AuthProvider
    DataWrapper          ← reads isAuthenticated, passes it to DataProvider
      DataProvider
        AppContent       ← renders <Navbar /> + <Routes>
```

`DataWrapper` reads `isAuthenticated` from `AuthContext` and passes it to `DataProvider`, ensuring the
data cache is cleared on logout.

DataContext caching:
- Cache TTL: 2 minutes per entity type.
- Cache is checked before every fetch - if data is fresh, no network request is made.
- After any mutation call `invalidate('categories')` or `invalidate('resources')` to force a fresh fetch.
- On logout all cached data is cleared via a `RESET` action.

```js
import { useData } from '../context/DataContext';

const { fetchCategories, invalidate } = useData();

const categories = await fetchCategories();     // reads cache if fresh
const categories = await fetchCategories(true); // force-bypass cache
await categoryService.createCategory(data);
invalidate('categories');                       // flush cache after write
```

### API Integration

All API calls go through `src/services/api.js`, which creates an Axios instance pointed at `REACT_APP_API_URL`.
A request interceptor attaches `Authorization: Bearer <token>`. A response interceptor handles errors globally.

| Service | Endpoints |
|---------|-----------|
| `categoryService` | GET all, GET by ID, POST, PUT, DELETE |
| `resourceService` | GET all, GET by ID, POST, PUT, DELETE |
| `userService` | GET all, GET by ID, GET roles, POST, PUT, DELETE |
| `logService` | GET (with `timeAgo` param, e.g. `1h`, `7d`, `30d`) |

Usage example:

```js
import { categoryService } from './services';

const categories = await categoryService.getAllCategories();
const created    = await categoryService.createCategory({ name: 'Electronics', description: '...' });
await categoryService.updateCategory(id, { name: 'Updated Name' });
await categoryService.deleteCategory(id);
```

### Error Handling

Errors are caught globally in `api.js`. The user sees a toast for every failure:

| Status | Toast message |
|--------|---------------|
| 401 | Unauthorized. Please login again. |
| 403 | Access forbidden. |
| 404 | Resource not found. |
| 500 | Server error. Please try again later. |
| Network error | Network error. Check your connection. |

### CORS

The backend (`CorsConfig.java`) accepts requests from `http://localhost:3000` with all HTTP methods
and the `Authorization` header.

---

## Routing & Navigation

### Route Definitions

All routes are declared in `src/config/routes.js` as a single exported array. No route path or role
string is hardcoded inside any component.

```js
export const NAV_ROUTES = [
  { path: '/resources',  label: 'Resources',  adminOnly: false },
  { path: '/categories', label: 'Categories', adminOnly: false },
  { path: '/users',      label: 'Users',      adminOnly: true  },
  { path: '/logs',       label: 'Logs',       adminOnly: true  },
];
```

To add a new route: add an entry here, create its page component, and add a matching `<Route>` in
`App.js`. The navbar tab appears automatically.

### Access Control

`src/components/ProtectedRoute.jsx` wraps any `<Route>` element that requires authentication or a
specific role:

| Visitor state | Outcome |
|---------------|---------|
| Not authenticated | Redirected to `/` (landing page) with `state.from` saved for optional post-login redirect |
| Authenticated, not admin, `adminOnly` route | Redirected to `/resources` |
| Authorised | Children rendered normally |

Frontend guards are UX only. All backend REST endpoints independently verify the Keycloak JWT and
enforce the same role restrictions.

### Navbar

`src/components/Navbar.jsx` is rendered once in `AppContent`, above `<Routes>`, so it appears on
every page.

**Unauthenticated state:** brand logo + login form (username, password, Login button).

**Authenticated state:** brand logo + desktop nav tabs filtered by role + username/role badge +
Logout button + hamburger button (mobile only).

**Responsive behaviour:**

| Viewport | Behaviour |
|----------|-----------|
| > 900 px | Full horizontal tab bar visible |
| ≤ 900 px | Tab bar hidden; hamburger `☰` button shown |
| Hamburger pressed | Full-width dropdown column appears below the header bar |
| Route changes | Dropdown closes automatically |

---

## DataTable Component

`src/components/DataTable.jsx` is a fully self-contained, reusable table component used on every data
page. It accepts the following props:

| Prop              | Type    | Default       | Description                                                  |
|-------------------|---------|---------------|--------------------------------------------------------------|
| `columns`         | Array   | `[]`          | Column definitions: `{ key, label, sortable?, render?, width? }` |
| `data`            | Array   | `[]`          | Full dataset passed from the parent page                     |
| `filters`         | Array   | `[]`          | Filter definitions: `{ key, label, type, options? }`         |
| `actions`         | Object  | `{}`          | Handlers: `{ onAdd?, onEdit?, onDelete?, addLabel? }`        |
| `loading`         | Boolean | `false`       | Displays a loading state while data is fetched               |
| `defaultPageSize` | Number  | `10`          | Initial rows per page                                        |
| `pageSizeOptions` | Array   | `[5,10,25,50]`| Page size choices shown in the footer                        |
| `title`           | String  | `''`          | Heading displayed above the table                            |
| `isAdmin`         | Boolean | `false`       | Shows or hides add / edit / delete actions                   |
| `emptyMessage`    | String  | `'No records found.'` | Text shown when there are no rows               |

### Filtering

Filter state is kept in a single `useState` object keyed by column name, e.g.
`{ name: "dell", status: "AVAILABLE" }`. Two filter types are supported:

- `text` - case-insensitive substring match against the column value.
- `select` - exact string equality match, rendered as a dropdown.

Multiple filters are applied in sequence, each narrowing the previous result set. The filtered array
is computed with `useMemo` and only recalculates when `data`, `filterValues`, or the `filters` prop
changes. Applying any filter resets the page counter to 1. A "Clear filters" button appears whenever
at least one filter has a value.

### Sorting

Clicking a sortable column header toggles between ascending and descending order. An inactive sortable
column shows a neutral indicator; the active column shows an up or down arrow. Sorting uses
`String.prototype.localeCompare` with `{ numeric: true }` so values like "Item 2" sort before
"Item 10". Sorting is also computed via `useMemo`, operating on the already-filtered dataset.

### Pagination

Total pages are derived from the filtered and sorted row count divided by the selected page size.
The footer provides:

- Previous and Next buttons.
- Numbered page buttons with ellipsis collapse for large page counts.
- A "Rows per page" selector driven by `pageSizeOptions`.

Changing page size or applying a filter resets the counter to 1 to prevent landing on an empty page.
The current page is clamped to `totalPages` so stale page state from a previous filter never causes
an out-of-range slice.

### Data flow

```
data (all rows, passed as prop)
  -> filtered  (useMemo: applies all active filterValues in sequence)
  -> sorted    (useMemo: applies sortKey and sortDir)
  -> paginated (slice based on current page and pageSize)
  -> rendered as <TableRow> elements
```

### Responsive layout

- `overflowX: auto` on the table wrapper enables horizontal scrolling on narrow viewports.
- The filter row, header, and footer use `flexWrap: wrap` so controls stack when horizontal space
  is limited.
- The application header adapts at **900 px** via CSS media queries in `App.css`: the tab bar is
  replaced by a collapsible hamburger dropdown, and login inputs compress to fit phone viewports.
- On screens ≤ 500 px the API Test Suite panel stretches edge-to-edge (`left/right: 8px`).

---

## Testing

### Framework

| Tool | Purpose |
|------|---------|
| **Jest** | Test runner, assertions, mocking — bundled with Create React App |
| **React Testing Library** | Component rendering and DOM queries |
| **Cypress** | End-to-end (E2E) testing — see *E2E* section below |

---

### Running unit tests

```bash
# Watch mode (interactive, re-runs on save)
npm test

# Single full run with coverage report
npm test -- --coverage --watchAll=false

# Coverage report only (no watch)
CI=true npm test -- --coverage
```

Coverage is collected from the four critical modules listed in the `jest.collectCoverageFrom`
field of `package.json`. A minimum threshold of **20 %** is enforced globally for statements,
branches, functions, and lines.

---

### Test files

| File | What it tests |
|------|---------------|
| `src/App.test.js` | Root component mounts without crashing |
| `src/components/__tests__/ProtectedRoute.test.jsx` | **Rendering of protected routes** – all three guard outcomes (unauthenticated redirect, non-admin redirect, authorised render) |
| `src/components/__tests__/Navbar.test.jsx` | **Role-based UI visibility** – tabs hidden/shown by role, hamburger open/close, unauthenticated login form |
| `src/services/__tests__/api.test.js` | **API call success and error states** – `get/post/put/delete` return `response.data`; response interceptor maps 401/403/404/500/network errors to correct toast messages |

---

### Mocking strategy

> **Warning:** Unit tests never call real backend endpoints or a live Keycloak instance.

| Dependency | How it is mocked |
|------------|-----------------|
| `axios` | `jest.mock('axios', factory)` — `axios.create()` returns a controlled fake instance with `jest.fn()` methods; interceptor handlers are extracted and tested directly |
| `AuthContext` (`useAuth`) | `jest.mock('../../context/AuthContext')` — `useAuth.mockReturnValue({...})` injects controlled auth state per test |
| `keycloak.js` | `jest.mock` — `refreshToken` returns `null` (no token attached to requests) |
| `react-toastify` | `jest.mock` — `toast.error` / `toast.success` are `jest.fn()` so assertions can verify which message was shown |
| Router | Not mocked — `MemoryRouter` from `react-router-dom` provides real routing context in tests |

---

### Writing new tests

Follow the same pattern:

```jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyComponent from '../MyComponent';
import { useAuth } from '../../context/AuthContext';

jest.mock('../../context/AuthContext');

test('renders correctly', () => {
  useAuth.mockReturnValue({ isAuthenticated: true, isAdmin: false });
  render(<MemoryRouter><MyComponent /></MemoryRouter>);
  expect(screen.getByText('Expected text')).toBeInTheDocument();
});
```

---

### E2E testing (Cypress)

> **Warning:** E2E tests must use a dedicated test Keycloak realm — never run against the
> production realm or shared development data.

Install Cypress (once):

```bash
npm install --save-dev cypress
```

Open Cypress interactive runner:

```bash
npx cypress open
```

Run headlessly (CI):

```bash
npx cypress run
```

Cypress specs live in `cypress/e2e/`. A test Keycloak instance on a separate port (e.g. 8082)
with a pre-seeded realm and test users should be started before running E2E tests.

Reference: [https://docs.cypress.io/guides/overview/why-cypress](https://docs.cypress.io/guides/overview/why-cypress)
