(function() {
  // Message for blocked actions
  var blockMessage = "This free version is for web reading only. If you want an offline PDF and ePUB version to read, please support the author on https://books.apiad.net";

  // Get book ID from URL
  var pathMatch = window.location.pathname.match(/\/books\/([^/]+)/);
  var bookId = pathMatch ? pathMatch[1] : null;

  // ========== DRAWER CONTROLS ==========
  (function() {
    if (!bookId) return;
    
    // Create drawer
    var drawer = document.createElement('div');
    drawer.id = 'reader-drawer';
    drawer.innerHTML = 
      '<div id="reader-drawer-handle">▲</div>' +
      '<div id="reader-drawer-controls">' +
        '<button id="font-smaller" title="Smaller text">A-</button>' +
        '<button id="font-larger" title="Larger text">A+</button>' +
        '<button id="theme-btn" title="Toggle theme">🌙</button>' +
      '</div>';
    document.body.appendChild(drawer);
    
    // Theme toggle
    var themeBtn = document.getElementById('theme-btn');
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
    
    // Drawer toggle
    var handle = document.getElementById('reader-drawer-handle');
    handle.onclick = function(e) {
      e.stopPropagation();
      drawer.classList.toggle('expanded');
      handle.textContent = drawer.classList.contains('expanded') ? '▼' : '▲';
    };
    
    // Close on scroll
    var lastScroll = 0;
    window.addEventListener('scroll', function() {
      var currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      if (Math.abs(currentScroll - lastScroll) > 30) {
        if (drawer.classList.contains('expanded')) {
          drawer.classList.remove('expanded');
          handle.textContent = '▲';
        }
        lastScroll = currentScroll;
      }
    });
  })();

  // ========== FONT SIZE CONTROLS ==========
  (function() {
    var fontSizes = [14, 16, 18, 20, 22, 24, 28, 32];
    var fontSizeKey = 'reader_fontsize_' + bookId;
    var savedSize = parseInt(localStorage.getItem(fontSizeKey));
    var currentSize = fontSizes.indexOf(savedSize) !== -1 ? savedSize : 18;
    var sizeIndex = fontSizes.indexOf(currentSize);
    if (sizeIndex === -1) sizeIndex = 2;
    
    // Apply saved size
    document.documentElement.style.setProperty('--font-size-base', currentSize + 'px');
    
    function applyFontSize(size) {
      localStorage.setItem(fontSizeKey, size);
      document.documentElement.style.setProperty('--font-size-base', size + 'px');
    }
    
    document.getElementById('font-smaller').onclick = function(e) {
      e.stopPropagation();
      sizeIndex = Math.max(0, sizeIndex - 1);
      applyFontSize(fontSizes[sizeIndex]);
    };
    
    document.getElementById('font-larger').onclick = function(e) {
      e.stopPropagation();
      sizeIndex = Math.min(fontSizes.length - 1, sizeIndex + 1);
      applyFontSize(fontSizes[sizeIndex]);
    };
    
    // Keyboard shortcuts for font size
    document.addEventListener('keydown', function(e) {
      if (e.key === '-' || e.key === '_') {
        document.getElementById('font-smaller').click();
      } else if (e.key === '=' || e.key === '+') {
        document.getElementById('font-larger').click();
      }
    });
  })();

  // ========== KEYBOARD SHORTCUTS ==========
  document.addEventListener('keydown', function(e) {
    // T key to toggle theme
    if (e.key === 't' || e.key === 'T') {
      document.getElementById('theme-btn').click();
    }
  });

  // ========== REMEMBER POSITION ==========
  (function() {
    var pathMatch = window.location.pathname.match(/\/books\/([^/]+)/);
    if (!pathMatch) return;
    var bookId = pathMatch[1];
    
    var posKey = 'reader_pos_' + bookId;
    var savedPos = JSON.parse(localStorage.getItem(posKey));
    
    // Restore position on load
    if (savedPos && savedPos.path === window.location.pathname) {
      window.addEventListener('load', function() {
        setTimeout(function() {
          window.scrollTo(0, savedPos.scroll);
        }, 100);
      });
    }
    
    // Save position on scroll
    var scrollTimeout;
    window.addEventListener('scroll', function() {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function() {
        localStorage.setItem(posKey, JSON.stringify({
          path: window.location.pathname,
          scroll: window.pageYOffset || document.documentElement.scrollTop
        }));
      }, 500);
    });
  })();

  // ========== PROGRESS BAR ==========
  (function() {
    // Find content area - prioritize specific IDs first, then fallbacks
    var content = document.querySelector('#quarto-document-content') || 
                  document.querySelector('main.content') ||
                  document.querySelector('article') || 
                  document.querySelector('main#main-content') ||
                  document.querySelector('main') || 
                  document.querySelector('.quarto-body-content') ||
                  document.querySelector('.page-content') ||
                  document.querySelector('.content');
    
    if (!content) {
      console.log('Reader progress: no content element found');
      return;
    }
    
    // Debug: log content details
    console.log('Reader progress: found content', {
      tag: content.tagName,
      id: content.id,
      className: content.className,
      textLength: (content.innerText || '').length,
      wordCount: (content.innerText || '').split(/\s+/).filter(function(w) { return w.length > 0; }).length,
      offsetHeight: content.offsetHeight
    });
    
    // Word count for this chapter
    var totalWords = (content.innerText || '').split(/\s+/).filter(function(w) { return w.length > 0; }).length;
    if (totalWords < 50) {
      console.log('Reader progress: too few words', totalWords);
      return;
    }
    
    console.log('Reader progress: words:', totalWords, 'expected time:', Math.ceil(totalWords / 120), 'minutes');
    
    // Create progress bar
    var progressBar = document.createElement('div');
    progressBar.id = 'reader-progress';
    progressBar.innerHTML = 
      '<div class="reader-progress-bar"><div class="reader-progress-fill"></div></div>' +
      '<span class="reader-progress-time"></span>';
    document.body.appendChild(progressBar);
    
    var fill = progressBar.querySelector('.reader-progress-fill');
    var timeLabel = progressBar.querySelector('.reader-progress-time');
    
    function updateProgress() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = content.offsetHeight;
      var winHeight = window.innerHeight;
      var scrollPercent = scrollTop / (docHeight - winHeight);
      scrollPercent = Math.min(1, Math.max(0, scrollPercent));
      
      // Update bar
      fill.style.width = (scrollPercent * 100) + '%';
      
    // Update time remaining
    var wordsRemaining = totalWords * (1 - scrollPercent);
    // 120 words per minute = 2 words per second
    var secondsRemaining = Math.ceil(wordsRemaining / 2);
      
      var timeText;
      if (secondsRemaining < 60) {
        timeText = secondsRemaining + 's left';
      } else {
        timeText = Math.ceil(secondsRemaining / 60) + 'm left';
      }
      timeLabel.textContent = timeText;
    }
    
    // Throttled scroll listener
    var scrollTimeout;
    window.addEventListener('scroll', function() {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateProgress, 100);
    });
    
    // Initial update
    updateProgress();
  })();

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