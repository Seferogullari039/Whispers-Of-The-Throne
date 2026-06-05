import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "public", "icons");

const BG = [15, 10, 20, 255];
const GOLD = [201, 162, 39, 255];
const DARK = [26, 15, 10, 255];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function setPixel(data, width, x, y, color) {
  const row = y * (1 + width * 4) + 1 + x * 4;
  data[row] = color[0];
  data[row + 1] = color[1];
  data[row + 2] = color[2];
  data[row + 3] = color[3];
}

function dist(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function createIconPng(size) {
  const rowSize = 1 + size * 4;
  const raw = Buffer.alloc(rowSize * size, 0);

  const cx = size / 2;
  const cy = size / 2;
  const outer = size * 0.39;
  const inner = size * 0.16;

  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0;
    for (let x = 0; x < size; x++) {
      const d = dist(x, y, cx, cy);
      let color = BG;

      if (d < outer && d > outer - size * 0.02) {
        color = [201, 162, 39, 90];
      }

      const star =
        Math.abs(Math.cos((Math.atan2(y - cy, x - cx) * 5))) *
          (1 - d / outer) >
        0.55;

      if (d < outer * 0.72 && star && d > inner) {
        color = GOLD;
      }

      if (y > size * 0.66 && y < size * 0.72 && x > cx - size * 0.12 && x < cx + size * 0.12) {
        color = [139, 90, 43, 255];
      }

      if (y >= size * 0.72 && y < size * 0.9 && x > cx - size * 0.16 && x < cx + size * 0.16) {
        color = DARK;
        if (y < size * 0.76 || x < cx - size * 0.14 || x > cx + size * 0.14) {
          color = GOLD;
        }
      }

      setPixel(raw, size, x, y, color);
    }
  }

  const compressed = deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(iconsDir, { recursive: true });

writeFileSync(join(iconsDir, "icon-192.png"), createIconPng(192));
writeFileSync(join(iconsDir, "icon-512.png"), createIconPng(512));
writeFileSync(join(iconsDir, "apple-touch-icon.png"), createIconPng(180));

console.log("Generated PWA icons in public/icons");
