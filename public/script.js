const video = document.getElementById('video');
const moodText = document.getElementById('mood');
const songsDiv = document.getElementById('songs');
const detectBtn = document.getElementById('detectBtn');

// Map Face API moods to Spotify genres
const MOOD_TO_GENRE = {
  happy: "pop",
  sad: "acoustic",
  angry: "rock",
  surprised: "electronic",
  neutral: "chill",
  disgusted: "metal",
  fearful: "ambient"
};

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo).catch(err => {
  console.error("Model loading error:", err);
  moodText.textContent = "Error loading AI models. Refresh.";
});

// 2. Start the webcam
function startVideo() {
  moodText.textContent = "Please allow webcam access...";
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
      moodText.textContent = "Click the button to detect mood!";
    })
    .catch(err => {
      console.error("Camera error:", err);
      moodText.textContent = "Error: Could not access webcam.";
    });
}

// click event to the button
detectBtn.addEventListener('click', async () => {
  moodText.textContent = "Detecting...";
  songsDiv.innerHTML = "";

  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();

  if (!detection) {
    moodText.textContent = "No face detected 😕";
    return;
  }

  // find the strongest emotion
  const mood = Object.entries(detection.expressions).sort((a, b) => b[1] - a[1])[0][0];
  moodText.textContent = `You seem ${mood}! Finding songs...`;

  const genre = MOOD_TO_GENRE[mood] || "indie";

  // fetch songs from server
  try {
    const res = await fetch(`/songs?mood=${genre}`);
    if (!res.ok) {
        throw new Error(`Server error: ${res.statusText}`);
    }
    const songs = await res.json();

    if (songs.error) {
        throw new Error(songs.error);
    }

    // 5. Display the songs
    songsDiv.innerHTML = songs.map(s => 
      `<a href="${s.url}" target="_blank">${s.name} by ${s.artist}</a>`
    ).join('');
  } catch (err) {
    console.error("Song fetching error:", err);
    moodText.textContent = `Error finding songs. (Did you set the Spotify token in server.js?)`;
  }
});