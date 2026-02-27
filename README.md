# Backend Application

This repository contains the backend source code for the application, built using **Java** and **Spring Boot**.
It serves as the REST API foundation, managing data persistence via PostgreSQL and exposing endpoints for the frontend integration.

## Tech Stack
* **Language:** Java 21 (JDK 21.0.9)
* **Framework:** Spring Boot 4.0.1
* **Security:** Spring Security & OAuth2 Resource Server
* **Identity Provider:** Keycloak (Docker)
* **Database:** PostgreSQL (via Docker)
* **Documentation:** SpringDoc OpenAPI (Swagger)
* **Validation:** Jakarta Validation
* **Build Tool:** Maven (using the included `mvnw` wrapper)
* **Server:** Apache Tomcat 11.0.15 (Embedded)
* **Testing:** JUnit 5, Mockito, Spring Boot Test, JaCoCo (Code Coverage)

## Getting Started

### Prerequisites
1. **Java Development Kit (JDK):** Version 21 or higher.
2. **Docker:** Required to run the PostgreSQL database container.

### Database Setup
The application requires a PostgreSQL database running in a Docker container.
Run the following command to start the database: `docker start posql`.

The server will start on default port **8080**.
To start the Spring Boot server with the required environment variables:

```bash
DB_USER=admin DB_PASSWORD=secret ./mvnw spring-boot:run
```

### Keycloak Setup (Authentication)
The application relies on Keycloak for identity management. Ensure your Keycloak container is running on port 8081.
Run the following command to start Keycloak: `docker start kclk`.
Credentials for Keycloak admin console:
* **Username:** `admin`
* **Password:** `admin`
* **Environment Variables:**
  * `KEYCLOAK_ADMIN=admin`
  * `KEYCLOAK_ADMIN_PASSWORD=admin`

## Architecture & Features

### Project Structure
```
src/main/java/io/dvloper/backend/
├── aspect/          # AOP for audit logging
├── config/          # Spring Security & OpenAPI configuration
├── controller/      # REST API endpoints
├── dto/             # Data Transfer Objects
├── entities/        # JPA entities (Category, Resource, Log)
├── exception/       # Global exception handling
├── repository/      # JPA repositories
└── service/         # Business logic (Keycloak integration)

src/test/java/io/dvloper/backend/
├── controller/      # Controller unit & integration tests
├── dto/             # DTO validation tests
├── entities/        # Entity validation tests
├── exception/       # Exception handler tests
└── repository/      # Repository integration tests
```

### REST API Layer
The application implements a layered architecture exposing RESTful endpoints for the following resources:
* **Categories:** Manage resource types.
* **Resources:** Manage hardware/software inventory.
* **Employees:** User profiles synced with the identity provider.
* **Logs:** Read-only audit trails.

### Request Validation and Error Handling
The application enforces strict data integrity using Jakarta Validation annotations on entities. Invalid requests are rejected before processing.
A centralized exception handler (`@RestControllerAdvice`) captures errors and returns standardized JSON responses:
**400 Bad Request**, **404 Not Found**, **500 Internal Server Error**, etc.

### Data Model & Seeding
* **UUID Strategy:** All primary keys are UUIDs to ensure consistency with external systems (Keycloak).
* **Data Seeding:** On startup, if the database is empty, a `CommandLineRunner` script automatically populates it with initial test data.

### Accessing Documentation
* **Swagger UI:** `http://localhost:8080/swagger-ui/index.html`
* **JSON Definition:** `http://localhost:8080/v3/api-docs`

**Note:** All API endpoints in Swagger are organized with descriptive tags (e.g., "Category", "Resource", "User", "Log") for better readability and navigation.

## Authentication & Role-Based Access Control
To interact with protected endpoints via `Swagger` or `cURL`, you must first obtain a `JWT` Access Token.

### Test Users
We have pre-configured two users with different permission levels to test `Role-Based Access Control`:

| Username | Password | Roles          |
|----------|----------|----------------|
| `sudosu`  | `admin` | `Admin` (Full CRUD access)    |
| `salahor` | `1234` | `Employee` (Read-only access)   |

