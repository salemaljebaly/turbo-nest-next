# Observability

The API exposes Prometheus metrics at `/api/metrics` when called with
`Authorization: Bearer $METRICS_TOKEN`.

The single-server deploy profile includes an optional Grafana Alloy service:

```bash
docker compose --env-file deploy/single-server/.env \
  -f deploy/single-server/docker-compose.yml \
  --profile observability up -d alloy
```

Configure these variables in `deploy/single-server/.env`:

- `GRAFANA_CLOUD_PROMETHEUS_URL`
- `GRAFANA_CLOUD_PROMETHEUS_USERNAME`
- `GRAFANA_CLOUD_PROMETHEUS_TOKEN`
- `GRAFANA_CLOUD_LOKI_URL`
- `GRAFANA_CLOUD_LOKI_USERNAME`
- `GRAFANA_CLOUD_LOKI_TOKEN`

Alloy tails Docker container logs and scrapes the API metrics endpoint. Keep the
profile disabled until credentials are present.
