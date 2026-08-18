#!/bin/sh
set -eu

repo_dir=${1:-/home/eppy/apps/valtro-webdesign-src}
live_dir=${2:-/home/eppy/apps/valtro-webdesign}

install -d -m 0755 "$live_dir"
rsync -a --delete \
  --exclude '.git/' \
  --exclude '.gitignore' \
  --exclude 'deploy/' \
  --exclude 'server/' \
  --exclude 'README.md' \
  --exclude 'package.json' \
  --exclude 'package-lock.json' \
  "$repo_dir/" "$live_dir/"
