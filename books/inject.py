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
                
                # Add PWA manifest
                has_manifest = any(link.get('href') == '/manifest.json' for link in head.find_all('link'))
                if not has_manifest:
                    manifest_link = soup.new_tag('link', href='/manifest.json', rel='manifest')
                    head.append(manifest_link)
                
                # Add Service Worker registration
                has_sw = any(script.get('src') == '/sw-register.js' for script in head.find_all('script'))
                if not has_sw:
                    sw_script = soup.new_tag('script', src='/sw-register.js')
                    head.append(sw_script)
            
            body = soup.find('body')
            if body:
                # REMOVE any existing reader-controls, reader.js, and duplicate data.js first
                for div in body.find_all('div', class_='reader-controls'):
                    div.decompose()
                
                # Remove all scripts we added previously (reader.js and data.js)
                scripts_to_remove = []
                for script in body.find_all('script'):
                    src = script.get('src', '')
                    if src == '/books/reader.js' or src == '/data.js':
                        scripts_to_remove.append(script)
                for script in scripts_to_remove:
                    script.decompose()
                
                # Add data.js first (so window.catalogData is available)
                data_script = soup.new_tag('script', src='/data.js')
                
                # Add reader.js (drawer is created by reader.js)
                reader_script = soup.new_tag('script', src='/books/reader.js')
                
                # Insert AFTER footer (or at end of body if no footer)
                footer = body.find('footer')
                if footer:
                    footer.insert_after(data_script, reader_script)
                else:
                    body.append(data_script)
                    body.append(reader_script)
            
            result = str(soup)
            html_file.write_text(result, encoding='utf-8')
            print(f"Injected: {html_file}")
            
        except Exception as e:
            print(f"Error: {html_file} - {e}")
    
    print("Done!")

if __name__ == '__main__':
    inject()