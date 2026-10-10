"""
Focused Tests for Bug 2: Audio Upload vs Recording Storage and Duplicate Upload Prevention
"""
import sys
import os
import unittest
import io
import time

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from fastapi.testclient import TestClient
from main import app
from database import engine
from sqlalchemy import text


class TestVoiceNotesUploadAndRecording(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.created_user_id = None
        cls.test_email = f"test_voice_{int(time.time())}@example.com"
        cls.created_files = []

        # Create a test user in database for testing
        try:
            with engine.begin() as conn:
                res = conn.execute(
                    text("INSERT INTO users (name, email, password) VALUES (:name, :email, :password)"),
                    {"name": "Voice Tester", "email": cls.test_email, "password": "hashed_pass_test"}
                )
                cls.created_user_id = res.lastrowid
        except Exception as exc:
            print("Setup note: Could not insert test user in live DB:", exc)

    @classmethod
    def tearDownClass(cls):
        # Clean up database records
        if cls.created_user_id:
            try:
                with engine.begin() as conn:
                    conn.execute(
                        text("DELETE FROM voice_notes WHERE email = :email"),
                        {"email": cls.test_email}
                    )
                    conn.execute(
                        text("DELETE FROM users WHERE id = :id"),
                        {"id": cls.created_user_id}
                    )
            except Exception as exc:
                print("Teardown warning (DB cleanup):", exc)

        # Clean up created files on disk
        for f in cls.created_files:
            if f and os.path.exists(f):
                try:
                    os.remove(f)
                except OSError:
                    pass

    def test_01_upload_endpoint_stores_upload_voice_and_leaves_recorded_null(self):
        """Verify POST /voice-notes/upload populates upload_voice and sets recorded_voice to NULL."""
        if not self.created_user_id:
            self.skipTest("Live database not available for upload endpoint test.")

        dummy_audio = io.BytesIO(b"RIFF dummy uploaded wav content")
        dummy_audio.name = "sample_lecture.wav"

        response = self.client.post(
            "/voice-notes/upload",
            data={"user_id": self.created_user_id},
            files={"file": ("sample_lecture.wav", dummy_audio, "audio/wav")}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        note_id = data.get("note_id")
        self.assertIsNotNone(note_id)

        # Response verification
        self.assertIsNotNone(data.get("upload_voice"))
        self.assertIsNone(data.get("recorded_voice"))
        self.assertTrue("upload_" in data["upload_voice"])
        self.created_files.append(data["upload_voice"])

        # Database record verification
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT upload_voice, recorded_voice FROM voice_notes WHERE id = :id"),
                {"id": note_id}
            ).fetchone()

            self.assertIsNotNone(row)
            self.assertIsNotNone(row.upload_voice, "upload_voice column must be populated")
            self.assertIsNone(row.recorded_voice, "recorded_voice column must be NULL")

    def test_02_record_endpoint_stores_recorded_voice_and_leaves_upload_null(self):
        """Verify POST /voice-notes/record populates recorded_voice and sets upload_voice to NULL."""
        if not self.created_user_id:
            self.skipTest("Live database not available for record endpoint test.")

        dummy_audio = io.BytesIO(b"GMC dummy mic recording webm content")
        dummy_audio.name = "mic_recording.webm"

        response = self.client.post(
            "/voice-notes/record",
            data={"user_id": self.created_user_id},
            files={"file": ("mic_recording.webm", dummy_audio, "audio/webm")}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        note_id = data.get("note_id")
        self.assertIsNotNone(note_id)

        # Response verification
        self.assertIsNone(data.get("upload_voice"))
        self.assertIsNotNone(data.get("recorded_voice"))
        self.assertTrue("recorded_" in data["recorded_voice"])
        self.created_files.append(data["recorded_voice"])

        # Database record verification
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT upload_voice, recorded_voice FROM voice_notes WHERE id = :id"),
                {"id": note_id}
            ).fetchone()

            self.assertIsNotNone(row)
            self.assertIsNone(row.upload_voice, "upload_voice column must be NULL")
            self.assertIsNotNone(row.recorded_voice, "recorded_voice column must be populated")

    def test_03_duplicate_prevention_logic_simulation(self):
        """Simulate handleAudioReady logic: verify upload is only triggered when noteId is absent."""
        upload_calls = []

        def mock_upload(audio_blob, title, user_id, voice_type):
            upload_calls.append({"title": title, "voice_type": voice_type})
            return {"note_id": 999}

        # Case A: Child page already uploaded and provided noteId (UploadAudioPage / RecordVoicePage)
        audio_info_with_id = {
            "noteId": 456,
            "title": "Already Uploaded Note",
            "type": "recorded"
        }
        note_id_a = audio_info_with_id.get("noteId")
        if not note_id_a:
            mock_upload(None, audio_info_with_id["title"], 1, audio_info_with_id["type"])

        # Verification: No upload call occurred
        self.assertEqual(len(upload_calls), 0, "Upload must not be called when noteId already exists")
        self.assertEqual(note_id_a, 456)

        # Case B: Audio provided without noteId (e.g. Dashboard quick upload)
        audio_info_without_id = {
            "noteId": None,
            "title": "Fresh Drop Note",
            "type": "uploaded"
        }
        note_id_b = audio_info_without_id.get("noteId")
        if not note_id_b:
            res = mock_upload(None, audio_info_without_id["title"], 1, "upload")
            note_id_b = res["note_id"]

        # Verification: Exactly one upload call occurred
        self.assertEqual(len(upload_calls), 1)
        self.assertEqual(upload_calls[0]["voice_type"], "upload")
        self.assertEqual(note_id_b, 999)


if __name__ == "__main__":
    unittest.main(verbosity=2)
