"""Bump the app version everywhere in one go, then commit + push to publish.

Usage (in this folder):  python release.py
Sets the next version number and today's date in index.html (the app reads it
from there), the ?v= numbers on the scripts, and the offline cache name in sw.js.
"""
import datetime
import pathlib
import re

here = pathlib.Path(__file__).parent
index = here / 'index.html'
sw = here / 'sw.js'

html = index.read_text(encoding='utf8')
old = int(re.search(r'<meta name="app-version" content="(\d+)\|', html).group(1))
new = old + 1
today = datetime.date.today().isoformat()

html = re.sub(r'<meta name="app-version" content="\d+\|[\d-]+">', f'<meta name="app-version" content="{new}|{today}">', html)
html = re.sub(r'\?v=\d+"', f'?v={new}"', html)
index.write_text(html, encoding='utf8', newline='\n')

js = sw.read_text(encoding='utf8')
js = re.sub(r"const VERSION = 'diag-v\d+';", f"const VERSION = 'diag-v{new}';", js)
sw.write_text(js, encoding='utf8', newline='\n')

print(f'v{old} -> v{new} ({today})')
