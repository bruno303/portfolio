# Deploying the portfolio

Target topology: `portfolio.bsoapp.net` → Cloudflare Tunnel → Traefik (k3s) → this
chart (web + api) in the `portfolio` namespace, with images from GHCR.

## 1. Images

GitHub Actions (`.github/workflows/web-ci.yml`, `api-ci.yml`) builds and pushes on every
push to `main`:

- `ghcr.io/bruno303/portfolio-web:<sha>` and `:latest`
- `ghcr.io/bruno303/portfolio-api:<sha>` and `:latest`

The GHCR packages are public; no image pull secret is needed.

## 2. Helm values for the homelab

`helm/portfolio/values-prod.yaml` is checked in and is the source of truth for the
homelab. It pins each image to a commit sha with `pullPolicy: IfNotPresent`, enables the
Traefik ingress for `portfolio.bsoapp.net`, and relies on the chart defaults for
`API_BASE_URL`, the Prometheus URL, the curated services and CORS.

The pins are written by `.github/workflows/release.yml`: after `web-ci` or `api-ci`
publishes an image for a merge to `main`, it commits
`chore(deploy): pin <web|api> image to <sha>` into `values-prod.yaml`. That commit is
what changes the rendered pod template, so ArgoCD (30s reconciliation, no webhook picks
it up) syncs and rolls the Deployment. Pushes made with `GITHUB_TOKEN` do not retrigger
workflows, so the bot commit runs no CI; a failed release leaves the previous sha in
place.

Rollback: re-pin a previous sha tag (or `git revert` the pin commit) and ArgoCD rolls
back; the sha images stay in GHCR. Re-running CI for a sha that is already pinned is not
picked up (same tag, `IfNotPresent`): land a new commit instead.

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

Sha pins are what trigger the rollout, so the Application needs no
`ignoreDifferences` for `kubectl rollout restart` annotations.

The alternative used by planning-poker is to render manifests
(`helm template portfolio helm/portfolio -f values-prod.yaml`) into
`self_hosted/k8s/portfolio/` and point ArgoCD at those files. Chart-direct is preferred
here so the chart stays the single source of truth for the deploy.

The Application cannot render until `helm/portfolio/values-prod.yaml` exists on `main`,
so push the portfolio changes first.

## 4. Cloudflare Tunnel + DNS

The tunnel is token-managed and already forwards `bsoapp.net` hostnames to Traefik, and
DNS already covers the domain, with TLS terminated by Cloudflare as for the other
services (`planning-poker.bsoapp.net`, `chat.bsoapp.net`). No per-service Cloudflare
change is required; the chart's Traefik ingress (`web` entrypoint) routes the host to
the web Service.

## 5. Verify

```bash
kubectl -n portfolio get pods
# image column must show the sha pinned in values-prod.yaml
kubectl -n portfolio get deploy \
  -o custom-columns=NAME:.metadata.name,IMAGE:.spec.template.spec.containers[0].image
kubectl -n portfolio get ingress
kubectl -n portfolio port-forward svc/portfolio-web 3000:3000
curl -s http://portfolio-api:8080/healthz   # from inside the cluster
curl -s https://portfolio.bsoapp.net/api/live/services | jq
curl -s https://portfolio.bsoapp.net/api/live/metrics | jq
```
