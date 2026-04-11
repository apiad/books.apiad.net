#!/usr/bin/env python3
from bs4 import BeautifulSoup
from pathlib import Path

def inject():
    books_dir = Path('.')
    html_files = list(books_dir.rglob('*.html'))
    html_files = [f for f in html_files if f.name not in ['reader.css', 'reader.js', 'inject.py']]
    print(f"Found {len(html_files)} HTML files")

    for html_file in html_files:
        try:
            content = html_file.read_text(encoding='utf-8')
            soup = BeautifulSoup(content, 'lxml')
            
            # Check if reader.css is already in <head>
            head = soup.find('head')
            if head:
                has_css = any(link.get('href') == '/books/reader.css' for link in head.find_all('link'))
                if not has_css:
                    link = soup.new_tag('link', href='/books/reader.css', rel='stylesheet')
                    head.insert(0, link)
            
            body = soup.find('body')
            if body:
                # REMOVE any existing reader-controls and reader.js first
                for div in body.find_all('div', class_='reader-controls'):
                    div.decompose()
                for script in body.find_all('script'):
                    if script.get('src') == '/books/reader.js':
                        script.decompose()
                
                # Create new elements
                controls = soup.new_tag('div', **{'class': 'reader-controls'})
                btn = soup.new_tag('button', **{'class': 'reader-btn', 'id': 'theme-btn', 'title': 'Toggle theme'})
                btn.string = '🌙'
                controls.append(btn)
                
                script = soup.new_tag('script', src='/books/reader.js')
                
                # Insert AFTER footer (or at end of body if no footer)
                footer = body.find('footer')
                if footer:
                    footer.insert_after(controls, script)
                else:
                    body.append(controls)
                    body.append(script)
            
            result = str(soup)
            html_file.write_text(result, encoding='utf-8')
            print(f"Injected: {html_file}")
            
        except Exception as e:
            print(f"Error: {html_file} - {e}")
    
    print("Done!")

if __name__ == '__main__':
    inject()