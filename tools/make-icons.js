"use strict";

/**
 * Vector brand icon generator.
 *
 * Draws the Vector logo - a dark-green rounded tile (#2D5D4F) with a bold
 * gold "V" (#FACB43) - and writes every icon asset the project ships:
 *
 *   ui/media/                      Chrome/Edge extension icons + store logo
 *   ui/mobile-native/android/...   Capacitor launcher icons + splash screens
 *   ui/android/...                 native Kotlin app launcher icons
 *   ui/web-app/public/             web app favicon/logo
 *
 * Pure Node (zlib only), no image libraries. Anti-aliased via 2x2 subsampling.
 *
 * Run:  node tools/make-icons.js
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const GREEN = [0x2d, 0x5d, 0x4f]; // #2D5D4F
const GOLD = [0xfa, 0xcb, 0x43]; // #FACB43

const ROOT = path.join(__dirname, "..");

// ---------------------------------------------------------------------------
// PNG encoder
// ---------------------------------------------------------------------------

function crcTable() {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
}
const CRC = crcTable();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function pngSize(file) {
  const buf = fs.readFileSync(file);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// ---------------------------------------------------------------------------
// Logo geometry (all coordinates normalised to 0..1)
// ---------------------------------------------------------------------------

const V_HALF = 0.086; // half stroke width of the V
const CORNER = 0.235; // rounded-square corner radius

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function roundedRectSdf(nx, ny, r) {
  const qx = Math.abs(nx - 0.5) - (0.5 - r);
  const qy = Math.abs(ny - 0.5) - (0.5 - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

// Gold "V" membership test. `pad` shrinks the mark into the safe zone.
function onV(nx, ny, pad) {
  const s = 1 - 2 * pad;
  const p = (nx - pad) / s;
  const q = (ny - pad) / s;
  const d1 = segDist(p, q, 0.30, 0.30, 0.50, 0.725);
  const d2 = segDist(p, q, 0.70, 0.30, 0.50, 0.725);
  return Math.min(d1, d2) <= V_HALF;
}

// shape: "square" | "round" | "foreground" | "splash"
function pointColor(nx, ny, shape) {
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;

  const bgVisible = shape === "square" || shape === "round" || shape === "splash";
  if (bgVisible) {
    const inside =
      shape === "round"
        ? Math.hypot(nx - 0.5, ny - 0.5) <= 0.5
        : roundedRectSdf(nx, ny, shape === "splash" ? 0 : CORNER) <= 0;
    if (inside) {
      r = GREEN[0];
      g = GREEN[1];
      b = GREEN[2];
      a = 255;
    }
  }

  const pad = shape === "foreground" ? 0.14 : 0;
  if (onV(nx, ny, pad)) {
    r = GOLD[0];
    g = GOLD[1];
    b = GOLD[2];
    a = 255;
  }
  return [r, g, b, a];
}

const SUB = [
  [0.25, 0.25],
  [0.75, 0.25],
  [0.25, 0.75],
  [0.75, 0.75]
];

function render(width, height, shape) {
  const px = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let pr = 0;
      let pg = 0;
      let pb = 0;
      let pa = 0;
      for (let s = 0; s < 4; s++) {
        const nx = (x + SUB[s][0]) / width;
        const ny = (y + SUB[s][1]) / height;
        const c = pointColor(nx, ny, shape);
        const w = c[3];
        pr += c[0] * w;
        pg += c[1] * w;
        pb += c[2] * w;
        pa += w;
      }
      const i = (y * width + x) * 4;
      if (pa > 0) {
        px[i] = Math.round(pr / pa);
        px[i + 1] = Math.round(pg / pa);
        px[i + 2] = Math.round(pb / pa);
        px[i + 3] = Math.round(pa / 4);
      }
    }
  }
  return px;
}

function writePng(file, width, height, shape) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const png = encodePng(width, height, render(width, height, shape));
  fs.writeFileSync(file, png);
  return png.length;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

const written = [];
function emit(file, w, h, shape) {
  const bytes = writePng(file, w, h, shape);
  written.push(rel(file) + " (" + bytes + " bytes)");
}

// ---------------------------------------------------------------------------
// 1. Extension / store icons -> ui/media
// ---------------------------------------------------------------------------

const mediaDir = path.join(ROOT, "ui", "media");
for (const size of [16, 32, 48, 128]) {
  emit(path.join(mediaDir, "icon" + size + ".png"), size, size, "square");
}
emit(path.join(mediaDir, "store-logo-300.png"), 300, 300, "square");
emit(path.join(mediaDir, "logo512.png"), 512, 512, "square");

// ---------------------------------------------------------------------------
// 2. Android launcher icons (both projects)
// ---------------------------------------------------------------------------

const ANDROID_DENSITIES = [
  ["mdpi", 48],
  ["hdpi", 72],
  ["xhdpi", 96],
  ["xxhdpi", 144],
  ["xxxhdpi", 192]
];

function androidLaunchers(resRoot) {
  for (const [density, size] of ANDROID_DENSITIES) {
    const dir = path.join(resRoot, "mipmap-" + density);
    emit(path.join(dir, "ic_launcher.png"), size, size, "square");
    emit(path.join(dir, "ic_launcher_round.png"), size, size, "round");
  }
}

// Capacitor client also uses an adaptive foreground PNG (108dp base).
function capacitorForeground(resRoot) {
  for (const [density, size] of ANDROID_DENSITIES) {
    const fg = Math.round((size / 48) * 108);
    emit(path.join(resRoot, "mipmap-" + density, "ic_launcher_foreground.png"), fg, fg, "foreground");
  }
}

const capRes = path.join(ROOT, "ui", "mobile-native", "android", "app", "src", "main", "res");
const satyaRes = path.join(ROOT, "ui", "android", "app", "src", "main", "res");

if (fs.existsSync(capRes)) {
  androidLaunchers(capRes);
  capacitorForeground(capRes);
}
if (fs.existsSync(satyaRes)) {
  androidLaunchers(satyaRes);
}

// ---------------------------------------------------------------------------
// 3. Splash screens - regenerate each existing splash at its own dimensions
// ---------------------------------------------------------------------------

function regenSplashes(resRoot) {
  const stack = [resRoot];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name === "splash.png") {
        const { width, height } = pngSize(full);
        emit(full, width, height, "splash");
      }
    }
  }
}
if (fs.existsSync(capRes)) regenSplashes(capRes);

// ---------------------------------------------------------------------------
// 4. Web app favicon / logo -> ui/web-app/public
// ---------------------------------------------------------------------------

const webAppPublic = path.join(ROOT, "ui", "web-app", "public");
if (fs.existsSync(path.join(ROOT, "ui", "web-app"))) {
  emit(path.join(webAppPublic, "vector-logo.png"), 512, 512, "square");
  emit(path.join(webAppPublic, "favicon-32.png"), 32, 32, "square");
}

// ---------------------------------------------------------------------------

console.log("Vector brand icon generator (green #2D5D4F + gold #FACB43)");
for (const line of written) console.log("  wrote " + line);
