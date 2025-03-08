function pong() {
  let isGameRunning = window.isGameRunning;
  if (isGameRunning) return;
  window.isGameRunning = isGameRunning = true;
  const canvas = document.getElementById('gameCanvas');
  canvas.width = 600; canvas.height = 400;
  const ctx = canvas.getContext('2d');
  canvas.style.display = 'block';
  gtag('event', 'start_game', { 'event_category': 'Game', 'event_label': 'pong' });

  const paddleWidth = 10, paddleHeight = 60, ballSize = 10;
  let player = { x: 50, y: canvas.height / 2 - paddleHeight / 2, dy: 5 };
  let ai = { x: canvas.width - 50 - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, dy: 4 };
  let ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 5, dy: 5 };
  let score = 0;

  function draw() {
    ctx.fillStyle = document.body.classList.contains('dark') ? '#000000' : '#f4f4f4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x, player.y, paddleWidth, paddleHeight);
    ctx.fillRect(ai.x, ai.y, paddleWidth, paddleHeight);
    ctx.fillRect(ball.x - ballSize / 2, ball.y - ballSize / 2, ballSize, ballSize);
  }

  function move() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y < ballSize / 2 || ball.y > canvas.height - ballSize / 2) ball.dy = -ball.dy;
    if (ball.x < player.x + paddleWidth && ball.y > player.y && ball.y < player.y + paddleHeight) {
      ball.dx = -ball.dx;
      score++;
    }
    if (ball.x > ai.x && ball.y > ai.y && ball.y < ai.y + paddleHeight) ball.dx = -ball.dx;

    ai.y += ball.y > ai.y + paddleHeight / 2 ? ai.dy : -ai.dy;
    if (ai.y < 0) ai.y = 0;
    if (ai.y > canvas.height - paddleHeight) ai.y = canvas.height - paddleHeight;

    if (ball.x < 0 || ball.x > canvas.width) {
      appendLog(`Game Over! Score: ${score}`, 'info');
      updateHighScore('pong', score);
      endGame();
      return;
    }
    draw();
    requestAnimationFrame(move);
  }

  function keyHandler(e) {
    if (!isGameRunning) return;
    switch (e.key) {
      case 'ArrowUp': player.y -= player.dy; break;
      case 'ArrowDown': player.y += player.dy; break;
      case 'Escape': endGame(); break;
    }
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height - paddleHeight) player.y = canvas.height - paddleHeight;
  }

  function endGame() {
    window.isGameRunning = isGameRunning = false;
    canvas.style.display = 'none';
    document.removeEventListener('keydown', keyHandler);
    appendLog('Game exited.', 'info');
    gtag('event', 'end_game', { 'event_category': 'Game', 'event_label': 'pong' });
  }

  document.addEventListener('keydown', keyHandler);
  draw();
  move();
}