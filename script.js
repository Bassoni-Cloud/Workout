const workSelect = document.getElementById('work-time');
const restSelect = document.getElementById('rest-time');
const roundsSelect = document.getElementById('rounds');
const roundsInput = document.getElementById('rounds');
const totalTimeDisplay = document.getElementById('total-time');
const countdownDisplay = document.getElementById('countdown');

let timerInterval = null;
let isRunning = false;
let currentRound = 0;
let currentPhase = 'work';
let remainingTime = 0;
let workTime, restTime, rounds;

function populateRounds(select, max, defaultValue) {
  for (let i = 1; i <= max; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    select.appendChild(option);
  }
  select.value = defaultValue;
}

populateRounds(roundsSelect, 15, 1);


function populateSelect(select, step, max, defaultValue) {
  for (let i = step; i <= max; i += step) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `${Math.floor(i / 60)}:${String(i % 60).padStart(2, '0')}`;
    select.appendChild(option);
  }
  select.value = defaultValue;
}

populateSelect(workSelect, 30, 600, 60);
populateSelect(restSelect, 10, 300, 30);

function updateTotalTime() {
  const work = parseInt(workSelect.value || 0);
  const rest = parseInt(restSelect.value || 0);
  const reps = parseInt(roundsSelect.value || 0);
  const total = reps * (work + rest);
  totalTimeDisplay.textContent = 'Gesamtzeit: ' + formatTime(total);
}

workSelect.addEventListener('change', updateTotalTime);
restSelect.addEventListener('change', updateTotalTime);
roundsInput.addEventListener('input', updateTotalTime);

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function beep(frequency, duration) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
  setTimeout(() => beep(1200, 1000), 2200);
  setTimeout(() => beep(1200, 1000), 4400);
}

function updateBackground() {
  if (currentPhase === 'work') {
    document.body.style.backgroundColor = '#8B0000';
    countdownDisplay.textContent = `Arbeit – ${formatTime(remainingTime)}`;
  } else {
    document.body.style.backgroundColor = '#006400';
    countdownDisplay.textContent = `Pause – ${formatTime(remainingTime)}`;
  }
}

function startTimer() {
  if (isRunning) return;

  workTime = parseInt(workSelect.value || 0);
  restTime = parseInt(restSelect.value || 0);
  rounds = parseInt(roundsInput.value || 0);
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
        if (restTime > 0) beep(1300, 1000); // Wechsel zu Pause
      } else {
        currentRound++;
        if (currentRound >= rounds) {
          stopTimer();
          tripleBeep(); // Ende
          return;
        }
        currentPhase = 'work';
        remainingTime = workTime;
        beep(1500, 1000); // Wechsel zu Arbeit
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
