/* Pixel Party: the original cabinets, zero dependencies. */
const $ = (selector) => document.querySelector(selector);
const storageGet = (key) => { try { return localStorage.getItem(key); } catch (error) { return null; } };
const storageSet = (key, value) => { try { localStorage.setItem(key, value); } catch (error) { /* scores remain session-only */ } };

// TETRIS -------------------------------------------------------------------
const tetris = (() => {
  const canvas = $('#tetris-canvas');
  if (!canvas) return { draw: () => {} };
  const ctx = canvas.getContext('2d');
  const nextCanvas = $('#tetris-next');
  const nextCtx = nextCanvas.getContext('2d');
  const cols = 10, rows = 20, cell = 30;
  const colors = ['#5ce4ff', '#ff4fa3', '#ad8cff', '#47b8ff', '#ff7bd5', '#ffab66', '#e5d7ff'];
  const shapes = [
    [[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]],
    [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[0, 1, 1], [1, 1, 0]], [[1, 1, 0], [0, 1, 1]]
  ];
  let board, current, next, score, lines, level, timer, running = false, paused = false;
  const clone = (shape) => shape.map((row) => [...row]);
  const randomPiece = () => { const type = Math.floor(Math.random() * shapes.length); return { shape: clone(shapes[type]), color: colors[type], x: 0, y: 0 }; };
  const reset = () => { board = Array.from({ length: rows }, () => Array(cols).fill(0)); score = lines = 0; level = 1; current = randomPiece(); next = randomPiece(); current.x = Math.floor((cols - current.shape[0].length) / 2); updateStats(); draw(); drawNext(); };
  const updateStats = () => { $('#tetris-score').textContent = String(score).padStart(6, '0'); $('#tetris-lines').textContent = String(lines).padStart(3, '0'); $('#tetris-level').textContent = String(level).padStart(2, '0'); };
  const rotate = (shape) => shape[0].map((_, index) => shape.map((row) => row[index]).reverse());
  const collides = (piece, ox = 0, oy = 0, shape = piece.shape) => shape.some((row, y) => row.some((value, x) => value && (piece.x + x + ox < 0 || piece.x + x + ox >= cols || piece.y + y + oy >= rows || (board[piece.y + y + oy] && board[piece.y + y + oy][piece.x + x + ox]))));
  const merge = () => current.shape.forEach((row, y) => row.forEach((value, x) => { if (value) board[current.y + y][current.x + x] = current.color; }));
  const clearRows = () => { let cleared = 0; board = board.filter((row) => { if (row.every(Boolean)) { cleared++; return false; } return true; }); while (board.length < rows) board.unshift(Array(cols).fill(0)); return cleared; };
  const spawn = () => { current = next; current.x = Math.floor((cols - current.shape[0].length) / 2); current.y = 0; next = randomPiece(); drawNext(); if (collides(current)) { running = false; clearInterval(timer); $('#game-status').textContent = 'STACKED OUT — RESTART'; } };
  const lock = () => { merge(); const cleared = clearRows(); if (window.PixelPartyEconomy) window.PixelPartyEconomy.addCoins(1 + cleared * 5); if (cleared) { lines += cleared; score += [0, 100, 300, 500, 800][cleared] * level; level = Math.floor(lines / 10) + 1; clearInterval(timer); timer = setInterval(drop, Math.max(90, 720 - (level - 1) * 55)); } spawn(); updateStats(); draw(); };
  const drop = () => { if (!running || paused) return; if (!collides(current, 0, 1)) current.y++; else lock(); draw(); };
  const move = (direction) => { if (running && !paused && !collides(current, direction, 0)) { current.x += direction; draw(); } };
  const hardDrop = () => { if (!running || paused) return; let distance = 0; while (!collides(current, 0, 1)) { current.y++; distance++; } score += distance * 2; lock(); updateStats(); };
  const turn = () => { if (!running || paused) return; const rotated = rotate(current.shape); const kicks = [0, -1, 1, -2, 2]; const kick = kicks.find((x) => !collides(current, x, 0, rotated)); if (kick !== undefined) { current.x += kick; current.shape = rotated; draw(); } };
  const start = () => { reset(); running = true; paused = false; $('#tetris-pause').classList.remove('visible'); $('#game-status').textContent = 'DROP IN PROGRESS'; clearInterval(timer); timer = setInterval(drop, 720); };
  const togglePause = () => { if (!running) return; paused = !paused; $('#tetris-pause').classList.toggle('visible', paused); $('#game-status').textContent = paused ? 'PAUSED' : 'DROP IN PROGRESS'; };
  const drawCell = (context, x, y, color, size = cell) => { context.fillStyle = color; context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2); context.fillStyle = 'rgba(255,255,255,.18)'; context.fillRect(x * size + 2, y * size + 2, size - 8, 3); };
  const draw = () => { ctx.fillStyle = '#060717'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1; for (let x = 0; x <= cols; x++) { ctx.beginPath(); ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, canvas.height); ctx.stroke(); } for (let y = 0; y <= rows; y++) { ctx.beginPath(); ctx.moveTo(0, y * cell); ctx.lineTo(canvas.width, y * cell); ctx.stroke(); } if (board) board.forEach((row, y) => row.forEach((color, x) => color && drawCell(ctx, x, y, color))); if (current) current.shape.forEach((row, y) => row.forEach((value, x) => value && drawCell(ctx, current.x + x, current.y + y, current.color))); };
  const drawNext = () => { nextCtx.fillStyle = '#060717'; nextCtx.fillRect(0, 0, 100, 100); if (!next) return; const size = 22; const offsetX = (100 - next.shape[0].length * size) / 2; const offsetY = (100 - next.shape.length * size) / 2; next.shape.forEach((row, y) => row.forEach((value, x) => { if (value) { nextCtx.fillStyle = next.color; nextCtx.fillRect(offsetX + x * size + 1, offsetY + y * size + 1, size - 2, size - 2); } })); };
  document.addEventListener('keydown', (event) => { if (document.body.dataset.game !== 'tetris') return; if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(event.key)) event.preventDefault(); if (event.key === 'ArrowLeft') move(-1); if (event.key === 'ArrowRight') move(1); if (event.key === 'ArrowDown') drop(); if (event.key === 'ArrowUp') turn(); if (event.key === ' ') hardDrop(); if (event.key.toLowerCase() === 'p') togglePause(); });
  $('#tetris-start').addEventListener('click', start);
  reset();
  return { draw };
})();

