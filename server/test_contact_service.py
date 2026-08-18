import os
import tempfile
import time
import unittest
from pathlib import Path

os.environ.setdefault("CONTACT_SPOOL_DIR", tempfile.mkdtemp())

import contact_service as service


def valid_values(**changes):
    values = {
        "name": ["Max Mustermann"],
        "email": ["max@example.de"],
        "service": ["website"],
        "message": ["Ich brauche eine neue Website."],
        "privacy": ["on"],
        "website": [""],
        "started_at": [str(int((time.time() - 5) * 1000))],
    }
    values.update(changes)
    return values


class ValidationTests(unittest.TestCase):
    def test_valid_submission_is_normalized(self):
        result = service.validate_submission(valid_values())
        self.assertEqual(result["service"], "Neue Website / Onepager")

    def test_honeypot_is_rejected(self):
        with self.assertRaises(service.PublicError) as error:
            service.validate_submission(valid_values(website=["bot.example"]))
        self.assertEqual(error.exception.status, service.HTTPStatus.NO_CONTENT)

    def test_fast_submission_is_rejected(self):
        with self.assertRaises(service.PublicError):
            service.validate_submission(valid_values(started_at=[str(int(time.time() * 1000))]))

    def test_invalid_service_is_rejected(self):
        with self.assertRaises(service.PublicError):
            service.validate_submission(valid_values(service=["unknown"]))

    def test_no_javascript_submission_is_supported(self):
        result = service.validate_submission(valid_values(started_at=[""]))
        self.assertEqual(result["email"], "max@example.de")

    def test_queue_file_uses_private_permissions(self):
        with tempfile.TemporaryDirectory() as directory:
            original = service.SPOOL_DIR
            service.SPOOL_DIR = Path(directory)
            try:
                path = service.queue_submission(service.validate_submission(valid_values()), "127.0.0.1")
                self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            finally:
                service.SPOOL_DIR = original


if __name__ == "__main__":
    unittest.main()
