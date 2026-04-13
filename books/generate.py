#!/usr/bin/env python3
"""Generate static files from data.json:
  - data.js (for landing page app.js and reader.js)
  - books/index.html (PWA book list)
"""
import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)


def load_data():
    json_path = os.path.join(SCRIPT_DIR, 'data.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def generate_data_js(data):
    """Generate data.js from data.json for use by app.js and reader.js"""
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
    output_path = os.path.join(ROOT_DIR, 'data.js')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js)
    print(f'Generated: {output_path}')


def generate_pwa_index(data):
    """Generate books/index.html (PWA book list) from data.json"""
    books_html = ''
    for category in data.get('categories', []):
        for book in category.get('items', []):
            if not book.get('readUrl'):
                continue

            cover_html = ''
            if book.get('coverUrl'):
                cover_html = f'<img src="{book["coverUrl"]}" alt="{book["title"]}" class="book-cover">'
            else:
                cover_html = '<div class="book-cover" style="background: linear-gradient(135deg, #f97316, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 24px;">📚</div>'

            link = book['readUrl'] + '/index.html'
            progress = book.get('progress', 0)
            status = f'{book.get("statusEmoji", "")} {book.get("status", "")} · {progress}%'

            books_html += f'''    <a href="{link}" class="book-card">
      {cover_html}
      <div class="book-info">
        <div class="book-title">{book["title"]}</div>
        <div class="book-description">{book["description"]}</div>
        <span class="book-status">{status}</span>
        <div class="progress-bar"><div class="progress-fill" style="width: {progress}%"></div></div>
        <span class="read-btn">Read</span>
      </div>
    </a>
'''

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Computist Library</title>
  <link rel="manifest" href="/manifest.json">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet">
  <script src="/sw-register.js"></script>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #0f0f0f;
      color: #fafafa;
      min-height: 100vh;
      padding: 24px 16px;
    }}
    .header {{ text-align: center; margin-bottom: 32px; }}
    .header h1 {{
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      background: linear-gradient(to right, #f97316, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }}
    .header p {{ color: #71717a; font-size: 14px; }}
    .books {{ display: flex; flex-direction: column; gap: 16px; max-width: 400px; margin: 0 auto; }}
    .book-card {{
      display: flex;
      gap: 16px;
      background: #1a1a1a;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 16px;
      text-decoration: none;
      color: inherit;
      transition: transform 0.2s, border-color 0.2s;
    }}
    .book-card:hover {{ transform: scale(1.02); border-color: #3f3f46; }}
    .book-card:active {{ transform: scale(0.98); }}
    .book-cover {{
      width: 60px;
      height: 80px;
      border-radius: 6px;
      object-fit: cover;
      flex-shrink: 0;
    }}
    .book-info {{ flex: 1; display: flex; flex-direction: column; justify-content: center; }}
    .book-title {{
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }}
    .book-description {{
      font-size: 13px;
      color: #a1a1aa;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }}
    .book-status {{
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #71717a;
      margin-top: 8px;
    }}
    .progress-bar {{
      height: 3px;
      background: #27272a;
      border-radius: 2px;
      margin-top: 8px;
      overflow: hidden;
    }}
    .progress-fill {{
      height: 100%;
      background: linear-gradient(to right, #f97316, #8b5cf6);
      border-radius: 2px;
    }}
    .read-btn {{
      display: inline-block;
      margin-top: 8px;
      padding: 6px 12px;
      background: #8b5cf6;
      color: white;
      font-size: 12px;
      font-weight: 500;
      border-radius: 6px;
      text-align: center;
    }}
    .footer {{
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #27272a;
      color: #52525b;
      font-size: 12px;
    }}
    .footer a {{ color: #8b5cf6; text-decoration: none; }}
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
    <p>Built with ❤️ by <a href="https://apiad.net">Alejandro Piad</a></p>
    <p style="margin-top: 8px;">100% free to read online</p>
  </div>
</body>
</html>'''

    output_path = os.path.join(SCRIPT_DIR, 'index.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'Generated: {output_path}')


def main():
    data = load_data()
    generate_data_js(data)
    generate_pwa_index(data)


if __name__ == '__main__':
    main()
