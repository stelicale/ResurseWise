# Backend Framework Setup

This repository contains the initial backend setup for the application, built using **Java** and the **Spring Boot** framework.
The project serves as a foundation for the API development and demonstrates a proper development environment configuration.

## Tech Stack

* **Language:** Java 21 (JDK 21.0.9)
* **Framework:** Spring Boot 4.0.1
* **Build Tool:** Maven (using the included `mvnw` wrapper)
* **Server:** Apache Tomcat 11.0.15 (Embedded)

## Getting Started

### Prerequisites
Ensure you have a Java Development Kit (JDK) **version 21 or higher** installed.

## Run
```bash
mvn spring-boot:run
```

The server will start on port **8080**.

## API Reference

Currently, the application exposes a single endpoint for testing server availability.

### Health Check

Returns a simple message to confirm the server is running and reachable.

* **URL:** `/`
* **Method:** `GET`
* **Success Response:**
  * **Code:** 200 OK
  * **Content:** `Hello World from Spring Boot!`

### Testing Example

To verify the endpoint from your terminal while the server is running:

```bash
curl http://localhost:8080/
```
