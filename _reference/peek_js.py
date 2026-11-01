import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('app_ref.js', 'r', encoding='utf-8') as f:
    js = f.read()

import re
matches = [line for line in js.split('\n') if 'sheet' in line.lower()]
for line in matches[:15]:
    print(line)
