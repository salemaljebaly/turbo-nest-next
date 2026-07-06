#!/usr/bin/env bash
set -Eeuo pipefail

token="$("$(dirname "$0")/github-app-token.sh")"
echo "username=x-access-token"
echo "password=$token"
