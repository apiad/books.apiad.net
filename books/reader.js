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
      '<div id="reader-drawer-handle" role="button" aria-label="Toggle controls" tabindex="0">▲</div>' +
      '<div id="reader-drawer-controls">' +
        '<button id="home-btn" aria-label="All Books">🏠</button>' +
        '<button id="toc-btn" aria-label="Table of Contents">☰</button>' +
        '<button id="font-smaller" aria-label="Decrease font size">A-</button>' +
        '<button id="font-larger" aria-label="Increase font size">A+</button>' +
        '<button id="theme-btn" aria-label="Toggle theme">🌙</button>' +
      '</div>';
    document.body.appendChild(drawer);
    
    // Home button
    document.getElementById('home-btn').onclick = function() {
      window.location.href = '/books/index.html';
    };
    
    // TOC toggle
    var tocBtn = document.getElementById('toc-btn');
    var sidebar = document.getElementById('quarto-sidebar');
    var overlay = document.createElement('div');
    overlay.id = 'reader-toc-overlay';
    document.body.appendChild(overlay);
    
    var closeBtn = document.createElement('button');
    closeBtn.id = 'reader-toc-close';
    closeBtn.innerHTML = '×';
    closeBtn.setAttribute('aria-label', 'Close table of contents');
    document.body.appendChild(closeBtn);
    
    // Close TOC on page load (reset state)
    if (sidebar) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
      closeBtn.style.display = 'none';
    }
    
    function closeToc() {
      if (sidebar) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        closeBtn.style.display = 'none';
      }
    }
    
    function toggleToc() {
      if (sidebar) {
        if (sidebar.classList.contains('active')) {
          closeToc();
        } else {
          sidebar.classList.add('active');
          overlay.classList.add('active');
          closeBtn.style.display = 'flex';
        }
      }
    }
    
    tocBtn.addEventListener('click', toggleToc);
    overlay.addEventListener('click', closeToc);
    closeBtn.addEventListener('click', closeToc);
    
    // Close TOC when clicking sidebar links
    if (sidebar) {
      sidebar.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && e.target.classList.contains('sidebar-link')) {
          closeToc();
        }
      });
    }
    
    // Close TOC on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
        closeToc();
        tocBtn.focus();
      }
    });
    
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

  // ========== NAVIGATION ARROWS + SWIPE ==========
  (function() {
    if (!bookId) return;
    
    var nav = document.querySelector('nav.page-navigation');
    if (!nav) return;
    
    var prevLink = nav.querySelector('.nav-page-previous a') || 
                   nav.querySelector('.pagination-link.previous');
    var nextLink = nav.querySelector('.nav-page-next a') || 
                   nav.querySelector('.pagination-link.next');
    
    // Find content area
    var content = document.querySelector('#quarto-document-content') || 
                  document.querySelector('main.content') ||
                  document.querySelector('main');
    if (!content) return;
    
    var navArrows = document.createElement('div');
    navArrows.id = 'reader-nav-arrows';
    navArrows.innerHTML = 
      '<button id="nav-prev" class="nav-prev-btn"><span class="nav-arrow">‹</span> Prev</button>' +
      '<button id="nav-next" class="nav-next-btn">Next <span class="nav-arrow">›</span></button>';
    content.appendChild(navArrows);
    
    var prevBtn = document.getElementById('nav-prev');
    var nextBtn = document.getElementById('nav-next');
    
    if (prevLink) {
      prevBtn.onclick = function() { window.location.href = prevLink.href; };
    } else {
      prevBtn.classList.add('disabled');
    }
    
    if (nextLink) {
      nextBtn.onclick = function() { window.location.href = nextLink.href; };
    } else {
      nextBtn.classList.add('disabled');
    }
    
    var touchStartX = 0;
    var touchEndX = 0;
    var touchStartY = 0;
    var touchEndY = 0;
    var swipeThreshold = 80;
    
    document.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      
      var deltaX = touchEndX - touchStartX;
      var deltaY = touchEndY - touchStartY;
      
      if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaY) < Math.abs(deltaX) * 0.5) {
        if (deltaX > 0 && prevLink) {
          window.location.href = prevLink.href;
        } else if (deltaX < 0 && nextLink) {
          window.location.href = nextLink.href;
        }
      }
    }, { passive: true });
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
    
    // Keyboard shortcuts for font size (skip if in input/textarea)
    document.addEventListener('keydown', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.key === '-' || e.key === '_') {
        document.getElementById('font-smaller').click();
      } else if (e.key === '=' || e.key === '+') {
        document.getElementById('font-larger').click();
      } else if (e.key === 't' || e.key === 'T') {
        document.getElementById('theme-btn').click();
      }
    });
  })();

  // ========== REMEMBER POSITION ==========
  (function() {
    if (!bookId) return;
    
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
    
    if (!content) return;
    
    // Word count for this chapter
    var totalWords = (content.innerText || '').split(/\s+/).filter(function(w) { return w.length > 0; }).length;
    if (totalWords < 50) return;
    
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
    if (!bookId) return;

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
    var thresholds = config.thresholds || [15, 30, 60, 120, 240, 480];
    var maxThreshold = thresholds[thresholds.length - 1];
    var shownKey = 'reader_upsell_' + bookId;
    var shownThresholds = JSON.parse(localStorage.getItem(shownKey) || '[]');

    // Save time periodically
    var saveInterval = setInterval(function() {
      localStorage.setItem(timeKey, totalSeconds.toString());
    }, 30000);

    // Increment time every second and check upsell
    var tickInterval = setInterval(function() {
      totalSeconds++;
      
      // Stop intervals if past all thresholds
      var minutes = Math.floor(totalSeconds / 60);
      if (minutes > maxThreshold && shownThresholds.length >= thresholds.length) {
        localStorage.setItem(timeKey, totalSeconds.toString());
        clearInterval(tickInterval);
        clearInterval(saveInterval);
        return;
      }
      
      checkUpsell();
    }, 1000);

    // Check and show modal
    function checkUpsell() {
      var minutes = Math.floor(totalSeconds / 60);

      for (var i = 0; i < thresholds.length; i++) {
        var threshold = thresholds[i];
        if (minutes >= threshold && shownThresholds.indexOf(threshold) === -1) {
          showUpsellModal(threshold, book, compendium);
          shownThresholds.push(threshold);
          localStorage.setItem(shownKey, JSON.stringify(shownThresholds));
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
      
      // Close upsell on Escape
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      var escHandler = function(e) {
        if (e.key === 'Escape') {
          modal.remove();
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);

      document.body.appendChild(modal);
    }
  })();
})();