## How to Generate Tokens
Run the following commands in your terminal to get the raw JSON response containing the `access_token`.

```bash
# For Admin User (sudosu)
curl -X POST \
  http://localhost:8081/realms/ITResurceManager/protocol/openid-connect/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'client_id=spring-backend' \
  -d 'username=sudosu' \
  -d 'password=admin' \
  -d 'grant_type=password'

# For Employee User (salahor)
curl -X POST \
  http://localhost:8081/realms/ITResurceManager/protocol/openid-connect/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'client_id=spring-backend' \
  -d 'username=salahor' \
  -d 'password=1234' \
  -d 'grant_type=password'
```
After that, copy the value of `access_token` from the JSON response and use it in the `Authorize` button in Swagger UI or in the `Authorization` header for `cURL` requests:

```bash
# should receive HTTP/1.1 200 for Admin and HTTP/1.1 403 for Employee
curl -v http://localhost:8080/api/employees \
  -H "Authorization: Bearer TOKEN_HERE"
```

## Frontend Integration & CORS

### Overview
The backend is configured to accept requests from the React frontend running on `http://localhost:3000`. This is achieved through **CORS (Cross-Origin Resource Sharing)** configuration.

### CORS Configuration

**File:** `src/main/java/io/dvloper/backend/config/CorsConfig.java`

The CORS configuration allows:
* ✅ **Origins:** `http://localhost:3000`, `http://localhost:3001`
* ✅ **Methods:** GET, POST, PUT, DELETE, OPTIONS
* ✅ **Headers:** All (including Authorization for JWT tokens)
* ✅ **Credentials:** Enabled (allows cookies and auth headers)
* ✅ **Preflight Cache:** 1 hour

**Security Integration:**

The CORS configuration is integrated with Spring Security in `SecurityConfig.java`:
```java
.cors(cors -> cors.configure(http)) // Enable CORS
```

### Frontend Setup

The frontend uses **Axios** for API communication with the following structure:

```
frontend/my-frontend/src/services/
├── api.js              # Base Axios instance with interceptors
├── categoryService.js  # Category CRUD operations
├── resourceService.js  # Resource CRUD operations
└── logService.js       # Log operations
```

**Environment Configuration:** `.env`
```env
REACT_APP_API_URL=http://localhost:8080/api
```

### API Endpoints for Frontend

| Endpoint | Method | Frontend Usage | Authentication |
|----------|--------|----------------|----------------|
| `/api/categories` | GET | Fetch all categories | Required (JWT) |
| `/api/categories/{id}` | GET | Fetch single category | Required (JWT) |
| `/api/categories` | POST | Create category | Admin role |
| `/api/categories/{id}` | PUT | Update category | Admin role |
| `/api/categories/{id}` | DELETE | Delete category | Admin role |
| `/api/resources` | GET | Fetch all resources | Required (JWT) |
| `/api/resources/{id}` | GET | Fetch single resource | Required (JWT) |
| `/api/resources` | POST | Create resource | Admin role |
| `/api/resources/{id}` | PUT | Update resource | Admin role |
| `/api/resources/{id}` | DELETE | Delete resource | Admin role |
| `/api/logs` | GET | Fetch activity logs | Admin role |

### Testing Frontend-Backend Integration

1. **Start Backend:**
   ```bash
   cd backend
   DB_USER=admin DB_PASSWORD=secret ./mvnw spring-boot:run
   ```

2. **Start Frontend:**
   ```bash
   cd frontend/my-frontend
   npm start
   ```

3. **Verify Connection:**
   - Open browser console (F12)
   - Navigate to `http://localhost:3000`
   - Check Network tab - should see successful API calls
   - No CORS errors should appear

### Troubleshooting CORS Issues

