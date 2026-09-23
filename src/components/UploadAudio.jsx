import { useState } from "react";

function UploadAudio() {
  const [audioFile, setAudioFile] = useState(null);
  const [audioURL, setAudioURL] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      setAudioFile(file);
      setAudioURL(URL.createObjectURL(file));
    }
  };

  return (
    <div className="upload-section">
      <h2>📁 Upload Audio</h2>

      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
      />

      {audioFile && (
        <div>
          <p>Selected: {audioFile.name}</p>

          <audio controls src={audioURL}></audio>
        </div>
      )}
    </div>
  );
}

export default UploadAudio;