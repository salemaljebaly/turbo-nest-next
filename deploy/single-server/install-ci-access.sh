#!/usr/bin/env bash
set -Eeuo pipefail

install -d -m 0755 /usr/local/bin
install -m 0755 "$(dirname "$0")/enqueue-deploy.sh" /usr/local/bin/enqueue
install -m 0755 "$(dirname "$0")/async-deploy.sh" /usr/local/bin/template-async-deploy
echo "Installed enqueue commands. Configure SSH forced command or deploy user PATH."