**Problem:** CORS error in browser console
```
Access to XMLHttpRequest at 'http://localhost:8080/api/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solutions:**
1. Ensure `CorsConfig.java` includes your frontend origin
2. Verify backend is running on port 8080
3. Check SecurityConfig has `.cors(cors -> cors.configure(http))`
4. Clear browser cache and restart dev server

**Problem:** 401 Unauthorized from frontend

**Solutions:**
1. Ensure JWT token is stored in localStorage: `localStorage.setItem('access_token', token)`
2. Verify token is not expired (default: 5 minutes)
3. Check Authorization header format: `Bearer <token>`

For detailed frontend integration documentation, see: `frontend/my-frontend/README.md`

## API Reference
The application includes automated API documentation generated by SpringDoc OpenAPI. It exposes a health check endpoint too.

### Health Check
Returns a simple message to confirm the server is running, connected to the database, and reachable.

* **URL:** `/`
* **Method:** `GET`
* **Success Response:**
  * **Code:** 200 OK
  * **Content:** `Hello World from Spring Boot!`

## Testing

The project implements comprehensive automated testing with **165 test cases** covering multiple layers of the application architecture.

### Test Structure

#### Unit Tests
* **Entity Tests** (48 tests): Validation rules for Category, Resource, and Log entities
* **DTO Tests** (31 tests): Data Transfer Object validation (KeycloakUserDTO, CreateKeycloakUserDTO)
* **Controller Unit Tests** (21 tests): Isolated controller logic with mocked dependencies using `@WebMvcTest`
* **Exception Handler Tests** (9 tests): Global error handling scenarios

#### Integration Tests  
* **Controller Integration Tests** (28 tests): Full HTTP request/response cycle testing with real database
* **Repository Tests** (33 tests): JPA repository operations and custom queries using `@DataJpaTest`

#### Coverage Metrics
The project uses **JaCoCo Maven Plugin** for code coverage analysis.

**Current Coverage:** ~16% (instruction coverage)

**Coverage Breakdown:**
- **Entities:** 100% (Category, Resource, Log)
- **DTOs:** 100% (KeycloakUserDTO, CreateKeycloakUserDTO)
- **Configuration:** 100% (OpenApiConfig)
- **Controllers:** Partial coverage (CategoryController, ResourceController, LogController)
- **Exception Handlers:** Partial coverage (GlobalExceptionHandler)
- **Aspect:** Minimal coverage (AuditAspect - requires runtime environment)
- **Service Layer:** Low coverage (KeycloakUserService requires live Keycloak instance)
- **Security:** Excluded from tests (OAuth2 configuration requires Keycloak)

**Note:** The majority of uncovered code is in the Keycloak integration layer (KeycloakUserService, SecurityConfig) which requires a live identity provider for meaningful testing. This represents ~63% of the uncovered code.

### Running Tests

#### Run All Tests
```bash
./mvnw clean test
```

#### Run Tests with Coverage Report
```bash
./mvnw clean test jacoco:report
```

View the coverage report: `target/site/jacoco/index.html`

#### Run Specific Test Classes
```bash
# Entity tests only
./mvnw test -Dtest=CategoryTest,ResourceTest,LogTest

# Integration tests only
./mvnw test -Dtest=*IntegrationTest

# Repository tests only
./mvnw test -Dtest=*RepositoryTest
```

#### View Coverage Summary (Command Line)
```bash
./mvnw clean test jacoco:report && awk -F, '{ instructions += $4 + $5; covered += $5 } END { print "Total Coverage: " covered/instructions*100 "%" }' target/site/jacoco/jacoco.csv
```

### Manual Testing
A Postman collection is included for manual API testing.
- Location: `docs/resourceManager.postman_collection.json`

### Test Configuration

Tests run with an isolated configuration that excludes security and Keycloak dependencies:
* **Profile:** `test` (activated via `@ActiveProfiles("test")`)
* **Database:** H2 in-memory database (PostgreSQL used in production)
* **Security:** Disabled (`@AutoConfigureMockMvc(addFilters = false)`)
* **OAuth2:** Auto-configuration excluded
* **Data Seeding:** Disabled (via `@Profile("!test")` on `initDatabase()`)

This ensures tests run quickly without external dependencies while still validating business logic and data persistence.

### Visualize the database

```bash
docker exec -it posql psql -U admin -d mydb

mydb=# SELECT * FROM employees;
mydb=# SELECT * FROM categories;
mydb=# \q
```
