const fs = require("fs")
const path = require("path")
const { PNG } = require("pngjs")

const OUT_DIR = path.resolve(__dirname, "../public/pwa")
const BG = { r: 11, g: 15, b: 12 }
const NEON = { r: 125, g: 255, b: 176 }
const EMBER = { r: 245, g: 196, b: 81 }

function mix(a, b, t) {
  return Math.round(a + (b - a) * t)
}

function drawIcon(size, { maskable = false } = {}) {
  const png = new PNG({ width: size, height: size })
  const cx = size / 2
  const cy = size / 2
  const outer = size * (maskable ? 0.3 : 0.36)
  const inner = size * (maskable ? 0.16 : 0.2)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = (size * y + x) * 4
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      const dist = Math.hypot(dx, dy)

      let r = BG.r
      let g = BG.g
      let b = BG.b

      if (dist < outer) {
        const t = 1 - dist / outer
        r = mix(BG.r, NEON.r, t)
        g = mix(BG.g, NEON.g, t)
        b = mix(BG.b, NEON.b, t)
      }

      if (dist < inner) {
        const t = 1 - dist / inner
        r = mix(BG.r, EMBER.r, t)
        g = mix(BG.g, EMBER.g, t)
        b = mix(BG.b, EMBER.b, t)
      }

      png.data[idx] = r
      png.data[idx + 1] = g
      png.data[idx + 2] = b
      png.data[idx + 3] = 255
    }
  }

  return png
}

function writePng(png, filename) {
  const buffer = PNG.sync.write(png)
  fs.writeFileSync(filename, buffer)
}

fs.mkdirSync(OUT_DIR, { recursive: true })

writePng(drawIcon(192), path.join(OUT_DIR, "icon-192.png"))
writePng(drawIcon(512), path.join(OUT_DIR, "icon-512.png"))
writePng(drawIcon(512, { maskable: true }), path.join(OUT_DIR, "icon-512-maskable.png"))
writePng(drawIcon(180), path.join(OUT_DIR, "apple-touch-icon.png"))
