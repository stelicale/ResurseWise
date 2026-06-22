# dvloper.io – Full Stack Application

This repository contains the complete source code and deployment instructions for the dvloper.io application, including both backend (Java Spring Boot) and frontend (React) components, containerized and orchestrated with Docker Swarm for high availability.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Production Build & Docker](#production-build--docker)
- [Docker Swarm Deployment](#docker-swarm-deployment)
- [Kubernetes (k3s) Local Deployment](#kubernetes-k3s-local-deployment)
- [Monitoring & Scaling](#monitoring--scaling)
- [References](#references)

## Architecture Overview
- **Backend:** Java 21, Spring Boot 4, PostgreSQL, Keycloak (for authentication)
- **Frontend:** React 19, served via Nginx
- **Orchestration:** Docker Swarm (multi-node, high availability)

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
- **Java 21+** (for backend development)
- **Node.js 18+ & npm 9+** (for frontend development)
- **Docker & Docker Compose**
- **Docker Swarm** (for production/HA deployment)

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

## Docker Swarm Deployment
### 1. Initialize Swarm (on manager node)
- `docker swarm init`

### 2. Join workers (on each worker node)
- `docker swarm join --token <token> <manager-ip>:2377`

### 3. Deploy the stack (on manager)
- `docker stack deploy -c docker-compose.yml mystack`

### 4. Check services and replicas
- `docker stack services mystack`
- `docker stack ps mystack`
- `docker node ls`

### 5. View logs
- `docker service logs mystack_backend`
- `docker service logs mystack_frontend`
- `docker service logs mystack_keycloak`
- `docker service logs mystack_postgres`

### 6. Scale services (example: backend to 3 replicas)
- `docker service scale mystack_backend=3`

## Kubernetes (k3s) Local Deployment
Use the k3s + Traefik setup guide in [k8s/README.md](k8s/README.md) to install k3s without the default Traefik, install Traefik in its own namespace, apply the manifests, and verify local domain routing.

## High Availability & Monitoring
- Services are configured with `deploy.replicas: 2` and `placement.constraints: [node.role == worker]` for HA.
- Use overlay network for inter-node communication.
- Monitor with `docker stack services mystack` and `docker node ls`.
- Avoid overloading nodes with too many replicas.

## Security & Best Practices
- Never commit `.env` files or secrets.
- Use overlay networks for Swarm.
- Regularly monitor cluster health.

## References
- [Docker Swarm Documentation](https://docs.docker.com/engine/swarm/)
- [Docker Stack Deploy](https://docs.docker.com/engine/reference/commandline/stack_deploy/)
- [Spring Boot](https://spring.io/projects/spring-boot)
- [React](https://react.dev/)
- [Keycloak](https://www.keycloak.org/)

## Orchestration Tool Comparison: Docker Swarm vs Kubernetes

### What is Docker Swarm?
Docker Swarm is Docker's native clustering and orchestration solution. It allows you to group multiple Docker hosts (nodes) into a single virtual host, enabling you to deploy, manage, and scale containerized applications across a cluster. Swarm provides service discovery, load balancing, scaling, rolling updates, and high availability using a simple and familiar Docker CLI.

### What is Kubernetes?
Kubernetes is an open-source container orchestration platform originally developed by Google. It automates the deployment, scaling, management, and networking of containerized applications. Kubernetes introduces concepts like pods, deployments, services, and ingress, and is designed for running complex, distributed, and highly available workloads at scale. It is widely adopted in the industry and supported by all major cloud providers.

### Key Differences
- **Complexity:**
   - Docker Swarm is simpler to set up and use, with a gentle learning curve.
   - Kubernetes is more complex, offering advanced features and flexibility for large-scale, production-grade deployments.
- **Architecture:**
   - Swarm uses managers and workers, with built-in clustering and service discovery.
   - Kubernetes uses master and worker nodes, with a rich ecosystem (pods, deployments, services, ingress, etc).
- **Networking:**
   - Swarm uses overlay networks and built-in load balancing.
   - Kubernetes offers advanced networking, ingress controllers, and network policies.
- **Scaling & Updates:**
   - Both support scaling and rolling updates, but Kubernetes provides more granular control and automation.
- **Ecosystem & Community:**
   - Kubernetes has a larger community, more integrations, and is the industry standard for cloud-native workloads.
- **Storage & Volumes:**
   - Kubernetes supports a wider range of persistent storage options and dynamic provisioning.
- **Monitoring & Logging:**
   - Kubernetes has richer built-in and third-party monitoring/logging solutions.

### Pros & Cons

#### Docker Swarm
**Pros:**
- Easy to learn and set up
- Integrated with Docker CLI
- Fast deployments
- Good for small/medium projects and teams

**Cons:**
- Limited advanced features
- Smaller community and ecosystem
- Less support for complex networking and storage
- Not as widely adopted in enterprise/cloud

#### Kubernetes
**Pros:**
- Highly scalable and flexible
- Rich ecosystem and integrations
- Advanced networking, storage, and security
- Supported by all major cloud providers

**Cons:**
- Steeper learning curve
- More complex setup and management
- Can be overkill for small/simple projects

### Recommendation
For this application, Docker Swarm is a suitable choice because:
- The stack is not extremely complex and does not require advanced orchestration features.
- The team can benefit from Swarm's simplicity and fast setup.
- Swarm provides high availability and scaling, which are sufficient for current needs.

However, if the application grows in complexity, requires multi-cloud/hybrid deployments, or needs advanced networking, security, or storage, migrating to Kubernetes should be considered.

### Research Summary
- Key differences, pros, and cons are documented above.
- Docker Swarm is currently more suitable for this project, but Kubernetes is recommended for future scalability and enterprise needs.

### References
- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [Docker Swarm Documentation](https://docs.docker.com/engine/swarm/)

*Decision made based on current project requirements, team expertise, and infrastructure. Not solely on popularity.*