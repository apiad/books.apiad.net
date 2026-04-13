#!/usr/bin/env python3
from bs4 import BeautifulSoup
from pathlib import Path

SKIP_FILES = {'reader.css', 'reader.js', 'inject.py', 'generate.py', 'data.json'}

def inject():
    books_dir = Path('.')
    html_files = list(books_dir.rglob('*.html'))
    # Skip non-book files and the PWA index page (generated separately)
    html_files = [f for f in html_files if f.name not in SKIP_FILES]
    html_files = [f for f in html_files if f != Path('index.html')]
    print(f"Found {len(html_files)} HTML files")

    for html_file in html_files:
        try:
            content = html_file.read_text(encoding='utf-8')
            soup = BeautifulSoup(content, 'lxml')

            head = soup.find('head')
            if head:
                # reader.css
                if not any(link.get('href') == '/books/reader.css' for link in head.find_all('link')):
                    link = soup.new_tag('link', href='/books/reader.css', rel='stylesheet')
                    head.insert(0, link)

                # Google Fonts (avoids render-blocking @import in CSS)
                fonts_url = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&family=Fira+Code:wght@400;500&display=swap'
                if not any(link.get('href', '').startswith('https://fonts.googleapis.com/css2?family=Inter') for link in head.find_all('link')):
                    preconnect1 = soup.new_tag('link', rel='preconnect', href='https://fonts.googleapis.com')
                    preconnect2 = soup.new_tag('link', rel='preconnect', href='https://fonts.gstatic.com', crossorigin='')
                    font_link = soup.new_tag('link', href=fonts_url, rel='stylesheet')
                    head.append(preconnect1)
                    head.append(preconnect2)
                    head.append(font_link)

                # PWA manifest
                if not any(link.get('href') == '/manifest.json' for link in head.find_all('link')):
                    head.append(soup.new_tag('link', href='/manifest.json', rel='manifest'))

                # Service Worker registration
                if not any(s.get('src') == '/sw-register.js' for s in head.find_all('script')):
                    head.append(soup.new_tag('script', src='/sw-register.js'))

                # theme-color meta tag
                if not any(m.get('name') == 'theme-color' for m in head.find_all('meta')):
                    meta = soup.new_tag('meta', attrs={'name': 'theme-color', 'content': '#0f0f0f'})
                    head.append(meta)

                # apple-mobile-web-app-capable
                if not any(m.get('name') == 'apple-mobile-web-app-capable' for m in head.find_all('meta')):
                    meta = soup.new_tag('meta', attrs={'name': 'apple-mobile-web-app-capable', 'content': 'yes'})
                    head.append(meta)

                # apple-touch-icon
                if not any(link.get('rel') == ['apple-touch-icon'] for link in head.find_all('link')):
                    head.append(soup.new_tag('link', rel='apple-touch-icon', href='/icon-192.png'))

                # favicon
                if not any(link.get('rel') == ['icon'] for link in head.find_all('link')):
                    head.append(soup.new_tag('link', rel='icon', type='image/png', sizes='192x192', href='/icon-192.png'))

                # viewport-fit=cover (update existing viewport meta)
                viewport_meta = head.find('meta', attrs={'name': 'viewport'})
                if viewport_meta:
                    current = viewport_meta.get('content', '')
                    if 'viewport-fit' not in current:
                        viewport_meta['content'] = current + ', viewport-fit=cover'

            body = soup.find('body')
            if body:
                # Remove existing injected scripts
                for div in body.find_all('div', class_='reader-controls'):
                    div.decompose()
                scripts_to_remove = [
                    s for s in body.find_all('script')
                    if s.get('src', '') in ('/books/reader.js', '/data.js')
                ]
                for s in scripts_to_remove:
                    s.decompose()

                # Add data.js + reader.js
                data_script = soup.new_tag('script', src='/data.js')
                reader_script = soup.new_tag('script', src='/books/reader.js')

                footer = body.find('footer')
                if footer:
                    footer.insert_after(data_script, reader_script)
                else:
                    body.append(data_script)
                    body.append(reader_script)

            html_file.write_text(str(soup), encoding='utf-8')
            print(f"Injected: {html_file}")

        except Exception as e:
            print(f"Error: {html_file} - {e}")

    print("Done!")

if __name__ == '__main__':
    inject()
