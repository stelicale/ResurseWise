# CI/CD-ready Kubernetes manifests

This folder provides generalized Kubernetes manifests using Kustomize. The base
uses placeholder images and env values suitable for CI/CD substitution. The
`overlays/test` layer is configured for local Traefik routing and sample images
(`nginx:alpine`) for testing when the real app images are not yet in a registry.

## Test deploy (sample images)

```bash
kubectl apply -k k8s/cicd/overlays/test
kubectl get pods -n dvloper
kubectl get ingress -n dvloper
```

## Verify routing

```bash
curl -i -H "Host: dvloper.local" http://<node-ip>:30080/
curl -i -H "Host: dvloper.local" http://<node-ip>:30080/api/
```

## CI/CD usage

- Replace images via `kustomize edit set image` in pipeline stages.
- Replace secrets using sealed secrets or CI secret injection.
- Update the ingress host with an overlay patch per environment.

Example:

```bash
kustomize edit set image frontend-image=harbor.dvloper.io/core-competencies-academy-2026/<name>/frontend:1.2.3
kustomize edit set image backend-image=harbor.dvloper.io/core-competencies-academy-2026/<name>/backend:1.2.3
```

## Registry details (for CI/CD)

- Registry: `https://harbor.dvloper.io/`
- Project: `core-competencies-academy-2026`
- Image naming convention: `core-competencies-academy-2026/<name>/frontend` and
	`core-competencies-academy-2026/<name>/backend` (use your short name/alias for `<name>`)

### Recommended GitLab CI variables

Store these as masked/protected variables in GitLab (do **not** commit credentials to the repo):

- `HARBOR_REGISTRY` = `harbor.dvloper.io`
- `HARBOR_PROJECT` = `core-competencies-academy-2026`
- `HARBOR_USERNAME` = robot username
- `HARBOR_PASSWORD` = robot secret
- `IMAGE_PREFIX` = your alias (used in image path)

## Notes

- `backend-secrets` uses placeholder values and must be injected by the pipeline.
- `frontend-config` mounts an Nginx config that proxies `/api` to the backend service.
