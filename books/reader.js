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
})();