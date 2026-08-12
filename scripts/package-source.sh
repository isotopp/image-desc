#!/usr/bin/env bash

set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Source packaging requires a clean Git worktree." >&2
  exit 1
fi

untracked_files="$(git ls-files --others --exclude-standard)"
if [[ -n "$untracked_files" ]]; then
  echo "Source packaging requires all release sources to be committed." >&2
  exit 1
fi

git ls-files --error-unmatch package-lock.json >/dev/null

version="$(node --input-type=module -e 'import packageJson from "./package.json" with { type: "json" }; process.stdout.write(packageJson.version)')"
artifact_dir="$project_root/source-artifacts"
archive="$artifact_dir/image-description-$version-source.zip"

mkdir -p "$artifact_dir"
git archive \
  --format=zip \
  --prefix="image-description-$version-source/" \
  --output="$archive" \
  HEAD

echo "Created $archive"
