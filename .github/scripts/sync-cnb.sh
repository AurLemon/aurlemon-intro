#!/usr/bin/env bash
set -euo pipefail

: "${CNB_REPOSITORY_SLUG:?CNB_REPOSITORY_SLUG is required}"
: "${CNB_TOKEN:?CNB_TOKEN is required}"

# The destination is a repository slug, never an arbitrary credential-bearing URL.
if [[ ! "$CNB_REPOSITORY_SLUG" =~ ^[A-Za-z0-9_.-]+(/[A-Za-z0-9_.-]+)+$ ]]; then
	printf '%s\n' 'INVALID_CNB_REPOSITORY_SLUG' >&2
	exit 1
fi

branch=main
source_sha=$(git rev-parse HEAD)
if [[ "$source_sha" != "$(git rev-parse "refs/remotes/origin/$branch")" ]]; then
	printf '%s\n' 'CNB_SYNC_REQUIRES_CHECKED_OUT_ORIGIN_MAIN' >&2
	exit 1
fi

git lfs version
# Fetch all LFS versions reachable from this branch so CNB history works too.
git lfs fetch --all origin "$source_sha"
git lfs fsck --objects "$source_sha"

remote=cnb-media-sync
temporary=$(mktemp -d)
remote_added=false
cleanup() {
	if [[ "$remote_added" == true ]]; then
		git remote remove "$remote"
	fi
	rm -rf "$temporary"
}
trap cleanup EXIT

git remote add "$remote" "https://cnb.cool/${CNB_REPOSITORY_SLUG%.git}.git"
remote_added=true

# Read the secret only at prompt time. Never persist it in a URL or Git config.
cat > "$temporary/askpass" <<'ASKPASS'
#!/usr/bin/env bash
case "$1" in
	*Username*https://cnb.cool*) printf '%s\n' cnb ;;
	*Password*https://cnb.cool*|*Password*https://cnb@cnb.cool*) printf '%s\n' "$CNB_TOKEN" ;;
	*) exit 1 ;;
esac
ASKPASS
chmod 700 "$temporary/askpass"
export GIT_ASKPASS="$temporary/askpass"
export GIT_TERMINAL_PROMPT=0

cnb_git() {
	git -c credential.helper= "$@"
}

remote_ref=$(cnb_git ls-remote "$remote" "refs/heads/$branch")
expected_sha=${remote_ref%%$'\t'*}

# Upload objects before exposing commits that reference them on the destination.
cnb_git lfs push --all "$remote" "$source_sha"
cnb_git push "--force-with-lease=refs/heads/$branch:$expected_sha" \
	"$remote" "$source_sha:refs/heads/$branch"
