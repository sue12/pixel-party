(function () {
  var boardEl = document.getElementById('board-2048');
  if (!boardEl) return;

  var board;
  var score = 0;
  var bestKey = 'pixel-party-2048-best';
  var animateTiles = false;

  function getBest() {
    try { return Number(localStorage.getItem(bestKey) || 0); } catch (error) { return 0; }
  }

  function saveBest(value) {
    try { localStorage.setItem(bestKey, value); } catch (error) { /* saved scores are optional */ }
  }

  function emptyCells() {
    var cells = [];
    for (var y = 0; y < 4; y += 1) {
      for (var x = 0; x < 4; x += 1) if (!board[y][x]) cells.push({ x: x, y: y });
    }
    return cells;
  }

  function addTile() {
    var cells = emptyCells();
    if (!cells.length) return;
    var cell = cells[Math.floor(Math.random() * cells.length)];
    board[cell.y][cell.x] = Math.random() < 0.9 ? 2 : 4;
  }

  function updateScore() {
    document.getElementById('2048-score').textContent = String(score).padStart(6, '0');
    document.getElementById('2048-best').textContent = String(getBest()).padStart(6, '0');
  }

  function render() {
    boardEl.innerHTML = '';
    for (var y = 0; y < 4; y += 1) {
      for (var x = 0; x < 4; x += 1) {
        var value = board[y][x];
        var tile = document.createElement('div');
        tile.className = 'tile-2048' + (animateTiles && value ? ' tile-pop' : '');
        tile.setAttribute('data-value', value || '');
        tile.setAttribute('role', 'gridcell');
        tile.textContent = value || '';
        boardEl.appendChild(tile);
      }
    }
  }

  function slideRow(row) {
    var filtered = row.filter(function (value) { return value; });
    var result = [];
    for (var i = 0; i < filtered.length; i += 1) {
      var value = filtered[i];
      if (value === filtered[i + 1]) { value *= 2; score += value; i += 1; }
      result.push(value);
    }
    while (result.length < 4) result.push(0);
    return result;
  }

  function isGameOver() {
    if (emptyCells().length) return false;
    for (var y = 0; y < 4; y += 1) for (var x = 0; x < 4; x += 1) {
      if (x < 3 && board[y][x] === board[y][x + 1]) return false;
      if (y < 3 && board[y][x] === board[y + 1][x]) return false;
    }
    return true;
  }

  function move(direction) {
    var before = JSON.stringify(board);
    var scoreBefore = score;
    var x;
    var y;
    if (direction === 'left') board = board.map(slideRow);
    if (direction === 'right') board = board.map(function (row) { return slideRow(row.slice().reverse()).reverse(); });
    if (direction === 'up' || direction === 'down') {
      for (x = 0; x < 4; x += 1) {
        var column = [];
        for (y = 0; y < 4; y += 1) column.push(board[y][x]);
        var moved = direction === 'up' ? slideRow(column) : slideRow(column.reverse()).reverse();
        for (y = 0; y < 4; y += 1) board[y][x] = moved[y];
      }
    }
    if (JSON.stringify(board) === before) return;
    addTile();
    if (score > getBest()) saveBest(score);
    updateScore();
    animateTiles = true;
    render();
    animateTiles = false;
    if (window.PixelPartyEconomy) window.PixelPartyEconomy.addCoins(1 + (score > scoreBefore ? 1 : 0));
    document.getElementById('game-status').textContent = score > scoreBefore ? 'MERGED! +' + (score - scoreBefore) : 'KEEP GOING';
    if (isGameOver()) document.getElementById('2048-over').classList.add('visible');
  }

  function reset() {
    board = [[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    score = 0;
    animateTiles = false;
    document.getElementById('2048-over').classList.remove('visible');
    document.getElementById('game-status').textContent = 'MERGE THE 2s';
    updateScore();
    render();
  }

  document.addEventListener('keydown', function (event) {
    var keys = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down' };
    var direction = keys[event.key] || keys[event.key.toLowerCase()];
    if (!direction) return;
    event.preventDefault();
    move(direction);
  });

  document.getElementById('2048-start').addEventListener('click', reset);
  document.getElementById('2048-try').addEventListener('click', reset);
  var moveButtons = document.querySelectorAll('[data-move]');
  for (var buttonIndex = 0; buttonIndex < moveButtons.length; buttonIndex += 1) {
    moveButtons[buttonIndex].addEventListener('click', function () { move(this.getAttribute('data-move')); });
  }
  reset();
}());
