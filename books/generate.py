#!/usr/bin/env python3
"""Generate static files from data.json:
  - data.js (for landing page app.js and reader.js)
  - books/index.html (PWA book list, pre-rendered)
  - robots.txt
  - sitemap.xml
"""
import html
import hashlib
import json
import time
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
ROOT_DIR = SCRIPT_DIR.parent
SITE_URL = 'https://books.apiad.net'


def load_data():
    return json.loads((SCRIPT_DIR / 'data.json').read_text(encoding='utf-8'))


def esc(text):
    """HTML-escape text"""
    return html.escape(str(text)) if text else ''


def version_hash():
    """Generate cache-busting hash from data.json + current time"""
    data_bytes = (SCRIPT_DIR / 'data.json').read_bytes()
    return hashlib.md5(data_bytes).hexdigest()[:8]


# ──────────────────────────────────────────────
# 1. Generate data.js
# ──────────────────────────────────────────────
def generate_data_js(data):
    reader_config = json.dumps(data.get('readerConfig', {}), indent=2)
    catalog_data = json.dumps({
        'compendium': data['compendium'],
        'categories': data['categories'],
    }, indent=2, ensure_ascii=False)

    js = f"""window.readerConfig = {reader_config};

// Developer console message
console.log('%c👋 Hey there, developer!', 'font-size: 18px; font-weight: bold; color: #f97316;');
console.log('%cLooks like you\\'re peeking behind the curtains — I respect that.', 'color: #a1a1aa;');
console.log('%cIf you enjoy deep dives into CS, AI, and software engineering,', 'color: #71717a;');
console.log('%cI send out free weekly articles on my blog: 📧 https://blog.apiad.net/subscribe', 'color: #8b5cf6; font-weight: bold;');
console.log('%cHappy reading! 🚀', 'color: #71717a;');

window.catalogData = {catalog_data};
"""
    path = ROOT_DIR / 'data.js'
    path.write_text(js, encoding='utf-8')
    print(f'Generated: {path}')


