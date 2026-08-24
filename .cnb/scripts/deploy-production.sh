#!/usr/bin/env bash

set -euo pipefail

require_env() {
  local name="$1"

  if [ -z "${!name:-}" ]; then
    echo "DEPLOY_CONFIGURATION_MISSING: $name is required" >&2
    exit 1
  fi
}

for required_env in \
  BACKEND_DEPLOY_HOST \
  BACKEND_DEPLOY_USER \
  BACKEND_DEPLOY_SSH_PRIVATE_KEY \
  BACKEND_PM2_APP_NAME; do
  require_env "$required_env"
done

SSH_PORT="${BACKEND_DEPLOY_SSH_PORT:-233}"
REMOTE_DEPLOY_PATH="${BACKEND_REMOTE_DEPLOY_PATH:-/www/wwwroot/aurlemon-intro}"
REMOTE_TEMP_DIR="/tmp/aurlemon-intro-deploy-${CNB_BUILD_ID:-manual}"

case "${BASELINE_EXISTING_DB:-false}" in
  true | false) ;;
  *)
    echo 'DEPLOY_CONFIGURATION_INVALID: BASELINE_EXISTING_DB must be true or false' >&2
    exit 1
    ;;
esac

case "${RUN_USER_IDENTITY_MIGRATION:-false}" in
  true | false) ;;
  *)
    echo 'DEPLOY_CONFIGURATION_INVALID: RUN_USER_IDENTITY_MIGRATION must be true or false' >&2
    exit 1
    ;;
esac

test -f deploy-artifact/.output/server/index.mjs
test -f deploy-artifact/prisma/schema.prisma
test -f deploy-artifact/prisma/migrations/migration_lock.toml
test -f deploy-artifact/node_modules/.bin/prisma
if [ "${RUN_USER_IDENTITY_MIGRATION:-false}" = 'true' ]; then
  test -f deploy-artifact/.scripts-dist/migrate-social-users.js
fi
test -f deploy-artifact/data/ip2region/ip2region_v4.xdb

install -d -m 700 ~/.ssh
printf '%s\n' "$BACKEND_DEPLOY_SSH_PRIVATE_KEY" > ~/.ssh/deploy_key
chmod 600 ~/.ssh/deploy_key
ssh-keyscan -p "$SSH_PORT" "$BACKEND_DEPLOY_HOST" >> ~/.ssh/known_hosts

cat > ~/.ssh/config <<EOF
Host deploy-host
  HostName $BACKEND_DEPLOY_HOST
  User $BACKEND_DEPLOY_USER
  Port $SSH_PORT
  IdentityFile ~/.ssh/deploy_key
  StrictHostKeyChecking yes
  ServerAliveInterval 10
  ServerAliveCountMax 3
  ConnectTimeout 30
EOF
chmod 600 ~/.ssh/config

ssh deploy-host "mkdir -p '$REMOTE_TEMP_DIR'"
rsync -az --delete deploy-artifact/ "deploy-host:$REMOTE_TEMP_DIR/"

ssh deploy-host \
  "export REMOTE_DEPLOY_PATH='$REMOTE_DEPLOY_PATH' \
  REMOTE_TEMP_DIR='$REMOTE_TEMP_DIR' \
  PM2_APP_NAME='$BACKEND_PM2_APP_NAME' \
  BASELINE_EXISTING_DB='${BASELINE_EXISTING_DB:-false}' \
  RUN_USER_IDENTITY_MIGRATION='${RUN_USER_IDENTITY_MIGRATION:-false}'; bash -s" <<'EOF'
set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo 'DEPLOY_RUNTIME_MISSING_NODE: node is required on remote host' >&2
  exit 1
fi

