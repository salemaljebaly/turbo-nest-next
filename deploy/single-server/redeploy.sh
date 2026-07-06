#!/usr/bin/env bash
set -Eeuo pipefail

cd "${TEMPLATE_REPO_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
git fetch --all --prune
git checkout main
git pull --ff-only
deploy/single-server/deploy.sh
