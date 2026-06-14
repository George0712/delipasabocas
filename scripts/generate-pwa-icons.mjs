import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = join(root, 'public', 'icons');
const svg = join(root, 'public', 'favicon.svg');

await mkdir(outDir, { recursive: true });

for (const size of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(outDir, `icon-${size}x${size}.png`));
  console.log(`icon-${size}x${size}.png`);
}
