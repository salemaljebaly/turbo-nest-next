#!/usr/bin/env bash
set -Eeuo pipefail

host="${DEPLOY_SSH_HOST:?DEPLOY_SSH_HOST is required}"
user="${DEPLOY_SSH_USER:-template-deploy}"
port="${DEPLOY_SSH_PORT:-22}"
sha="${1:-$(git rev-parse HEAD)}"

ssh -p "$port" "$user@$host" "enqueue $sha local"
