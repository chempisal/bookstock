import re
import json

with open('index_ref.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open('app_ref.js', 'r', encoding='utf-8') as f:
    js = f.read()

print("=== HTML NAVIGATION / VIEWS ===")
views = re.findall(r'id=["\'](view-[^"\']+)["\']', html)
print("Views found:", views)

navs = re.findall(r'data-view=["\']([^"\']+)["\']', html)
print("Nav targets:", list(set(navs)))

modals = re.findall(r'id=["\']([^"\']*modal[^"\']*)["\']', html, re.I)
print("Modals found:", set(modals))

print("\n=== JS OVERVIEW ===")
# Find function declarations or state objects
functions = re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\(', js)
print("Total functions in JS:", len(functions))
print("Sample functions:", functions[:30])

classes = re.findall(r'class\s+([a-zA-Z0-9_]+)', js)
print("Classes:", classes)

# Find localStorage keys or sample data
storage_keys = re.findall(r'localStorage\.getItem\(["\']([^"\']+)["\']\)', js)
print("LocalStorage keys:", set(storage_keys))

# Find report generation functions or references
reports = [f for f in functions if 'report' in f.lower() or 'print' in f.lower() or 'export' in f.lower()]
print("Report/Print/Export functions:", reports)
