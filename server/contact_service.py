#!/usr/bin/env python3
"""Small same-origin contact form service without third-party dependencies."""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import re
import smtplib
import ssl
import sys
import threading
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timezone
from email.message import EmailMessage
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs


HOST = os.environ.get("CONTACT_HOST", "127.0.0.1")
PORT = int(os.environ.get("CONTACT_PORT", "8787"))
PUBLIC_ORIGIN = os.environ.get("CONTACT_ORIGIN", "https://valtro-webdesign.de").rstrip("/")
SPOOL_DIR = Path(os.environ.get("CONTACT_SPOOL_DIR", "/var/lib/valtro-contact/queue"))
QUEUE_MAX_AGE = int(os.environ.get("CONTACT_QUEUE_MAX_AGE", str(7 * 24 * 60 * 60)))
MAX_BODY_BYTES = 32 * 1024
RATE_LIMIT_COUNT = int(os.environ.get("CONTACT_RATE_LIMIT", "5"))
RATE_LIMIT_WINDOW = 60 * 60

SMTP_HOST = os.environ.get("CONTACT_SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("CONTACT_SMTP_PORT", "465"))
SMTP_USER = os.environ.get("CONTACT_SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("CONTACT_SMTP_PASSWORD", "")
SMTP_FROM = os.environ.get("CONTACT_SMTP_FROM", SMTP_USER)
CONTACT_TO = os.environ.get("CONTACT_TO", "kontakt@valtro.cloud")

SERVICES = {
    "website": "Neue Website / Onepager",
    "onlineshop": "Online-Shop",
    "webapp": "Web-App",
    "relaunch": "Bestehende Website ueberarbeiten",
    "pflege": "Website-Pflege",
    "hosting": "Hosting / technischer Livegang",
    "logo": "Logo-Design",
    "kombination": "Website und Logo",
    "sonstiges": "Sonstiges",
}
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[A-Za-z]{2,63}$")
REQUESTS: dict[str, deque[float]] = defaultdict(deque)
REQUESTS_LOCK = threading.Lock()


class PublicError(Exception):
    def __init__(self, message: str, status: HTTPStatus = HTTPStatus.BAD_REQUEST):
        super().__init__(message)
        self.message = message
        self.status = status


def clean_single(values: dict[str, list[str]], name: str, limit: int) -> str:
    value = values.get(name, [""])[0].strip()
    if len(value) > limit:
        raise PublicError("Eine Angabe ist zu lang. Bitte kuerzen Sie Ihre Nachricht.")
    return value


def validate_submission(values: dict[str, list[str]]) -> dict[str, str]:
    name = clean_single(values, "name", 100)
    email = clean_single(values, "email", 254)
    service = clean_single(values, "service", 40)
    message = clean_single(values, "message", 5000)
    privacy = clean_single(values, "privacy", 10)
    website = clean_single(values, "website", 200)
    started_at = clean_single(values, "started_at", 30)

    if website:
        raise PublicError("OK", HTTPStatus.NO_CONTENT)
    if len(name) < 2:
        raise PublicError("Bitte geben Sie Ihren Namen an.")
    if not EMAIL_RE.fullmatch(email):
        raise PublicError("Bitte geben Sie eine gueltige E-Mail-Adresse an.")
    if service not in SERVICES:
        raise PublicError("Bitte waehlen Sie eine Leistung aus.")
    if len(message) < 10:
        raise PublicError("Bitte beschreiben Sie Ihr Projekt etwas ausfuehrlicher.")
    if privacy not in {"on", "true", "1"}:
        raise PublicError("Bitte bestaetigen Sie die Datenschutzerklaerung.")

    # JavaScript clients provide a start time. Native no-JS submissions remain
    # possible and are still protected by server validation and rate limits.
    if started_at:
        try:
            age_seconds = (time.time() * 1000 - int(started_at)) / 1000
        except (TypeError, ValueError):
            raise PublicError("Das Formular ist abgelaufen. Bitte laden Sie die Seite neu.") from None
        if age_seconds < 2.5 or age_seconds > 24 * 60 * 60:
            raise PublicError("Das Formular ist abgelaufen. Bitte laden Sie die Seite neu.")

    return {
        "name": name,
        "email": email,
        "service": SERVICES[service],
        "message": message,
    }


def is_rate_limited(client_ip: str) -> bool:
    now = time.monotonic()
    with REQUESTS_LOCK:
        attempts = REQUESTS[client_ip]
        while attempts and now - attempts[0] > RATE_LIMIT_WINDOW:
            attempts.popleft()
        if len(attempts) >= RATE_LIMIT_COUNT:
            return True
        attempts.append(now)
        return False


def queue_submission(submission: dict[str, str], client_ip: str) -> Path:
    SPOOL_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    request_id = uuid.uuid4().hex
    ip_digest = hmac.new(
        os.environ.get("CONTACT_IP_HASH_KEY", "local-contact-form").encode(),
        client_ip.encode(),
        hashlib.sha256,
    ).hexdigest()[:16]
    record = {
        "id": request_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "client": ip_digest,
        **submission,
    }
    target = SPOOL_DIR / f"{int(time.time())}-{request_id}.json"
    descriptor = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
        json.dump(record, handle, ensure_ascii=False)
    return target


def build_message(record: dict[str, str]) -> EmailMessage:
    message = EmailMessage()
    message["Subject"] = f"Neue Projektanfrage: {record['service']}"
    message["From"] = SMTP_FROM
    message["To"] = CONTACT_TO
    message["Reply-To"] = record["email"]
    message.set_content(
        "Neue Anfrage ueber valtro-webdesign.de\n\n"
        f"Name: {record['name']}\n"
        f"E-Mail: {record['email']}\n"
        f"Leistung: {record['service']}\n"
        f"Eingang: {record['created_at']}\n\n"
        f"Nachricht:\n{record['message']}\n"
    )
    return message


def smtp_configured() -> bool:
    return all((SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, CONTACT_TO))


def deliver_file(path: Path) -> bool:
    if not smtp_configured():
        print("SMTP configuration is incomplete", file=sys.stderr)
        return False
    try:
        record = json.loads(path.read_text(encoding="utf-8"))
        context = ssl.create_default_context()
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15, context=context) as smtp:
                smtp.login(SMTP_USER, SMTP_PASSWORD)
                smtp.send_message(build_message(record))
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as smtp:
                smtp.ehlo()
                smtp.starttls(context=context)
                smtp.ehlo()
                smtp.login(SMTP_USER, SMTP_PASSWORD)
                smtp.send_message(build_message(record))
        path.unlink(missing_ok=True)
        return True
    except Exception as error:
        print(f"Delivery failed for {path.name}: {type(error).__name__}", file=sys.stderr)
        return False


def retry_queue() -> int:
    SPOOL_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    failures = 0
    for path in sorted(SPOOL_DIR.glob("*.json")):
        if not deliver_file(path):
            failures += 1
    purge_queue()
    return failures


def purge_queue() -> None:
    SPOOL_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    cutoff = time.time() - QUEUE_MAX_AGE
    for path in SPOOL_DIR.glob("*.json"):
        try:
            if path.stat().st_mtime < cutoff:
                path.unlink()
        except FileNotFoundError:
            pass


class ContactHandler(BaseHTTPRequestHandler):
    server_version = "ValtroContact/1.0"
    sys_version = ""

    def log_message(self, message: str, *args: object) -> None:
        print(f"{self.log_date_time_string()} {message % args}", file=sys.stderr)

    def send_common_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")

    def send_json(self, status: HTTPStatus, payload: dict[str, object]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_common_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_success(self) -> None:
        if "application/json" in self.headers.get("Accept", ""):
            self.send_json(HTTPStatus.OK, {"ok": True})
            return
        self.send_response(HTTPStatus.SEE_OTHER)
        self.send_common_headers()
        self.send_header("Location", "/danke.html")
        self.end_headers()

    def do_GET(self) -> None:
        if self.path == "/health":
            status = HTTPStatus.OK if smtp_configured() else HTTPStatus.SERVICE_UNAVAILABLE
            self.send_json(status, {"ok": status == HTTPStatus.OK})
            return
        self.send_json(HTTPStatus.NOT_FOUND, {"ok": False})

    def do_POST(self) -> None:
        if self.path != "/api/contact":
            self.send_json(HTTPStatus.NOT_FOUND, {"ok": False})
            return

        origin = self.headers.get("Origin", "")
        if origin != PUBLIC_ORIGIN:
            self.send_json(HTTPStatus.FORBIDDEN, {"ok": False, "message": "Ungueltige Herkunft."})
            return

        content_type = self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
        if content_type != "application/x-www-form-urlencoded":
            self.send_json(HTTPStatus.UNSUPPORTED_MEDIA_TYPE, {"ok": False, "message": "Ungueltiges Formularformat."})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = 0
        if content_length <= 0 or content_length > MAX_BODY_BYTES:
            self.send_json(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, {"ok": False, "message": "Die Anfrage ist zu gross."})
            return

        client_ip = self.headers.get("X-Real-IP", self.client_address[0]).strip()
        try:
            raw_body = self.rfile.read(content_length).decode("utf-8", errors="strict")
            values = parse_qs(raw_body, keep_blank_values=True, max_num_fields=20)
            submission = validate_submission(values)
            if is_rate_limited(client_ip):
                raise PublicError(
                    "Zu viele Anfragen. Bitte versuchen Sie es spaeter erneut oder nutzen Sie E-Mail.",
                    HTTPStatus.TOO_MANY_REQUESTS,
                )
        except UnicodeDecodeError:
            self.send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "message": "Ungueltige Zeichenkodierung."})
            return
        except PublicError as error:
            if error.status == HTTPStatus.NO_CONTENT:
                self.send_success()
            else:
                self.send_json(error.status, {"ok": False, "message": error.message})
            return

        queued = queue_submission(submission, client_ip)
        if not deliver_file(queued):
            self.send_json(
                HTTPStatus.SERVICE_UNAVAILABLE,
                {"ok": False, "message": "Der Versand ist voruebergehend nicht moeglich. Bitte nutzen Sie E-Mail oder WhatsApp."},
            )
            return
        self.send_success()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--serve", action="store_true")
    parser.add_argument("--retry", action="store_true")
    parser.add_argument("--purge", action="store_true")
    args = parser.parse_args()

    if args.retry:
        return 1 if retry_queue() else 0
    if args.purge:
        purge_queue()
        return 0
    if not args.serve:
        parser.error("choose --serve, --retry or --purge")

    purge_queue()
    server = ThreadingHTTPServer((HOST, PORT), ContactHandler)
    print(f"Contact service listening on {HOST}:{PORT}", file=sys.stderr)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
