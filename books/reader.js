(function() {
  // Message for blocked actions
  var blockMessage = "This free version is for web reading only. If you want an offline PDF and ePUB version to read, please support the author on https://books.apiad.net";

  // Theme toggle
  var themeBtn = document.getElementById('theme-btn');
  if (themeBtn) {
    var savedTheme = localStorage.getItem('reader-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    themeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('reader-theme', next);
      themeBtn.textContent = next === 'dark' ? '☀️' : '🌙';
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // T key to toggle theme
    if (e.key === 't' || e.key === 'T') {
      if (themeBtn) themeBtn.click();
    }
  });

  // ========== UPSELL MODAL ==========
  (function() {
    // Get book ID from URL path (e.g., /books/tsoc/intro.html -> tsoc)
    var pathMatch = window.location.pathname.match(/\/books\/([^/]+)/);
    if (!pathMatch) return;
    var bookId = pathMatch[1];

    // Get config from window
    var config = window.readerConfig?.upsell;
    if (!config || !config.enabled) return;

    // Get book and compendium data from window.catalogData
    var book = null;
    var compendium = null;
    if (window.catalogData?.categories) {
      for (var i = 0; i < window.catalogData.categories.length; i++) {
        var cat = window.catalogData.categories[i];
        if (cat.items) {
          for (var j = 0; j < cat.items.length; j++) {
            if (cat.items[j].id === bookId) {
              book = cat.items[j];
              break;
            }
          }
        }
      }
    }
    compendium = window.catalogData?.compendium;

    if (!book || !compendium) return;

    // Time tracking (cumulative per book)
    var timeKey = 'reader_time_' + bookId;
    var totalSeconds = parseInt(localStorage.getItem(timeKey) || '0');

    // Save time periodically
    setInterval(function() {
      localStorage.setItem(timeKey, totalSeconds.toString());
    }, 30000);

    // Increment time every second
    setInterval(function() {
      totalSeconds++;
      checkUpsell();
    }, 1000);

    // Check and show modal
    function checkUpsell() {
      var thresholds = config.thresholds || [15, 30, 60, 120, 240, 480];
      var minutes = Math.floor(totalSeconds / 60);
      var shownKey = 'reader_upsell_' + bookId;
      var shown = JSON.parse(localStorage.getItem(shownKey) || '[]');

      for (var i = 0; i < thresholds.length; i++) {
        var threshold = thresholds[i];
        if (minutes >= threshold && shown.indexOf(threshold) === -1) {
          showUpsellModal(threshold, book, compendium);
          shown.push(threshold);
          localStorage.setItem(shownKey, JSON.stringify(shown));
          break;
        }
      }
    }

    // Show modal
    function showUpsellModal(minutes, book, compendium) {
      // Remove existing modal if any
      var existing = document.getElementById('reader-upsell-modal');
      if (existing) existing.remove();

      var bookPrice = (book.price || 2900) / 100;
      var bundlePrice = (compendium.price || 6900) / 100;

      // Create modal
      var modal = document.createElement('div');
      modal.id = 'reader-upsell-modal';
      modal.innerHTML =
        '<div class="upsell-overlay">' +
          '<div class="upsell-content">' +
            '<h3>It seems you\'re enjoying this!</h3>' +
            '<p>You\'ve been reading for over ' + minutes + ' minutes.</p>' +
            '<p class="upsell-cta">If you want to support the author, you can get the PDF/ePUB of this book, or get all my books (current and future) in the Compendium bundle. Otherwise, feel free to keep reading!</p>' +
            '<div class="upsell-buttons">' +
              '<a href="' + book.gumroadUrl + '?wanted=true" class="upsell-btn-primary" target="_blank">Get This Book - $' + bookPrice + '</a>' +
              '<a href="' + compendium.gumroadUrl + '?wanted=true" class="upsell-btn-secondary" target="_blank">Get All Books Bundle - $' + bundlePrice + '</a>' +
              '<button class="upsell-btn-dismiss">Keep Reading</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      modal.querySelector('.upsell-btn-dismiss').onclick = function() {
        modal.remove();
      };

      document.body.appendChild(modal);
    }
  })();
})();