# ──────────────────────────────────────────────
# 2. Generate books/index.html (PWA book list)
# ──────────────────────────────────────────────
def generate_pwa_index(data):
    books_html = ''
    for category in data.get('categories', []):
        for book in category.get('items', []):
            if not book.get('readUrl'):
                continue
            title = esc(book['title'])
            desc = esc(book['description'])
            cover_url = esc(book.get('coverUrl', ''))
            read_url = esc(book['readUrl'])
            progress = book.get('progress', 0)
            status_emoji = esc(book.get('statusEmoji', ''))
            status = esc(book.get('status', ''))

            cover_html = (
                f'<img src="{cover_url}" alt="{title}" class="book-cover" loading="lazy">'
                if cover_url else
                '<div class="book-cover" style="background:linear-gradient(135deg,#f97316,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:24px">📚</div>'
            )

            books_html += f'''    <a href="{read_url}/index.html" class="book-card">
      {cover_html}
      <div class="book-info">
        <div class="book-title">{title}</div>
        <div class="book-description">{desc}</div>
        <span class="book-status">{status_emoji} {status} · {progress}%</span>
        <div class="progress-bar"><div class="progress-fill" style="width:{progress}%"></div></div>
        <span class="read-btn">Read</span>
      </div>
    </a>
'''

    page = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>The Computist Library — Free Online Books</title>
  <meta name="description" content="Read free books on computer science, AI, and software engineering. Custom web reader with offline support, dark mode, progress tracking, and more.">
  <link rel="canonical" href="{SITE_URL}/books/">
  <meta property="og:title" content="The Computist Library — Free Online Books">
  <meta property="og:description" content="Read free books on computer science, AI, and software engineering online.">
  <meta property="og:url" content="{SITE_URL}/books/">
  <meta property="og:type" content="website">
  <meta property="og:image" content="{SITE_URL}/icon-512.png">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="The Computist Library">
  <meta name="twitter:description" content="Free online books on CS, AI, and software engineering.">
  <meta name="twitter:creator" content="@alepiad">
  <meta name="theme-color" content="#0f0f0f">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="apple-touch-icon" href="/icon-192.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
  <link rel="manifest" href="/manifest.json">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet">
  <script src="/sw-register.js"></script>
  <style>
    *{{margin:0;padding:0;box-sizing:border-box}}
    body{{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;background:#0f0f0f;color:#fafafa;min-height:100vh;padding:max(24px,env(safe-area-inset-top)) 16px max(24px,env(safe-area-inset-bottom))}}
    .header{{text-align:center;margin-bottom:32px}}
    .header h1{{font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;margin-bottom:8px;background:linear-gradient(to right,#f97316,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}}
    .header p{{color:#71717a;font-size:14px}}
    .books{{display:flex;flex-direction:column;gap:16px;max-width:400px;margin:0 auto}}
    .book-card{{display:flex;gap:16px;background:#1a1a1a;border:1px solid #27272a;border-radius:12px;padding:16px;text-decoration:none;color:inherit;transition:transform .2s,border-color .2s}}
    .book-card:hover{{transform:scale(1.02);border-color:#3f3f46}}
    .book-card:active{{transform:scale(.98)}}
    .book-cover{{width:60px;height:80px;border-radius:6px;object-fit:cover;flex-shrink:0}}
    .book-info{{flex:1;display:flex;flex-direction:column;justify-content:center}}
    .book-title{{font-family:'Playfair Display',Georgia,serif;font-size:16px;font-weight:600;margin-bottom:4px}}
    .book-description{{font-size:13px;color:#a1a1aa;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}}
    .book-status{{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#71717a;margin-top:8px}}
    .progress-bar{{height:3px;background:#27272a;border-radius:2px;margin-top:8px;overflow:hidden}}
    .progress-fill{{height:100%;background:linear-gradient(to right,#f97316,#8b5cf6);border-radius:2px}}
    .read-btn{{display:inline-block;margin-top:8px;padding:6px 12px;background:#8b5cf6;color:#fff;font-size:12px;font-weight:500;border-radius:6px;text-align:center}}
    .footer{{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #27272a;color:#52525b;font-size:12px}}
    .footer a{{color:#8b5cf6;text-decoration:none}}
  </style>
</head>
<body>
  <div class="header">
    <h1>The Computist Library</h1>
    <p>Read online for free</p>
  </div>
  <div class="books">
{books_html}  </div>
  <div class="footer">
    <p>© {datetime.now().year} <a href="https://apiad.net">Alejandro Piad</a></p>
    <p style="margin-top:8px">100% free to read online</p>
  </div>
</body>
</html>'''

    path = SCRIPT_DIR / 'index.html'
    path.write_text(page, encoding='utf-8')
    print(f'Generated: {path}')


# ──────────────────────────────────────────────
# 3. Generate robots.txt
# ──────────────────────────────────────────────
def generate_robots_txt():
    content = f"""User-agent: *
Allow: /

Sitemap: {SITE_URL}/sitemap.xml
"""
    path = ROOT_DIR / 'robots.txt'
    path.write_text(content, encoding='utf-8')
    print(f'Generated: {path}')


# ──────────────────────────────────────────────
# 4. Generate sitemap.xml
# ──────────────────────────────────────────────
def generate_sitemap(data):
    today = datetime.now().strftime('%Y-%m-%d')

    urls = [
        (f'{SITE_URL}/', '1.0', 'weekly'),
        (f'{SITE_URL}/books/', '0.9', 'weekly'),
    ]

    # Add book index pages
    for category in data.get('categories', []):
        for book in category.get('items', []):
            if book.get('readUrl'):
                urls.append((f'{SITE_URL}{book["readUrl"]}/index.html', '0.8', 'weekly'))

    # Add individual chapter pages from filesystem
    for book_dir in SCRIPT_DIR.iterdir():
        if book_dir.is_dir() and not book_dir.name.startswith('.'):
            for html_file in sorted(book_dir.rglob('*.html')):
                rel = html_file.relative_to(SCRIPT_DIR)
                urls.append((f'{SITE_URL}/books/{rel}', '0.7', 'monthly'))

    # Deduplicate
    seen = set()
    unique_urls = []
    for url_tuple in urls:
        if url_tuple[0] not in seen:
            seen.add(url_tuple[0])
            unique_urls.append(url_tuple)

    xml_entries = ''
    for url, priority, changefreq in unique_urls:
        xml_entries += f'''  <url>
    <loc>{esc(url)}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>
'''

    sitemap = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{xml_entries}</urlset>
'''
    path = ROOT_DIR / 'sitemap.xml'
    path.write_text(sitemap, encoding='utf-8')
    print(f'Generated: {path}')


# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────
def main():
    data = load_data()
    generate_data_js(data)
    generate_pwa_index(data)
    generate_robots_txt()
    generate_sitemap(data)


if __name__ == '__main__':
    main()
