# Backend Application

This repository contains the backend source code for the application, built using **Java** and **Spring Boot**.
It serves as the REST API foundation, managing data persistence via PostgreSQL and exposing endpoints for the frontend integration.

## 🛠 Tech Stack
* **Language:** Java 21 (JDK 21.0.9)
* **Framework:** Spring Boot 4.0.1
* **Database:** PostgreSQL (via Docker)
* **Build Tool:** Maven (using the included `mvnw` wrapper)
* **Server:** Apache Tomcat 11.0.15 (Embedded)

## Getting Started

### Prerequisites
1. **Java Development Kit (JDK):** Version 21 or higher.
2. **Docker:** Required to run the PostgreSQL database container.

### 1. Database Setup
The application requires a PostgreSQL database running in a Docker container.

Run the following command to start the database:

docker run --name posql \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=mydb \
  -p 5432:5432 \
  -d postgres

### 2. Configuration (Security)
**WARNING:** Database credentials are not stored in the source code.
The application uses environment variables for configuration. You must provide them when running the app.

* `DB_USER`: Database username (default dev: `admin`)
* `DB_PASSWORD`: Database password (default dev: `secret`)

### 3. Running the Application
To start the Spring Boot server with the required environment variables:

**Linux/macOS:**
DB_USER=admin DB_PASSWORD=secret ./mvnw spring-boot:run

**Windows (PowerShell):**
$env:DB_USER="admin"; $env:DB_PASSWORD="secret"; .\mvnw.cmd spring-boot:run

The server will start on port **8080**.

## Data Model & Architecture

### Database Schema
The application manages the following entities:
* **Employees** (Users synced with Keycloak)
* **Resources** (Equipment)
* **Categories** (Resource types)
* **Logs** (Audit trail for actions)

### UUID Strategy
To ensure consistency with the Identity Provider (Keycloak) and facilitate future scalability:
* **All Primary Keys are UUIDs.**
* The **Employee ID** is not auto-generated; it mirrors the User ID received from Keycloak.

### Data Seeding
On startup, the application checks if the database is empty. If so, a `CommandLineRunner` script automatically seeds the database with initial test data (Admin user, default categories, and resources) to facilitate immediate testing.

## API Reference

Currently, the application exposes a health check endpoint.

### Health Check
Returns a simple message to confirm the server is running, connected to the database, and reachable.

* **URL:** `/`
* **Method:** `GET`
* **Success Response:**
  * **Code:** 200 OK
  * **Content:** `Hello World from Spring Boot!`

### Testing Example
To verify the endpoint from your terminal:

```bash
curl http://localhost:8080/
```
