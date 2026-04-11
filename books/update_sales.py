#!/usr/bin/env python3
import subprocess
import re
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(os.path.dirname(SCRIPT_DIR), 'data.js')

def fetch_sales_count(permalink):
    url = f'https://apiad.gumroad.com/l/{permalink}'
    result = subprocess.run(['curl', '-s', url], capture_output=True, text=True)
    html = result.stdout
    match = re.search(r'sales_count&quot;:(\d+)', html)
    return int(match.group(1)) if match else 0

# Read file
with open(DATA_FILE, 'r') as f:
    lines = f.readlines()

print('Updating sales counts...')

# Go through lines, find gumroadUrl, then update salesCount on next line
i = 0
while i < len(lines):
    line = lines[i]
    if 'gumroadUrl' in line:
        # Extract permalink from URL
        match = re.search(r'/l/(\w+)', line)
        if match:
            permalink = match.group(1)
            count = fetch_sales_count(permalink)
            
            # Look for salesCount on next lines
            j = i + 1
            while j < len(lines) and 'salesCount' not in lines[j]:
                j += 1
            
            if j < len(lines):
                # Replace the number after salesCount:
                lines[j] = re.sub(r'(salesCount: )\d+', r'\g<1>' + str(count), lines[j])
                print(f"  {permalink}: {count}")
    i += 1

# Write back
with open(DATA_FILE, 'w') as f:
    f.writelines(lines)

print('Done!')