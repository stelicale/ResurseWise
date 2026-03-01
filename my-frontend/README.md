# Frontend

React frontend for the dvloper.io resource management application. Communicates with a Spring Boot backend REST API using Axios.

## Tech Stack

- React 19.2.4
- Axios 1.x - HTTP client
- keycloak-js - OpenID Connect authentication
- react-toastify - Toast notifications
- ESLint + Prettier - Linting and formatting

## Prerequisites

- Node.js v14 or higher
- Backend running on `http://localhost:8080`

## Getting Started

```bash
cd frontend/my-frontend
npm install
npm start
```

The app runs on `http://localhost:3000`.

## Environment Variables

Create a `.env` file in `my-frontend/`:

```env
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_KEYCLOAK_URL=http://localhost:8081
REACT_APP_KEYCLOAK_REALM=ITResurceManager
REACT_APP_KEYCLOAK_CLIENT_ID=spring-backend
REACT_APP_KEYCLOAK_PROXY_PREFIX=/keycloak
BROWSER=none
```

The `.env` file is listed in `.gitignore` and should never be committed.

## API Integration

All API calls go through `src/services/api.js`, which creates an Axios instance using the base URL from `REACT_APP_API_URL`. A request interceptor refreshes the Keycloak token (when close to expiration) and automatically attaches `Authorization: Bearer <token>`. A response interceptor catches errors globally and shows toast notifications.

### Available Services

| Service | Endpoints |
|---------|-----------|
| `categoryService` | GET all, GET by ID, POST, PUT, DELETE |
| `resourceService` | GET all, GET by ID, POST, PUT, DELETE |
| `userService` | GET all, GET by ID, GET roles, POST, PUT, DELETE |
| `logService` | GET (with `timeAgo` param, e.g. `1h`, `7d`, `30d`) |

### Usage Example

```javascript
import { categoryService } from './services';

// Fetch all categories
const categories = await categoryService.getAllCategories();

// Create a category
const created = await categoryService.createCategory({
  name: 'Electronics',
  description: 'Electronic devices'
});

// Update
await categoryService.updateCategory(id, { name: 'Updated Name' });

// Delete
await categoryService.deleteCategory(id);
```

### Authentication

Authentication uses direct token requests to Keycloak (Resource Owner Password Credentials flow — no browser redirect):

- The login form sends `username` and `password` to the Keycloak token endpoint through a dev proxy (`/keycloak`)
- On successful login, `access_token` and `refresh_token` are stored **in memory only** (JavaScript module-level variables) — never written to `localStorage` or `sessionStorage`
- `api.js` automatically refreshes the token before every protected API call if it expires within 30 seconds
- `AuthContext` also runs a background interval every 25 seconds to proactively refresh the token
- If the refresh token itself expires, the user is automatically logged out
- **Page refresh = logged out** (by design — tokens are not persisted to disk)

Required Keycloak client settings:

- Direct Access Grants must be enabled on client `spring-backend`
- `Web Origins`: `http://localhost:3000`

Role-based UI:

- `Run All CRUD Tests` is available for all authenticated users
- Results show `⛔ FORBIDDEN` for operations that require the `Admin` realm role

Quick setup:

```bash
cp .env.example .env
npm install
npm start
```

Login is done directly in the app using the Username/Password fields and `Login` button.

### Error Handling

Errors are handled globally in `api.js`. The user sees a toast notification for every failure:

| Status | Message |
|--------|---------|
| 401 | Unauthorized. Please login again. |
| 403 | Access forbidden. |
| 404 | Resource not found. |
| 500 | Server error. Please try again later. |
| Network error | Network error. Check your connection. |

## CORS

The backend (`CorsConfig.java`) is configured to accept requests from `http://localhost:3000` with all HTTP methods and the `Authorization` header.

## Testing the API

The app includes a `ConnectionTest` component that runs automated tests against all endpoints. It creates test data, verifies each operation (GET, POST, PUT, DELETE), and cleans up after itself.

To use it:

1. Start frontend and backend
2. Click `Login` and authenticate with your Keycloak credentials
3. Click `Run All CRUD Tests`
4. Results show `✅ SUCCESS` for permitted operations and `⛔ FORBIDDEN` for operations outside your role

## Available Scripts

```bash
npm start        # Start development server
npm run build    # Build for production (output: build/)
npm test         # Run tests
npm run lint     # Check for lint errors
npm run format   # Format code with Prettier
```
