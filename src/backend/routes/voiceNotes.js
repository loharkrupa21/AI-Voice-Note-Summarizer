const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();
const pool = require("../db");

// =====================================================
// CREATE SEPARATE FOLDERS
// =====================================================

const uploadFolder = path.join(__dirname, "../uploads/audio");
const recordedFolder = path.join(__dirname, "../uploads/recorded");

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

if (!fs.existsSync(recordedFolder)) {
  fs.mkdirSync(recordedFolder, { recursive: true });
}


// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    const voiceType = req.body.voice_type;

    if (voiceType === "recorded") {
      cb(null, recordedFolder);
    } else {
      cb(null, uploadFolder);
    }
  },

  filename: (req, file, cb) => {

    const voiceType = req.body.voice_type;

    const ext =
      path.extname(file.originalname) || ".webm";

    const prefix =
      voiceType === "recorded"
        ? "recorded_"
        : "audio_";

    const filename =
      prefix +
      Date.now() +
      ext;

    cb(null, filename);
  }
});


const upload = multer({
  storage: storage
});


// =====================================================
// SAVE AUDIO / RECORDING
// =====================================================

router.post(
  "/upload",
  upload.single("audio"),

  async (req, res) => {

    try {

      console.log("");
      console.log("====================================");
      console.log("VOICE FILE SAVE REQUEST");
      console.log("====================================");

      // -------------------------------------------------
      // FILE CHECK
      // -------------------------------------------------

      if (!req.file) {

        return res.status(400).json({
          success: false,
          message: "Audio file is required"
        });
      }


      // -------------------------------------------------
      // EMAIL CHECK
      // -------------------------------------------------

      const email = req.body.email;

      if (!email) {

        return res.status(400).json({
          success: false,
          message: "Email is required"
        });
      }


      // -------------------------------------------------
      // VOICE TYPE
      // -------------------------------------------------

      const voiceType =
        req.body.voice_type || "upload";


      const fileName =
        req.file.filename;


      let uploadVoice = null;
      let recordedVoice = null;


      // =================================================
      // RECORDED AUDIO
      // =================================================

      if (voiceType === "recorded") {

        recordedVoice = fileName;

        console.log(
          "Type: RECORDED VOICE"
        );

        console.log(
          "Saved folder: uploads/recorded/"
        );

      }


      // =================================================
      // UPLOADED AUDIO FILE
      // =================================================

      else {

        uploadVoice = fileName;

        console.log(
          "Type: UPLOADED AUDIO FILE"
        );

        console.log(
          "Saved folder: uploads/audio/"
        );
      }


      // =================================================
      // SAVE DATABASE
      // =================================================

      const [result] = await pool.execute(

        `
        INSERT INTO voice_notes
        (
          email,
          upload_voice,
          recorded_voice,
          created_at
        )
        VALUES (?, ?, ?, NOW())
        `,

        [
          email,
          uploadVoice,
          recordedVoice
        ]
      );


      console.log(
        "Database ID:",
        result.insertId
      );

      console.log(
        "File:",
        fileName
      );

      console.log(
        "===================================="
      );


      // =================================================
      // RESPONSE
      // =================================================

      return res.status(200).json({

        success: true,

        message:
          voiceType === "recorded"
            ? "Recording saved successfully"
            : "Audio file saved successfully",

        note_id: result.insertId,

        file_name: fileName,

        voice_type: voiceType
      });


    } catch (error) {

      console.error(
        "VOICE FILE SAVE ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to save voice file",

        error:
          error.message
      });
    }
  }
);


module.exports = router;