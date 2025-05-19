const workSelect = document.getElementById('work-time');
const restSelect = document.getElementById('rest-time');
const roundsSelect = document.getElementById('rounds');
const totalTimeDisplay = document.getElementById('total-time');
const countdownDisplay = document.getElementById('countdown');

let timerInterval = null;
let isRunning = false;
let currentRound = 0;
let currentPhase = 'work';
let remainingTime = 0;
let workTime, restTime, rounds;

let audioCtx = null;
let unlocked = false;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Dummy-Ton zur Aktivierung auf iOS
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    if (source.start) {
      source.start(0);
    } else if (source.noteOn) {
      source.noteOn(0);
    }

    // ➕ Extra Sicherheit: AudioContext aktivieren
    audioCtx.resume().catch((e) => console.log('AudioContext resume error:', e));

    unlocked = true;
  }
}



function beep(frequency, duration) {
  if (!audioCtx) return; // kein Context = kein Ton
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gainNode.gain.setValueAtTime(1, audioCtx.currentTime);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration / 1000);
}

function tripleBeep() {
  beep(1200, 1000);
  setTimeout(() => beep(1200, 1000), 1200);
  setTimeout(() => beep(1200, 1000), 2400);
}

function populateSelect(select, step, max, defaultValue) {
  for (let i = step; i <= max; i += step) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `${Math.floor(i / 60)}:${String(i % 60).padStart(2, '0')}`;
    select.appendChild(option);
  }
  select.value = defaultValue;
}

function populateRounds(select, max, defaultValue) {
  for (let i = 1; i <= max; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    select.appendChild(option);
  }
  select.value = defaultValue;
}

populateSelect(workSelect, 30, 600, 60); // 30s Schritte bis 10min
populateSelect(restSelect, 10, 300, 30); // 10s Schritte bis 5min
populateRounds(roundsSelect, 15, 1);     // 1–15 Runden

function updateTotalTime() {
  const work = parseInt(workSelect.value || 0);
  const rest = parseInt(restSelect.value || 0);
  const reps = parseInt(roundsSelect.value || 0);
  const total = reps * (work + rest);
  totalTimeDisplay.textContent = 'Gesamtzeit: ' + formatTime(total);
}

workSelect.addEventListener('change', updateTotalTime);
restSelect.addEventListener('change', updateTotalTime);
roundsSelect.addEventListener('change', updateTotalTime);

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function updateBackground() {
  if (currentPhase === 'work') {
    document.body.style.backgroundColor = '#8B0000'; // Rot
    countdownDisplay.textContent = `Arbeit – ${formatTime(remainingTime)}`;
  } else {
    document.body.style.backgroundColor = '#006400'; // Grün
    countdownDisplay.textContent = `Pause – ${formatTime(remainingTime)}`;
  }
}

function startTimer() {
  if (isRunning) return;

  initAudio(); // aktiviert Ton auch auf iOS
  workTime = parseInt(workSelect.value || 0);
  restTime = parseInt(restSelect.value || 0);
  rounds = parseInt(roundsSelect.value || 0);
  if (!workTime || !rounds) return;

  isRunning = true;
  currentRound = 0;
  currentPhase = 'work';
  remainingTime = workTime;
  beep(1500, 1000); // Start Arbeit
  updateBackground();
  runCountdown();
}

function runCountdown() {
  updateBackground();
  timerInterval = setInterval(() => {
    remainingTime--;
    updateBackground();

    if (remainingTime <= 0) {
      if (currentPhase === 'work') {
        currentPhase = 'rest';
        remainingTime = restTime;
        if (restTime > 0) beep(1000, 1000); // Pause beginnt
      } else {
        currentRound++;
        if (currentRound >= rounds) {
          stopTimer();
          tripleBeep(); // fertig!
          return;
        }
        currentPhase = 'work';
        remainingTime = workTime;
        beep(1500, 1000); // Neue Arbeitsrunde
      }
      updateBackground();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  countdownDisplay.textContent = 'Timer: 00:00';
  document.body.style.backgroundColor = 'black';
}

updateTotalTime();
