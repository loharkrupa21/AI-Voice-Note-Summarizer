"""
Unit and Integration Tests for User Registration (POST /signup and POST /register)
"""
import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# Ensure backend directory is in python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from fastapi.testclient import TestClient
from main import app, SignupRequest
from models import User
import bcrypt
from sqlalchemy.exc import IntegrityError


class TestSignupValidationAndEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_validation_empty_name(self):
        """Test registration fails with 400 when name is empty."""
        response = self.client.post("/signup", json={
            "name": "   ",
            "email": "test@example.com",
            "password": "securepassword123"
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn("Name is required", response.json().get("detail", ""))

    def test_02_validation_invalid_email(self):
        """Test registration fails with 400 when email format is invalid."""
        response = self.client.post("/signup", json={
            "name": "Krupa Lohar",
            "email": "invalid-email-no-at",
            "password": "securepassword123"
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn("valid email address is required", response.json().get("detail", ""))

    def test_03_validation_short_password(self):
        """Test registration fails with 400 when password is under 6 characters."""
        response = self.client.post("/signup", json={
            "name": "Krupa Lohar",
            "email": "krupa@example.com",
            "password": "123"
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn("Password must be at least 6 characters", response.json().get("detail", ""))

    def test_04_validation_missing_fields(self):
        """Test registration fails with 422 when required fields are missing from JSON."""
        response = self.client.post("/signup", json={
            "name": "Krupa Lohar"
        })
        self.assertEqual(response.status_code, 422)

    def test_05_successful_signup_flow_and_bcrypt_hashing(self):
        """Test successful registration with mock DB returns 201, correct payload shape, and verified bcrypt hash."""
        captured_insert_params = {}

        class DummyBeginConn:
            def execute(self, statement, params=None):
                nonlocal captured_insert_params
                if params and "password" in params:
                    captured_insert_params.update(params)
                mock_res = MagicMock()
                mock_res.lastrowid = 101
                return mock_res

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc_val, exc_tb):
                pass

        class DummyConnectConn:
            def execute(self, statement, params=None):
                mock_res = MagicMock()
                mock_res.fetchone.return_value = None  # No existing user
                return mock_res

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc_val, exc_tb):
                pass

        with patch("main.engine.connect", return_value=DummyConnectConn()), \
             patch("main.engine.begin", return_value=DummyBeginConn()):
            response = self.client.post("/signup", json={
                "name": "Krupa Lohar",
                "email": "krupa@voicemind.ai",
                "password": "mySecurePassword123"
            })

            self.assertEqual(response.status_code, 201)
            data = response.json()

            # Verify response matches LoginPage.jsx and client.js expectations
            self.assertEqual(data.get("message"), "User registered successfully")
            self.assertEqual(data.get("user_id"), 101)
            self.assertEqual(data.get("name"), "Krupa Lohar")
            self.assertEqual(data.get("email"), "krupa@voicemind.ai")
            self.assertIn("user", data)
            self.assertEqual(data["user"]["id"], 101)
            self.assertEqual(data["user"]["name"], "Krupa Lohar")
            self.assertEqual(data["user"]["email"], "krupa@voicemind.ai")

            # Verify password was securely hashed with bcrypt (never plaintext)
            stored_hash = captured_insert_params.get("password")
            self.assertIsNotNone(stored_hash)
            self.assertTrue(stored_hash.startswith("$2b$") or stored_hash.startswith("$2a$"))
            self.assertTrue(bcrypt.checkpw(b"mySecurePassword123", stored_hash.encode("utf-8")))

    def test_06_duplicate_email_precheck_handling(self):
        """Test duplicate registration caught during SELECT check returns 400 Bad Request."""
        class DummyConnectConnWithExistingUser:
            def execute(self, statement, params=None):
                mock_res = MagicMock()
                mock_existing = MagicMock()
                mock_existing.id = 5
                mock_res.fetchone.return_value = mock_existing
                return mock_res

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc_val, exc_tb):
                pass

        with patch("main.engine.connect", return_value=DummyConnectConnWithExistingUser()):
            response = self.client.post("/signup", json={
                "name": "Duplicate User",
                "email": "existing@voicemind.ai",
                "password": "password123"
            })

            self.assertEqual(response.status_code, 400)
            self.assertIn("User with this email already exists", response.json().get("detail", ""))

    def test_07_register_alias_endpoint(self):
        """Test /register alias returns identical 201 result."""
        class DummyBeginConn:
            def execute(self, statement, params=None):
                mock_res = MagicMock()
                mock_res.lastrowid = 102
                return mock_res

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc_val, exc_tb):
                pass

        class DummyConnectConn:
            def execute(self, statement, params=None):
                mock_res = MagicMock()
                mock_res.fetchone.return_value = None
                return mock_res

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc_val, exc_tb):
                pass

        with patch("main.engine.connect", return_value=DummyConnectConn()), \
             patch("main.engine.begin", return_value=DummyBeginConn()):
            response = self.client.post("/register", json={
                "name": "Alias User",
                "email": "alias@voicemind.ai",
                "password": "mypassword123"
            })

            self.assertEqual(response.status_code, 201)
            self.assertEqual(response.json().get("user_id"), 102)

    def test_08_concurrent_race_condition_integrity_error(self):
        """Test race condition: unique constraint on email triggers IntegrityError on INSERT, safely handled as 400."""
        class DummyConnectConn:
            def execute(self, statement, params=None):
                mock_res = MagicMock()
                mock_res.fetchone.return_value = None  # Passed SELECT check
                return mock_res

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc_val, exc_tb):
                pass

        class DummyBeginConnRaisesIntegrity:
            def execute(self, statement, params=None):
                raise IntegrityError(
                    "Duplicate entry for key 'email'",
                    orig=Exception("1062 (23000): Duplicate entry"),
                    params={}
                )

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc_val, exc_tb):
                pass

        with patch("main.engine.connect", return_value=DummyConnectConn()), \
             patch("main.engine.begin", return_value=DummyBeginConnRaisesIntegrity()):
            response = self.client.post("/signup", json={
                "name": "Race Condition User",
                "email": "race@voicemind.ai",
                "password": "password123"
            })

            self.assertEqual(response.status_code, 400)
            self.assertIn("User with this email already exists", response.json().get("detail", ""))

    def test_09_login_password_verification_compatibility(self):
        """Verify that password hash stored by /signup is successfully verified by the /login endpoint."""
        captured_insert_params = {}

        class DummyBeginConn:
            def execute(self, statement, params=None):
                nonlocal captured_insert_params
                if params and "password" in params:
                    captured_insert_params.update(params)
                mock_res = MagicMock()
                mock_res.lastrowid = 105
                return mock_res

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc_val, exc_tb):
                pass

        class DummyConnectConn:
            def execute(self, statement, params=None):
                mock_res = MagicMock()
                mock_res.fetchone.return_value = None
                return mock_res

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc_val, exc_tb):
                pass

        # 1. Sign up user
        with patch("main.engine.connect", return_value=DummyConnectConn()), \
             patch("main.engine.begin", return_value=DummyBeginConn()):
            signup_resp = self.client.post("/signup", json={
                "name": "Login Test User",
                "email": "login_test@voicemind.ai",
                "password": "ExactPassword456!"
            })
            self.assertEqual(signup_resp.status_code, 201)

        hashed_password = captured_insert_params["password"]

        # 2. Mock /login querying this user with stored hashed_password
        class DummyUserRow:
            id = 105
            name = "Login Test User"
            email = "login_test@voicemind.ai"
            password = hashed_password

        class DummyLoginConnect:
            def execute(self, statement, params=None):
                mock_res = MagicMock()
                mock_res.fetchone.return_value = DummyUserRow()
                return mock_res

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc_val, exc_tb):
                pass

        with patch("main.engine.connect", return_value=DummyLoginConnect()):
            # A) Correct password succeeds
            login_resp = self.client.post("/login", json={
                "email": "login_test@voicemind.ai",
                "password": "ExactPassword456!"
            })
            self.assertEqual(login_resp.status_code, 200)
            self.assertEqual(login_resp.json().get("user_id"), 105)

            # B) Wrong password fails with 401
            bad_login_resp = self.client.post("/login", json={
                "email": "login_test@voicemind.ai",
                "password": "WrongPassword!"
            })
            self.assertEqual(bad_login_resp.status_code, 401)

    def test_10_live_database_status(self):
        """Live MySQL integration check. Distinguishes SSL errors from service stopped."""
        from database import engine
        try:
            with engine.connect() as conn:
                res = conn.exec_driver_sql("SELECT 1").fetchone()
                self.assertEqual(res[0], 1)
                tables = [r[0] for r in conn.exec_driver_sql("SHOW TABLES").fetchall()]
                self.assertIn("users", tables, "Table 'users' should exist in the database.")
            print("\n[LIVE DB TEST]: MySQL is ONLINE, SSL connected, and database tables are verified.")
        except Exception as exc:
            err_msg = str(exc)

            if "CERTIFICATE_VERIFY_FAILED" in err_msg or "certificate verify failed" in err_msg.lower():
                self.fail(
                    f"Live MySQL SSL Verification Error: Connection to '{engine.url.host}' failed SSL certificate validation. "
                    "Ensure local connections do not enforce remote cloud CA certificates."
                )
            elif "10061" in err_msg or "actively refused" in err_msg.lower() or "connection refused" in err_msg.lower():
                self.skipTest(
                    "Live MySQL test PENDING: MySQL service is stopped or unreachable "
                    "(Port 3306 connection refused). Start the MYSQL80 service to run live database tests."
                )
            elif "1045" in err_msg or "access denied" in err_msg.lower():
                self.fail("Live MySQL Authentication Error: Access denied for configured user.")
            elif "1049" in err_msg or "unknown database" in err_msg.lower():
                self.fail(f"Live MySQL Schema Error: Database '{engine.url.database}' does not exist on local server.")
            else:
                self.fail(f"Live MySQL connection failed with unexpected error: {err_msg}")

    def test_11_live_database_user_registration_integration(self):
        """Live end-to-end integration test: register a user in local MySQL and verify DB persistence."""
        from database import engine
        from sqlalchemy import text
        import time

        # Probe database connectivity first
        try:
            with engine.connect() as probe_conn:
                probe_conn.exec_driver_sql("SELECT 1")
        except Exception as exc:
            err_msg = str(exc)
            if "CERTIFICATE_VERIFY_FAILED" in err_msg or "certificate verify failed" in err_msg.lower():
                self.fail("Live MySQL SSL Verification Error on live registration probe.")
            elif "10061" in err_msg or "actively refused" in err_msg.lower():
                self.skipTest("Live MySQL test PENDING: MySQL service is stopped.")
            else:
                self.fail(f"Live MySQL probe failed: {err_msg}")

        # Live registration test with automated cleanup
        test_email = f"test_live_{int(time.time())}@example.com"
        created_user_id = None

        try:
            resp = self.client.post("/signup", json={
                "name": "Live Integration Test User",
                "email": test_email,
                "password": "LivePassword123!"
            })
            self.assertEqual(resp.status_code, 201)
            data = resp.json()
            created_user_id = data.get("user_id")
            self.assertIsNotNone(created_user_id)

            # Query real database to verify record is actually inserted and password is valid bcrypt
            with engine.connect() as conn:
                db_user = conn.execute(
                    text("SELECT id, name, email, password FROM users WHERE email = :email"),
                    {"email": test_email}
                ).fetchone()

                self.assertIsNotNone(db_user, "User record must exist in real database.")
                self.assertEqual(db_user.name, "Live Integration Test User")
                self.assertTrue(bcrypt.checkpw(b"LivePassword123!", db_user.password.encode("utf-8")))

            # Verify duplicate attempt on real database returns 400
            dup_resp = self.client.post("/signup", json={
                "name": "Duplicate User",
                "email": test_email,
                "password": "AnotherPassword123!"
            })
            self.assertEqual(dup_resp.status_code, 400)
            self.assertIn("User with this email already exists", dup_resp.json().get("detail", ""))

        finally:
            # Clean up the test user from real database
            if created_user_id or test_email:
                try:
                    with engine.begin() as cleanup_conn:
                        cleanup_conn.execute(
                            text("DELETE FROM users WHERE email = :email"),
                            {"email": test_email}
                        )
                except Exception as cleanup_err:
                    print("Cleanup warning:", cleanup_err)


if __name__ == "__main__":
    unittest.main(verbosity=2)
