#!/bin/sh
set -eu

backup_dir=/var/backups/valtro-webdesign
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
archive="$backup_dir/valtro-webdesign-$timestamp.tar.gz"

install -d -m 0700 "$backup_dir"
tar -czf "$archive" \
  /home/eppy/apps/valtro-webdesign \
  /home/eppy/apps/Claude/deploy/Caddyfile \
  /etc/systemd/system/valtro-contact.service \
  /etc/systemd/system/valtro-contact-retry.service \
  /etc/systemd/system/valtro-contact-retry.timer \
  /opt/valtro-contact/contact_service.py
chmod 0600 "$archive"
find "$backup_dir" -type f -name 'valtro-webdesign-*.tar.gz' -mtime +14 -delete
