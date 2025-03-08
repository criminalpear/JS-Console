function snake() {
  let isGameRunning = window.isGameRunning;
  if (isGameRunning) return;
  window.isGameRunning = isGameRunning = true;
  const canvas = document.getElementById('gameCanvas');
  canvas.width = 400; canvas.height = 400;
  const ctx = canvas.getContext('2d');
  canvas.style.display = 'block';
  gtag('event', 'start_game', { 'event_category': 'Game', 'event_label': 'snake' });

  const gridSize = 20;
  let snake = [{ x: 10, y: 10 }];
  let food = { x: 15, y: 15 };
  let dx = 1;
  let dy = 0;
  let score = 0;
  let firstMove = true;

  function draw() {
    ctx.fillStyle = document.body.classList.contains('dark') ? '#000000' : '#f4f4f4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'green';
    snake.forEach(segment => ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2));
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
  }

  function move() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    if (!firstMove && (head.x < 0 || head.x >= canvas.width / gridSize || head.y < 0 || head.y >= canvas.height / gridSize || snake.some(s => s.x === head.x && s.y === head.y))) {
      appendLog(`Game Over! Score: ${score}`, 'info');
      updateHighScore('snake', score);
      endGame();
      return;
    }
    firstMove = false;

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score++;
      food = { x: Math.floor(Math.random() * (canvas.width / gridSize)), y: Math.floor(Math.random() * (canvas.height / gridSize)) };
      while (snake.some(s => s.x === food.x && s.y === food.y)) {
        food = { x: Math.floor(Math.random() * (canvas.width / gridSize)), y: Math.floor(Math.random() * (canvas.height / gridSize)) };
      }
    } else {
      snake.pop();
    }
    draw();
    setTimeout(move, 100);
  }

  function keyHandler(e) {
    if (!isGameRunning) return;
    switch (e.key) {
      case 'ArrowUp': if (dy !== 1) { dx = 0; dy = -1; } break;
      case 'ArrowDown': if (dy !== -1) { dx = 0; dy = 1; } break;
      case 'ArrowLeft': if (dx !== 1) { dx = -1; dy = 0; } break;
      case 'ArrowRight': if (dx !== -1) { dx = 1; dy = 0; } break;
      case 'Escape': endGame(); break;
    }
  }

  function endGame() {
    window.isGameRunning = isGameRunning = false;
    canvas.style.display = 'none';
    document.removeEventListener('keydown', keyHandler);
    appendLog('Game exited.', 'info');
    gtag('event', 'end_game', { 'event_category': 'Game', 'event_label': 'snake' });
  }

  document.addEventListener('keydown', keyHandler);
  draw();
  setTimeout(move, 100);
}