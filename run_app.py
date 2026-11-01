#!/usr/bin/env python3
"""
Launcher script for Khmer Textbook Stock & Borrowing Management System
ប្រព័ន្ធគ្រប់គ្រងសៀវភៅសិក្សាគោល និងរបាយការណ៍
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and disable caching for smooth local development
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    server_address = ("", PORT)
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(server_address, Handler) as httpd:
            url = f"http://localhost:{PORT}"
            print("=" * 65)
            print("  ប្រព័ន្ធគ្រប់គ្រងសៀវភៅសិក្សាគោល (Textbook Management System)")
            print(f"  ដំណើរការលើ៖ {url}")
            print("  ចុច Ctrl+C ដើម្បីបិទប្រព័ន្ធ")
            print("=" * 65)
            
            webbrowser.open(url)
            httpd.serve_forever()
    except OSError as e:
        print(f"Port {PORT} is currently busy, trying port {PORT+1}...")
        with socketserver.TCPServer(("", PORT+1), Handler) as httpd:
            url = f"http://localhost:{PORT+1}"
            print(f"  ដំណើរការលើ៖ {url}")
            webbrowser.open(url)
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nបានបិទប្រព័ន្ធដោយជោគជ័យ។")
        sys.exit(0)

if __name__ == '__main__':
    main()

