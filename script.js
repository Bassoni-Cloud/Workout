const workSelect = document.getElementById('work-time');
const restSelect = document.getElementById('rest-time');
const roundsSelect = document.getElementById('rounds');
const prepSelect = document.getElementById('prep-time');
const totalTimeDisplay = document.getElementById('total-time');
const remainingTotalDisplay = document.getElementById('remaining-total');
const countdownDisplay = document.getElementById('countdown');
const phaseIndicator = document.getElementById('phase-indicator');

let timerInterval = null;
let isRunning = false;
let currentRound = 0;
let currentPhase = 'prep';
let remainingTime = 0;
let totalRemainingTime = 0;
let workTime, restTime, rounds, prepTime;

let audioCtx = null;
let unlocked = false;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
    audioCtx.resume().catch(e => console.log('AudioContext resume error:', e));
    unlocked = true;
  }
}

function beep(frequency, duration) {
  if (!audioCtx || !unlocked) return;
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

function testBeep() {
  initAudio();
  beep(1000, 1000);
}

function tripleBeep() {
  beep(1200, 1000);
  setTimeout(() => beep(1200, 1000), 1200);
  setTimeout(() => beep(1200, 1000), 2400);
}

function populateSelect(select, step, max, defaultValue) {
  select.innerHTML = '';
  for (let i = step; i <= max; i += step) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `${Math.floor(i / 60)}:${String(i % 60).padStart(2, '0')}`;
    select.appendChild(option);
  }
  select.value = defaultValue;
}

function populateRounds(select, max, defaultValue) {
  select.innerHTML = '';
  for (let i = 1; i <= max; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    select.appendChild(option);
  }
  select.value = defaultValue;
}

function updateTotalTime() {
  workTime = parseInt(workSelect.value || 0);
  restTime = parseInt(restSelect.value || 0);
  prepTime = parseInt(prepSelect.value || 0);
  rounds = parseInt(roundsSelect.value || 0);
  const total = prepTime + rounds * (workTime + restTime);
  totalTimeDisplay.textContent = 'Gesamtzeit: ' + formatTime(total);
  totalRemainingTime = total;
  updateRemainingTimeDisplay();
}

function updateRemainingTimeDisplay() {
  remainingTotalDisplay.textContent = 'Restzeit: ' + formatTime(totalRemainingTime);
}

workSelect.addEventListener('change', updateTotalTime);
restSelect.addEventListener('change', updateTotalTime);
prepSelect.addEventListener('change', updateTotalTime);
roundsSelect.addEventListener('change', updateTotalTime);

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function updateDisplays() {
  updateRemainingTimeDisplay();
  if (currentPhase === 'prep') {
    countdownDisplay.textContent = `Vorlauf – ${formatTime(remainingTime)}`;
    phaseIndicator.textContent = 'Phase 0 von ' + rounds;
  } else if (currentPhase === 'work') {
    countdownDisplay.textContent = `Arbeit – ${formatTime(remainingTime)}`;
    phaseIndicator.textContent = `Phase ${currentRound + 1} von ${rounds}`;
  } else {
    countdownDisplay.textContent = `Pause – ${formatTime(remainingTime)}`;
    phaseIndicator.textContent = `Phase ${currentRound + 1} von ${rounds}`;
  }
}

function startTimer() {
  if (isRunning) return;
  initAudio();
  updateTotalTime();

  isRunning = true;
  currentRound = 0;
  currentPhase = 'prep';
  remainingTime = prepTime;
  updateDisplays();
  runCountdown();
}

function runCountdown() {
  updateDisplays();
  timerInterval = setInterval(() => {
    remainingTime--;
    totalRemainingTime--;
    updateDisplays();

    if (remainingTime <= 0) {
      if (currentPhase === 'prep') {
        currentPhase = 'work';
        remainingTime = workTime;
        beep(1500, 1000);
      } else if (currentPhase === 'work') {
        currentPhase = 'rest';
        remainingTime = restTime;
        if (restTime > 0) beep(1000, 1000);
      } else {
        currentRound++;
        if (currentRound >= rounds) {
          stopTimer();
          tripleBeep();
          return;
        }
        currentPhase = 'work';
        remainingTime = workTime;
        beep(1500, 1000);
      }
      updateDisplays();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  countdownDisplay.textContent = 'Timer: 00:00';
  phaseIndicator.textContent = 'Phase 0 von 0';
  remainingTotalDisplay.textContent = 'Restzeit: 00:00';
}

document.addEventListener("DOMContentLoaded", () => {
  populateSelect(workSelect, 30, 600, 60);
  populateSelect(restSelect, 10, 300, 30);
  populateSelect(prepSelect, 10, 60, 10);
  populateRounds(roundsSelect, 15, 1);
  updateTotalTime();
});

