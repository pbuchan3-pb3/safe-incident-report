"""
extract_logic.py
Extracts testable pure-logic functions from safe_incident_form_24.html
and writes them to app_logic.js for use by the regression suite.

Run from the project root:
    python3 tests/extract_logic.py

Or from inside the tests folder:
    python3 extract_logic.py

Re-run this any time safe_incident_form_24.html changes.
"""

import re
import os

# Resolve paths relative to this script's location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
APP_FILE = os.path.join(SCRIPT_DIR, '..', 'Index.html')
OUTPUT_FILE = os.path.join(SCRIPT_DIR, 'app_logic.js')

# Fallback: look for the development filename if Index.html isn't found
if not os.path.exists(APP_FILE):
    APP_FILE = os.path.join(SCRIPT_DIR, '..', 'safe_incident_form_24.html')

if not os.path.exists(APP_FILE):
    raise FileNotFoundError(
        f'Could not find the app file. Expected Index.html or '
        f'safe_incident_form_24.html in the project root ({os.path.dirname(SCRIPT_DIR)})'
    )

print(f'Reading from: {os.path.abspath(APP_FILE)}')

with open(APP_FILE, encoding='utf-8') as f:
    content = f.read()

blocks = {}

# 1. escapeHtml — XSS prevention utility
s = content.find('// ── SECURITY: HTML escaping')
e = content.find('\nfunction addBubble', s)
if s != -1 and e != -1:
    blocks['escapeHtml'] = content[s:e].strip()
else:
    print('WARNING: escapeHtml block not found')

# 2. People data model — ROLE_CATEGORIES, newPerson, migration, filter functions
s = content.find('const ROLE_CATEGORIES = [')
e = content.find('function getWitnessPeople(){')
if e != -1:
    e = content.find('\n}', e) + 2
if s != -1 and e != -1:
    blocks['roleModel'] = content[s:e].strip()
else:
    print('WARNING: roleModel block not found')

# 2b. toProperCase — needed by migration and name parser
s = content.find('function toProperCase(s){')
e = content.find('\n}', s) + 2
if s != -1 and e != -1:
    blocks['toProperCase'] = content[s:e].strip()
else:
    print('WARNING: toProperCase block not found')

# 3. Name parser
s = content.find('// ── INTELLIGENT NAME PARSER')
e = content.find('\nasync function collectPersonName', s)
if s != -1 and e != -1:
    blocks['nameParser'] = content[s:e].strip()
else:
    print('WARNING: nameParser block not found')
s = content.find('function correctKnownNames(raw){')
e = content.find('\nasync function collectPerson', s)
if s != -1 and e != -1:
    blocks['nameCorrection'] = content[s:e].strip()
else:
    print('WARNING: correctKnownNames block not found')

# 4. generateAnalyticsTags — tag derivation from structured form data
s = content.find('function generateAnalyticsTags(fd){')
e = content.find('\nasync function submitToSheets', s)
if s != -1 and e != -1:
    blocks['analytics'] = content[s:e].strip()
else:
    print('WARNING: generateAnalyticsTags block not found')

if not blocks:
    raise RuntimeError('No logic blocks were extracted. The app file may have changed structure.')

# Combine blocks
combined = '\n\n'.join(blocks.values())

# Convert const/let to var so eval() in the test harness works at module scope
combined = re.sub(r'\bconst\b', 'var', combined)
combined = re.sub(r'\blet\b', 'var', combined)

header = f'''\
/**
 * app_logic.js — Auto-generated from the S.A.F.E. app source file.
 * DO NOT EDIT MANUALLY. Re-generate with: python3 tests/extract_logic.py
 *
 * Source: {os.path.basename(APP_FILE)}
 * Blocks: {", ".join(blocks.keys())}
 */

'''

with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    f.write(header + combined)

print(f'Extracted {len(blocks)} blocks ({len(combined):,} chars) → {os.path.abspath(OUTPUT_FILE)}')
for name, block in blocks.items():
    print(f'  {name}: {len(block):,} chars')
