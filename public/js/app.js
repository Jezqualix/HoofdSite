/* ============================================================
   HoofdSite — Client-side: zoeken, filteren, dark mode
   ============================================================ */

(function () {
  'use strict';

  const searchInput  = document.getElementById('searchInput');
  const filterBtns   = document.querySelectorAll('.filter-btn');
  const appCards     = document.querySelectorAll('.app-card');
  const emptyState   = document.getElementById('emptyState');
  const themeToggle  = document.getElementById('themeToggle');
  const themeIcon    = themeToggle.querySelector('.theme-icon');
  const currentYear  = document.getElementById('currentYear');
  const html         = document.documentElement;

  // --- Jaar in footer ---
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // --- Dark mode ---
  const savedTheme = localStorage.getItem('hoofdsite-theme');

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('hoofdsite-theme', theme);
  }

  // Initialisatie: gebruik opgeslagen voorkeur of systeemvoorkeur
  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  } else {
    applyTheme('light');
  }

  themeToggle.addEventListener('click', function () {
    const current = html.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // --- Filter + zoek logica ---
  let activeFilter = 'alle';
  let searchQuery  = '';

  function filterCards() {
    let zichtbaar = 0;

    appCards.forEach(function (card) {
      const status      = card.dataset.status;
      const naam        = card.dataset.naam || '';
      const beschrijving = card.dataset.beschrijving || '';
      const tekst       = naam + ' ' + beschrijving;

      const filterOk = activeFilter === 'alle' || status === activeFilter;
      const zoekOk   = searchQuery === '' || tekst.includes(searchQuery);

      if (filterOk && zoekOk) {
        card.classList.remove('hidden');
        zichtbaar++;
      } else {
        card.classList.add('hidden');
      }
    });

    if (emptyState) {
      emptyState.classList.toggle('hidden', zichtbaar > 0);
    }
  }

  // Filterknopjes
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      filterCards();
    });
  });

  // Zoekbalk
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      searchQuery = searchInput.value.toLowerCase().trim();
      filterCards();
    });
  }

  // --- App klikken loggen ---
  const appLinks = document.querySelectorAll('.btn-open[data-app-id]');
  appLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      const appId = link.dataset.appId;
      const appName = link.dataset.appName;

      // Log de klik naar de server
      fetch('/api/log-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appId: appId,
          appName: appName
        })
      }).catch(function (err) {
        console.error('Error logging click:', err);
      });

      // Laat de link normaal handelen (open in nieuw tab)
    });
  });

})();
