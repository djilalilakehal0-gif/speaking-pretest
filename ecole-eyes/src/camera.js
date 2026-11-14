// The phone's back camera, and taking a still picture to send to the AI.

let stream = null;

export async function startCamera(video) {
  if (stream) return;
  stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
  });
  video.srcObject = stream;
  video.setAttribute('playsinline', '');
  video.muted = true;
  await video.play().catch(() => {});
  // Wait for the first frame so the first picture is not black.
  if (!video.videoWidth) {
    await new Promise((r) => {
      const t = setTimeout(r, 2500);
      video.addEventListener('loadeddata', () => { clearTimeout(t); r(); }, { once: true });
    });
  }
  // Let auto-exposure settle a moment.
  await new Promise((r) => setTimeout(r, 600));
}

export function stopCamera(video) {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
  if (video) video.srcObject = null;
}

export function cameraOn() { return !!stream; }

// Returns a base64 JPEG (no data: prefix), longest side up to `max` pixels.
export function snapshot(video, max = 1280) {
  const w = video.videoWidth, h = video.videoHeight;
  if (!w || !h) return null;
  const s = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * s);
  canvas.height = Math.round(h * s);
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
}