load_dotenv() {
  local env_file="$1"
  local dotenv_dump

  dotenv_dump="$(mktemp)"
  chmod 600 "$dotenv_dump"
  if ! ENV_FILE="$env_file" node --input-type=module -e '
    import { readFileSync } from "node:fs"
    import { parseEnv } from "node:util"

    const values = parseEnv(readFileSync(process.env.ENV_FILE, "utf8"))
    for (const [key, value] of Object.entries(values)) {
      process.stdout.write(`${key}\0${value}\0`)
    }
  ' >"$dotenv_dump"; then
    rm -f -- "$dotenv_dump"
    echo "DEPLOY_DOTENV_INVALID: failed to parse $env_file" >&2
    exit 1
  fi

  while IFS= read -r -d '' key && IFS= read -r -d '' value; do
    export "$key=$value"
  done <"$dotenv_dump"
  rm -f -- "$dotenv_dump"
}

mkdir -p "$REMOTE_DEPLOY_PATH"
if [ -f "$REMOTE_DEPLOY_PATH/.env" ]; then
  load_dotenv "$REMOTE_DEPLOY_PATH/.env"
fi

if [ -z "${DATABASE_URL:-}" ] || [[ "$DATABASE_URL" != file:* ]]; then
  echo 'DEPLOY_DATABASE_URL_INVALID: a file: SQLite DATABASE_URL is required' >&2
  exit 1
fi

