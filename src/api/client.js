const API_BASE = "http://127.0.0.1:8000";

// =========================================================
// HEADERS
// =========================================================

function getHeaders() {
  return {
    "Content-Type": "application/json",
  };
}

// =========================================================
// RESPONSE DATA
// =========================================================

async function getResponseData(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      detail: text,
    };
  }
}

// =========================================================
// ERROR MESSAGE
// =========================================================

function getErrorMessage(data, fallback) {
  if (!data) {
    return fallback;
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data.detail)) {
    return data.detail
      .map(
        (item) =>
          item?.msg || "Validation error"
      )
      .join(", ");
  }

  if (typeof data.message === "string") {
    return data.message;
  }

  return fallback;
}

// =========================================================
// GET CURRENT USER EMAIL
// =========================================================

function getCurrentUserEmail() {
  try {
    const directEmail =
      localStorage.getItem("email");

    if (directEmail) {
      return directEmail;
    }

    const storedUser =
      localStorage.getItem("voicemind_user");

    if (storedUser) {
      const user =
        JSON.parse(storedUser);

      return user?.email || "";
    }

    return "";
  } catch (error) {
    console.warn(
      "Could not get user email:",
      error
    );

    return "";
  }
}

// =========================================================
// API
// =========================================================

export const api = {

  // =======================================================
  // LOGIN
  // =======================================================

  async login(email, password) {
    const response =
      await fetch(
        `${API_BASE}/login`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

    const data =
      await getResponseData(response);

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          data,
          "Login failed"
        )
      );
    }

    const user = {
      id: data.user_id,
      name: data.name || "",
      email: data.email || email,
    };

    localStorage.setItem(
      "voicemind_user",
      JSON.stringify(user)
    );

    if (data.user_id) {
      localStorage.setItem(
        "user_id",
        String(data.user_id)
      );
    }

    localStorage.setItem(
      "email",
      data.email || email
    );

    if (data.name) {
      localStorage.setItem(
        "name",
        data.name
      );
    }

    return data;
  },

  // =======================================================
  // REGISTER / SIGNUP
  // =======================================================

  async register(
    name,
    email,
    password
  ) {
    const response =
      await fetch(
        `${API_BASE}/signup`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

    const data =
      await getResponseData(response);

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          data,
          "Signup failed"
        )
      );
    }

    return data;
  },

  // =======================================================
  // GET SAVED NOTES
  // =======================================================

  async getSavedNotes(userId) {
    if (!userId) {
      throw new Error(
        "User ID not found"
      );
    }

    const response =
      await fetch(
        `${API_BASE}/voice-notes/user/${userId}`,
        {
          method: "GET",
        }
      );

    const data =
      await getResponseData(response);

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          data,
          "Failed to load saved notes"
        )
      );
    }

    return data;
  },

  // =======================================================
  // UPLOAD / RECORD VOICE NOTE
  // =======================================================

  async uploadVoiceNote(
    audioBlob,
    title,
    userId,
    voiceType = "upload"
  ) {
    // -----------------------------------------------------
    // VALIDATE AUDIO
    // -----------------------------------------------------

    if (!audioBlob) {
      throw new Error(
        "Audio file is required"
      );
    }

    // -----------------------------------------------------
    // VALIDATE USER ID
    // -----------------------------------------------------

    if (!userId) {
      throw new Error(
        "User ID not found. Please login again."
      );
    }

    // -----------------------------------------------------
    // FORM DATA
    // -----------------------------------------------------

    const formData =
      new FormData();

    formData.append(
      "user_id",
      String(userId)
    );

    // -----------------------------------------------------
    // FILE NAME
    // -----------------------------------------------------

    let fileName =
      title || "voice_note.webm";

    if (!fileName.includes(".")) {
      fileName =
        `${fileName}.webm`;
    }

    // -----------------------------------------------------
    // AUDIO FILE
    // -----------------------------------------------------

    formData.append(
      "file",
      audioBlob,
      fileName
    );

    // -----------------------------------------------------
    // SELECT FASTAPI ENDPOINT
    // -----------------------------------------------------

    const endpoint =
      voiceType === "recorded"
        ? `${API_BASE}/voice-notes/record`
        : `${API_BASE}/voice-notes/upload`;

    // -----------------------------------------------------
    // DEBUG
    // -----------------------------------------------------

    console.log(
      "================================"
    );

    console.log(
      "VOICE NOTE REQUEST"
    );

    console.log(
      "USER ID:",
      userId
    );

    console.log(
      "VOICE TYPE:",
      voiceType
    );

    console.log(
      "ENDPOINT:",
      endpoint
    );

    console.log(
      "AUDIO NAME:",
      fileName
    );

    console.log(
      "AUDIO SIZE:",
      audioBlob.size
    );

    console.log(
      "AUDIO MIME:",
      audioBlob.type
    );

    console.log(
      "================================"
    );

    // -----------------------------------------------------
    // SEND TO FASTAPI
    // -----------------------------------------------------

    const response =
      await fetch(
        endpoint,
        {
          method: "POST",
          body: formData,
        }
      );

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    const data =
      await getResponseData(response);

    // -----------------------------------------------------
    // ERROR
    // -----------------------------------------------------

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          data,
          "Audio upload failed"
        )
      );
    }

    // -----------------------------------------------------
    // SUCCESS
    // -----------------------------------------------------

    console.log(
      "VOICE NOTE SAVED SUCCESSFULLY"
    );

    console.log(
      "BACKEND RESPONSE:",
      data
    );

    return data;
  },

  // =======================================================
  // TRANSCRIPTION
  // =======================================================

  async transcribe(
    noteId,
    language = "English"
  ) {
    if (!noteId) {
      throw new Error(
        "Note ID not found"
      );
    }

    console.log(
      "================================"
    );

    console.log(
      "TRANSCRIPTION REQUEST"
    );

    console.log(
      "NOTE ID:",
      noteId
    );

    console.log(
      "LANGUAGE:",
      language
    );

    console.log(
      "ENDPOINT:",
      `${API_BASE}/transcription`
    );

    console.log(
      "================================"
    );

    const response =
      await fetch(
        `${API_BASE}/transcription`,
        {
          method: "POST",

          headers:
            getHeaders(),

          body: JSON.stringify({
            note_id:
              Number(noteId),

            language:
              language,
          }),
        }
      );

    const data =
      await getResponseData(response);

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          data,
          "Transcription failed"
        )
      );
    }

    console.log(
      "TRANSCRIPTION SUCCESSFUL"
    );

    console.log(
      "TRANSCRIPT:",
      data.transcript
    );

    return data;
  },

  // =======================================================
  // SUMMARIZATION
  // =======================================================

  async summarize(
    noteId,
    transcript,
    language = "English",
    format = "key-points",
    detailLevel = "balanced"
  ) {
    if (!noteId) {
      throw new Error(
        "Note ID not found"
      );
    }

    if (
      !transcript ||
      !transcript.trim()
    ) {
      throw new Error(
        "Transcript is empty"
      );
    }

    const response =
      await fetch(
        `${API_BASE}/summarization`,
        {
          method: "POST",

          headers:
            getHeaders(),

          body: JSON.stringify({
            note_id:
              Number(noteId),

            transcript_text:
              transcript,

            language:
              language,

            format:
              format,

            detail_level:
              detailLevel,
          }),
        }
      );

    const data =
      await getResponseData(response);

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          data,
          "Summary generation failed"
        )
      );
    }

    return data;
  },

  // =======================================================
  // DELETE VOICE NOTE
  // =======================================================

  async deleteVoiceNote(noteId) {
    if (!noteId) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_BASE}/voice-notes/${noteId}`,
          {
            method: "DELETE",
          }
        );

      return await getResponseData(
        response
      );

    } catch (err) {
      console.warn(
        "Could not delete note on backend:",
        err
      );
    }
  },
};