from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
DATABASE = "voice_notes.db"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ---------------- DATABASE ----------------

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # USER table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS USER (
            User_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Name TEXT NOT NULL,
            Email TEXT UNIQUE NOT NULL,
            Password TEXT NOT NULL
        )
    """)

    # VOICE_NOTE table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS VOICE_NOTE (
            Note_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            User_ID INTEGER NOT NULL,
            Audio_File TEXT NOT NULL,
            Date_Time TEXT NOT NULL,
            Duration REAL,
            FOREIGN KEY (User_ID) REFERENCES USER(User_ID)
        )
    """)

    # TRANSCRIPT table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS TRANSCRIPT (
            Transcript_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Note_ID INTEGER UNIQUE NOT NULL,
            Transcript_Text TEXT,
            FOREIGN KEY (Note_ID) REFERENCES VOICE_NOTE(Note_ID)
        )
    """)

    # SUMMARY table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS SUMMARY (
            Summary_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Note_ID INTEGER UNIQUE NOT NULL,
            Summary_Text TEXT,
            Created_Date TEXT NOT NULL,
            FOREIGN KEY (Note_ID) REFERENCES VOICE_NOTE(Note_ID)
        )
    """)

    conn.commit()
    conn.close()


# ---------------- HOME ----------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "AI Voice Note Summarizer Backend is Running",
        "status": "success"
    })


# ---------------- REGISTER ----------------

@app.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({
            "message": "All fields are required"
        }), 400

    hashed_password = generate_password_hash(password)

    try:

        conn = get_db()

        conn.execute("""
            INSERT INTO USER
            (Name, Email, Password)
            VALUES (?, ?, ?)
        """, (
            name,
            email,
            hashed_password
        ))

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Registration successful"
        }), 201

    except sqlite3.IntegrityError:

        return jsonify({
            "message": "Email already registered"
        }), 409


# ---------------- LOGIN ----------------

@app.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "message": "Email and password required"
        }), 400

    conn = get_db()

    user = conn.execute("""
        SELECT *
        FROM USER
        WHERE Email = ?
    """, (email,)).fetchone()

    conn.close()

    if user and check_password_hash(user["Password"], password):

        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user["User_ID"],
                "name": user["Name"],
                "email": user["Email"]
            }
        })

    return jsonify({
        "message": "Invalid email or password"
    }), 401


# ---------------- UPLOAD VOICE NOTE ----------------

@app.route("/upload", methods=["POST"])
def upload_voice():

    user_id = request.form.get("user_id")
    audio = request.files.get("audio")

    if not user_id:
        return jsonify({
            "message": "User ID required"
        }), 400

    if not audio:
        return jsonify({
            "message": "Audio file required"
        }), 400

    filename = audio.filename

    if filename == "":
        return jsonify({
            "message": "Invalid file"
        }), 400

    filepath = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    audio.save(filepath)

    date_time = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    conn = get_db()

    cursor = conn.execute("""
        INSERT INTO VOICE_NOTE
        (User_ID, Audio_File, Date_Time, Duration)
        VALUES (?, ?, ?, ?)
    """, (
        user_id,
        filename,
        date_time,
        0
    ))

    note_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Voice note uploaded successfully",
        "note_id": note_id,
        "file": filename
    }), 201


# ---------------- SPEECH TO TEXT ----------------

@app.route("/transcribe/<int:note_id>", methods=["POST"])
def transcribe(note_id):

    # Temporary transcript
    # Actual Speech-to-Text model/API can be connected here.

    transcript_text = """
    This is a sample transcript generated from the
    uploaded voice note. The system converts speech
    into text for further processing.
    """

    conn = get_db()

    note = conn.execute("""
        SELECT *
        FROM VOICE_NOTE
        WHERE Note_ID = ?
    """, (note_id,)).fetchone()

    if not note:
        conn.close()

        return jsonify({
            "message": "Voice note not found"
        }), 404

    conn.execute("""
        INSERT OR REPLACE INTO TRANSCRIPT
        (Note_ID, Transcript_Text)
        VALUES (?, ?)
    """, (
        note_id,
        transcript_text.strip()
    ))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Speech-to-text completed",
        "note_id": note_id,
        "transcript": transcript_text.strip()
    })


# ---------------- AI SUMMARY ----------------

@app.route("/summarize/<int:note_id>", methods=["POST"])
def summarize(note_id):

    conn = get_db()

    transcript = conn.execute("""
        SELECT Transcript_Text
        FROM TRANSCRIPT
        WHERE Note_ID = ?
    """, (note_id,)).fetchone()

    if not transcript:
        conn.close()

        return jsonify({
            "message": "Transcript not found"
        }), 404

    text = transcript["Transcript_Text"]

    # Temporary AI summary
    # Actual AI model/API can be connected here.

    summary_text = (
        "The voice note contains information that was "
        "converted from speech into text. The AI system "
        "extracts the main idea and creates a concise summary."
    )

    created_date = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    conn.execute("""
        INSERT OR REPLACE INTO SUMMARY
        (Note_ID, Summary_Text, Created_Date)
        VALUES (?, ?, ?)
    """, (
        note_id,
        summary_text,
        created_date
    ))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "AI summarization completed",
        "note_id": note_id,
        "summary": summary_text
    })


# ---------------- GET RESULT ----------------

@app.route("/result/<int:note_id>", methods=["GET"])
def get_result(note_id):

    conn = get_db()

    result = conn.execute("""
        SELECT
            V.Note_ID,
            V.Audio_File,
            V.Date_Time,
            T.Transcript_Text,
            S.Summary_Text,
            S.Created_Date
        FROM VOICE_NOTE V

        LEFT JOIN TRANSCRIPT T
        ON V.Note_ID = T.Note_ID

        LEFT JOIN SUMMARY S
        ON V.Note_ID = S.Note_ID

        WHERE V.Note_ID = ?
    """, (note_id,)).fetchone()

    conn.close()

    if not result:
        return jsonify({
            "message": "Result not found"
        }), 404

    return jsonify({
        "note_id": result["Note_ID"],
        "audio_file": result["Audio_File"],
        "date_time": result["Date_Time"],
        "transcript": result["Transcript_Text"],
        "summary": result["Summary_Text"],
        "created_date": result["Created_Date"]
    })


# ---------------- USER HISTORY ----------------

@app.route("/history/<int:user_id>", methods=["GET"])
def history(user_id):

    conn = get_db()

    notes = conn.execute("""
        SELECT
            V.Note_ID,
            V.Audio_File,
            V.Date_Time,
            T.Transcript_Text,
            S.Summary_Text

        FROM VOICE_NOTE V

        LEFT JOIN TRANSCRIPT T
        ON V.Note_ID = T.Note_ID

        LEFT JOIN SUMMARY S
        ON V.Note_ID = S.Note_ID

        WHERE V.User_ID = ?

        ORDER BY V.Note_ID DESC
    """, (user_id,)).fetchall()

    conn.close()

    result = []

    for note in notes:

        result.append({
            "note_id": note["Note_ID"],
            "audio_file": note["Audio_File"],
            "date_time": note["Date_Time"],
            "transcript": note["Transcript_Text"],
            "summary": note["Summary_Text"]
        })

    return jsonify(result)


# ---------------- RUN SERVER ----------------

if __name__ == "__main__":

    init_db()

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )