# ResurseWise

Allows the company to manage staff equipment, including laptops, PCs, mobile phones, software subscriptions, and office chairs. There are two types of users: Administrators, who can add, modify, or remove equipment, and Employees, who can only view their assigned equipment. The platform helps streamline resource tracking, improve accountability, and ensure efficient resource allocation.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Production Build & Docker](#production-build--docker)
- [Kubernetes (k3s) Local Deployment](#kubernetes-k3s-local-deployment)
- [Monitoring & Scaling](#monitoring--scaling)
- [References](#references)

## Architecture Overview
- **Backend:** Java 21, Spring Boot 4, PostgreSQL, Keycloak (for authentication)
- **Frontend:** React 19, served via Nginx
- **Orchestration:** Kubernetes (container orchestration for scaling, self-healing, and service management)
- **CI/CD:** Git-based automation pipeline using container build and deployment workflows

## Tech Stack
### Backend
- Java 21 (JDK 21.0.9)
- Spring Boot 4.0.1
- Spring Security, OAuth2 Resource Server
- Keycloak (Identity Provider)
- PostgreSQL (Database)
- Maven (Build Tool)
- JUnit 5, Mockito, JaCoCo (Testing & Coverage)

### Frontend
- React 19.2.4 (Create React App)
- React Router DOM v6
- Axios, keycloak-js, react-toastify
- Jest, React Testing Library
- ESLint, Prettier

## Prerequisites
- Java 21+
- Node.js 18+
- npm 9+
- Docker & Docker Compose
- Kubernetes cluster (k3s recommended for local deployment)
- kubectl configured access to cluster
- Harbor (or other container registry) access for images

## Local Development
### Backend
1. Start PostgreSQL and Keycloak using Docker Compose:
   - `docker compose --env-file backend/.env up -d --build`
2. Start backend server:
   - `cd backend`
   - `./mvnw spring-boot:run`

### Frontend
1. Install dependencies:
   - `cd frontend/my-frontend`
   - `npm ci`
2. Start development server:
   - `npm start`

## Production Build & Docker
### Backend
- Build Docker image:
  - `cd backend`
  - `docker build -t dvloper-backend .`

### Frontend
- Build Docker image:
  - `cd frontend/my-frontend`
  - `docker build -t dvloper-frontend .`

## Kubernetes Deployment

The application is deployed using Kubernetes manifests. For local environments, a lightweight distribution such as k3s can be used.`

### Apply manifests
- `kubectl apply -f k8s/`

### Check resources
- `kubectl get pods`
- `kubectl get services`
- `kubectl get deployments`

### Check rollout status
- `kubectl rollout status deployment/backend`
- `kubectl rollout status deployment/frontend`

### View logs
- `kubectl logs -f deployment/backend`
- `kubectl logs -f deployment/frontend`

## CI/CD Pipeline

The project uses GitHub Actions for automated CI/CD:

- Pipeline flow:
	1. Trigger on push to repository
	2. Build Docker images for frontend and backend
	3. Push images to container registry (e.g. Harbor)
	4. Deploy updated images to Kubernetes cluster using kubectl

- Key features:
	- Automatic builds per commit (github.sha tagging)
	- Separate pipelines for frontend and backend
	- Self-hosted runner for deployment to Kubernetes cluster
	- Manual trigger option via GitHub Actions (workflow_dispatch)

## Security & Best Practices

- Sensitive data is managed via environment variables and Kubernetes secrets
- `.env` files are excluded from version control
- Container images are versioned using commit SHA
- Access to cluster is controlled via kubeconfig and RBAC
