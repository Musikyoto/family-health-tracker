// Generate full-bleed PNG app icons from the Mamori mark using sharp.
// "Full-bleed" = the gradient reaches all four edges with no transparent
// padding, so iOS auto-rounds the apple-touch-icon cleanly and Android masks
// the maskable manifest icons cleanly. (mamori-icon.svg has rounded corners,
// rx=114, which would leave transparent corners — so we use a square rx=0
// variant of the same gradient + mark here.)
// Run: node scripts/generate-icons.mjs   (or: npm run gen:icons)

import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2E8B57"/>
      <stop offset="1" stop-color="#1FA9A0"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <path d="M128 284 L256 156 L384 284" fill="none" stroke="#ffffff" stroke-width="38" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M256 304 c-25 -38 -82 -30 -82 18 c0 38 52 66 82 88 c30 -22 82 -50 82 -88 c0 -48 -57 -56 -82 -18 Z" fill="#ffffff"/>
</svg>`

const targets = [
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
]

for (const [name, size] of targets) {
  const out = join(publicDir, name)
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out)
  // Verify: correct dimensions + opaque top-left pixel (i.e. no transparent corner).
  const { data, info } = await sharp(out).raw().toBuffer({ resolveWithObject: true })
  const cornerAlpha = info.channels === 4 ? data[3] : 255
  console.log(`public/${name}: ${info.width}x${info.height}, top-left alpha=${cornerAlpha} ${info.width === size && cornerAlpha === 255 ? '✓' : '✗ CHECK'}`)
}
