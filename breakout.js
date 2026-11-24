/* Pixel Party Breakout: clear the brick wall with one bouncing ball. */
(function () {
  var canvas = document.getElementById('breakout-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d'), width = canvas.width, height = canvas.height;
  var paddle, ball, bricks, score, lives, running = false, paused = false, raf, keys = {};
  var colors = ['#ff4fa3', '#ad8cff', '#5ce4ff', '#ffdc61', '#c1f36b'];
  function best() { try { return Number(localStorage.getItem('pixel-party-breakout-best') || 0); } catch (error) { return 0; } }
  function saveBest() { try { if (score > best()) localStorage.setItem('pixel-party-breakout-best', String(score)); } catch (error) {} }
  function resetBall() { ball = { x: width / 2, y: height - 72, r: 8, vx: (Math.random() < .5 ? -1 : 1) * 3.6, vy: -4.2 }; }
  function reset() { paddle = { x: width / 2 - 54, y: height - 29, w: 108, h: 11 }; score = 0; lives = 3; bricks = []; for (var row = 0; row < 5; row += 1) for (var col = 0; col < 9; col += 1) bricks.push({ x: 27 + col * 62, y: 38 + row * 27, w: 52, h: 16, color: colors[row], alive: true }); resetBall(); update(); draw(); }
  function update() { document.getElementById('breakout-score').textContent = String(score).padStart(4, '0'); document.getElementById('breakout-best').textContent = String(best()).padStart(4, '0'); }
  function finish(won) { running = false; cancelAnimationFrame(raf); saveBest(); update(); document.getElementById('game-status').textContent = won ? 'WALL CLEARED — RESTART' : 'OUT OF LIVES — RESTART'; if (won && window.PixelPartyEconomy) window.PixelPartyEconomy.addCoins(30); }
  function tick() {
    if (!running) return;
    if (!paused) {
      if (keys.ArrowLeft || keys.a) paddle.x -= 8;
      if (keys.ArrowRight || keys.d) paddle.x += 8;
      paddle.x = Math.max(10, Math.min(width - paddle.w - 10, paddle.x));
      ball.x += ball.vx; ball.y += ball.vy;
      if (ball.x - ball.r < 10 || ball.x + ball.r > width - 10) { ball.vx *= -1; ball.x = Math.max(ball.r + 10, Math.min(width - ball.r - 10, ball.x)); }
      if (ball.y - ball.r < 10) { ball.vy = Math.abs(ball.vy); ball.y = ball.r + 10; }
      if (ball.vy > 0 && ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h && ball.x >= paddle.x - ball.r && ball.x <= paddle.x + paddle.w + ball.r) { ball.vy = -Math.abs(ball.vy); ball.vx += (ball.x - (paddle.x + paddle.w / 2)) * .035; ball.y = paddle.y - ball.r; }
      bricks.forEach(function (brick) { if (!brick.alive) return; if (ball.x + ball.r > brick.x && ball.x - ball.r < brick.x + brick.w && ball.y + ball.r > brick.y && ball.y - ball.r < brick.y + brick.h) { brick.alive = false; ball.vy *= -1; score += 10; if (window.PixelPartyEconomy) window.PixelPartyEconomy.addCoins(1); update(); } });
      if (bricks.every(function (brick) { return !brick.alive; })) return finish(true);
      if (ball.y - ball.r > height) { lives -= 1; if (lives <= 0) return finish(false); resetBall(); document.getElementById('game-status').textContent = 'BALL LOST — ' + lives + ' LIVES'; }
    }
    draw(); raf = requestAnimationFrame(tick);
  }
  function draw() {
    ctx.fillStyle = '#060717'; ctx.fillRect(0, 0, width, height); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.strokeRect(10, 10, width - 20, height - 20);
    bricks.forEach(function (brick) { if (!brick.alive) return; ctx.fillStyle = brick.color; ctx.shadowColor = brick.color; ctx.shadowBlur = 10; ctx.fillRect(brick.x, brick.y, brick.w, brick.h); ctx.shadowBlur = 0; });
    ctx.fillStyle = '#ffdc61'; ctx.shadowColor = '#ffdc61'; ctx.shadowBlur = 15; ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h); ctx.fillStyle = '#fff7fb'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '14px Space Mono, monospace'; ctx.fillText('LIVES ' + lives, 20, height - 8);
  }
  function start() { reset(); running = true; paused = false; document.getElementById('breakout-pause').classList.remove('visible'); document.getElementById('game-status').textContent = 'BREAKOUT IN PROGRESS'; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }
  function togglePause() { if (!running) return; paused = !paused; document.getElementById('breakout-pause').classList.toggle('visible', paused); document.getElementById('game-status').textContent = paused ? 'PAUSED' : 'BREAKOUT IN PROGRESS'; }
  document.addEventListener('keydown', function (event) { if (document.body.dataset.game !== 'breakout') return; var key = event.key.length === 1 ? event.key.toLowerCase() : event.key; if (['ArrowLeft', 'ArrowRight', 'a', 'd', ' '].indexOf(key) !== -1) event.preventDefault(); keys[key] = true; if (key === 'p') togglePause(); });
  document.addEventListener('keyup', function (event) { keys[event.key.length === 1 ? event.key.toLowerCase() : event.key] = false; });
  document.getElementById('breakout-start').addEventListener('click', start); reset();
}());
