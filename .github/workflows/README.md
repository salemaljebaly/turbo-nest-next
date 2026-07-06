# GitHub Workflows

- `ci.yml` runs lint, type checks, API contract checks, tests, builds, Docker
  image builds, and E2E tests for pull requests and `main`.
- `deploy-staging.yml` queues an exact commit on a single-server host after CI
  succeeds on `main`, or manually through `workflow_dispatch`.

## Staging Deploy Secrets

Set these repository secrets before enabling staging deploys:

- `DEPLOY_SSH_HOST`
- `DEPLOY_SSH_PORT` (optional, defaults to `22`)
- `DEPLOY_SSH_USER` (optional, defaults to `template-deploy`)
- `DEPLOY_SSH_KEY`
- `DEPLOY_SSH_KNOWN_HOSTS`

The remote host should expose an `enqueue` command that calls
`deploy/single-server/enqueue-deploy.sh`.
