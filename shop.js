(function () {
  var economy = window.PixelPartyEconomy;
  if (!economy) return;
  var message = document.getElementById('shop-message');
  var cards = document.querySelectorAll('[data-theme-card]');

  function render() {
    var active = economy.getTheme();
    for (var i = 0; i < cards.length; i += 1) {
      var card = cards[i];
      var theme = card.getAttribute('data-theme-card');
      var button = card.querySelector('[data-buy-theme]');
      var price = economy.themes[theme].cost;
      card.classList.toggle('is-active', theme === active);
      if (theme === active) { button.textContent = 'EQUIPPED'; button.disabled = true; }
      else if (economy.ownsTheme(theme)) { button.disabled = false; button.textContent = 'USE THEME'; }
      else { button.disabled = false; button.textContent = price ? 'BUY FOR ' + price + ' COINS' : 'USE THEME'; }
    }
    economy.updateCoins();
  }

  for (var i = 0; i < cards.length; i += 1) cards[i].querySelector('[data-buy-theme]').addEventListener('click', function () {
    var theme = this.closest('[data-theme-card]').getAttribute('data-theme-card');
    var price = economy.themes[theme].cost;
    if (theme !== economy.getTheme() && !economy.ownsTheme(theme) && price && !economy.spendCoins(price)) {
      message.textContent = 'PLAY MORE TO EARN COINS';
      message.className = 'shop-message is-error';
      return;
    }
    economy.unlockTheme(theme);
    economy.setTheme(theme);
    message.textContent = economy.themes[theme].name + ' EQUIPPED';
    message.className = 'shop-message is-success';
    render();
  });

  render();
}());
