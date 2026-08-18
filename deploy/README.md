# Server deployment

The public website and the private contact service are deployed separately. Never copy
`server/`, `deploy/`, the SMTP environment file, or Git metadata into the web root.

## Contact service

1. Create the system user `valtro-contact` without a login shell.
2. Install `server/contact_service.py` as `/opt/valtro-contact/contact_service.py`.
3. Create `/etc/valtro-contact.env` from `valtro-contact.env.example`, mode `0600`, and
   enter the mailbox SMTP credentials directly on the server.
4. Install the service and retry timer in `/etc/systemd/system/`, then run
   `systemctl daemon-reload` and enable both units.
5. Check `curl -fsS http://172.18.0.1:8787/health` before enabling the Caddy route.

## Caddy

Replace the existing Valtro-Webdesign blocks in `/home/eppy/apps/Claude/deploy/Caddyfile`
with `Caddyfile.valtro`. The CSP hashes belong to the two inline JSON-LD blocks in
`index.html`; recalculate them whenever those blocks change. Always validate the complete
configuration inside the running Caddy container before reloading it.

## Static files

Run `deploy-static.sh` after pulling the repository. Its exclusion list keeps operational
files out of the public document root.

## Backups

Install `valtro-backup.sh` as `/usr/local/sbin/valtro-backup`, install and enable the timer,
then run one manual backup and list the resulting archive. The local backup protects
against accidental edits; a provider snapshot or encrypted off-server backup is still
required for complete disaster recovery.

## Host hardening

`sshd-valtro.conf` disables password authentication and allows SSH only for `eppy`.
Confirm a separate key-based SSH session before installing it, run `sshd -t`, and reload
instead of restarting SSH. `valtro-journal-retention.conf` limits system journal retention
to 30 days and 500 MB. Hostinger's external firewall should expose only TCP 22, TCP 80,
TCP 443 and UDP 443, followed by a deny-all rule.