// SNAKE --------------------------------------------------------------------
const snake = (() => {
  const canvas = $('#snake-canvas');
  if (!canvas) return { draw: () => {} };
  const ctx = canvas.getContext('2d'), size = 20, cell = canvas.width / size;
  let body, direction, queued, food, score, timer, running = false, paused = false;
  const bestKey = 'pixel-party-snake-best';
  const best = () => Number(storageGet(bestKey) || 0);
  const placeFood = () => { do { food = { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) }; } while (body.some((part) => part.x === food.x && part.y === food.y)); };
  const reset = () => { body = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]; direction = { x: 1, y: 0 }; queued = direction; score = 0; placeFood(); update(); draw(); };
  const update = () => { $('#snake-score').textContent = String(score).padStart(3, '0'); $('#snake-best').textContent = String(best()).padStart(3, '0'); };
  const end = () => { running = false; clearInterval(timer); $('#snake-message').innerHTML = 'Crashed!<br>Try a new route.'; $('#game-status').textContent = 'WALL HIT — RESTART'; };
  const tick = () => { if (!running || paused) return; direction = queued; const head = { x: body[0].x + direction.x, y: body[0].y + direction.y }; if (head.x < 0 || head.y < 0 || head.x >= size || head.y >= size || body.some((part) => part.x === head.x && part.y === head.y)) return end(); body.unshift(head); if (head.x === food.x && head.y === food.y) { score += 10; if (window.PixelPartyEconomy) window.PixelPartyEconomy.addCoins(5); if (score > best()) storageSet(bestKey, score); placeFood(); update(); } else body.pop(); draw(); };
  const start = () => { reset(); running = true; paused = false; $('#snake-pause').classList.remove('visible'); $('#snake-message').innerHTML = 'Eat the star.<br>Keep moving.'; $('#game-status').textContent = 'HUNT IN PROGRESS'; clearInterval(timer); timer = setInterval(tick, 125); };
  const changeDirection = (x, y) => { if (direction.x + x === 0 && direction.y + y === 0) return; queued = { x, y }; };
  const togglePause = () => { if (!running) return; paused = !paused; $('#snake-pause').classList.toggle('visible', paused); $('#game-status').textContent = paused ? 'PAUSED' : 'HUNT IN PROGRESS'; };
  const draw = () => { ctx.fillStyle = '#060717'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.strokeStyle = 'rgba(92,228,255,.1)'; for (let i = 0; i <= size; i++) { ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, canvas.height); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(canvas.width, i * cell); ctx.stroke(); } if (body) body.forEach((part, index) => { ctx.fillStyle = index === 0 ? '#ffdc61' : '#5ce4ff'; ctx.shadowColor = index === 0 ? '#ffdc61' : '#5ce4ff'; ctx.shadowBlur = 12; ctx.fillRect(part.x * cell + 3, part.y * cell + 3, cell - 6, cell - 6); ctx.shadowBlur = 0; }); if (food) { ctx.fillStyle = '#ff4fa3'; ctx.shadowColor = '#ff4fa3'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(food.x * cell + cell / 2, food.y * cell + cell / 2, cell * .28, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; } };
  document.addEventListener('keydown', (event) => { if (document.body.dataset.game !== 'snake') return; const key = event.key.toLowerCase(); if (['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d'].includes(key)) event.preventDefault(); if (key === 'arrowleft' || key === 'a') changeDirection(-1, 0); if (key === 'arrowright' || key === 'd') changeDirection(1, 0); if (key === 'arrowup' || key === 'w') changeDirection(0, -1); if (key === 'arrowdown' || key === 's') changeDirection(0, 1); if (key === 'p') togglePause(); });
  $('#snake-start').addEventListener('click', start); reset(); return { draw };
})();

