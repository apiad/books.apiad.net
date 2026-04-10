// App initialization
console.log('app.js loaded');

const audienceTooltips = {
  '😄 General': 'A book that can be read by anyone, regardless of their background.',
  '😎 Technical': 'A book for technical audiences with working knowledge in programming.',
  '🧐 Expert': 'A book for experts, mostly requiring formal education in math and/or CS.',
};

const statusTooltips = {
  '🔴 Alpha': 'Some chapters have drafts, but part of the content is not even written.',
  '🟠 Beta': 'All chapters have at least a first draft. First round of editing under way.',
  '🔵 Delta': 'All digital assets ready. Second round of revision under way.',
  '🟣 Epsilon': 'Book content is locked in, only aesthetic changes remain.',
  '🟢 Omega': 'Final version of the book is ready and published.',
  '🎯 Planned': 'In the queue - not started yet.',
};

function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2);
}

function renderProgressBar(progress) {
  return `
    <div class="flex items-center gap-3">
      <div class="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-orange-500 to-violet-500 rounded-full progress-bar"
             style="width: ${progress}%"></div>
      </div>
      <span class="text-xs text-zinc-400 font-mono">${progress}%</span>
    </div>
  `;
}

function renderBadge(text, emoji, isPlanned = false, tooltip = '') {
  const bgColor = isPlanned ? 'bg-zinc-800' : 'bg-zinc-700/50';
  const tooltipHtml = tooltip
    ? `<span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-zinc-700">${tooltip}</span>`
    : '';
  return `<span class="relative inline-flex items-center gap-1 px-2 py-1 ${bgColor} rounded-lg text-xs text-zinc-300 group cursor-help">${emoji} ${text}${tooltipHtml}</span>`;
}

function renderButton(url, text, variant = 'primary', icon = '', fullWidth = false) {
  if (!url) {
    return `<span class="text-zinc-500 text-sm">Coming Eventually</span>`;
  }

  const display = fullWidth ? 'display: block; width: 100%;' : 'display: inline-flex;';
  const padding = fullWidth ? 'padding: 16px 24px;' : 'padding: 16px 32px;';
  const fontSize = 'font-size: 16px;';
  const borderRadius = 'border-radius: 12px;';

  const colors = variant === 'primary'
    ? 'background-color: #f97316; color: white; border: 2px solid #f97316;'
    : 'background-color: transparent; color: #a78bfa; border: 2px solid #a78bfa;';

  const isGumroad = url.includes('gumroad') || url.includes('apiad.gumroad.com');
  const attrs = isGumroad
    ? 'data-gumroad-url="' + url + '" class="gumroad-buy-btn"'
    : '';

  return `<a href="${url}" ${attrs} style="${display} ${padding} ${fontSize} ${borderRadius} ${colors} text-align: center; font-weight: 600; cursor: pointer; text-decoration: none;">${icon} ${text}</a>`;
}

function renderBookCard(book) {
  const isPlanned = book.status === 'Planned';
  const isCover = book.coverUrl || !isPlanned;
  const coverHtml = book.coverUrl
    ? `<img src="${book.coverUrl}" alt="${book.title}" class="w-full h-40 object-cover rounded-t-xl">`
    : (!isPlanned ? `<div class="w-full h-40 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-t-xl flex items-center justify-center text-4xl">${book.statusEmoji}</div>` : '');

  const progressHtml = isPlanned
    ? ''
    : `
      <div class="flex-none">
        ${renderProgressBar(book.progress)}
        <div class="text-xs text-zinc-500 mt-1">${book.pages} of ~${book.targetPages} pages</div>
      </div>
    `;

  const buttonsHtml = isPlanned
    ? ''
    : `<div class="mt-auto pt-4 space-y-3">${renderButton(book.gumroadUrl, 'Buy', 'primary', '💳', true)}${renderButton(book.readUrl, 'Read Online', 'secondary', '📖', true)}</div>`;

  const compendiumCardCta = isPlanned
    ? ''
    : `<div class="mt-3 pt-3 border-t border-zinc-800">
        <button onclick="openBookModal('compendium')" class="w-full py-2 text-xs text-violet-400 hover:text-violet-300 transition-colors">
          📦 Get Compendium - all books + future included →
        </button>
      </div>`;

  const cardHeight = isPlanned ? '' : 'min-h-[520px]';

  return `
    <div class="bg-card rounded-2xl border border-zinc-800 overflow-visible hover:border-orange-500/30 hover:bg-card-hover transition-all duration-200 shadow-lg shadow-black/20 flex flex-col ${cardHeight} cursor-pointer book-card" data-book-id="${book.id}">
      ${coverHtml}
      <div class="p-5 flex flex-col flex-grow">
        <div class="flex flex-wrap gap-2 mb-2">
          ${renderBadge(book.audience, '', false, audienceTooltips[book.audience] || '')}
          ${renderBadge(book.status, book.statusEmoji, isPlanned, statusTooltips[book.statusEmoji + ' ' + book.status] || '')}
        </div>
        <h3 class="text-lg font-semibold text-zinc-100 font-serif">${book.title}</h3>
        <p class="text-zinc-400 text-sm mt-2 custom-clamp">${book.description}</p>
        <div class="flex-grow"></div>
        ${progressHtml}
        ${buttonsHtml}
        ${compendiumCardCta}
      </div>
    </div>
  `;
}