database_url_path="${DATABASE_URL#file:}"
if [[ "$database_url_path" = /* ]]; then
  database_path="$database_url_path"
else
  database_path="$(realpath -m "$REMOTE_DEPLOY_PATH/prisma/$database_url_path")"
fi
export DATABASE_URL="file:$database_path"

if [ ! -f "$database_path" ]; then
  echo "DEPLOY_DATABASE_MISSING: $database_path" >&2
  exit 1
fi

STAGED_PRISMA_CLI="$REMOTE_TEMP_DIR/node_modules/.bin/prisma"
MIGRATION_SCRIPT="$REMOTE_TEMP_DIR/.scripts-dist/migrate-social-users.js"
if [ ! -x "$STAGED_PRISMA_CLI" ]; then
  echo 'DEPLOY_ARTIFACT_MISSING_PRISMA: Prisma CLI is required in the deployment artifact' >&2
  exit 1
fi
if [ "$RUN_USER_IDENTITY_MIGRATION" = 'true' ] && [ ! -f "$MIGRATION_SCRIPT" ]; then
  echo 'DEPLOY_ARTIFACT_MISSING_USER_MIGRATION: the user identity migration script is required when enabled' >&2
  exit 1
fi

manifest_path="$REMOTE_TEMP_DIR/social-users.social-user-manifest.json"
needs_user_migration=false
if [ "$RUN_USER_IDENTITY_MIGRATION" = 'true' ]; then
  migration_status="$(cd "$REMOTE_TEMP_DIR" && node "$MIGRATION_SCRIPT" --status | tail -n 1)"
  case "$migration_status" in
    USER_IDENTITY_MIGRATION_STATUS=complete)
      echo 'USER_IDENTITY_MIGRATION_SKIPPED: migration is already complete'
      ;;
    USER_IDENTITY_MIGRATION_STATUS=pending | USER_IDENTITY_MIGRATION_STATUS=incomplete)
      needs_user_migration=true
      ;;
    *)
      echo "DEPLOY_MIGRATION_STATUS_INVALID: $migration_status" >&2
      exit 1
      ;;
  esac

  if [ "$needs_user_migration" = 'true' ]; then
    (cd "$REMOTE_TEMP_DIR" && node "$MIGRATION_SCRIPT" --check --manifest "$manifest_path")
  fi
else
  echo 'USER_IDENTITY_MIGRATION_DISABLED: skipping the one-time user backfill'
fi

rollback_dir="${REMOTE_TEMP_DIR}-rollback"
mkdir -p "$rollback_dir"
had_previous_app=false
if [ -f "$REMOTE_DEPLOY_PATH/.output/server/index.mjs" ]; then
  had_previous_app=true
  rsync -a --no-owner --no-group --delete \
    --exclude='.env' \
    --exclude='backups/' \
    --exclude='*.db' \
    --exclude='*.db-journal' \
    "$REMOTE_DEPLOY_PATH/" \
    "$rollback_dir/"
fi

backup_dir="$REMOTE_DEPLOY_PATH/backups"
mkdir -p "$backup_dir"
database_mode="$(stat -c '%a' "$database_path")"
database_backup="$backup_dir/user-identity-$(date -u +%Y%m%dT%H%M%SZ).db"
cp -p -- "$database_path" "$database_backup"
chmod 400 "$database_backup"

had_pm2_app=false
if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
  had_pm2_app=true
  pm2 stop "$PM2_APP_NAME"
fi

deployment_succeeded=false
rollback_on_exit() {
  exit_code=$?
  trap - EXIT
  if [ "$deployment_succeeded" != 'true' ]; then
    echo 'DEPLOY_FAILED: restoring the database and previous application' >&2
    pm2 stop "$PM2_APP_NAME" >/dev/null 2>&1 || true
    cp -- "$database_backup" "$database_path"
    chmod "$database_mode" "$database_path"
    if [ "$had_previous_app" = 'true' ]; then
      rsync -a --no-owner --no-group --delete \
        --exclude='.env' \
        --exclude='backups/' \
        --exclude='*.db' \
        --exclude='*.db-journal' \
        "$rollback_dir/" \
        "$REMOTE_DEPLOY_PATH/"
      if [ "$had_pm2_app" = 'true' ]; then
        pm2 restart "$PM2_APP_NAME" --update-env || true
      else
        pm2 start "$REMOTE_DEPLOY_PATH/.output/server/index.mjs" --name "$PM2_APP_NAME" --cwd "$REMOTE_DEPLOY_PATH" || true
      fi
      pm2 save || true
    fi
  fi
  exit "$exit_code"
}
trap rollback_on_exit EXIT

rsync -a --no-owner --no-group --delete \
  --exclude='.env' \
  --exclude='backups/' \
  --exclude='*.db' \
  --exclude='*.db-journal' \
  "$REMOTE_TEMP_DIR/" \
  "$REMOTE_DEPLOY_PATH/"

cd "$REMOTE_DEPLOY_PATH"
PRISMA_CLI='./node_modules/.bin/prisma'

if [ "$BASELINE_EXISTING_DB" = 'true' ]; then
  "$PRISMA_CLI" migrate resolve --applied 20250202232641_init
  "$PRISMA_CLI" migrate resolve --applied 20260405000000_social_features
  "$PRISMA_CLI" migrate resolve --applied 20260406132000_message_comment_pin
fi

"$PRISMA_CLI" migrate deploy

if [ "$needs_user_migration" = 'true' ]; then
  node ./.scripts-dist/migrate-social-users.js --apply --manifest "$manifest_path"
  node ./.scripts-dist/migrate-social-users.js --verify --manifest "$manifest_path"
fi

if [ "$had_pm2_app" = 'true' ]; then
  pm2 restart "$PM2_APP_NAME" --update-env
else
  pm2 start "$REMOTE_DEPLOY_PATH/.output/server/index.mjs" --name "$PM2_APP_NAME" --cwd "$REMOTE_DEPLOY_PATH"
fi
pm2 save

healthcheck_url="${NUXT_SITE_URL%/}/api/health"
healthcheck_ok=false
for _ in $(seq 1 15); do
  if HEALTHCHECK_URL="$healthcheck_url" node --input-type=module -e '
    const base = process.env.HEALTHCHECK_URL
    const health = await fetch(base)
    if (!health.ok || (await health.json()).ok !== true) process.exit(1)
    const origin = new URL(base).origin
    for (const path of ["/api/auth/me", "/api/messages?page=1&pageSize=1"]) {
      const response = await fetch(`${origin}${path}`)
      if (!response.ok) process.exit(1)
    }
  ' >/dev/null 2>&1; then
    healthcheck_ok=true
    break
  fi
  sleep 2
done
if [ "$healthcheck_ok" != 'true' ]; then
  echo "DEPLOY_HEALTHCHECK_FAILED: $healthcheck_url" >&2
  exit 1
fi

deployment_succeeded=true
rm -rf -- "$REMOTE_TEMP_DIR" "$rollback_dir"
echo "DEPLOY_DATABASE_BACKUP: $database_backup"
EOF
