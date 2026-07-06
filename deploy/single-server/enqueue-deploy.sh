#!/usr/bin/env bash
set -Eeuo pipefail

commit_sha="${1:?full commit SHA is required}"
run_id="${2:-local}"
lock_file="${TEMPLATE_DEPLOY_LOCK_FILE:-/var/lock/template-deploy.lock}"

if [[ ! "$commit_sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "A full 40-character commit SHA is required" >&2
  exit 2
fi

exec 9>"$lock_file"
if ! flock -n 9; then
  echo "Another deployment is already queued or running" >&2
  exit 1
fi

"$(dirname "$0")/async-deploy.sh" "$commit_sha" "$run_id"
