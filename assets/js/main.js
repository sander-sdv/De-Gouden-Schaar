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

  // Menuknop op kleine schermen: opent en sluit het menu.
  var btn = document.querySelector('.menu-btn');
  if (header && btn) {
    var label = btn.querySelector('.menu-label');
    var setOpen = function (open) {
      header.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (label) label.textContent = open ? 'Sluiten' : 'Menu';
    };
    btn.addEventListener('click', function () { setOpen(!header.classList.contains('open')); });
    header.querySelectorAll('nav a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('click', function (e) {
      if (header.classList.contains('open') && !header.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('open')) { setOpen(false); btn.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 860) setOpen(false); });
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
  } else if (svg && 'IntersectionObserver' in window) {
    // 4. Op een gsm staat het stiksel onder de vouw: start pas als het in beeld komt.
    try { svg.pauseAnimations(); svg.setCurrentTime(0); } catch (e) {}
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        try { svg.unpauseAnimations(); } catch (e) {}
        io.disconnect();
      }
    }, { threshold: 0.6 });
    io.observe(svg);
  }
})();