// 2048 ---------------------------------------------------------------------
const game2048 = (() => {
  const boardEl = $('#board-2048');
  if (!boardEl) return { render: () => {} };
  let board, score = 0;
  const bestKey = 'pixel-party-2048-best';
  const best = () => Number(storageGet(bestKey) || 0);
  const emptyCells = () => board.flatMap((row, y) => row.map((value, x) => value ? null : { x, y }).filter(Boolean));
  const addTile = () => { const cells = emptyCells(); if (!cells.length) return; const cell = cells[Math.floor(Math.random() * cells.length)]; board[cell.y][cell.x] = Math.random() < .9 ? 2 : 4; };
  const reset = () => { board = Array.from({ length: 4 }, () => Array(4).fill(0)); score = 0; board[0][0] = 2; board[0][1] = 4; $('#2048-over').classList.remove('visible'); $('#game-status').textContent = 'USE ARROWS TO PLAY'; update(); render(); };
  const update = () => { $('#2048-score').textContent = String(score).padStart(6, '0'); $('#2048-best').textContent = String(best()).padStart(6, '0'); };
  const slideRow = (row) => { const filtered = row.filter(Boolean); const result = []; for (let i = 0; i < filtered.length; i++) { if (filtered[i] === filtered[i + 1]) { filtered[i] *= 2; score += filtered[i]; i++; } result.push(filtered[i]); } while (result.length < 4) result.push(0); return result; };
  const move = (direction) => { const before = JSON.stringify(board); if (direction === 'left') board = board.map(slideRow); if (direction === 'right') board = board.map((row) => slideRow([...row].reverse()).reverse()); if (direction === 'up' || direction === 'down') { for (let x = 0; x < 4; x++) { const column = board.map((row) => row[x]); const moved = direction === 'up' ? slideRow(column) : slideRow(column.reverse()).reverse(); for (let y = 0; y < 4; y++) board[y][x] = moved[y]; } } if (JSON.stringify(board) !== before) { addTile(); if (score > best()) storageSet(bestKey, score); update(); render(); if (isGameOver()) { $('#2048-over').classList.add('visible'); $('#game-status').textContent = 'NO MORE MOVES — RESTART'; } } };
  const isGameOver = () => emptyCells().length === 0 && !board.some((row, y) => row.some((value, x) => (x < 3 && value === row[x + 1]) || (y < 3 && value === board[y + 1][x])));
  const render = () => { boardEl.innerHTML = ''; board.forEach((row) => row.forEach((value) => { const tile = document.createElement('div'); tile.className = 'tile-2048'; tile.dataset.value = value || ''; tile.textContent = value || ''; tile.setAttribute('role', 'gridcell'); boardEl.appendChild(tile); })); };
  document.addEventListener('keydown', (event) => { if (document.body.dataset.game !== '2048') return; const key = event.key.toLowerCase(); const map = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down' }; if (map[key]) { event.preventDefault(); move(map[key]); } });
  $('#2048-start').addEventListener('click', reset); $('#2048-try').addEventListener('click', reset); reset(); return { render };
})();

