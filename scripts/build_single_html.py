"""Inline a fresh Vite build without changing the source project.

Run `npm ci && npm run build` in the repository root, then run this script.
"""
import base64
import mimetypes
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
html = (DIST / 'index.html').read_text()

def inline_asset(match):
    asset = DIST / match.group(1).lstrip('/')
    if not asset.is_file():
        raise RuntimeError(f'Missing asset: {asset}')
    mime = mimetypes.guess_type(asset.name)[0] or 'application/octet-stream'
    return 'data:' + mime + ';base64,' + base64.b64encode(asset.read_bytes()).decode()

def inline_script(match):
    js = (DIST / match.group(1).lstrip('/')).read_text()
    js = re.sub(r'(/assets/[^\s"\x27`<>]+)', inline_asset, js)
    js = re.sub(r'</script', r'<\\/script', js, flags=re.I)
    return '<script type="module">' + js + '</script>'

def inline_style(match):
    css = (DIST / match.group(1).lstrip('/')).read_text()
    css = re.sub(r'(/assets/[^\s"\x27`<>\)]+)', inline_asset, css)
    return '<style>' + css + '</style>'

html = re.sub(r'<script\b[^>]*\bsrc="([^"]+)"[^>]*></script>', inline_script, html)
html = re.sub(r'<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>', inline_style, html)
if re.search(r'<(?:script|link)\b[^>]*(?:src|href)=', html) or '/assets/' in html:
    raise RuntimeError('External build assets remain')
output = ROOT / 'offline' / 'ampere-force-student-explorer-yanan-v2.html'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(html)
print(f'{output}\n{output.stat().st_size:,} bytes')
