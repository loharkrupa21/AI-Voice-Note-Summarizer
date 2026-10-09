from __future__ import annotations
from fastapi import (
    FastAPI,
    HTTPException,
    UploadFile,
    File,
    Form
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text

from database import engine
from api_calling import generate_ai_summary

import os
import shutil
import whisper
import bcrypt


# =========================================================
# REQUEST MODELS
# =========================================================

class LoginRequest(BaseModel):
    email: str
    password: str


class TranscriptionRequest(BaseModel):
    note_id: int
    language: str = "English"


class SummarizationRequest(BaseModel):
    note_id: int
    transcript_text: str
    language: str = "English"
    detail_level: str = "medium"


# =========================================================
# LANGUAGE MAP
# =========================================================

LANGUAGE_MAP = {
    "English": "en",
    "Hindi": "hi",
    "Marathi": "mr",
    "Spanish": "es",
    "French": "fr",
    "German": "de",
    "Japanese": "ja",
    "Chinese": "zh",
    "Arabic": "ar",
    "Portuguese": "pt",
    "Russian": "ru",
    "Italian": "it"
}


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="AI Voice Note Summarizer",
    description="Backend API for AI Voice Note Summarizer",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# =========================================================
# UPLOAD FOLDERS
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

print("Python upload folder:", UPLOAD_FOLDER)


# =========================================================
# WHISPER MODEL - LOAD WHEN FIRST REQUIRED
# =========================================================

whisper_model = None


def get_whisper_model():
    global whisper_model

    if whisper_model is None:
        print("Loading Whisper tiny model...")

        whisper_model = whisper.load_model(
            "tiny",
            device="cpu"
        )

        print("Whisper model loaded successfully.")

    return whisper_model


# =========================================================
# ROOT / HEALTH CHECK
# =========================================================

@app.get("/")
def root():
    return {
        "message": "AI Voice Note Summarizer API is running",
        "docs": "/docs"
    }


@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        print("Health/database check failed:", e)

        raise HTTPException(
            status_code=503,
            detail="API is running, but database connection failed."
        )


# =========================================================
# LOGIN
# =========================================================

@app.post("/login")
def login(request: LoginRequest):
    try:
        with engine.connect() as conn:
            user = conn.execute(
                text("""
                    SELECT id, name, email, password
                    FROM users
                    WHERE email = :email
                """),
                {"email": request.email}
            ).fetchone()

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        stored_password = str(user.password)
        password_valid = False

        # Supports bcrypt hashes and legacy plain-text
        # passwords. Plain-text password storage should
        # be migrated to bcrypt hashes.
        try:
            password_valid = bcrypt.checkpw(
                request.password.encode("utf-8"),
                stored_password.encode("utf-8")
            )
        except (ValueError, TypeError):
            password_valid = (
                request.password == stored_password
            )

        if not password_valid:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        return {
            "message": "Login successful",
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        print("Login error:", e)

        raise HTTPException(
            status_code=500,
            detail="Login failed because of a server/database error."
        )


# =========================================================
# COMMON AUDIO SAVE HELPER
# =========================================================

def save_audio_file(file: UploadFile, prefix: str, user_id: int):
    original_name = os.path.basename(
        file.filename or "audio.webm"
    )

    safe_name = "".join(
        ch for ch in original_name
        if ch.isalnum() or ch in "._-"
    )

    if not safe_name:
        safe_name = "audio.webm"

    filename = f"{prefix}_{user_id}_{safe_name}"

    file_path = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return file_path


# =========================================================
# RECORD VOICE NOTE
# =========================================================

@app.post("/voice-notes/record")
async def record_voice_note(
    user_id: int = Form(...),
    file: UploadFile = File(...)
):
    file_path = None

    try:
        with engine.connect() as conn:
            user = conn.execute(
                text("""
                    SELECT id, email
                    FROM users
                    WHERE id = :user_id
                """),
                {"user_id": user_id}
            ).fetchone()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        file_path = save_audio_file(
            file,
            "recorded",
            user_id
        )

        with engine.begin() as conn:
            result = conn.execute(
                text("""
                    INSERT INTO voice_notes
                        (email, upload_voice, recorded_voice)
                    VALUES
                        (:email, NULL, :recorded_voice)
                """),
                {
                    "email": user.email,
                    "recorded_voice": file_path
                }
            )

            note_id = result.lastrowid

        return {
            "message": "Voice recording saved successfully",
            "note_id": note_id,
            "upload_voice": None,
            "recorded_voice": file_path
        }

    except HTTPException:
        raise

    except Exception as e:
        print("Recording error:", e)

        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass

        raise HTTPException(
            status_code=500,
            detail="Could not save recording. Check the database and server logs."
        )

    finally:
        await file.close()


# =========================================================
# UPLOAD VOICE NOTE
# =========================================================

@app.post("/voice-notes/upload")
async def upload_voice_note(
    user_id: int = Form(...),
    file: UploadFile = File(...)
):
    file_path = None

    try:
        with engine.connect() as conn:
            user = conn.execute(
                text("""
                    SELECT id, email
                    FROM users
                    WHERE id = :user_id
                """),
                {"user_id": user_id}
            ).fetchone()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        file_path = save_audio_file(
            file,
            "upload",
            user_id
        )

        with engine.begin() as conn:
            result = conn.execute(
                text("""
                    INSERT INTO voice_notes
                        (email, upload_voice, recorded_voice)
                    VALUES
                        (:email, :upload_voice, NULL)
                """),
                {
                    "email": user.email,
                    "upload_voice": file_path
                }
            )

            note_id = result.lastrowid

        return {
            "message": "Voice note uploaded successfully",
            "note_id": note_id,
            "upload_voice": file_path,
            "recorded_voice": None
        }

    except HTTPException:
        raise

    except Exception as e:
        print("Upload error:", e)

        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass

        raise HTTPException(
            status_code=500,
            detail="Could not upload audio. Check the database and server logs."
        )

    finally:
        await file.close()


# =========================================================
# TRANSCRIPTION - WHISPER
# =========================================================

@app.post("/transcription")
def transcription(request: TranscriptionRequest):
    try:
        print(
            "Transcription request:",
            request.note_id,
            request.language
        )

        # First, find the note in the database.
        with engine.connect() as conn:
            note = conn.execute(
                text("""
                    SELECT id, upload_voice, recorded_voice
                    FROM voice_notes
                    WHERE id = :note_id
                """),
                {"note_id": request.note_id}
            ).fetchone()

        if not note:
            raise HTTPException(
                status_code=404,
                detail="Voice note not found"
            )

        stored_path = note.upload_voice or note.recorded_voice

        if not stored_path:
            raise HTTPException(
                status_code=404,
                detail="Audio file path is missing"
            )

        # Resolve the file in this backend's upload folder.
        filename = os.path.basename(str(stored_path))
        file_path = os.path.join(UPLOAD_FOLDER, filename)

        if not os.path.isfile(file_path):
            raise HTTPException(
                status_code=404,
                detail=(
                    "Audio file not found on this server. "
                    "It may have been lost after a redeployment."
                )
            )

        if os.path.getsize(file_path) == 0:
            raise HTTPException(
                status_code=400,
                detail="Audio file is empty"
            )

        whisper_language = LANGUAGE_MAP.get(request.language)

        # This call loads the model if it has not loaded yet.
        model = get_whisper_model()

        transcription_options = {
            "task": "transcribe",
            "fp16": False
        }

        if whisper_language:
            transcription_options["language"] = whisper_language

        result = model.transcribe(
            file_path,
            **transcription_options
        )

        transcript = result.get("text", "").strip()

        if not transcript:
            raise HTTPException(
                status_code=422,
                detail="Whisper could not generate a transcript"
            )

        with engine.begin() as conn:
            conn.execute(
                text("""
                    UPDATE voice_notes
                    SET transcript = :transcript,
                        language = :language
                    WHERE id = :note_id
                """),
                {
                    "transcript": transcript,
                    "language": request.language,
                    "note_id": request.note_id
                }
            )

        return {
            "message": "Transcription successful",
            "note_id": request.note_id,
            "transcript": transcript,
            "language": request.language
        }

    except HTTPException:
        raise

    except Exception as e:
        print("Transcription error:", e)

        raise HTTPException(
            status_code=500,
            detail="Transcription failed. Check the server logs."
        )


# =========================================================
# AI SUMMARIZATION - GEMINI
# =========================================================

@app.post("/summarization")
def summarization(request: SummarizationRequest):
    try:
        transcript = request.transcript_text.strip()

        if not transcript:
            raise HTTPException(
                status_code=400,
                detail="Transcript is empty"
            )

        with engine.connect() as conn:
            note = conn.execute(
                text("""
                    SELECT id
                    FROM voice_notes
                    WHERE id = :note_id
                """),
                {"note_id": request.note_id}
            ).fetchone()

        if not note:
            raise HTTPException(
                status_code=404,
                detail="Voice note not found"
            )

        result = generate_ai_summary(
            transcript=transcript,
            language=request.language,
            detail_level=request.detail_level
        )

        if not isinstance(result, dict):
            raise HTTPException(
                status_code=500,
                detail="AI summarizer returned an invalid response"
            )

        if not result.get("success", False):
            print(
                "AI summary error:",
                result.get("error", "Unknown error")
            )

            raise HTTPException(
                status_code=502,
                detail="AI summary generation failed. Check the API key and service logs."
            )

        summary = result.get("summary", "")

        if not isinstance(summary, str) or not summary.strip():
            raise HTTPException(
                status_code=502,
                detail="AI returned an empty summary"
            )

        key_points = result.get("keyPoints", [])
        action_items = result.get("actionItems", [])
        topics = result.get("topics", [])
        ai_model = result.get("model", "Gemini")

        with engine.begin() as conn:
            conn.execute(
                text("""
                    UPDATE voice_notes
                    SET transcript = :transcript,
                        summary = :summary,
                        language = :language
                    WHERE id = :note_id
                """),
                {
                    "transcript": transcript,
                    "summary": summary,
                    "language": request.language,
                    "note_id": request.note_id
                }
            )

        return {
            "message": "AI summary generated successfully",
            "note_id": request.note_id,
            "summary": summary,
            "keyPoints": key_points,
            "actionItems": action_items,
            "topics": topics,
            "language": request.language,
            "ai_model": ai_model
        }

    except HTTPException:
        raise

    except Exception as e:
        print("Summarization error:", e)

        raise HTTPException(
            status_code=500,
            detail="AI summarization failed. Check the server logs."
        )


# =========================================================
# GET USER VOICE NOTES / HISTORY
# =========================================================

@app.get("/voice-notes/user/{user_id}")
def get_user_voice_notes(user_id: int):
    try:
        with engine.connect() as conn:
            user = conn.execute(
                text("""
                    SELECT id, email
                    FROM users
                    WHERE id = :user_id
                """),
                {"user_id": user_id}
            ).fetchone()

            if not user:
                raise HTTPException(
                    status_code=404,
                    detail="User not found"
                )

            notes = conn.execute(
                text("""
                    SELECT
                        id,
                        email,
                        upload_voice,
                        recorded_voice,
                        transcript,
                        summary,
                        language,
                        created_at
                    FROM voice_notes
                    WHERE email = :email
                    ORDER BY created_at DESC
                """),
                {"email": user.email}
            ).fetchall()

        history = []

        for note in notes:
            history.append({
                "id": note.id,
                "email": note.email,
                "upload_voice": note.upload_voice,
                "recorded_voice": note.recorded_voice,
                "transcript": note.transcript,
                "summary": note.summary,
                "language": note.language,
                "created_at": note.created_at
            })

        return {
            "user_id": user_id,
            "notes": history
        }

    except HTTPException:
        raise

    except Exception as e:
        print("History error:", e)

        raise HTTPException(
            status_code=500,
            detail="Could not load voice note history."
        )


# =========================================================
# DELETE VOICE NOTE
# =========================================================

@app.delete("/voice-notes/{note_id}")
def delete_voice_note(note_id: int):
    try:
        with engine.connect() as conn:
            note = conn.execute(
                text("""
                    SELECT id, upload_voice, recorded_voice
                    FROM voice_notes
                    WHERE id = :note_id
                """),
                {"note_id": note_id}
            ).fetchone()

        if not note:
            raise HTTPException(
                status_code=404,
                detail="Voice note not found"
            )

        file_paths = [
            note.upload_voice,
            note.recorded_voice
        ]

        # Delete the database record first.
        with engine.begin() as conn:
            conn.execute(
                text("""
                    DELETE FROM voice_notes
                    WHERE id = :note_id
                """),
                {"note_id": note_id}
            )

        # Only delete files stored in this backend's uploads folder.
        for stored_path in file_paths:
            if not stored_path:
                continue

            filename = os.path.basename(str(stored_path))
            local_path = os.path.abspath(
                os.path.join(UPLOAD_FOLDER, filename)
            )

            if (
                os.path.dirname(local_path)
                == os.path.abspath(UPLOAD_FOLDER)
                and os.path.isfile(local_path)
            ):
                try:
                    os.remove(local_path)
                except OSError as e:
                    print("Could not delete audio file:", e)

        return {
            "message": "Voice note deleted successfully",
            "note_id": note_id
        }

    except HTTPException:
        raise

    except Exception as e:
        print("Delete error:", e)

        raise HTTPException(
            status_code=500,
            detail="Could not delete voice note."
        )