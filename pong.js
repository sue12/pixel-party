/* Pixel Party Pong: a tiny one-player cabinet game. */
(function () {
  var canvas = document.getElementById('pong-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var width = canvas.width, height = canvas.height;
  var paddleH = 92, paddleW = 13, playerY, cpuY, ball, score, cpuScore, running = false, paused = false, raf;
  var keys = {};
  function resetBall(direction) { ball = { x: width / 2, y: height / 2, r: 8, vx: direction * 5, vy: (Math.random() * 4 - 2) }; }
  function reset() { playerY = height / 2 - paddleH / 2; cpuY = playerY; score = 0; cpuScore = 0; resetBall(Math.random() < .5 ? -1 : 1); update(); draw(); }
  function update() { document.getElementById('pong-score').textContent = String(score).padStart(2, '0'); document.getElementById('pong-cpu').textContent = String(cpuScore).padStart(2, '0'); }
  function clamp(value) { return Math.max(8, Math.min(height - paddleH - 8, value)); }
  function end(won) { running = false; cancelAnimationFrame(raf); document.getElementById('game-status').textContent = won ? 'YOU WIN — RESTART' : 'CPU WINS — RESTART'; if (won && window.PixelPartyEconomy) window.PixelPartyEconomy.addCoins(25); }
  function pointTo(side) { if (side === 'player') { score += 1; if (window.PixelPartyEconomy) window.PixelPartyEconomy.addCoins(3); } else cpuScore += 1; update(); if (score >= 7 || cpuScore >= 7) return end(score >= 7); resetBall(side === 'player' ? 1 : -1); }
  function tick() {
    if (!running) return;
    if (!paused) {
      if (keys.ArrowUp || keys.w) playerY = clamp(playerY - 7);
      if (keys.ArrowDown || keys.s) playerY = clamp(playerY + 7);
      var target = ball.y - paddleH / 2;
      cpuY += Math.max(-4.3, Math.min(4.3, target - cpuY)); cpuY = clamp(cpuY);
      ball.x += ball.vx; ball.y += ball.vy;
      if (ball.y - ball.r < 7 || ball.y + ball.r > height - 7) { ball.vy *= -1; ball.y = Math.max(ball.r + 7, Math.min(height - ball.r - 7, ball.y)); }
      if (ball.vx < 0 && ball.x - ball.r < 34 + paddleW && ball.x > 25 && ball.y > playerY - 4 && ball.y < playerY + paddleH + 4) { ball.vx = Math.abs(ball.vx) + .18; ball.vy += (ball.y - (playerY + paddleH / 2)) * .06; }
      if (ball.vx > 0 && ball.x + ball.r > width - 34 - paddleW && ball.x < width - 25 && ball.y > cpuY - 4 && ball.y < cpuY + paddleH + 4) { ball.vx = -Math.abs(ball.vx) - .18; ball.vy += (ball.y - (cpuY + paddleH / 2)) * .06; }
      if (ball.x < -ball.r) pointTo('cpu');
      if (ball.x > width + ball.r) pointTo('player');
    }
    draw(); raf = requestAnimationFrame(tick);
  }
  function draw() {
    ctx.fillStyle = '#060717'; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(92,228,255,.16)'; ctx.setLineDash([8, 12]); ctx.beginPath(); ctx.moveTo(width / 2, 8); ctx.lineTo(width / 2, height - 8); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.strokeRect(8, 8, width - 16, height - 16);
    ctx.fillStyle = '#5ce4ff'; ctx.shadowColor = '#5ce4ff'; ctx.shadowBlur = 16; ctx.fillRect(25, playerY, paddleW, paddleH); ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff4fa3'; ctx.shadowColor = '#ff4fa3'; ctx.shadowBlur = 16; ctx.fillRect(width - 25 - paddleW, cpuY, paddleW, paddleH); ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  }
  function start() { reset(); running = true; paused = false; document.getElementById('pong-pause').classList.remove('visible'); document.getElementById('game-status').textContent = 'MATCH IN PROGRESS'; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }
  function togglePause() { if (!running) return; paused = !paused; document.getElementById('pong-pause').classList.toggle('visible', paused); document.getElementById('game-status').textContent = paused ? 'PAUSED' : 'MATCH IN PROGRESS'; }
  document.addEventListener('keydown', function (event) { if (document.body.dataset.game !== 'pong') return; var key = event.key.length === 1 ? event.key.toLowerCase() : event.key; if (['ArrowUp', 'ArrowDown', 'w', 's', ' '].indexOf(key) !== -1) event.preventDefault(); keys[key] = true; if (key === 'p') togglePause(); });
  document.addEventListener('keyup', function (event) { keys[event.key.length === 1 ? event.key.toLowerCase() : event.key] = false; });
  document.getElementById('pong-start').addEventListener('click', start); reset();
}());