function renderCategory(category) {
  const cardsHtml = category.items.map(book => renderBookCard(book)).join('');
  return `
    <section class="mb-16">
      <h2 class="text-3xl font-bold font-serif mb-3 text-zinc-100">${category.name}</h2>
      <p class="text-zinc-400 mb-8 max-w-2xl">${category.description}</p>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        ${cardsHtml}
      </div>
    </section>
  `;
}

function renderCompendium(compendium) {
  // Calculate savings
  const earlyAccess = window.catalogData.categories.find(c => c.id === 'early-access');
  const backburner = window.catalogData.categories.find(c => c.id === 'backburner');
  const totalPrice = earlyAccess.items.reduce((sum, book) => sum + (book.price || 0), 0);
  const bookCount = earlyAccess.items.length;
  const futureCount = backburner ? backburner.items.length : 0;
  const savingsCents = totalPrice - compendium.price;
  const savingsPercent = totalPrice > 0 ? Math.round((savingsCents / totalPrice) * 100) : 0;

  return `
    <section class="mb-16">
      <div class="relative rounded-2xl p-8 bg-gradient-to-r from-violet-500/10 via-card to-orange-500/10 border border-zinc-800 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-orange-500/5"></div>
        <div class="relative">
          <span class="inline-block px-3 py-1 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full text-xs font-semibold text-white mb-4">✨ Best Value</span>
          <h2 class="text-3xl md:text-4xl font-bold font-serif text-zinc-100 mb-3">${compendium.title}</h2>
          <p class="text-zinc-400 mb-4 max-w-xl">${compendium.description}</p>
          
          <div class="bg-zinc-800/50 rounded-lg p-3 mb-4 max-w-lg">
            <p class="text-zinc-400 text-sm">
              <span class="line-through opacity-60">$${(totalPrice / 100).toFixed(2)}</span> 
              <span class="text-zinc-300 ml-2">for ${bookCount} books</span>
              <span class="text-green-400 font-semibold ml-3">Save ${savingsPercent}%</span>
            </p>
            <p class="text-violet-400 text-xs mt-1">
              ✨ Plus ${futureCount} more future books included forever (worth $${((futureCount * 29)).toFixed(0)}+)
            </p>
          </div>
          
          <div class="flex flex-wrap items-center gap-4">
            <span class="text-3xl font-bold text-orange-400">${formatPrice(compendium.price)}</span>
            <a href="#" data-gumroad-url="${compendium.gumroadUrl}" class="gumroad-buy-btn bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-violet-500/25">🎁 Buy Bundle</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderLayout() {
  const compendiumHtml = renderCompendium(window.catalogData.compendium);
  const categoriesHtml = window.catalogData.categories.map(cat => renderCategory(cat)).join('');

  // Count books
  const earlyAccess = window.catalogData.categories.find(c => c.id === 'early-access');
  const bookCount = earlyAccess ? earlyAccess.items.length : 0;

  return `
    <div class="max-w-6xl mx-auto px-4 py-12">
      <header class="text-center mb-16">
        <h1 class="text-4xl md:text-5xl font-bold font-serif text-zinc-100 mb-4">Master Computer Science & AI</h1>
        <p class="text-zinc-400 text-lg max-w-2xl mx-auto mb-4">
          Deep, conceptual books on computation, algorithms, and AI. 
          Zero formulas, zero code. Written for curious minds.
        </p>
        <p class="text-zinc-500 text-sm">
          📚 ${bookCount} books in progress • 
          <a href="https://blog.apiad.net/subscribe" class="text-violet-400 hover:text-violet-300 transition-colors">Subscribe for updates →</a>
        </p>
      </header>

      ${compendiumHtml}
      
      <!-- How it works -->
      <div class="flex justify-center gap-8 mb-16 text-center flex-wrap">
        <div class="max-w-[180px]">
          <div class="text-3xl mb-2">📖</div>
          <p class="text-zinc-400 text-sm">Read free online<br/>or buy PDF/EPUB</p>
        </div>
        <div class="max-w-[180px]">
          <div class="text-3xl mb-2">🔄</div>
          <p class="text-zinc-400 text-sm">Buy once, get<br/>all future updates</p>
        </div>
        <div class="max-w-[180px]">
          <div class="text-3xl mb-2">🎁</div>
          <p class="text-zinc-400 text-sm">Get Compendium for<br/>all future books</p>
        </div>
      </div>

      <main>
        ${categoriesHtml}
      </main>

      <footer class="mt-20 pt-8 border-t border-zinc-800 text-center text-zinc-500 text-sm">
        <p>© 2025 <a href="https://books.apiad.net" class="hover:text-zinc-300 transition-colors">The Computist Bookshelf</a> - All rights reserved.</p>
        <p class="mt-2">
          <a href="https://blog.apiad.net" class="hover:text-zinc-300 transition-colors">Blog</a> ·
          <a href="https://store.apiad.net" class="hover:text-zinc-300 transition-colors">Store</a> ·
          <a href="https://github.com/apiad" class="hover:text-zinc-300 transition-colors">Github</a>
        </p>
      </footer>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  // Render the page
  document.getElementById('catalog-root').innerHTML = renderLayout();
  console.log('Page rendered');

  // Attach click handlers to Gumroad buttons (already inside cards)
  document.querySelectorAll('.gumroad-buy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const url = btn.dataset.gumroadUrl + '?wanted=true';
      openGumroadModal(url);
    });
  });

  // Attach click handler to book cards (but not on buttons)
  document.querySelectorAll('.book-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't open modal if clicking on a button or link
      if (e.target.closest('a') || e.target.closest('button')) return;
      const bookId = card.dataset.bookId;
      openBookModal(bookId);
    });
  });
});