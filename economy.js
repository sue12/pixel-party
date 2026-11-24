(function () {
  var COIN_KEY = 'pixel-party-coins';
  var THEME_KEY = 'pixel-party-theme';
  var OWNED_KEY = 'pixel-party-owned-themes';
  var TEST_GRANT_KEY = 'pixel-party-test-grant-v1';
  var BONUS_GRANT_KEY = 'pixel-party-test-grant-v2';
  var SHOP_TEST_GRANT_KEY = 'pixel-party-test-grant-v3';
  var themes = {
    city: { name: 'Neon City', cost: 0 },
    sunset: { name: 'Sunset Drive', cost: 25 },
    ocean: { name: 'Ocean Terminal', cost: 40 },
    mono: { name: 'Mono Arcade', cost: 60 },
    laser: { name: 'Laser Grid', cost: 80 },
    forest: { name: 'Forest Glitch', cost: 100 },
    candy: { name: 'Candy Circuit', cost: 120 }
  };

  function read(key, fallback) {
    try { var value = localStorage.getItem(key); return value === null ? fallback : value; } catch (error) { return fallback; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (error) { /* progress can remain session-only */ }
  }

  function getCoins() { return Number(read(COIN_KEY, '0')) || 0; }

  if (read(TEST_GRANT_KEY, null) === null) {
    write(COIN_KEY, getCoins() + 100);
    write(TEST_GRANT_KEY, 'claimed');
  }
  if (read(BONUS_GRANT_KEY, null) === null) {
    write(COIN_KEY, getCoins() + 20);
    write(BONUS_GRANT_KEY, 'claimed');
  }
  if (read(SHOP_TEST_GRANT_KEY, null) === null) {
    write(COIN_KEY, getCoins() + 1500);
    write(SHOP_TEST_GRANT_KEY, 'claimed');
  }

  function updateCoins() {
    var labels = document.querySelectorAll('[data-coin-count]');
    for (var i = 0; i < labels.length; i += 1) labels[i].textContent = String(getCoins()).padStart(3, '0');
  }

  function toast(message) {
    var oldToast = document.querySelector('.coin-toast');
    if (oldToast) oldToast.remove();
    var item = document.createElement('div');
    item.className = 'coin-toast';
    item.textContent = message;
    document.body.appendChild(item);
    setTimeout(function () { item.classList.add('is-gone'); setTimeout(function () { item.remove(); }, 220); }, 1100);
  }

  function addCoins(amount) {
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    if (!amount) return;
    write(COIN_KEY, getCoins() + amount);
    updateCoins();
    toast('+' + amount + ' COINS');
  }

  function spendCoins(amount) {
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    if (getCoins() < amount) return false;
    write(COIN_KEY, getCoins() - amount);
    updateCoins();
    return true;
  }

  function getTheme() { return read(THEME_KEY, 'city'); }

  function getOwnedThemes() {
    var saved;
    try { saved = JSON.parse(read(OWNED_KEY, '["city"]')); } catch (error) { saved = ['city']; }
    if (!Array.isArray(saved) || saved.indexOf('city') === -1) saved = ['city'];
    return saved;
  }

  function ownsTheme(theme) { return getOwnedThemes().indexOf(theme) !== -1; }

  function unlockTheme(theme) {
    if (!themes[theme]) return false;
    var owned = getOwnedThemes();
    if (owned.indexOf(theme) === -1) { owned.push(theme); write(OWNED_KEY, JSON.stringify(owned)); }
    return true;
  }

  function setTheme(theme) {
    if (!themes[theme]) return false;
    write(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
    return true;
  }

  window.PixelPartyEconomy = {
    themes: themes,
    getCoins: getCoins,
    addCoins: addCoins,
    spendCoins: spendCoins,
    getTheme: getTheme,
    ownsTheme: ownsTheme,
    unlockTheme: unlockTheme,
    setTheme: setTheme,
    updateCoins: updateCoins
  };

  // Keep every cabinet page connected as the arcade grows.
  function ensureGameLinks() {
    var nav = document.querySelector('.site-nav');
    if (!nav) return;
    var shop = nav.querySelector('a[href="shop.html"]');
    if (!shop) return;
    [['pong.html', 'PONG'], ['breakout.html', 'BREAKOUT'], ['mines.html', 'MINES']].forEach(function (item) {
      if (nav.querySelector('a[href="' + item[0] + '"]')) return;
      var link = document.createElement('a'); link.href = item[0]; link.textContent = item[1]; nav.insertBefore(link, shop);
    });
  }

  document.documentElement.dataset.theme = getTheme();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { updateCoins(); ensureGameLinks(); });
  else { updateCoins(); ensureGameLinks(); }
}());
