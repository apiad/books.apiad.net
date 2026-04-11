#!/usr/bin/env python3
import os
import re

def get_reader_css_path(html_file):
    """Get relative path to reader.css based on HTML file location"""
    depth = html_file.count('/')
    if depth <= 1:
        return 'reader.css'
    return '../' * (depth - 1) + 'reader.css'

controls_html_template = ''' <!-- Reader Controls -->
  <div class="reader-controls">
    <button class="reader-btn" id="theme-btn" title="Toggle theme">🌙</button>
  </div>
  
  <script>
    (function() {
      // Theme management
      const themeBtn = document.getElementById("theme-btn");
      const savedTheme = localStorage.getItem("reader-theme") || "light";
      document.documentElement.setAttribute("data-theme", savedTheme);
      themeBtn.textContent = savedTheme === "dark" ? "☀️" : "🌙";

      themeBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("reader-theme", next);
        themeBtn.textContent = next === "dark" ? "☀️" : "🌙";
      });

      // T for theme toggle
      document.addEventListener("keydown", function(e) {
        if (e.key === "t" || e.key === "T") {
          themeBtn.click();
        }
      });
      
      console.log("Reader controls initialized");
    })();
  </script>
'''

# Find all HTML files
html_files = []
for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.html'):
            html_files.append(os.path.join(root, file))

print(f"Found {len(html_files)} HTML files")

for html_file in html_files:
    print(f"Processing: {html_file}")
    
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Get correct relative path
    css_path = get_reader_css_path(html_file)
    css_link = f'<link href="{css_path}" rel="stylesheet">'
    
    # Remove existing reader controls to re-add cleanly
    content = re.sub(r'<!-- Reader Controls -->.*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)
    content = re.sub(r'<!-- Floating Controls -->.*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)
    content = re.sub(r'<div class="sidebar-overlay"[^>]*></div>\s*', '', content)
    content = re.sub(r'<div class="reader-controls">.*?</div>\s*<!-- Reader Controls -->', '<!-- Reader Controls -->', content, flags=re.DOTALL)
    
    # Add CSS link after bootstrap link (both patterns)
    content = re.sub(
        r'<link href="site_libs/bootstrap/bootstrap\.min\.css" rel="stylesheet" id="quarto-bootstrap" data-mode="light">',
        r'\g<0>\n  ' + css_link,
        content
    )
    content = re.sub(
        r'<link href="../site_libs/bootstrap/bootstrap\.min\.css" rel="stylesheet" id="quarto-bootstrap" data-mode="light">',
        r'\g<0>\n  ' + css_link,
        content
    )
    
    # Add controls before </body>
    content = content.replace('</body>', controls_html_template + '\n</body>')
    
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  - Done (css path: {css_path})")

print("\nAll files processed!")