# Deploying the portfolio

Target topology: `portfolio.bsoapp.net` → Cloudflare Tunnel → Traefik (k3s) → this
chart (web + api) in the `portfolio` namespace, with images from GHCR.

## 1. Images

GitHub Actions (`.github/workflows/web-ci.yml`, `api-ci.yml`) builds and pushes on every
push to `main`:

- `ghcr.io/bruno303/portfolio-web:<sha>` and `:latest`
- `ghcr.io/bruno303/portfolio-api:<sha>` and `:latest`

The GHCR packages are private by default; either flip them to public once, or add an
image pull secret to the namespace.

## 2. Helm values for the homelab

Add a production values file to this repo at `helm/portfolio/values-prod.yaml`:

```yaml
web:
  image:
    tag: "<sha-or-latest>"
  env:
    API_BASE_URL: "http://portfolio-api:8080"

api:
  image:
    tag: "<sha-or-latest>"
  prometheus:
    url: "http://prometheus-server.monitoring.svc.cluster.local"
  services:
    - id: planning-poker-api
      name: "Planning Poker API"
      namespace: production
      podRegex: "planning-poker-backend.*"
    - id: planning-poker-web
      name: "Planning Poker Web"
      namespace: production
      podRegex: "planning-poker-frontend.*"

ingress:
  enabled: true
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web
  hosts:
    - host: portfolio.bsoapp.net
      paths:
        - path: /
          pathType: Prefix
```

## 2.1 Environment variables and secrets

No credential or environment-specific URL is baked into the images. Deploy-time
settings flow through Helm values and env vars:

- **web (Next.js BFF):** `API_BASE_URL` points at the api service, set from values.
  `web.extraEnv` (a values list) adds any other variable; `web.envFrom`
  (secretRef/configMapRef) pulls values from a Secret so nothing sensitive sits in
  git.
- **api (Go):** the config baseline is compiled into the image
  (`api/config/config.yaml`); Helm values are rendered directly into env vars
  (`PORT`, `PROMETHEUS_URL`, `LOG_LEVEL`, `CORS_ALLOWED_ORIGINS`,
  `PROMETHEUS_QUERY_TIMEOUT`, `PROMETHEUS_CACHE_TTL`, `SERVICES`,
  `CUSTOM_METRICS`), so no ConfigMap is involved. `api.extraEnv` /
  `api.envFrom` work like the web ones.

Example secret wiring — create the Secret outside the chart, or sync it with the
External Secrets Operator as done for the other homelab services:

```yaml
web:
  envFrom:
    - secretRef:
        name: portfolio-secrets
```

For completeness: the URLs and profile data in `web/src` are public portfolio
content by design, and a repository audit found no tokens or credentials to move
out of source.

## 3. ArgoCD application

Add `self_hosted/k8s/argo/apps/portfolio.yaml` to the `study-topics` repo following the
existing pattern:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: portfolio
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/bruno303/portfolio
    targetRevision: main
    path: helm/portfolio
    helm:
      valueFiles:
        - values.yaml
        - values-prod.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: portfolio
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

The alternative used by planning-poker is to render manifests
(`helm template portfolio helm/portfolio -f values-prod.yaml`) into
`self_hosted/k8s/portfolio/` and point ArgoCD at those files. Chart-direct is preferred
here so image bumps are a one-line values change.

## 4. Cloudflare Tunnel + DNS

In the cloudflared configuration, add a public hostname:

```yaml
- hostname: portfolio.bsoapp.net
  service: http://traefik.kube-system.svc.cluster.local:80
```

and create the matching `CNAME` in Cloudflare DNS. TLS is terminated by Cloudflare, the
same as the other services (`planning-poker.bsoapp.net`, `chat.bsoapp.net`).

## 5. Verify

```bash
kubectl -n portfolio get pods
kubectl -n portfolio port-forward svc/portfolio-web 3000:3000
curl -s http://portfolio-api:8080/healthz   # from inside the cluster
curl -s https://portfolio.bsoapp.net/api/live/services | jq
```
