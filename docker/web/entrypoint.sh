#!/bin/sh
# Starts as root only to make sure the app user owns /data (Docker creates a
# missing bind-mount folder as root), then drops to that user to run Bob.
set -e

APP_UID="${APP_UID:-1000}"
APP_GID="${APP_GID:-1000}"

if [ "$(id -u)" = "0" ]; then
  mkdir -p /data
  find /data \( ! -user "$APP_UID" -o ! -group "$APP_GID" \) -exec chown "$APP_UID:$APP_GID" {} +
  exec setpriv --reuid="$APP_UID" --regid="$APP_GID" --clear-groups -- "$@"
fi

exec "$@"
