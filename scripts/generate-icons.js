/**
 * Generate PWA icons for the site
 * Run: node scripts/generate-icons.js
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'docs', 'public', 'icons');

// Ensure output directory exists
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

// SVG template for icon
const svg = (
  size
) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0d1117" rx="${size * 0.1}"/>
  <text
    x="50%"
    y="55%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="monospace"
    font-size="${size * 0.35}"
    font-weight="bold"
    fill="#00d4aa"
  >GPU</text>
</svg>`;

// Generate SVG icons
const sizes = [192, 512];

for (const size of sizes) {
  const filename = `icon-${size}.svg`;
  const filepath = join(outDir, filename);
  writeFileSync(filepath, svg(size));
  console.log(`✓ Generated ${filename}`);
}

// Also create PNG placeholder notes (users should convert SVG to PNG for production)
console.log('\n📝 Note: SVG icons generated. For production PWA support:');
console.log('   1. Convert SVG to PNG using a tool like sharp or Inkscape');
console.log('   2. Or use an online converter: https://cloudconvert.com/svg-to-png');
console.log('\n   Example with sharp:');
console.log('   npm install sharp');
console.log(
  "   node -e \"require('sharp')('docs/public/icons/icon-192.svg').png().toFile('docs/public/icons/icon-192.png')\""
);
