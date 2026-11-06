#!/usr/bin/env python3
"""Create recipe WebP assets and update existing image references."""
import argparse
import re
from pathlib import Path
from PIL import Image, ImageOps

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('slug')
parser.add_argument('source', type=Path)
args = parser.parse_args()
if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', args.slug):
    parser.error('Use a lowercase hyphenated recipe slug.')
root = Path(__file__).resolve().parent.parent
if not (root / f'{args.slug}.html').exists():
    parser.error('Create the recipe HTML before adding its image.')
with Image.open(args.source) as source:
    photo = ImageOps.exif_transpose(source).convert('RGB')
    for suffix, size, quality in [('', (1200, 800), 88), ('-thumb', (600, 400), 82)]:
        output = root / 'images' / f'{args.slug}{suffix}.webp'
        output.parent.mkdir(exist_ok=True)
        result = ImageOps.contain(photo, size, Image.Resampling.LANCZOS)
        result.save(output, 'WEBP', quality=quality, method=6)
for file in root.iterdir():
    if file.suffix not in {'.html', '.js', '.mjs'}:
        continue
    original = file.read_text()
    pattern = rf'images/{re.escape(args.slug)}(?:-thumb)?\.(?:svg|png|jpe?g|webp)'
    def replace(match):
        thumb = file.name != f'{args.slug}.html'
        return f'images/{args.slug}{"-thumb" if thumb else ""}.webp'
    updated = re.sub(pattern, replace, original)
    if updated != original:
        file.write_text(updated)
print(f'Added full-size and thumbnail images for {args.slug}.')
