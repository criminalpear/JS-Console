console.log('Script loaded');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded');
  gtag('event', 'page_load', { 'event_category': 'Page' });

  let elementList = [];
  let commandHistory = [];
  let historyIndex = -1;
  window.isGameRunning = false;

  console.log = function(message) { appendLog(message, 'log'); };
  console.error = function(message) { appendLog(message, 'error'); };
  console.warn = function(message) { appendLog(message, 'warn'); };
  console.info = function(message) { appendLog(message, 'info'); };

  function installPWA() {
    if (window.hasInstalledPWA) return;
    window.hasInstalledPWA = true;

    let deferredPrompt;
    const installBtn = document.getElementById('installBtn');
    installBtn.style.display = 'none';

    function isStandalone() {
      return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    }

    function updateButtonVisibility() {
      if (isStandalone()) {
        installBtn.style.display = 'none';
        appendLog('App is already running as a standalone PWA!', 'info');
      } else if (deferredPrompt) {
        installBtn.style.display = 'inline-block';
      }
    }

    updateButtonVisibility();

    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      if (e.matches) {
        installBtn.style.display = 'none';
        appendLog('App is now running as a standalone PWA!', 'info');
      }
    });

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      updateButtonVisibility();
    });

    window.addEventListener('appinstalled', () => {
      appendLog('App installed successfully!', 'info');
      installBtn.style.display = 'none';
      deferredPrompt = null;
    });

    installBtn.addEventListener('click', () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        appendLog('Install prompt displayed. Choose to install or cancel.', 'info');
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            appendLog('App installed successfully!', 'info');
            gtag('event', 'pwa_install', { 'event_category': 'PWA', 'event_label': 'accepted' });
          } else {
            appendLog('Install prompt dismissed.', 'info');
            gtag('event', 'pwa_install', { 'event_category': 'PWA', 'event_label': 'dismissed' });
          }
          deferredPrompt = null;
        });
      } else {
        appendLog('Install prompt not available yet. Try refreshing the page.', 'error');
      }
    });
  }

  function executeCode() {
    const input = document.getElementById('inputField').value.trim();
    if (input === '') {
      appendLog('Error: Please enter some code to execute.', 'error');
      playSound('error');
      return;
    }
    commandHistory.unshift(input);
    historyIndex = -1;
    try {
      if (input === 'idiot();') {
        idiot();
      } else if (input === 'elements();') {
        elements();
      } else if (input === 'elementshelp();') {
        elementshelp();
      } else if (input.includes('=') && input.includes('x')) {
        const [leftSide, rightSide] = input.split('=').map(part => part.trim());
        const solution = solveEquation(leftSide, rightSide);
        appendLog(
          `Equation: \\\\(${leftSide} = ${rightSide}\\\\), Solution: \\\\(x = ${solution}\\\\)`,
          'log',
          true
        );
        playSound('success');
      } else if (window.editElement && /\d+\s/.test(input)) {
        window.editElement(input);
      } else {
        const result = eval(input);
        if (typeof result !== 'undefined') console.log(`Result: ${result}`);
        playSound('execute');
      }
      gtag('event', 'execute_code', { 'event_category': 'Console', 'event_label': input });
    } catch (e) {
      appendLog('Error: ' + e.message, 'error');
      playSound('error');
    }
    document.getElementById('inputField').value = '';
    hideAutocomplete();
  }

  function solveEquation(left, right) {
    function parseSide(side) {
      side = side.replace(/\s+/g, '');
      let coeffX = 0, constant = 0;
      let currentNum = '';
      let sign = 1;

      for (let i = 0; i < side.length; i++) {
        const char = side[i];
        if (char === '+' || char === '-') {
          if (currentNum) {
            if (currentNum.includes('x')) {
              coeffX += sign * (parseFloat(currentNum.replace('x', '')) || 1);
            } else {
              constant += sign * parseFloat(currentNum);
            }
          }
          currentNum = '';
          sign = char === '+' ? 1 : -1;
        } else {
          currentNum += char;
        }
      }
      if (currentNum) {
        if (currentNum.includes('x')) {
          coeffX += sign * (parseFloat(currentNum.replace('x', '')) || 1);
        } else {
          constant += sign * parseFloat(currentNum);
        }
      }
      return { coeffX, constant };
    }

    const leftParsed = parseSide(left);
    const rightParsed = parseSide(right);

    const finalCoeffX = leftParsed.coeffX - rightParsed.coeffX;
    const finalConstant = rightParsed.constant - leftParsed.constant;

    if (finalCoeffX === 0) {
      if (finalConstant === 0) {
        appendLog('Infinite solutions (identity)', 'info');
        return 'all real numbers';
      } else {
        appendLog('No solution (contradiction)', 'error');
        return 'no solution';
      }
    }

    return finalConstant / finalCoeffX;
  }

  function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    document.documentElement.style.removeProperty('--bg-color');
    document.documentElement.style.removeProperty('--text-color');
    localStorage.removeItem('customTheme');
    gtag('event', 'toggle_theme', { 'event_category': 'UI', 'event_label': document.body.classList.contains('dark') ? 'dark' : 'light' });
  }

  function setTheme(bgColor, textColor) {
    document.body.classList.remove('dark');
    document.documentElement.style.setProperty('--bg-color', bgColor);
    document.documentElement.style.setProperty('--text-color', textColor);
    localStorage.setItem('customTheme', JSON.stringify({ bgColor, textColor }));
    localStorage.removeItem('theme');
    appendLog(`Custom theme set: bg=${bgColor}, text=${textColor}`, 'info');
    gtag('event', 'set_theme', { 'event_category': 'UI', 'event_label': `${bgColor},${textColor}` });
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('soundEnabled', soundEnabled);
    appendLog(`Sound ${soundEnabled ? 'enabled' : 'disabled'}`, 'info');
    gtag('event', 'toggle_sound', { 'event_category': 'Audio', 'event_label': soundEnabled ? 'on' : 'off' });
  }

  function exportLog() {
    const consoleDiv = document.getElementById('jsConsole');
    const text = Array.from(consoleDiv.children).map(line => line.textContent).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'console-log.txt';
    a.click();
    gtag('event', 'export_log', { 'event_category': 'Console' });
  }

  const functions = [
    'squares', 'ponies', 'sawyer', 'aiden', 'aadyn', 'eli', 'elijah', 'ronin', 'ronin1', 'ronin2',
    'check', 'idiot', 'elements', 'elementshelp', 'list', 'snake', 'updates', 'setColor', 'tictactoe',
    'share', 'reset', 'highscores', 'shareHighScores', 'leaderboard', 'setUsername', 'setTheme', 'toggleSound', 'more'
  ];

  function setupAutocomplete() {
    const autocomplete = document.getElementById('autocomplete');
    const inputField = document.getElementById('inputField');
    inputField.addEventListener('input', () => {
      const value = inputField.value.toLowerCase();
      if (value === '') { hideAutocomplete(); return; }
      const matches = functions.filter(f => f.startsWith(value));
      if (matches.length === 0) { hideAutocomplete(); return; }
      autocomplete.innerHTML = '';
      matches.forEach(match => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = `${match}()`;
        item.addEventListener('click', () => {
          inputField.value = `${match}();`;
          hideAutocomplete();
          inputField.focus();
        });
        autocomplete.appendChild(item);
      });
      autocomplete.style.display = 'block';
    });
  }

  function hideAutocomplete() {
    document.getElementById('autocomplete').style.display = 'none';
  }

  function setupInput() {
    const inputField = document.getElementById('inputField');
    inputField.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        executeCode();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          inputField.value = commandHistory[historyIndex];
        }
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (historyIndex > -1) {
          historyIndex--;
          inputField.value = historyIndex === -1 ? '' : commandHistory[historyIndex];
        }
      }
    });
  }

  function updates() {
    appendLog('Update Log:', 'info');
    appendLog('v1.0 (Mar 07, 2025): Initial release with theme toggle, Snake, and more!', 'info');
    appendLog('v1.1 (Mar 07, 2025): Added setColor, Tic-Tac-Toe, sharing, logs, reset, scores.', 'info');
    appendLog('v1.2 (Mar 07, 2025): Fixed title overlap and Tic-Tac-Toe score bug.', 'info');
    appendLog('v1.3 (Mar 07, 2025): Scores persist after reset; added shareHighScores().', 'info');
    appendLog('v1.4 (Mar 07, 2025): Added leaderboard() for global scores.', 'info');
    appendLog('v1.5 (Mar 07, 2025): Added Pong (later removed).', 'info');
    appendLog('v1.6 (Mar 07, 2025): Added setUsername() for profiles.', 'info');
    appendLog('v1.7 (Mar 07, 2025): Added setTheme() for custom colors.', 'info');
    appendLog('v1.8 (Mar 07, 2025): Added toggleSound() for sound control.', 'info');
    appendLog('v1.9 (Mar 07, 2025): Removed Pong, fixed setTheme(), prioritized bookmarks, added PWA support.', 'info');
    appendLog('v2.0 (Mar 09, 2025): Enhanced PWA support with "Install App" button, fixed manifest and service worker paths.', 'info');
    appendLog('v2.1 (Mar 11, 2025): Organized bookmarks into categorized folders.', 'info');
    appendLog('Type "list();" to see all commands.', 'info');
  }

  function setColor(type, color) {
    const validTypes = ['log', 'error', 'warn', 'info'];
    if (!validTypes.includes(type)) {
      appendLog(`Error: Type must be one of ${validTypes.join(', ')}`, 'error');
      return;
    }
    document.querySelectorAll(`.console .${type}`).forEach(el => el.style.color = color);
    appendLog(`Set ${type} color to ${color}`, 'info');
    gtag('event', 'set_color', { 'event_category': 'Console', 'event_label': `${type}:${color}` });
  }

  function setUsername(name) {
    localStorage.setItem('username', name);
    appendLog(`Username set to "${name}"`, 'info');
    gtag('event', 'set_username', { 'event_category': 'User', 'event_label': name });
  }

  function highscores() {
    const localHighScores = JSON.parse(localStorage.getItem('highScores') || '{}');
    const username = localStorage.getItem('username') || 'Anonymous';
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('scores') ? JSON.parse(decodeURIComponent(urlParams.get('scores'))) : {};
    appendLog(`Your High Scores (${username}):`, 'info');
    appendLog(`Snake: ${localHighScores.snake || 0}`, 'info');
    appendLog(`Tic-Tac-Toe Wins: ${localHighScores.tictactoe || 0}`, 'info');
    if (sharedData.username) {
      appendLog(`Shared High Scores (${sharedData.username}):`, 'info');
      appendLog(`Snake: ${sharedData.scores.snake || 0}`, 'info');
      appendLog(`Tic-Tac-Toe Wins: ${sharedData.scores.tictactoe || 0}`, 'info');
    } else {
      appendLog('No shared high scores available. Use "shareHighScores();" to share yours!', 'info');
    }
    gtag('event', 'view_highscores', { 'event_category': 'Game' });
  }

  function shareHighScores() {
    const highScores = JSON.parse(localStorage.getItem('highScores') || '{}');
    const username = localStorage.getItem('username') || 'Anonymous';
    const data = { username, scores: highScores };
    const encoded = encodeURIComponent(JSON.stringify(data));
    const url = `${window.location.origin}${window.location.pathname}?scores=${encoded}`;
    navigator.clipboard.writeText(url);
    appendLog('High scores URL with username copied to clipboard!', 'info');
    gtag('event', 'share_highscores', { 'event_category': 'Game' });
  }

  function leaderboard() {
    fetch('scores.json')
      .then(response => response.json())
      .then(data => {
        appendLog('Global Leaderboard:', 'info');
        data.sort((a, b) => (b.snake || 0) - (a.snake || 0)).slice(0, 5).forEach((entry, i) => {
          appendLog(`${i + 1}. ${entry.username}: Snake=${entry.snake || 0}, Tic-Tac-Toe=${entry.tictactoe || 0}`, 'info');
        });
        gtag('event', 'view_leaderboard', { 'event_category': 'Game' });
      })
      .catch(error => appendLog('Error loading leaderboard: ' + error.message, 'error'));
  }

  function share() {
    const logs = JSON.parse(localStorage.getItem('consoleLogs') || '[]');
    const encoded = encodeURIComponent(JSON.stringify(logs));
    const url = `${window.location.origin}${window.location.pathname}?logs=${encoded}`;
    navigator.clipboard.writeText(url);
    appendLog('Share URL copied to clipboard! Paste it to share your console.', 'info');
    gtag('event', 'share_logs', { 'event_category': 'Console' });
  }

  function reset() {
    clearConsole();
    localStorage.removeItem('customBookmarks');
    localStorage.removeItem('theme');
    localStorage.removeItem('customTheme');
    document.body.classList.remove('dark');
    document.documentElement.style.removeProperty('--bg-color');
    document.documentElement.style.removeProperty('--text-color');
    if (window.isGameRunning) {
      window.isGameRunning = false;
      document.getElementById('gameCanvas').style.display = 'none';
    }
    document.querySelectorAll('.bookmark:not(#addBookmarkBtn):not(#saveBookmarksBtn)').forEach(bm => bm.remove());
    appendLog('Console reset to factory settings! High scores preserved.', 'info');
    gtag('event', 'reset_console', { 'event_category': 'Console' });
  }

  function squares() {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100vw";
    container.style.height = "100vh";
    container.style.overflow = "hidden";
    document.body.appendChild(container);

    class Square {
      constructor(x, y, dx, dy) {
        this.element = document.createElement("div");
        this.element.style.position = "absolute";
        this.element.style.width = "50px";
        this.element.style.height = "50px";
        this.element.style.backgroundColor = "lightgreen";
        this.element.style.borderRadius = "5px";
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.size = 50;
        container.appendChild(this.element);
        this.updatePosition();
      }
      updatePosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
      }
      move() {
        this.x += this.dx;
        this.y += this.dy;
        if (this.x <= 0 || this.x + this.size >= window.innerWidth) this.dx = -this.dx;
        if (this.y <= 0 || this.y + this.size >= window.innerHeight) this.dy = -this.dy;
        this.updatePosition();
      }
    }

    const squares = [];
    function createNewSquare() {
      const x = (window.innerWidth - 50) / 2;
      const y = (window.innerHeight - 50) / 2;
      const dx = 5;
      const dy = 5;
      const newSquare = new Square(x, y, dx, dy);
      squares.push(newSquare);
    }
    setInterval(createNewSquare, 125);
    function animate() {
      squares.forEach(square => square.move());
      requestAnimationFrame(animate);
    }
    animate();
    gtag('event', 'run_function', { 'event_category': 'Fun', 'event_label': 'squares' });
  }

  function ponies() {
    (function(srcs, cfg) {
      let cbcount = 1;
      const callback = () => {
        cbcount--;
        if (cbcount === 0) {
          window.BrowserPonies.setBaseUrl(cfg.baseurl);
          if (!window.BrowserPoniesBaseConfig.loaded) {
            window.BrowserPonies.loadConfig(window.BrowserPoniesBaseConfig);
            window.BrowserPoniesBaseConfig.loaded = true;
          }
          window.BrowserPonies.loadConfig(cfg);
          if (!window.BrowserPonies.running()) window.BrowserPonies.start();
          gtag('event', 'run_function', { 'event_category': 'Fun', 'event_label': 'ponies' });
        }
      };

      if (typeof window.BrowserPoniesConfig === 'undefined') window.BrowserPoniesConfig = {};
      if (typeof window.BrowserPoniesBaseConfig === 'undefined') {
        cbcount++;
        window.BrowserPoniesConfig.onbasecfg = callback;
      }
      if (typeof window.BrowserPonies === 'undefined') {
        cbcount++;
        window.BrowserPoniesConfig.oninit = callback;
      }

      const node = document.body || document.documentElement || document.getElementsByTagName('head')[0];
      for (const id in srcs) {
        if (document.getElementById(id)) continue;
        if (node) {
          const s = document.createElement('script');
          s.type = 'text/javascript';
          s.id = id;
          s.src = srcs[id];
          node.appendChild(s);
        }
      }
      callback();
    })({
      "browser-ponies-script": "https://panzi.github.io/Browser-Ponies/browserponies.js",
      "browser-ponies-config": "https://panzi.github.io/Browser-Ponies/basecfg.js"
    }, {
      baseurl: "https://panzi.github.io/Browser-Ponies/",
      fadeDuration: 500,
      volume: 1,
      fps: 25,
      speed: 3,
      audioEnabled: false,
      showFps: false,
      showLoadProgress: true,
      speakProbability: 0.1,
      spawn: {
        "applejack": 1,
        "fluttershy": 1,
        "pinkie pie": 1,
        "rainbow dash": 1,
        "rarity": 1,
        "twilight sparkle": 1
      }
    });
  }

  var gifSrc = 'https://media.giphy.com/media/uDgOkInszKwt7B3Ql1/giphy.gif';
  var gifsPerRow = 13;
  var numRows = 9;
  var gifSize = 150;
  var numGrids = 5;

  function sawyer() { rec(document.body); gtag('event', 'run_function', { 'event_category': 'Fun', 'event_label': 'sawyer' }); }
  function rec(n) { doit(n); var nodes = n.childNodes; var x = nodes.length; while (x--) rec(nodes[x]); }
  function doit(n) { if (n.nodeType === 1) createGrid(); }
  function createGrid() {
    var totalGifsCreated = document.body.getElementsByTagName('img').length;
    var totalGifsToCreate = gifsPerRow * numRows * numGrids;
    if (totalGifsCreated >= totalGifsToCreate) return;
    for (var gridIndex = 0; gridIndex < numGrids; gridIndex++) {
      for (var row = 0; row < numRows; row++) {
        for (var col = 0; col < gifsPerRow; col++) {
          createGif(row, col, gridIndex, gifSize);
        }
      }
    }
  }
  function createGif(row, col, gridIndex, size) {
    var gif = document.createElement('img');
    gif.src = gifSrc;
    gif.style.position = 'absolute';
    var offsetY = gridIndex * (numRows * gifSize);
    gif.style.top = (row * gifSize + offsetY) + 'px';
    gif.style.left = col * gifSize + 'px';
    gif.style.zIndex = '9999';
    gif.style.width = size + 'px';
    gif.style.height = size + 'px';
    document.body.appendChild(gif);
  }

  var gifSrcAiden = 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzVyM2p4d3JqeTNpcDhtdGk2dGdxZ3p6bDNpbWxuczFoNGN4YzRpbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Ahgz5lNbT3I1BY1nDi/giphy.gif';
  function aiden() { recAiden(document.body); gtag('event', 'run_function', { 'event_category': 'Fun', 'event_label': 'aiden' }); }
  function recAiden(n) { doitAiden(n); var nodes = n.childNodes; var x = nodes.length; while (x--) recAiden(nodes[x]); }
  function doitAiden(n) { if (n.nodeType === 1) createGridAiden(); }
  function createGridAiden() {
    var totalGifsCreated = document.body.getElementsByTagName('img').length;
    var totalGifsToCreate = gifsPerRow * numRows * numGrids;
    if (totalGifsCreated >= totalGifsToCreate) return;
    for (var gridIndex = 0; gridIndex < numGrids; gridIndex++) {
      for (var row = 0; row < numRows; row++) {
        for (var col = 0; col < gifsPerRow; col++) {
          createGifAiden(row, col, gridIndex, gifSize);
        }
      }
    }
  }
  function createGifAiden(row, col, gridIndex, size) {
    var gif = document.createElement('img');
    gif.src = gifSrcAiden;
    gif.style.position = 'absolute';
    var offsetY = gridIndex * (numRows * gifSize);
    gif.style.top = (row * gifSize + offsetY) + 'px';
    gif.style.left = col * gifSize + 'px';
    gif.style.zIndex = '9999';
    gif.style.width = size + 'px';
    gif.style.height = size + 'px';
    document.body.appendChild(gif);
  }

  var gifSrcAadyn = 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTdvcTN1dWRsazc4cjhuazZyeGVyOXY1a3ljY25xOHIxeWlrYWE0cyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QyrNVOLM2lumcqpNnA/200w.webp';
  function aadyn() { recAadyn(document.body); gtag('event', 'run_function', { 'event_category': 'Fun', 'event_label': 'aadyn' }); }
  function recAadyn(n) { doitAadyn(n); var nodes = n.childNodes; var x = nodes.length; while (x--) recAadyn(nodes[x]); }
  function doitAadyn(n) { if (n.nodeType === 1) createGridAadyn(); }
  function createGridAadyn() {
    var totalGifsCreated = document.body.getElementsByTagName('img').length;
    var totalGifsToCreate = gifsPerRow * numRows * numGrids;
    if (totalGifsCreated >= totalGifsToCreate) return;
    for (var gridIndex = 0; gridIndex < numGrids; gridIndex++) {
      for (var row = 0; row < numRows; row++) {
        for (var col = 0; col < gifsPerRow; col++) {
          createGifAadyn(row, col, gridIndex, gifSize);
        }
      }
    }
  }
  function createGifAadyn(row, col, gridIndex, size) {
    var gif = document.createElement('img');
    gif.src = gifSrcAadyn;
    gif.style.position = 'absolute';
    var offsetY = gridIndex * (numRows * gifSize);
    gif.style.top = (row * gifSize + offsetY) + 'px';
    gif.style.left = col * gifSize + 'px';
    gif.style.zIndex = '9999';
    gif.style.width = size + 'px';
    gif.style.height = size + 'px';
    document.body.appendChild(gif);
  }

  var gifSrcEli = 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExaXZqNmhwcDhhbzFlOWVzengyYWF4MGgzMzBwb3pweGJ0bndubXE1NyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/K65N7Gt98tK1iBeeZI/giphy.gif';
  function eli() { recEli(document.body); gtag('event', 'run_function', { 'event_category': 'Fun', 'event_label': 'eli' }); }
  function elijah() { recEli(document.body); gtag('event', 'run_function', { 'event_category': 'Fun', 'event_label': 'elijah' }); }
  function recEli(n) { doitEli(n); var nodes = n.childNodes; var x = nodes.length; while (x--) recEli(nodes[x]); }
  function doitEli(n) { if (n.nodeType === 1) createGridEli(); }
  function createGridEli() {
    var totalGifsCreated = document.body.getElementsByTagName('img').length;
    var totalGifsToCreate = gifsPerRow * numRows * numGrids;
    if (totalGifsCreated >= totalGifsToCreate) return;
    for (var gridIndex = 0; gridIndex < numGrids; gridIndex++) {
      for (var row = 0; row < numRows; row++) {
        for (var col = 0; col < gifsPerRow; col++) {
          createGifEli(row, col, gridIndex, gifSize);
        }
      }
    }
  }
  function createGifEli(row, col, gridIndex, size) {
    var gif = document.createElement('img');
    gif.src = gifSrcEli;
    gif.style.position = 'absolute';
    var offsetY = gridIndex * (numRows * gifSize);
    gif.style.top = (row * gifSize + offsetY) + 'px';
    gif.style.left = col * gifSize + 'px';
    gif.style.zIndex = '9999';
    gif.style.width = size + 'px';
    gif.style.height = size + 'px';
    document.body.appendChild(gif);
  }

  var gifSrcRonin = 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2FkcmpjOXBvdWoyOXA4d2J4ZGsxcTA5eTl3djBwaXplczdhMzF6OCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/A1hXsyj2wdyHyvwOSF/200w.webp';
  function ronin() { recRonin(document.body); gtag('event', 'run_function', { 'event_category': 'Fun', 'event_label': 'ronin' }); }
  function recRonin(n) { doitRonin(n); var nodes = n.childNodes; var x = nodes.length; while (x--) recRonin(nodes[x]); }
  function doitRonin(n) { if (n.nodeType === 1) createGridRonin(); }
  function createGridRonin() {
    var totalGifsCreated = document.body.getElementsByTagName('img').length;
    var totalGifsToCreate = gifsPerRow * numRows * numGrids;
    if (totalGifsCreated >= totalGifsToCreate) return;
    for (var gridIndex = 0; gridIndex < numGrids; gridIndex++) {
      for (var row = 0; row < numRows; row++) {
        for (var col = 0; col < gifsPerRow; col++) {
          createGifRonin(row, col, gridIndex, gifSize);
        }
      }
    }
  }
  function createGifRonin(row, col, gridIndex, size) {
    var gif = document.createElement('img');
    gif.src = gifSrcRonin;
    gif.style.position = 'absolute';
    var offsetY = gridIndex * (numRows * gifSize);
    gif.style.top = (row * gifSize + offsetY) + 'px';
    gif.style.left = col * gifSize + 'px';
    gif.style.zIndex = '9999';
    gif.style.width = size + 'px';
    gif.style.height = size + 'px';
    document.body.appendChild(gif);
  }

  var gifSrcRonin1 = 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWZ6Mm9jcWxuZnVnMm1xaG9uNm9zNjBoZDJ2MTY3emthZGhvZ3FqNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Qpbs1ClcmF9BTdVcab/giphy.gif';
  function ronin1() { recRonin1(document.body); gtag('event', 'run_function', { 'event_category': 'Fun', 'event_label': 'ronin1' }); }
  function recRonin1(n) { doitRonin1(n); var nodes = n.childNodes; var x = nodes.length; while (x--) recRonin1(nodes[x]); }
  function doitRonin1(n) { if (n.nodeType === 1) createGridRonin1(); }
  function createGridRonin1() {
    var totalGifsCreated = document.body.getElementsByTagName('img').length;
    var totalGifsToCreate = gifsPerRow * numRows * numGrids;
    if (totalGifsCreated >= totalGifsToCreate) return;
    for (var gridIndex = 0; gridIndex < numGrids; gridIndex++) {
      for (var row = 0; row < numRows; row++) {
        for (var col = 0; col < gifsPerRow; col++) {
          createGifRonin1(row, col, gridIndex, gifSize);
        }
      }
    }
  }
  function createGifRonin1(row, col, gridIndex, size) {
    var gif = document.createElement('img');
    gif.src = gifSrcRonin1;
    gif.style.position = 'absolute';
    var offsetY = gridIndex * (numRows * gifSize);
    gif.style.top = (row * gifSize + offsetY) + 'px';
    gif.style.left = col * gifSize + 'px';
    gif.style.zIndex = '9999';
    gif.style.width = size + 'px';
    gif.style.height = size + 'px';
    document.body.appendChild(gif);
  }

  var gifSrcRonin2 = 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExOWVzbzBtNmZtNHBpbDM2cm9hYWU3eXE1d25vd3B5MGZ1aHByazl3YiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/qV8ABqS0C7nXeX5z2j/200w.webp';
  function ronin2() { recRonin2(document.body); gtag('event', 'run_function', { 'event_category': 'Fun', 'event_label': 'ronin2' }); }
  function recRonin2(n) { doitRonin2(n); var nodes = n.childNodes; var x = nodes.length; while (x--) recRonin2(nodes[x]); }
  function doitRonin2(n) { if (n.nodeType === 1) createGridRonin2(); }
  function createGridRonin2() {
    var totalGifsCreated = document.body.getElementsByTagName('img').length;
    var totalGifsToCreate = gifsPerRow * numRows * numGrids;
    if (totalGifsCreated >= totalGifsToCreate) return;
    for (var gridIndex = 0; gridIndex < numGrids; gridIndex++) {
      for (var row = 0; row < numRows; row++) {
        for (var col = 0; col < gifsPerRow; col++) {
          createGifRonin2(row, col, gridIndex, gifSize);
        }
      }
    }
  }
  function createGifRonin2(row, col, gridIndex, size) {
    var gif = document.createElement('img');
    gif.src = gifSrcRonin2;
    gif.style.position = 'absolute';
    var offsetY = gridIndex * (numRows * gifSize);
    gif.style.top = (row * gifSize + offsetY) + 'px';
    gif.style.left = col * gifSize + 'px';
    gif.style.zIndex = '9999';
    gif.style.width = size + 'px';
    gif.style.height = size + 'px';
    document.body.appendChild(gif);
  }

  function check() {
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => {
        const ip = data.ip;
        console.log(`Your public IP address is: ${ip}`);
        alert(`Your public IP address is: ${ip}`);
        gtag('event', 'run_function', { 'event_category': 'Utility', 'event_label': 'check' });
      })
      .catch(error => {
        console.error('Error fetching IP address:', error);
        alert('Sorry, we could not retrieve your IP address at the moment.');
      });
  }

  function idiot() {
    window.location.href = "https://youareanidiot.cc";
    gtag('event', 'run_function', { 'event_category': 'Fun', 'event_label': 'idiot' });
  }

  function elements() {
    appendLog('Here’s everything on the page! Click a blue link to change it.', 'info');
    const allElements = document.getElementsByTagName('*');
    elementList = [];
    Array.from(allElements).forEach((el, index) => {
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : '';
      const classes = el.className ? `.${el.className.split(' ').join('.')}` : '';
      const text = el.textContent.trim().substring(0, 20) + (el.textContent.length > 20 ? '...' : '');
      elementList.push({ index, tag, selector: `${tag}${id}${classes}`, text, element: el });

      const line = document.createElement('div');
      line.className = 'log';
      line.textContent = `[${index}] ${tag} - "${text}" `;
      const link = document.createElement('span');
      link.textContent = '[Click here to edit]';
      link.className = 'element-link';
      link.addEventListener('click', () => showEditOptions(index));
      line.appendChild(link);
      document.getElementById('jsConsole').appendChild(line);
    });

    appendLog('Want to know more? Try typing "elementshelp();" below!', 'info');
    gtag('event', 'run_function', { 'event_category': 'Utility', 'event_label': 'elements' });
  }

  function showEditOptions(index) {
    const el = elementList[index]?.element;
    if (!el) {
      appendLog(`Oops! Item [${index}] not found.`, 'error');
      return;
    }
    appendLog(`Editing item [${index}] - "${el.tagName.toLowerCase()}"`, 'info');
    appendLog('What would you like to do? Pick an option by typing it below and pressing "Execute Code":', 'info');
    appendLog(`  1. Change text to: "Your text here"`, 'info');
    appendLog(`  2. Change color to: "red" (or any color)`, 'info');
    appendLog(`  3. Make it disappear`, 'info');
    appendLog(`  4. Add something new after it: "Your text here"`, 'info');
    appendLog(`Example: Type "1 Hello World" and press "Execute Code" to change its text.`, 'info');

    window.editElement = function(command) {
      const [option, ...valueParts] = command.split(' ');
      const value = valueParts.join(' ');
      try {
        switch(option) {
          case '1':
            el.textContent = value;
            appendLog(`Changed text of [${index}] to "${value}"`, 'log');
            break;
          case '2':
            el.style.color = value;
            appendLog(`Changed color of [${index}] to "${value}"`, 'log');
            break;
          case '3':
            el.remove();
            appendLog(`Removed [${index}] from the page`, 'log');
            break;
          case '4':
            el.insertAdjacentHTML('beforeend', value);
            appendLog(`Added "${value}" to [${index}]`, 'log');
            break;
          default:
            appendLog('Oops! Pick a number from 1 to 4. Try again!', 'error');
        }
        gtag('event', 'edit_element', { 'event_category': 'Utility', 'event_label': `option${option}` });
      } catch (e) {
        appendLog(`Something went wrong: ${e.message}`, 'error');
      }
    };
  }

  function elementshelp() {
    appendLog('Easy Guide to Changing the Page:', 'info');
    appendLog('Step 1: Type "elements();" below and press "Execute Code" to see everything on the page.', 'info');
    appendLog('Step 2: Click a blue "[Click here to edit]" link next to something you want to change.', 'info');
    appendLog('Step 3: You’ll see 4 options. Pick one by typing its number and what you want, like this:', 'info');
    appendLog('  1. "1 New Text" - Changes what it says.', 'info');
    appendLog('     Example: "1 Hello" makes it say "Hello".', 'info');
    appendLog('  2. "2 red" - Changes its color.', 'info');
    appendLog('     Example: "2 blue" turns it blue.', 'info');
    appendLog('  3. "3" - Makes it go away.', 'info');
    appendLog('     Example: "3" removes it.', 'info');
    appendLog('  4. "4 Extra Stuff" - Adds something new after it.', 'info');
    appendLog('     Example: "4 Yay!" adds "Yay!" to it.', 'info');
    appendLog('Step 4: Press "Execute Code" after typing your choice.', 'info');
    appendLog('Have fun playing with the page!', 'info');
    gtag('event', 'run_function', { 'event_category': 'Utility', 'event_label': 'elementshelp' });
  }

  function list() {
    console.log("squares();, Creates a never ending amount of bouncing squares.");
    console.log("ponies();, Makes magical ponies fly around on your screen.");
    console.log("sawyer();, Creates a bunch of images of sawyer.");
    console.log("aiden();, Creates a bunch of images of aiden.");
    console.log("aadyn();, Creates a bunch of images of aadyn.");
    console.log("eli();/elijah();, Creates a bunch of images of eli/elijah");
    console.log("ronin();, Creates a bunch of images of ronin.");
    console.log("ronin1();, Creates a bunch of images of ronin.");
    console.log("ronin2();, Creates a bunch of images of ronin.");
    console.log("check();, Checks and tells you your public IP Address.");
    console.log("idiot();, Brings you to youareanidiot.cc.");
    console.log("elements();, Shows page items and lets you change them easily.");
    console.log("elementshelp();, Teaches you how to use elements() in a simple way.");
    console.log("list();, Tells you all of the functions and what they do.");
    console.log("snake();, Play a simple Snake game.");
    console.log("updates();, Shows the update log for this console.");
    console.log("setColor('type', 'color');, Changes console log type color (e.g., 'log', 'error').");
    console.log("tictactoe();, Play a simple Tic-Tac-Toe game.");
    console.log("share();, Copies a URL to share your console logs.");
    console.log("reset();, Resets console and bookmarks (high scores preserved).");
    console.log("highscores();, Shows your and shared high scores for Snake and Tic-Tac-Toe.");
    console.log("shareHighScores();, Copies a URL to share your high scores with username.");
    console.log("leaderboard();, Shows top global scores from scores.json.");
    console.log("setUsername('name');, Sets your username for high scores.");
    console.log("setTheme('bgColor', 'textColor');, Sets custom background and text colors.");
    console.log("toggleSound();, Enables or disables sound effects.");
    console.log("more();, Shows additional functions not in the top bookmarks.");
    gtag('event', 'run_function', { 'event_category': 'Utility', 'event_label': 'list' });
  }

  function more() {
    appendLog('Additional Functions:', 'info');
    appendLog("squares(); - Bouncing squares animation", 'info');
    appendLog("ponies(); - Magical ponies on screen", 'info');
    appendLog("sawyer(); - Sawyer GIFs", 'info');
    appendLog("aiden(); - Aiden GIFs", 'info');
    appendLog("aadyn(); - Aadyn GIFs", 'info');
    appendLog("eli();/elijah(); - Eli/Elijah GIFs", 'info');
    appendLog("ronin(); - Ronin GIFs", 'info');
    appendLog("ronin1(); - Ronin GIFs (variant 1)", 'info');
    appendLog("ronin2(); - Ronin GIFs (variant 2)", 'info');
    appendLog("check(); - Show your public IP", 'info');
    appendLog("idiot(); - Visit youareanidiot.cc", 'info');
    appendLog("Type any of these in the input field to run them!", 'info');
    gtag('event', 'run_function', { 'event_category': 'Utility', 'event_label': 'more' });
  }

  const bookmarksBar = document.getElementById('bookmarksBar');

  const categorizedBookmarks = {
    Games: [
      { name: "Snake Game", type: "bookmarklet", value: "snake()" },
      { name: "Tic-Tac-Toe", type: "bookmarklet", value: "tictactoe()" }
    ],
    Scores: [
      { name: "High Scores", type: "bookmarklet", value: "highscores()" },
      { name: "Leaderboard", type: "bookmarklet", value: "leaderboard()" }
    ],
    Utilities: [
      { name: "Updates", type: "bookmarklet", value: "updates()" },
      { name: "Set Username", type: "bookmarklet", value: "setUsername(prompt('Enter your username:'))" },
      { name: "Set Theme", type: "bookmarklet", value: "setTheme(prompt('Background color:'), prompt('Text color:'))" },
      { name: "Toggle Sound", type: "bookmarklet", value: "toggleSound()" },
      { name: "More", type: "bookmarklet", value: "more()" }
    ],
    Gifs: [
      { name: "Sawyer", type: "bookmarklet", value: "sawyer()" },
      { name: "Aiden", type: "bookmarklet", value: "aiden()" },
      { name: "Aadyn", type: "bookmarklet", value: "aadyn()" },
      { name: "Eli", type: "bookmarklet", value: "eli()" },
      { name: "Elijah", type: "bookmarklet", value: "elijah()" },
      { name: "Ronin", type: "bookmarklet", value: "ronin()" },
      { name: "Ronin 1", type: "bookmarklet", value: "ronin1()" },
      { name: "Ronin 2", type: "bookmarklet", value: "ronin2()" }
    ]
  };

  function createCategorizedBookmark(category, bookmarks) {
    const bookmark = document.createElement('div');
    bookmark.className = 'bookmark';
    const span = document.createElement('span');
    span.textContent = category;
    span.addEventListener('click', (e) => {
      e.preventDefault();
      bookmark.classList.toggle('active');
    });
    bookmark.appendChild(span);

    const dropdown = document.createElement('div');
    dropdown.className = 'bookmark-dropdown';
    bookmarks.forEach(bm => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.textContent = bm.name;
      item.addEventListener('click', () => handleBookmark(bm.type, bm.value));
      dropdown.appendChild(item);
    });
    bookmark.appendChild(dropdown);

    return bookmark;
  }

  Object.entries(categorizedBookmarks).forEach(([category, bookmarks]) => {
    const bookmarkElement = createCategorizedBookmark(category, bookmarks);
    bookmarksBar.appendChild(bookmarkElement);
  });

  const addBookmarkBtn = document.createElement('div');
  addBookmarkBtn.className = 'bookmark';
  addBookmarkBtn.id = 'addBookmarkBtn';
  addBookmarkBtn.textContent = 'Add Bookmark';
  addBookmarkBtn.addEventListener('click', addBookmark);
  bookmarksBar.appendChild(addBookmarkBtn);

  const saveBookmarksBtn = document.createElement('div');
  saveBookmarksBtn.className = 'bookmark';
  saveBookmarksBtn.id = 'saveBookmarksBtn';
  saveBookmarksBtn.textContent = 'Save Bookmarks';
  saveBookmarksBtn.addEventListener('click', saveBookmarks);
  bookmarksBar.appendChild(saveBookmarksBtn);

  function handleBookmark(type, value) {
    if (type === 'url') {
      window.open(value, '_blank');
    } else if (type === 'bookmarklet') {
      try {
        eval(value);
      } catch (e) {
        appendLog('Bookmarklet Error: ' + e.message, 'error');
      }
    } else {
      appendLog(`Unknown bookmark type: ${type}`, 'error');
    }
    gtag('event', 'use_bookmark', { 'event_category': 'UI', 'event_label': value });
  }

  let customBookmarks = JSON.parse(localStorage.getItem('customBookmarks') || '[]');

  function addBookmark() {
    const name = prompt("Enter bookmark name:");
    if (!name) return;

    const type = prompt("Is this a URL or a Bookmarklet? Type 'url' or 'bookmarklet':").toLowerCase();
    if (type !== 'url' && type !== 'bookmarklet') {
      appendLog("Error: Please type 'url' or 'bookmarklet'.", 'error');
      return;
    }

    const value = type === 'url'
      ? prompt("Enter the URL (e.g., https://example.com):")
      : prompt("Enter JavaScript code (e.g., 'squares()'):");
    if (!value) return;

    const bookmark = document.createElement('div');
    bookmark.className = 'bookmark';
    const span = document.createElement('span');
    span.textContent = name;
    span.addEventListener('click', () => handleBookmark(type, value));
    bookmark.appendChild(span);
    const remove = document.createElement('span');
    remove.className = 'remove';
    remove.textContent = 'x';
    remove.addEventListener('click', (e) => {
      e.stopPropagation();
      removeBookmark(remove, name);
    });
    bookmark.appendChild(remove);
    bookmarksBar.insertBefore(bookmark, saveBookmarksBtn);
    customBookmarks.push({ name, type, value });
    gtag('event', 'add_bookmark', { 'event_category': 'UI', 'event_label': name });
  }

  function removeBookmark(element, name) {
    const bookmarkDiv = element.parentElement;
    bookmarkDiv.remove();
    customBookmarks = customBookmarks.filter(bm => bm.name !== name);
    localStorage.setItem('customBookmarks', JSON.stringify(customBookmarks));
    appendLog(`Bookmark "${name}" removed.`, 'info');
    gtag('event', 'remove_bookmark', { 'event_category': 'UI', 'event_label': name });
  }

  function saveBookmarks() {
    localStorage.setItem('customBookmarks', JSON.stringify(customBookmarks));
    appendLog('Custom bookmarks saved successfully!', 'info');
    gtag('event', 'save_bookmarks', { 'event_category': 'UI' });
  }

  customBookmarks.forEach(bm => {
    const bookmark = document.createElement('div');
    bookmark.className = 'bookmark';
    const span = document.createElement('span');
    span.textContent = bm.name;
    span.addEventListener('click', () => handleBookmark(bm.type, bm.value));
    bookmark.appendChild(span);
    const remove = document.createElement('span');
    remove.className = 'remove';
    remove.textContent = 'x';
    remove.addEventListener('click', (e) => {
      e.stopPropagation();
      removeBookmark(remove, bm.name);
    });
    bookmark.appendChild(remove);
    bookmarksBar.insertBefore(bookmark, saveBookmarksBtn);
  });

  let hasShownWelcome = false;

  const urlParams = new URLSearchParams(window.location.search);
  const sharedLogs = urlParams.get('logs');
  if (sharedLogs) {
    const logs = JSON.parse(decodeURIComponent(sharedLogs));
    logs.forEach(log => appendLog(log.message, log.type, log.isHtml));
  } else {
    const savedLogs = JSON.parse(localStorage.getItem('logs') || '[]');
    savedLogs.forEach(log => appendLog(log.message, log.type, log.isHtml));
  }
  if (!hasShownWelcome) {
    appendLog('Welcome to the JavaScript Console v2.1 on GitHub Pages!', 'info');
    appendLog('Type "updates();" for what’s new or "list();" for all commands.', 'info');
    hasShownWelcome = true;
  }

  const customTheme = JSON.parse(localStorage.getItem('customTheme'));
  if (customTheme) {
    document.body.classList.remove('dark');
    document.documentElement.style.setProperty('--bg-color', customTheme.bgColor);
    document.documentElement.style.setProperty('--text-color', customTheme.textColor);
  } else if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
  }

  setupInput();
  setupAutocomplete();
  installPWA();

  document.getElementById('executeBtn').addEventListener('click', executeCode);
  document.getElementById('clearBtn').addEventListener('click', clearConsole);
  document.getElementById('exportBtn').addEventListener('click', exportLog);
  document.getElementById('themeBtn').addEventListener('click', toggleTheme);
  document.getElementById('launcherBtn').addEventListener('click', () => {
  console.log('Launcher button clicked');
  window.location.assign('https://criminalpear.github.io/JS-Console/launcher.html');
});
});
