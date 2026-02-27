# Frontend

React frontend for the dvloper.io resource management application. Communicates with a Spring Boot backend REST API using Axios.

## Tech Stack

- React 19.2.4
- Axios 1.x - HTTP client
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
BROWSER=none
```

The `.env` file is listed in `.gitignore` and should never be committed.

## API Integration

All API calls go through `src/services/api.js`, which creates an Axios instance using the base URL from `REACT_APP_API_URL`. A request interceptor automatically attaches the JWT token from `localStorage` to every request. A response interceptor catches errors globally and shows toast notifications.

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

After obtaining a JWT token from Keycloak, store it in localStorage:

```javascript
localStorage.setItem('access_token', 'your-jwt-token');
```

All subsequent API calls will include it automatically via the request interceptor.

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

## Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/{id}` | Update category |
| DELETE | `/api/categories/{id}` | Delete category |
| GET | `/api/resources` | Get all resources |
| POST | `/api/resources` | Create resource |
| PUT | `/api/resources/{id}` | Update resource |
| DELETE | `/api/resources/{id}` | Delete resource |
| GET | `/api/users` | Get all users |
| POST | `/api/users` | Create user |
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Delete user |
| GET | `/api/users/roles/available` | Get available roles |
| GET | `/api/logs?timeAgo=24h` | Get audit logs |

## Testing the API

The app includes a `ConnectionTest` component that runs automated tests against all endpoints. It creates test data, verifies each operation (GET, POST, PUT, DELETE), and cleans up after itself.

To use it, navigate to the Connection Test page and click "Run All Tests". With a valid JWT token stored in localStorage, all tests should pass.

## Available Scripts

```bash
npm start        # Start development server
npm run build    # Build for production (output: build/)
npm test         # Run tests
npm run lint     # Check for lint errors
npm run format   # Format code with Prettier
```
