// De Gouden Schaar: kleine verbeteringen bovenop de statische pagina.
(function () {
  // 1. Kaartlinks: Apple Kaarten op iPhone/iPad/Mac, anders Google Maps (opent de Maps-app op Android).
  var apple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
  if (apple) {
    document.querySelectorAll('.js-maps[data-query]').forEach(function (a) {
      a.href = 'https://maps.apple.com/?q=' + encodeURIComponent(a.dataset.query);
    });
    document.querySelectorAll('.js-route[data-query]').forEach(function (a) {
      a.href = 'https://maps.apple.com/?daddr=' + encodeURIComponent(a.dataset.query);
    });
  }

  // 2. Markeer de openingsuren van vandaag.
  var today = new Date().getDay(); // 0 = zondag
  document.querySelectorAll('.hours tr[data-day="' + today + '"]').forEach(function (tr) {
    tr.classList.add('today');
  });

  // 3. Wie minder beweging wil, ziet het stiksel meteen af.
  var svg = document.getElementById('stitch-svg');
  if (svg && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    try { svg.setCurrentTime(10); svg.pauseAnimations(); } catch (e) {}
  }
})();
