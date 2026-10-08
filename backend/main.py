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
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="AI Voice Note Summarizer",
    description="Backend API for AI Voice Note Summarizer",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# =========================================================
# PATHS / UPLOAD FOLDERS
# =========================================================

# Current Python backend:
# frontend/backend

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)


# Python backend uploads
UPLOAD_FOLDER = os.path.join(
    BASE_DIR,
    "uploads"
)


# Node backend uploads:
# frontend/src/backend/uploads

NODE_UPLOAD_FOLDER = os.path.abspath(
    os.path.join(
        BASE_DIR,
        "..",
        "src",
        "backend",
        "uploads"
    )
)


# Create folders
os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

os.makedirs(
    os.path.join(
        NODE_UPLOAD_FOLDER,
        "audio"
    ),
    exist_ok=True
)

os.makedirs(
    os.path.join(
        NODE_UPLOAD_FOLDER,
        "recorded"
    ),
    exist_ok=True
)


print("")
print("======================================")
print("UPLOAD FOLDERS")
print("======================================")

print(
    "Python upload folder:",
    UPLOAD_FOLDER
)

print(
    "Node upload folder:",
    NODE_UPLOAD_FOLDER
)

print("======================================")
print("")


# =========================================================
# LOAD WHISPER MODEL
# =========================================================

print("Loading Whisper model...")

try:

    whisper_model = whisper.load_model(
        "base"
    )

    print(
        "Whisper model loaded successfully."
    )

except Exception as e:

    print(
        "Whisper model loading failed:"
    )

    print(e)

    whisper_model = None


# =========================================================
# PYDANTIC MODELS
# =========================================================

class SignupRequest(BaseModel):

    name: str
    email: str
    password: str


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
    format: str = "standard"
    detail_level: str = "balanced"


# =========================================================
# LANGUAGE MAP
# =========================================================

LANGUAGE_MAP = {

    "English": "en",

    "Marathi": "mr",

    "Hindi": "hi",

    "Gujarati": "gu",

    "Bengali": "bn",

    "Tamil": "ta",

    "Telugu": "te",

    "Kannada": "kn",

    "Malayalam": "ml",

    "Punjabi": "pa",

    "Urdu": "ur",

    "Nepali": "ne",

    "French": "fr",

    "German": "de",

    "Spanish": "es",

    "Italian": "it",

    "Portuguese": "pt",

    "Japanese": "ja",

    "Korean": "ko",

    "Chinese": "zh"
}


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {

        "message":
            "AI Voice Note Summarizer Backend is Running",

        "whisper":
            whisper_model is not None,

        "gemini":
            True
    }


# =========================================================
# SIGNUP
# =========================================================

