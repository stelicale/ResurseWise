# Kubernetes (k3s) local setup

This folder contains manifests and Traefik values for running the stack on k3s.

## 1) Install k3s without default Traefik

```bash
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable=traefik" sh -
```

Verify:

```bash
sudo k3s kubectl get nodes
```

## 2) Configure kubectl

```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
kubectl get nodes
```

## 3) Install Traefik in dedicated namespace

```bash
kubectl create namespace traefik
helm repo add traefik https://traefik.github.io/charts
helm repo update
helm upgrade --install traefik traefik/traefik -n traefik -f k8s/traefik/values.yaml
kubectl get pods -n traefik
```

## 4) Build and load images into k3s

```bash
docker build -t dvloper-backend:local ./backend
docker build -t dvloper-frontend:local ./frontend/my-frontend

docker save dvloper-backend:local -o /tmp/dvloper-backend.tar
docker save dvloper-frontend:local -o /tmp/dvloper-frontend.tar

sudo k3s ctr images import /tmp/dvloper-backend.tar
sudo k3s ctr images import /tmp/dvloper-frontend.tar
```

## 5) Deploy manifests

```bash
kubectl apply -f k8s/manifests/
kubectl get pods -n dvloper
```

## 6) Local domain mapping

Add to hosts file:

- Windows: C:\\Windows\\System32\\drivers\\etc\\hosts
- Linux/WSL: /etc/hosts

```text
127.0.0.1 dvloper.local
```

## 7) Verify routing

```bash
kubectl get ingress -n dvloper
curl -H "Host: dvloper.local" http://127.0.0.1/
curl -i -H "Host: dvloper.local" http://127.0.0.1/api/resources
curl -H "Host: dvloper.local" http://127.0.0.1/keycloak/realms/ITResurceManager
```

Open in browser:

- http://dvloper.local
