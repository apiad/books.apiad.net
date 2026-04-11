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

function renderButton(url, text, variant = 'primary', icon = '', fullWidth = false, hint = '') {
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

  const button = `<a href="${url}" ${attrs} style="${display} ${padding} ${fontSize} ${borderRadius} ${colors} text-align: center; font-weight: 600; cursor: pointer; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='scale(1.02)';this.style.boxShadow='0 8px 20px rgba(0,0,0,0.3)';" onmouseout="this.style.transform='scale(1)';this.style.boxShadow='none';">${icon} ${text}</a>`;

  if (hint) {
    return `<div class="relative group">
      ${button}
      <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-orange-500/90 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        💡 ${hint}
        <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-orange-500/90"></div>
      </div>
    </div>`;
  }

  return button;
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
    : `<div class="mt-auto pt-4 space-y-3">${renderButton(book.gumroadUrl, 'Buy - $' + (book.price / 100).toFixed(2), 'primary', '💳', true, book.hint || '')}${renderButton(book.readUrl, 'Read Online', 'secondary', '📖', true)}</div>`;

  const compendiumCardCta = isPlanned
    ? ''
    : `<div class="mt-3 pt-3 border-t border-zinc-800">
        <button onclick="openBookModal('compendium')" class="w-full py-2 text-xs text-violet-400 hover:text-violet-300 transition-colors">
          📦 Get Compendium - all books + private Discord →
        </button>
      </div>`;

  const cardHeight = isPlanned ? '' : 'min-h-[520px]';

  return `
    <div class="bg-card rounded-2xl border border-zinc-800 overflow-visible hover:border-orange-500/50 hover:bg-card-hover transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/20 shadow-lg shadow-black/20 flex flex-col ${cardHeight} cursor-pointer book-card" data-book-id="${book.id}">
      ${coverHtml}
      <div class="p-5 flex flex-col flex-grow">
        <div class="flex flex-wrap gap-2 mb-2">
          ${renderBadge(book.audience, '', false, audienceTooltips[book.audience] || '')}
          ${renderBadge(book.status, book.statusEmoji, isPlanned, statusTooltips[book.statusEmoji + ' ' + book.status] || '')}
        </div>
        <h3 class="text-lg font-semibold text-zinc-100 font-serif">${book.title}</h3>
        ${book.salesCount > 0 
          ? `<p class="text-zinc-500 text-xs mt-1">👤 ${book.salesCount} buyers</p>`
          : ''
        }
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
  const bannerHtml = category.banner ? `
    <div class="rounded-lg p-4 bg-gradient-to-r ${category.banner.bgGradient} border ${category.banner.borderColor} mb-6">
      <p class="text-orange-300 text-center font-medium">${category.banner.text}</p>
    </div>
  ` : '';
  return `
    <section class="mb-16">
      <h2 class="text-3xl font-bold font-serif mb-3 text-zinc-100">${category.name}</h2>
      <p class="text-zinc-400 mb-8 max-w-2xl">${category.description}</p>
      ${bannerHtml}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        ${cardsHtml}
      </div>
    </section>
  `;
}

function renderCompendium(compendium) {
  const earlyAccess = window.catalogData.categories.find(c => c.id === 'early-access');
  const backburner = window.catalogData.categories.find(c => c.id === 'backburner');
  const totalPrice = earlyAccess.items.reduce((sum, book) => sum + (book.price || 0), 0);
  const bookCount = earlyAccess.items.length;
  const futureCount = backburner ? backburner.items.length : 0;
  const savingsCents = totalPrice - compendium.price;
  const savingsPercent = totalPrice > 0 ? Math.round((savingsCents / totalPrice) * 100) : 0;

  return `
    <section class="mb-16">
      <div class="relative rounded-2xl p-6 md:p-8 bg-gradient-to-r from-violet-500/10 via-card to-orange-500/10 border border-zinc-800 overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-violet-500/20" onclick="openBookModal('compendium')">
        <div class="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-orange-500/5"></div>
        <div class="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div class="md:col-span-2">
            <span class="inline-block px-3 py-1 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full text-xs font-semibold text-white mb-4">✨ Best Value</span>
            <h2 class="text-3xl md:text-4xl font-bold font-serif text-zinc-100 mb-3">${compendium.title}</h2>
            <p class="text-zinc-400 mb-4">${compendium.description}</p>
            <div class="bg-zinc-800/50 rounded-lg p-3 max-w-lg">
              <p class="text-zinc-400 text-sm">
                <span class="line-through opacity-60">$${(totalPrice / 100).toFixed(2)}</span>
                <span class="text-zinc-300 ml-2">for ${bookCount} books</span>
                <span class="text-green-400 font-semibold ml-3">Save ${savingsPercent}%</span>
              </p>
              <p class="text-violet-400 text-xs mt-1">
                💬 Plus access to private Discord community for discussions and Q&A
              </p>
            </div>
          </div>
          <div class="flex flex-col justify-center items-start md:items-end">
            <span class="text-5xl font-bold text-orange-400 mb-2">${formatPrice(compendium.price)}</span>
            ${compendium.salesCount > 0 
              ? `<p class="text-zinc-500 text-sm mb-4">👤 ${compendium.salesCount}+ total buyers</p>`
              : ''
            }
            <a href="#" data-gumroad-url="${compendium.gumroadUrl}" class="gumroad-buy-btn bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-10 py-5 rounded-xl font-semibold text-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-violet-500/25 w-full md:w-auto text-center" onclick="event.stopPropagation();">🎁 Buy Bundle</a>
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

  // Calculate total sales (all books + compendium)
  const bookSales = window.catalogData.categories.reduce((sum, cat) => 
    sum + cat.items.reduce((s, book) => s + (book.salesCount || 0), 0), 0
  );
  const totalSales = bookSales + (window.catalogData.compendium.salesCount || 0);

  // Get random book for reader link
  const allBooksWithReadUrl = window.catalogData.categories
    .flatMap(c => c.items)
    .filter(b => b.readUrl);
  const randomBook = allBooksWithReadUrl[Math.floor(Math.random() * allBooksWithReadUrl.length)];
  const readerLink = randomBook ? randomBook.readUrl : '#';

  const readerBannerHtml = `
    <div class="rounded-2xl p-6 md:p-8 bg-gradient-to-r from-emerald-500/10 via-card to-cyan-500/10 border border-emerald-500/30 mb-12 hover:border-emerald-500/50 transition-all duration-300">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div class="md:col-span-2 text-center md:text-left">
          <h2 class="text-2xl md:text-3xl font-bold text-zinc-100 mb-3">
            📖 All books are free to read online
          </h2>
          <p class="text-zinc-400 max-w-xl mb-4">
            I built a custom web reader that feels like a native experience — 100% free. You can buy the EPUB/PDF later if you want to support the author.
          </p>
          <div class="flex flex-wrap justify-center md:justify-start gap-2">
            <span class="px-3 py-1.5 bg-zinc-800/60 text-zinc-400 text-xs rounded-full flex items-center gap-1.5 hover:bg-zinc-700/60 hover:text-zinc-300 transition-colors cursor-default">
              🔖 Remembers your place
            </span>
            <span class="px-3 py-1.5 bg-zinc-800/60 text-zinc-400 text-xs rounded-full flex items-center gap-1.5 hover:bg-zinc-700/60 hover:text-zinc-300 transition-colors cursor-default">
              🌙 Light & dark mode
            </span>
            <span class="px-3 py-1.5 bg-zinc-800/60 text-zinc-400 text-xs rounded-full flex items-center gap-1.5 hover:bg-zinc-700/60 hover:text-zinc-300 transition-colors cursor-default">
              📊 Reading progress
            </span>
            <span class="px-3 py-1.5 bg-zinc-800/60 text-zinc-400 text-xs rounded-full flex items-center gap-1.5 hover:bg-zinc-700/60 hover:text-zinc-300 transition-colors cursor-default">
              👆 Swipe navigation
            </span>
            <span class="px-3 py-1.5 bg-zinc-800/60 text-zinc-400 text-xs rounded-full flex items-center gap-1.5 hover:bg-zinc-700/60 hover:text-zinc-300 transition-colors cursor-default">
              🔤 Font size controls
            </span>
            <span class="px-3 py-1.5 bg-zinc-800/60 text-zinc-400 text-xs rounded-full flex items-center gap-1.5 hover:bg-zinc-700/60 hover:text-zinc-300 transition-colors cursor-default">
              ⬅️➡️ Chapter arrows
            </span>
          </div>
        </div>
        <div class="flex justify-center md:justify-end">
          <a href="${readerLink}" class="inline-flex items-center gap-3 px-8 py-4 bg-emerald-500/20 text-emerald-400 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/30" style="transition: transform 0.2s, box-shadow 0.2s;">
            Try the reader <span class="text-xl">→</span>
          </a>
        </div>
      </div>
    </div>
  `;

  return `
    <div class="max-w-6xl mx-auto px-4 py-12">
      <header class="text-center mb-16">
        <h1 class="text-4xl md:text-5xl font-bold font-serif text-zinc-100 mb-4">The Computist Library</h1>
        <h2 class="text-2xl md:text-2xl font-bold font-serif text-zinc-100 mb-4">Master Computer Science & Artificial Intelligence</h2>
        <p class="text-zinc-400 text-lg max-w-2xl mx-auto mb-4">
          Deep, conceptual books on computation, algorithms, and AI.
          Zero formulas, zero code. Written for curious minds.
        </p>
        <p class="text-zinc-500 text-sm">
          📚 ${bookCount} books in progress •
          💰 Over ${totalSales}+ total sales on Gumroad •
          <a href="https://blog.apiad.net/subscribe" class="text-violet-400 hover:text-violet-300 transition-colors">Subscribe for updates →</a>
        </p>
      </header>

      ${readerBannerHtml}

      ${compendiumHtml}

      <!-- How it works -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div class="text-center">
          <div class="text-5xl mb-3">📖</div>
          <h3 class="text-zinc-100 font-semibold mb-2">Read Instantly Online</h3>
          <p class="text-zinc-400 text-sm">Read free in your browser, or buy PDF & EPUB. Your forever copy.</p>
        </div>
        <div class="text-center">
          <div class="text-5xl mb-3">🔄</div>
          <h3 class="text-zinc-100 font-semibold mb-2">One Purchase, Forever</h3>
          <p class="text-zinc-400 text-sm">Buy once, get all future updates, forever - no extra cost, ever.</p>
        </div>
        <div class="text-center">
          <div class="text-5xl mb-3">💬</div>
          <h3 class="text-zinc-100 font-semibold mb-2">Private Community</h3>
          <p class="text-zinc-400 text-sm">Join a private Discord of like-minded readers and the author for Q&A.</p>
        </div>
      </div>

      <main>
        ${categoriesHtml}
      </main>

      <footer class="mt-20 pt-8 border-t border-zinc-800 text-center text-zinc-500 text-sm">
        <p>© 2025 <a href="https://books.apiad.net" class="hover:text-zinc-300 transition-colors">The Computist Library</a> - All rights reserved.</p>
        <p class="mt-2">
          <a href="https://blog.apiad.net" class="hover:text-zinc-300 transition-colors">Blog</a> ·
          <a href="https://store.apiad.net" class="hover:text-zinc-300 transition-colors">Store</a> ·
          <a href="https://github.com/apiad" class="hover:text-zinc-300 transition-colors">Github</a>
        </p>
      </footer>
    </div>
  `;
}

async function fetchGumroadSales(permalink) {
  try {
    const url = `https://api.gumroad.com/v2/products/${permalink}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.product ? data.product.sales_count : 0;
  } catch (e) {
    console.error('Failed to fetch sales for', permalink, e);
    return 0;
  }
}

async function loadSalesCounts() {
  const products = [
    { id: 'tsoc', permalink: 'tsoc' },
    { id: 'mhai', permalink: 'mhai' },
    { id: 'chatbots', permalink: 'chatbots' },
    { id: 'graphs', permalink: 'graphs' },
    { id: 'compendium', permalink: 'compendium' }
  ];

  for (const p of products) {
    const count = await fetchGumroadSales(p.permalink);
    if (p.id === 'compendium') {
      window.catalogData.compendium.salesCount = count;
    } else {
      for (const cat of window.catalogData.categories) {
        const book = cat.items.find(b => b.id === p.id);
        if (book) {
          book.salesCount = count;
          break;
        }
      }
    }
  }

  document.getElementById('catalog-root').innerHTML = renderLayout();
  attachEventHandlers();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('catalog-root').innerHTML = renderLayout();
  console.log('Page rendered');

  attachEventHandlers();
});

function attachEventHandlers() {
  document.querySelectorAll('.gumroad-buy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const url = btn.dataset.gumroadUrl + '?wanted=true';
      openGumroadModal(url);
    });
  });

  document.querySelectorAll('.book-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      const bookId = card.dataset.bookId;
      openBookModal(bookId);
    });
  });
}