// App initialization
console.log('app.js loaded');

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

function renderBadge(text, emoji, isPlanned = false) {
  const bgColor = isPlanned ? 'bg-zinc-800' : 'bg-zinc-700/50';
  return `<span class="inline-flex items-center gap-1 px-2 py-1 ${bgColor} rounded-lg text-xs text-zinc-300">${emoji} ${text}</span>`;
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
  const coverHtml = book.coverUrl
    ? `<img src="${book.coverUrl}" alt="${book.title}" class="w-full h-40 object-cover rounded-t-xl">`
    : `<div class="w-full h-40 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-t-xl flex items-center justify-center text-4xl">${book.statusEmoji}</div>`;

  const contentHtml = isPlanned
    ? `<p class="text-zinc-400 text-sm mt-2 custom-clamp">${book.description}</p>`
    : `<p class="text-zinc-400 text-sm mt-2 custom-clamp">${book.description}</p>`;

  const progressHtml = isPlanned
    ? `<div class="text-xs text-zinc-500">Status: Planned</div>`
    : `
      <div class="flex-none">
        ${renderProgressBar(book.progress)}
        <div class="text-xs text-zinc-500 mt-1">${book.pages} of ~${book.targetPages} pages</div>
      </div>
    `;

  const buttonsHtml = isPlanned
    ? `<div class="mt-auto pt-4">
         <p class="text-zinc-500 text-xs text-center mb-3">
           Get the Compendium and you'll automatically have all future books, this included.
         </p>
         <button onclick="openBookModal('compendium')" style="display: block; width: 100%; padding: 12px 16px; font-size: 14px; background-color: transparent; color: #a78bfa; border: 2px solid #a78bfa; border-radius: 10px; text-align: center; font-weight: 500; cursor: pointer;">📦 Get the Compendium</button>
       </div>`
    : `<div class="mt-auto pt-4 space-y-3">${renderButton(book.gumroadUrl, 'Buy', 'primary', '💳', true)}${renderButton(book.readUrl, 'Read Online', 'secondary', '📖', true)}</div>`;

  return `
    <div class="bg-card rounded-2xl border border-zinc-800 overflow-hidden hover:border-orange-500/30 hover:bg-card-hover transition-all duration-200 shadow-lg shadow-black/20 flex flex-col min-h-[520px] cursor-pointer book-card" data-book-id="${book.id}">
      ${coverHtml}
      <div class="p-5 flex flex-col flex-grow">
        <div class="flex flex-wrap gap-2 mb-2">
          ${renderBadge(book.audience, '')}
          ${renderBadge(book.status, book.statusEmoji, isPlanned)}
        </div>
        <h3 class="text-lg font-semibold text-zinc-100 font-serif">${book.title}</h3>
        ${contentHtml}
        <div class="flex-grow"></div>
        ${progressHtml}
        ${buttonsHtml}
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
  return `
    <section class="mb-16">
      <div class="relative rounded-2xl p-8 bg-gradient-to-r from-violet-500/10 via-card to-orange-500/10 border border-zinc-800 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-orange-500/5"></div>
        <div class="relative">
          <span class="inline-block px-3 py-1 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full text-xs font-semibold text-white mb-4">✨ Best Value</span>
          <h2 class="text-3xl md:text-4xl font-bold font-serif text-zinc-100 mb-3">${compendium.title}</h2>
          <p class="text-zinc-400 mb-6 max-w-xl">${compendium.description}</p>
          <div class="flex flex-wrap items-center gap-4">
            <span class="text-2xl font-bold text-orange-400">${formatPrice(compendium.price)}</span>
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

  return `
    <div class="max-w-6xl mx-auto px-4 py-12">
      <header class="text-center mb-16">
        <h1 class="text-4xl md:text-5xl font-bold font-serif text-zinc-100 mb-3">The Computist Library</h1>
        <p class="text-zinc-400 text-lg">Books on Computer Science topics for the curious mind</p>
      </header>

      ${compendiumHtml}

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