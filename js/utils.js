function appendLog(message, type = 'log', isHtml = false) {
  const consoleDiv = document.getElementById('jsConsole');
  if (!consoleDiv) return;
  const line = document.createElement('div');
  line.className = type;
  if (isHtml) line.innerHTML = message; else line.textContent = message;
  consoleDiv.appendChild(line);
  consoleDiv.scrollTop = consoleDiv.scrollHeight;
  if (typeof MathJax !== 'undefined') MathJax.typeset();
  const logs = JSON.parse(localStorage.getItem('consoleLogs') || '[]');
  logs.push({ message, type, isHtml });
  localStorage.setItem('consoleLogs', JSON.stringify(logs));
  gtag('event', 'log', { 'event_category': 'Console', 'event_label': type });
}

function clearConsole() {
  const consoleDiv = document.getElementById('jsConsole');
  if (consoleDiv) consoleDiv.innerHTML = '';
  localStorage.removeItem('consoleLogs');
  gtag('event', 'clear_console', { 'event_category': 'Console' });
}

let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
function playSound(type) {
  if (!soundEnabled) return;
  const sounds = {
    execute: new Audio('https://www.myinstants.com/media/sounds/click.mp3'),
    success: new Audio('https://www.myinstants.com/media/sounds/ding.mp3'),
    error: new Audio('https://www.myinstants.com/media/sounds/error.mp3')
  };
  sounds[type]?.play();
  gtag('event', 'play_sound', { 'event_category': 'Audio', 'event_label': type });
}

function updateHighScore(game, score) {
  const highScores = JSON.parse(localStorage.getItem('highScores') || '{}');
  if (!highScores[game] || score > highScores[game]) {
    highScores[game] = score;
    localStorage.setItem('highScores', JSON.stringify(highScores));
    appendLog(`New high score for ${game}: ${score}!`, 'info');
    gtag('event', 'high_score', { 'event_category': 'Game', 'event_label': game, 'value': score });
  }
}