@app.post("/signup")
def signup(
    request: SignupRequest
):

    try:

        # -------------------------------------------------
        # CHECK EXISTING USER
        # -------------------------------------------------

        with engine.connect() as conn:

            existing_user = conn.execute(
                text("""
                    SELECT id
                    FROM users
                    WHERE email = :email
                """),
                {
                    "email": request.email
                }
            ).fetchone()


        if existing_user:

            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )


        # -------------------------------------------------
        # HASH PASSWORD
        # -------------------------------------------------

        hashed_password = bcrypt.hashpw(
            request.password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")


        # -------------------------------------------------
        # INSERT USER
        # -------------------------------------------------

        with engine.begin() as conn:

            result = conn.execute(
                text("""
                    INSERT INTO users
                    (
                        name,
                        email,
                        password
                    )
                    VALUES
                    (
                        :name,
                        :email,
                        :password
                    )
                """),
                {
                    "name": request.name,
                    "email": request.email,
                    "password": hashed_password
                }
            )

            user_id = result.lastrowid


        return {

            "message":
                "Signup successful",

            "user_id":
                user_id,

            "user": {

                "id":
                    user_id,

                "name":
                    request.name,

                "email":
                    request.email
            }
        }


    except HTTPException:

        raise


    except Exception as e:

        print(
            "Signup error:"
        )

        print(e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================================================
# LOGIN
# =========================================================

@app.post("/login")
def login(
    request: LoginRequest
):

    try:

        # -------------------------------------------------
        # GET USER
        # -------------------------------------------------

        with engine.connect() as conn:

            user = conn.execute(
                text("""
                    SELECT
                        id,
                        name,
                        email,
                        password
                    FROM users
                    WHERE email = :email
                """),
                {
                    "email":
                        request.email
                }
            ).fetchone()


        if not user:

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )


        # -------------------------------------------------
        # CHECK PASSWORD
        # -------------------------------------------------

        stored_password = user.password

        password_valid = False


        try:

            password_valid = bcrypt.checkpw(
                request.password.encode(
                    "utf-8"
                ),
                stored_password.encode(
                    "utf-8"
                )
            )

        except Exception:

            password_valid = (
                request.password ==
                stored_password
            )


        if not password_valid:

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )


        # -------------------------------------------------
        # LOGIN SUCCESS
        # -------------------------------------------------

        return {

            "message":
                "Login successful",

            "user_id":
                user.id,

            "name":
                user.name,

            "email":
                user.email,

            "user": {

                "id":
                    user.id,

                "name":
                    user.name,

                "email":
                    user.email
            }
        }


    except HTTPException:

        raise


    except Exception as e:

        print(
            "Login error:"
        )

        print(e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================================================
# RECORD VOICE NOTE
# =========================================================

@app.post("/voice-notes/record")
async def record_voice_note(
    user_id: int = Form(...),
    file: UploadFile = File(...)
):

    try:

        # -------------------------------------------------
        # 1. CHECK USER
        # -------------------------------------------------

        with engine.connect() as conn:

            user = conn.execute(
                text("""
                    SELECT
                        id,
                        email
                    FROM users
                    WHERE id = :user_id
                """),
                {
                    "user_id": user_id
                }
            ).fetchone()

        if not user:

            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # -------------------------------------------------
        # 2. FILE NAME
        # -------------------------------------------------

        original_filename = (
            file.filename
            or "recording.webm"
        )

        safe_filename = (
            f"recorded_{user_id}_"
            f"{original_filename}"
        )

        file_path = os.path.join(
            UPLOAD_FOLDER,
            safe_filename
        )

        # -------------------------------------------------
        # 3. SAVE FILE
        # -------------------------------------------------

        with open(
            file_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

        # -------------------------------------------------
        # 4. SAVE DATABASE
        # -------------------------------------------------

        with engine.begin() as conn:

            result = conn.execute(
                text("""
                    INSERT INTO voice_notes
                    (
                        email,
                        upload_voice,
                        recorded_voice
                    )
                    VALUES
                    (
                        :email,
                        NULL,
                        :recorded_voice
                    )
                """),
                {
                    "email": user.email,
                    "recorded_voice": file_path
                }
            )

            note_id = result.lastrowid

        # -------------------------------------------------
        # 5. RESPONSE
        # -------------------------------------------------

        return {

            "message":
                "Voice recording saved successfully",

            "note_id":
                note_id,

            "upload_voice":
                None,

            "recorded_voice":
                file_path
        }

    except HTTPException:

        raise

    except Exception as e:

        print(
            "Recording error:"
        )

        print(e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    
# =========================================================
# UPLOAD VOICE NOTE
# =========================================================

@app.post("/voice-notes/upload")
async def upload_voice_note(
    user_id: int = Form(...),
    file: UploadFile = File(...)
):

    try:

        # -------------------------------------------------
        # 1. CHECK USER
        # -------------------------------------------------

        with engine.connect() as conn:

            user = conn.execute(
                text("""
                    SELECT
                        id,
                        email
                    FROM users
                    WHERE id = :user_id
                """),
                {
                    "user_id": user_id
                }
            ).fetchone()

        if not user:

            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # -------------------------------------------------
        # 2. FILE NAME
        # -------------------------------------------------

        original_filename = (
            file.filename
            or "audio.webm"
        )

        safe_filename = (
            f"upload_{user_id}_"
            f"{original_filename}"
        )

        file_path = os.path.join(
            UPLOAD_FOLDER,
            safe_filename
        )

        # -------------------------------------------------
        # 3. SAVE FILE
        # -------------------------------------------------

        with open(
            file_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

        # -------------------------------------------------
        # 4. SAVE DATABASE
        # -------------------------------------------------

        with engine.begin() as conn:

            result = conn.execute(
                text("""
                    INSERT INTO voice_notes
                    (
                        email,
                        upload_voice,
                        recorded_voice
                    )
                    VALUES
                    (
                        :email,
                        :upload_voice,
                        NULL
                    )
                """),
                {
                    "email": user.email,
                    "upload_voice": file_path
                }
            )

            note_id = result.lastrowid

        # -------------------------------------------------
        # 5. RESPONSE
        # -------------------------------------------------

        return {

            "message":
                "Voice note uploaded successfully",

            "note_id":
                note_id,

            "upload_voice":
                file_path,

            "recorded_voice":
                None
        }

    except HTTPException:

        raise

    except Exception as e:

        print(
            "Upload error:"
        )

        print(e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =========================================================
# TRANSCRIPTION
# =========================================================

@app.post("/transcription")
def transcription(
    request: TranscriptionRequest
):

    try:

        print("")
        print("======================================")
        print("TRANSCRIPTION REQUEST")
        print("======================================")

        print(
            "Note ID:",
            request.note_id
        )

        print(
            "Language:",
            request.language
        )

        # -------------------------------------------------
        # 1. CHECK WHISPER
        # -------------------------------------------------

        if whisper_model is None:

            raise HTTPException(
                status_code=500,
                detail="Whisper model is not loaded"
            )

        # -------------------------------------------------
        # 2. GET NOTE FROM DATABASE
        # -------------------------------------------------

        with engine.connect() as conn:

            note = conn.execute(
                text("""
                    SELECT
                        id,
                        upload_voice,
                        recorded_voice
                    FROM voice_notes
                    WHERE id = :note_id
                """),
                {
                    "note_id": request.note_id
                }
            ).fetchone()

        if not note:

            raise HTTPException(
                status_code=404,
                detail="Voice note not found"
            )

        # -------------------------------------------------
        # 3. GET FILE PATH FROM DATABASE
        # -------------------------------------------------

        file_name = (
            note.upload_voice
            or note.recorded_voice
        )

        if not file_name:

            raise HTTPException(
                status_code=404,
                detail="Audio file not found in database"
            )

        print(
            "Database file value:",
            file_name
        )

        # -------------------------------------------------
        # 4. GET ONLY FILE NAME
        # -------------------------------------------------

        file_name_only = os.path.basename(
            str(file_name)
        )

        print(
            "File name:",
            file_name_only
        )

        # -------------------------------------------------
        # 5. USE PYTHON BACKEND UPLOAD FOLDER
        # -------------------------------------------------

        file_path = os.path.join(
            UPLOAD_FOLDER,
            file_name_only
        )

        print(
            "Checking audio file:"
        )

        print(
            file_path
        )

        # -------------------------------------------------
        # 6. CHECK FILE EXISTS
        # -------------------------------------------------

        if not os.path.exists(file_path):

            print(
                "Audio file was not found."
            )

            print(
                "Expected path:",
                file_path
            )

            raise HTTPException(
                status_code=404,
                detail=(
                    "Audio file does not exist. "
                    f"Path: {file_path}"
                )
            )

        # -------------------------------------------------
        # 7. FILE INFORMATION
        # -------------------------------------------------

        print(
            "Audio file found:"
        )

        print(
            file_path
        )

        print(
            "File size:",
            os.path.getsize(file_path),
            "bytes"
        )

        # -------------------------------------------------
        # 8. LANGUAGE
        # -------------------------------------------------

        whisper_language = (
            LANGUAGE_MAP.get(
                request.language
            )
        )

        print(
            "Whisper language:",
            whisper_language
        )

        # -------------------------------------------------
        # 9. START WHISPER
        # -------------------------------------------------

        print(
            "Starting Whisper transcription..."
        )

        if whisper_language:

            result = whisper_model.transcribe(

                file_path,

                language=whisper_language,

                task="transcribe",

                fp16=False
            )

        else:

            result = whisper_model.transcribe(

                file_path,

                task="transcribe",

                fp16=False
            )

        # -------------------------------------------------
        # 10. GET TRANSCRIPT
        # -------------------------------------------------

        transcript = (
            result.get(
                "text",
                ""
            ).strip()
        )

        if not transcript:

            raise HTTPException(
                status_code=500,
                detail=(
                    "Whisper could not generate transcript"
                )
            )

        print(
            "Transcript:",
            transcript
        )

        # -------------------------------------------------
        # 11. SAVE TRANSCRIPT TO DATABASE
        # -------------------------------------------------

        with engine.begin() as conn:

            conn.execute(
                text("""
                    UPDATE voice_notes
                    SET
                        transcript = :transcript,
                        language = :language
                    WHERE id = :note_id
                """),
                {
                    "transcript": transcript,

                    "language": request.language,

                    "note_id": request.note_id
                }
            )

        # -------------------------------------------------
        # 12. SUCCESS
        # -------------------------------------------------

        print(
            "Transcription completed successfully."
        )

        print(
            "======================================"
        )

        print("")

        return {

            "message":
                "Transcription successful",

            "note_id":
                request.note_id,

            "transcript":
                transcript,

            "language":
                request.language
        }

    except HTTPException:

        raise

    except Exception as e:

        print("")
        print(
            "Transcription error:"
        )

        print(e)

        print("")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================================================
# AI SUMMARIZATION
# =========================================================

@app.post("/summarization")
def summarization(
    request: SummarizationRequest
):

    try:

        print("")
        print("======================================")
        print("AI SUMMARIZATION REQUEST")
        print("======================================")

        print(
            "Note ID:",
            request.note_id
        )

        print(
            "Language:",
            request.language
        )


        # -------------------------------------------------
        # 1. CHECK NOTE
        # -------------------------------------------------

        with engine.connect() as conn:

            note = conn.execute(
                text("""
                    SELECT id
                    FROM voice_notes
                    WHERE id = :note_id
                """),
                {
                    "note_id":
                        request.note_id
                }
            ).fetchone()


        if not note:

            raise HTTPException(
                status_code=404,
                detail="Voice note not found"
            )


        # -------------------------------------------------
        # 2. CHECK TRANSCRIPT
        # -------------------------------------------------

        if not request.transcript_text:

            raise HTTPException(
                status_code=400,
                detail="Transcript is empty"
            )


        transcript_text = (
            request.transcript_text.strip()
        )


        if not transcript_text:

            raise HTTPException(
                status_code=400,
                detail="Transcript is empty"
            )


        print(
            "Transcript length:",
            len(transcript_text)
        )

        print(
            "Calling Gemini..."
        )


        # -------------------------------------------------
        # 3. GEMINI
        # -------------------------------------------------

        result = generate_ai_summary(

            transcript=
                transcript_text,

            language=
                request.language,

            detail_level=
                request.detail_level
        )


        print("")
        print(
            "Gemini result:"
        )

        print(result)

        print("")


        # -------------------------------------------------
        # 4. CHECK RESULT
        # -------------------------------------------------

        if not result.get(
            "success",
            False
        ):

            error_message = result.get(
                "error",
                "Gemini summary generation failed"
            )


            print(
                "Gemini summary failed:",
                error_message
            )


            raise HTTPException(
                status_code=500,
                detail=error_message
            )


        # -------------------------------------------------
        # 5. GET SUMMARY DATA
        # -------------------------------------------------

        summary = result.get(
            "summary",
            ""
        )


        key_points = result.get(
            "keyPoints",
            []
        )


        action_items = result.get(
            "actionItems",
            []
        )


        topics = result.get(
            "topics",
            []
        )


        ai_model = result.get(
            "model",
            "gemini-3.1-flash-lite"
        )


        if not summary:

            raise HTTPException(
                status_code=500,
                detail=
                    "Gemini returned an empty summary"
            )


        # -------------------------------------------------
        # 6. SAVE SUMMARY
        # -------------------------------------------------

        with engine.begin() as conn:

            conn.execute(
                text("""
                    UPDATE voice_notes
                    SET
                        transcript = :transcript,
                        summary = :summary,
                        language = :language
                    WHERE id = :note_id
                """),
                {
                    "transcript":
                        transcript_text,

                    "summary":
                        summary,

                    "language":
                        request.language,

                    "note_id":
                        request.note_id
                }
            )


        # -------------------------------------------------
        # 7. SUCCESS
        # -------------------------------------------------

        print("")
        print(
            "AI summary generated successfully."
        )

        print(
            "AI Model:",
            ai_model
        )

        print(
            "======================================"
        )

        print("")


        return {

            "message":
                "AI summary generated successfully",

            "note_id":
                request.note_id,

            "summary":
                summary,

            "keyPoints":
                key_points,

            "actionItems":
                action_items,

            "topics":
                topics,

            "language":
                request.language,

            "ai_model":
                ai_model
        }


    except HTTPException:

        raise


    except Exception as e:

        print("")
        print(
            "Summarization error:"
        )

        print(e)

        print("")


        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================================================
# GET USER VOICE NOTES / HISTORY
# =========================================================

@app.get(
    "/voice-notes/user/{user_id}"
)
def get_user_voice_notes(
    user_id: int
):

    try:

        # -------------------------------------------------
        # 1. GET USER
        # -------------------------------------------------

        with engine.connect() as conn:

            user = conn.execute(
                text("""
                    SELECT email
                    FROM users
                    WHERE id = :user_id
                """),
                {
                    "user_id":
                        user_id
                }
            ).fetchone()


        if not user:

            raise HTTPException(
                status_code=404,
                detail="User not found"
            )


        # -------------------------------------------------
        # 2. GET NOTES
        # -------------------------------------------------

        with engine.connect() as conn:

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
                {
                    "email":
                        user.email
                }
            ).fetchall()


        # -------------------------------------------------
        # 3. CREATE HISTORY
        # -------------------------------------------------

        history = []


        for note in notes:

            history.append({

                "id":
                    note.id,

                "email":
                    note.email,

                "upload_voice":
                    note.upload_voice,

                "recorded_voice":
                    note.recorded_voice,

                "transcript":
                    note.transcript,

                "summary":
                    note.summary,

                "language":
                    note.language,

                "created_at":
                    note.created_at
            })


        return {

            "user_id":
                user_id,

            "notes":
                history
        }


    except HTTPException:

        raise


    except Exception as e:

        print(
            "History error:"
        )

        print(e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================================================
# DELETE VOICE NOTE
# =========================================================

@app.delete(
    "/voice-notes/{note_id}"
)
def delete_voice_note(
    note_id: int
):

    try:

        # -------------------------------------------------
        # 1. GET NOTE
        # -------------------------------------------------

        with engine.connect() as conn:

            note = conn.execute(
                text("""
                    SELECT
                        id,
                        upload_voice,
                        recorded_voice
                    FROM voice_notes
                    WHERE id = :note_id
                """),
                {
                    "note_id":
                        note_id
                }
            ).fetchone()


        if not note:

            raise HTTPException(
                status_code=404,
                detail="Voice note not found"
            )


        # -------------------------------------------------
        # 2. DELETE FILES
        # -------------------------------------------------

        files_to_delete = [

            note.upload_voice,

            note.recorded_voice
        ]


        for file_path in files_to_delete:

            if (
                file_path
                and
                os.path.exists(
                    file_path
                )
            ):

                try:

                    os.remove(
                        file_path
                    )

                except Exception as e:

                    print(
                        "Could not delete file:",
                        e
                    )


        # -------------------------------------------------
        # 3. DELETE DATABASE RECORD
        # -------------------------------------------------

        with engine.begin() as conn:

            conn.execute(
                text("""
                    DELETE FROM voice_notes
                    WHERE id = :note_id
                """),
                {
                    "note_id":
                        note_id
                }
            )


        return {

            "message":
                "Voice note deleted successfully",

            "note_id":
                note_id
        }


    except HTTPException:

        raise


    except Exception as e:

        print(
            "Delete error:"
        )

        print(e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )