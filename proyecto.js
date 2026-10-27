
const artistName = "Llonstill";

const songsData = [
  {
    id: 1,
    title: "Primer Sencillo (Nuevo Lanzamiento)",
    album: "Lanzamiento 2026",
    duration: "3:15",
    durationSeconds: 195,
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: 2,
    title: "Pista 02 - Título de Canción",
    album: "Producción Oficial",
    duration: "2:50",
    durationSeconds: 170,
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: 3,
    title: "Pista 03 - Título de Canción",
    album: "Producción Oficial",
    duration: "3:30",
    durationSeconds: 210,
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: 4,
    title: "Pista 04 - Colaboración Especial",
    album: "Sencillos",
    duration: "3:05",
    durationSeconds: 185,
    cover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=200&q=80"
  }
];

const albumsData = [
  {
    id: 1,
    title: "Nuevo Álbum 2026",
    type: "album",
    year: "2026",
    tracks: "Próximamente",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 2,
    title: "Sencillos Oficiales",
    type: "single",
    year: "2025",
    tracks: "Disponible en Spotify",
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80"
  }
];

const tourData = [
  { date: "Próximamente", city: "Bogotá", venue: "Por confirmar", status: "Confirmando", available: true },
  { date: "Próximamente", city: "Medellín", venue: "Por confirmar", status: "Confirmando", available: true }
];

/* ==========================================================
   ESTADO DEL REPRODUCTOR & SINTETIZADOR DE TONO
   ========================================================== */
let currentTrackIndex = 0;
let isPlaying = false;
let currentTime = 0;
let playbackTimer = null;

let audioCtx = null;
let synthOsc = null;

function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function startSynthTone() {
  try {
    initAudioContext();
    stopSynthTone();
    synthOsc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    synthOsc.type = 'sine';
    synthOsc.frequency.setValueAtTime(261.63, audioCtx.currentTime); // Tono agradable (C4)
    gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);
    synthOsc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    synthOsc.start();
  } catch (e) {
    console.log("Audio API:", e);
  }
}

function stopSynthTone() {
  if (synthOsc) {
    try {
      synthOsc.stop();
      synthOsc.disconnect();
    } catch (e) {}
    synthOsc = null;
  }
}

/* ==========================================================
   INICIALIZACIÓN
   ========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  renderTracks();
  renderAlbums('all');
  renderTour();
  setupPlayerListeners();
  setupMenuToggle();
  setupFilters();
  setupBookingForm();
  updatePlayerUI();
});

/* ==========================================================
   RENDERIZADO DE SECCIONES
   ========================================================== */
function renderTracks() {
  const container = document.getElementById("tracksContainer");
  if (!container) return;

  container.innerHTML = songsData.map((song, index) => `
    <div class="track-row ${index === currentTrackIndex && isPlaying ? 'active' : ''}" onclick="playTrackByIndex(${index})">
      <span class="track-num">${index + 1}</span>
      <img src="${song.cover}" alt="${song.title}" class="track-img">
      <div class="track-meta">
        <h4>${song.title}</h4>
        <span>${song.album}</span>
      </div>
      <span class="track-duration">${song.duration}</span>
      <button class="track-action-btn" aria-label="Reproducir">
        <i class="fa-solid ${index === currentTrackIndex && isPlaying ? 'fa-pause' : 'fa-play'}"></i>
      </button>
    </div>
  `).join("");
}

function renderAlbums(filter = 'all') {
  const container = document.getElementById("albumsContainer");
  if (!container) return;

  const filtered = filter === 'all' 
    ? albumsData 
    : albumsData.filter(album => album.type === filter);

  container.innerHTML = filtered.map(album => `
    <div class="album-card">
      <div class="album-cover-box">
        <img src="${album.cover}" alt="${album.title}">
      </div>
      <div class="album-details">
        <span class="album-tag">${album.type.toUpperCase()} • ${album.year}</span>
        <h3>${album.title}</h3>
        <p>${album.tracks}</p>
      </div>
    </div>
  `).join("");
}

