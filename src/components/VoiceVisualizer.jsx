import { useEffect, useRef } from 'react';

export default function VoiceVisualizer({ isRecording, stream = null }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (isRecording && stream) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        sourceRef.current = source;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const drawLive = () => {
          animationFrameRef.current = requestAnimationFrame(drawLive);
          analyser.getByteFrequencyData(dataArray);

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const barCount = 28;
          const barWidth = 4;
          const gap = 4;
          const startX = (canvas.width - (barCount * (barWidth + gap))) / 2;

          for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor((i / barCount) * bufferLength);
            const value = dataArray[dataIndex] || 0;
            const percent = value / 255;
            const barHeight = Math.max(6, percent * (canvas.height - 10));

            // Gradient: Cyan to Blue to Purple
            const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
            gradient.addColorStop(0, '#3B82F6');
            gradient.addColorStop(0.5, '#6366F1');
            gradient.addColorStop(1, '#8B5CF6');

            ctx.fillStyle = gradient;
            const x = startX + i * (barWidth + gap);
            const y = (canvas.height - barHeight) / 2;

            // Rounded bar
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 3);
            ctx.fill();
          }
        };

        drawLive();
        return;
      } catch (err) {
        console.warn('AudioContext visualization fallback:', err);
      }
    }

    // Fallback animation when stream isn't connected or stream is mocked
    let step = 0;
    const drawSimulated = () => {
      animationFrameRef.current = requestAnimationFrame(drawSimulated);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 28;
      const barWidth = 4;
      const gap = 4;
      const startX = (canvas.width - (barCount * (barWidth + gap))) / 2;

      step += 0.08;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 8;
        if (isRecording) {
          const wave = Math.sin(step + i * 0.4) * 0.5 + 0.5;
          const wave2 = Math.cos(step * 1.5 + i * 0.3) * 0.5 + 0.5;
          barHeight = Math.max(6, (wave * 0.6 + wave2 * 0.4) * (canvas.height - 12));
        }

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#3B82F6');
        gradient.addColorStop(0.5, '#6366F1');
        gradient.addColorStop(1, '#A855F7');

        ctx.fillStyle = gradient;
        const x = startX + i * (barWidth + gap);
        const y = (canvas.height - barHeight) / 2;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }
    };

    drawSimulated();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isRecording, stream]);

  return (
    <div className="voice-visualizer-container">
      <canvas 
        ref={canvasRef} 
        width={340} 
        height={64} 
        className="visualizer-canvas"
      />
    </div>
  );
}
