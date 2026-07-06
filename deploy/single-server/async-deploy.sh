#!/usr/bin/env bash
set -Eeuo pipefail

commit_sha="${1:?full commit SHA is required}"
run_id="${2:-local}"
repo_dir="${TEMPLATE_REPO_DIR:-/opt/turbo-nest-next}"
log_dir="${TEMPLATE_DEPLOY_LOG_DIR:-/var/log/template-deployments}"

mkdir -p "$log_dir"
log_file="$log_dir/$run_id.log"

(
  cd "$repo_dir"
  git fetch --all --prune
  git checkout --detach "$commit_sha"
  deploy/single-server/deploy.sh
) >"$log_file" 2>&1 &

echo "Queued deployment $run_id for $commit_sha"
echo "Log: $log_file"