function renderTour() {
  const tbody = document.getElementById("tourTableBody");
  if (!tbody) return;

  tbody.innerHTML = tourData.map(tour => `
    <tr>
      <td><strong>${tour.date}</strong></td>
      <td>${tour.city}</td>
      <td>${tour.venue}</td>
      <td><span class="badge-available">${tour.status}</span></td>
      <td>
        <button class="btn btn-outline" style="padding: 6px 16px; font-size: 0.85rem;" onclick="showToast('Próximamente boletas para ${tour.city}')">Info</button>
      </td>
    </tr>
  `).join("");
}

/* ==========================================================
   CONTROL DEL REPRODUCTOR
   ========================================================== */
function setupPlayerListeners() {
  const btnPlay = document.getElementById("btnPlay");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const btnHeroPlay = document.getElementById("btnHeroPlay");
  const progressBg = document.getElementById("progressBg");

  btnPlay.addEventListener("click", togglePlay);
  btnPrev.addEventListener("click", prevTrack);
  btnNext.addEventListener("click", nextTrack);

  if (btnHeroPlay) {
    btnHeroPlay.addEventListener("click", () => {
      playTrackByIndex(0);
    });
  }

  progressBg.addEventListener("click", (e) => {
    const rect = progressBg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const track = songsData[currentTrackIndex];
    currentTime = Math.floor((clickX / width) * track.durationSeconds);
    updateProgressUI();
  });
}

function playTrackByIndex(index) {
  if (currentTrackIndex === index && isPlaying) {
    togglePlay();
    return;
  }
  currentTrackIndex = index;
  currentTime = 0;
  isPlaying = true;
  startSynthTone();
  startTimer();
  updatePlayerUI();
  renderTracks();
}

function togglePlay() {
  isPlaying = !isPlaying;
  if (isPlaying) {
    startSynthTone();
    startTimer();
  } else {
    stopSynthTone();
    clearInterval(playbackTimer);
  }
  updatePlayerUI();
  renderTracks();
}

function prevTrack() {
  currentTrackIndex = (currentTrackIndex - 1 + songsData.length) % songsData.length;
  currentTime = 0;
  if (isPlaying) startSynthTone();
  updatePlayerUI();
  renderTracks();
}

function nextTrack() {
  currentTrackIndex = (currentTrackIndex + 1) % songsData.length;
  currentTime = 0;
  if (isPlaying) startSynthTone();
  updatePlayerUI();
  renderTracks();
}

function startTimer() {
  clearInterval(playbackTimer);
  playbackTimer = setInterval(() => {
    const track = songsData[currentTrackIndex];
    if (currentTime < track.durationSeconds) {
      currentTime++;
      updateProgressUI();
    } else {
      nextTrack();
    }
  }, 1000);
}

function updatePlayerUI() {
  const track = songsData[currentTrackIndex];
  document.getElementById("playerTitle").innerText = track.title;
  document.getElementById("playerArtist").innerText = artistName;
  document.getElementById("playerCover").src = track.cover;
  document.getElementById("durTime").innerText = track.duration;

  const btnPlay = document.getElementById("btnPlay");
  btnPlay.innerHTML = isPlaying ? `<i class="fa-solid fa-pause"></i>` : `<i class="fa-solid fa-play"></i>`;
  updateProgressUI();
}

function updateProgressUI() {
  const track = songsData[currentTrackIndex];
  const progressPercent = (currentTime / track.durationSeconds) * 100;
  document.getElementById("progressFill").style.width = `${progressPercent}%`;

  const mins = Math.floor(currentTime / 60);
  const secs = currentTime % 60;
  document.getElementById("currTime").innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/* ==========================================================
   UTILIDADES & FORMULARIO
   ========================================================== */
function setupMenuToggle() {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("navMenu");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    nav.classList.toggle("active");
  });

  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => nav.classList.remove("active"));
  });
}

function setupFilters() {
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderAlbums(btn.dataset.filter);
    });
  });
}

function setupBookingForm() {
  const form = document.getElementById("bookingForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    showToast(`¡Solicitud enviada para ${name}! Nos pondremos en contacto pronto.`);
    form.reset();
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.innerText = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}