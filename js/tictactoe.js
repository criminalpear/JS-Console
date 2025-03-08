function tictactoe() {
  let isGameRunning = window.isGameRunning;
  if (isGameRunning) return;
  window.isGameRunning = isGameRunning = true;
  const canvas = document.getElementById('gameCanvas');
  canvas.width = 300; canvas.height = 300;
  const ctx = canvas.getContext('2d');
  canvas.style.display = 'block';
  let board = Array(9).fill(null);
  let player = 'X';
  let highScores = JSON.parse(localStorage.getItem('highScores') || '{}');
  let wins = highScores.tictactoe || 0;
  gtag('event', 'start_game', { 'event_category': 'Game', 'event_label': 'tictactoe' });

  function drawBoard() {
    ctx.fillStyle = document.body.classList.contains('dark') ? '#000000' : '#f4f4f4';
    ctx.fillRect(0, 0, 300, 300);
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 5;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(i * 100, 0); ctx.lineTo(i * 100, 300); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * 100); ctx.lineTo(300, i * 100); ctx.stroke();
    }
    board.forEach((cell, i) => {
      if (cell) {
        ctx.fillStyle = cell === 'X' ? 'blue' : 'red';
        ctx.font = '60px Arial';
        ctx.fillText(cell, (i % 3) * 100 + 35, Math.floor(i / 3) * 100 + 70);
      }
    });
  }
  drawBoard();

  canvas.onclick = e => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 100);
    const y = Math.floor((e.clientY - rect.top) / 100);
    const idx = y * 3 + x;
    if (!board[idx]) {
      board[idx] = player;
      drawBoard();
      if (checkWin()) {
        appendLog(`${player} wins!`, 'info');
        if (player === 'X') {
          wins++;
          updateHighScore('tictactoe', wins);
        }
        endGame();
      } else if (!board.includes(null)) {
        appendLog('Draw!', 'info');
        endGame();
      } else {
        player = player === 'X' ? 'O' : 'X';
      }
    }
  };

  function checkWin() {
    const wins = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
    return wins.some(w => w.every(i => board[i] === player));
  }

  function endGame() {
    window.isGameRunning = isGameRunning = false;
    canvas.style.display = 'none';
    appendLog('Game exited.', 'info');
    gtag('event', 'end_game', { 'event_category': 'Game', 'event_label': 'tictactoe' });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isGameRunning) endGame();
  });
}