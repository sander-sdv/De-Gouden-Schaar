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

  // Hoogte van de vaste menubalk, zodat menulinks niet onder de balk eindigen.
  var header = document.querySelector('.site-header');
  function setHeaderH() { if (header) document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px'); }
  setHeaderH();
  window.addEventListener('resize', setHeaderH);

  // 2. Markeer de openingsuren van vandaag.
  var today = new Date().getDay(); // 0 = zondag
  document.querySelectorAll('.hours tr[data-day="' + today + '"]').forEach(function (tr) {
    tr.classList.add('today');
  });

  // Kaart (OpenStreetMap via Leaflet), met een gouden pin.
  var el = document.getElementById('kaart');
  if (el && window.L) {
    var pos = [parseFloat(el.dataset.lat), parseFloat(el.dataset.lon)];
    var map = L.map(el, { scrollWheelZoom: false, attributionControl: true }).setView(pos, parseInt(el.dataset.zoom, 10) || 17);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    var icon = L.divIcon({
      className: 'pin-goud',
      html: '<svg width="34" height="44" viewBox="0 0 34 44" aria-hidden="true"><path d="M17 43C17 43 32 27 32 16A15 15 0 0 0 2 16C2 27 17 43 17 43Z" fill="#c9a03f" stroke="#111110" stroke-width="1.5"/><circle cx="17" cy="16" r="6" fill="#fff"/></svg>',
      iconSize: [34, 44], iconAnchor: [17, 43]
    });
    L.marker(pos, { icon: icon, title: el.dataset.naam, keyboard: false }).addTo(map);
    // Kaart iets omhoog schuiven zodat de pin niet achter het adreskaartje valt
    map.panBy([0, 50], { animate: false });
  }

  // 3. Wie minder beweging wil, ziet het stiksel meteen af.
  var svg = document.getElementById('stitch-svg');
  if (svg && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    try { svg.setCurrentTime(10); svg.pauseAnimations(); } catch (e) {}
  }
})();
