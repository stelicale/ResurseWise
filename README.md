# Frontend

A React single-page application for tracking company assets, managing users, and reviewing audit logs.
Communicates with a Spring Boot REST API secured by Keycloak.

## Tech Stack

- React 19.2.4 (Create React App)
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

---

## Architecture

### Component Structure

```
src/
  App.js                   # Root layout, header, tab-based routing
  App.css                  # Global styles and responsive media queries
  auth/
    keycloak.js            # Keycloak adapter initialisation
  context/
    AuthContext.js         # login, logout, isAuthenticated, isAdmin, username
    DataContext.js         # In-memory TTL cache for resources and categories
  components/
    DataTable.jsx          # Reusable table with filtering, sorting, pagination
    ResourcesPage.jsx      # Resources tab (uses DataTable)
    CategoriesPage.jsx     # Categories tab (uses DataTable)
    UsersPage.jsx          # Users tab - admin only (uses DataTable)
    LogsPage.jsx           # Audit logs tab - admin only (uses DataTable)
    LandingPage.jsx        # Home screen shown before login
    Modal.jsx              # Generic modal dialog with form helpers
    ConnectionTest.jsx     # Automated API test panel
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
AuthProvider
  DataProvider (receives isAuthenticated via DataWrapper)
    AppContent
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
- The application header adapts at 600 px via CSS media queries in `App.css`: navigation tabs move
  to a second row with horizontal scroll, and login inputs shrink to fit phone viewports.

---

## Testing

The project uses Jest and React Testing Library (bundled with Create React App).

Run tests in watch mode:

```bash
cd frontend/my-frontend
npm test
```

The existing test (`src/App.test.js`) verifies that the root component mounts without crashing.
New tests follow the same `@testing-library/react` pattern in the same directory.
