// Create PNG Icons for PWA
// CommonJS version

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
function makeCRCTable() {
    const table = new Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[n] = c;
    }
    return table;
}

const crcTable = makeCRCTable();

function crc32(data) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const typeBuffer = Buffer.from(type);
    const crcData = crc32(Buffer.concat([typeBuffer, data]));
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crcData, 0);
    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function createPNG(size) {
    // PNG signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(size, 0);  // width
    ihdrData.writeUInt32BE(size, 4);  // height
    ihdrData.writeUInt8(8, 8);        // bit depth
    ihdrData.writeUInt8(2, 9);        // color type (RGB)
    ihdrData.writeUInt8(0, 10);       // compression
    ihdrData.writeUInt8(0, 11);       // filter
    ihdrData.writeUInt8(0, 12);       // interlace
    const ihdr = createChunk('IHDR', ihdrData);

    // Create image data - purple with white "D" pattern
    const rawData = [];
    const radius = size * 0.2;

    for (let y = 0; y < size; y++) {
        rawData.push(0); // filter byte
        for (let x = 0; x < size; x++) {
            // Check if inside rounded corners
            const isCorner = (
                (x < radius && y < radius && Math.hypot(x - radius, y - radius) > radius) ||
                (x >= size - radius && y < radius && Math.hypot(x - (size - radius), y - radius) > radius) ||
                (x < radius && y >= size - radius && Math.hypot(x - radius, y - (size - radius)) > radius) ||
                (x >= size - radius && y >= size - radius && Math.hypot(x - (size - radius), y - (size - radius)) > radius)
            );

            if (isCorner) {
                // Transparent corner (white fallback)
                rawData.push(255, 255, 255);
            } else {
                // Check if should be white (D letter area)
                const centerX = size / 2;
                const centerY = size / 2;
                const letterWidth = size * 0.3;
                const letterHeight = size * 0.4;

                const inDLetter = (
                    // Left bar of D
                    (x >= centerX - letterWidth / 2 - size * 0.05 && x <= centerX - letterWidth / 2 + size * 0.08 &&
                        y >= centerY - letterHeight && y <= centerY + letterHeight) ||
                    // Top curve
                    (x >= centerX - letterWidth / 2 && x <= centerX + letterWidth / 2 &&
                        y >= centerY - letterHeight && y <= centerY - letterHeight + size * 0.08) ||
                    // Bottom curve
                    (x >= centerX - letterWidth / 2 && x <= centerX + letterWidth / 2 &&
                        y >= centerY + letterHeight - size * 0.08 && y <= centerY + letterHeight) ||
                    // Right curve
                    (x >= centerX + letterWidth / 2 - size * 0.1 && x <= centerX + letterWidth / 2 &&
                        y >= centerY - letterHeight && y <= centerY + letterHeight)
                );

                if (inDLetter) {
                    // White for letter
                    rawData.push(255, 255, 255);
                } else {
                    // Purple: #6366f1 = RGB(99, 102, 241)
                    rawData.push(99, 102, 241);
                }
            }
        }
    }

    const compressed = zlib.deflateSync(Buffer.from(rawData));
    const idat = createChunk('IDAT', compressed);

    // IEND
    const iend = createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdr, idat, iend]);
}

// Create icons directory
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Creating PWA icons...');

// Create 192x192 icon
const icon192 = createPNG(192);
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), icon192);
console.log('✅ Created icon-192x192.png (' + icon192.length + ' bytes)');

// Create 512x512 icon
const icon512 = createPNG(512);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), icon512);
console.log('✅ Created icon-512x512.png (' + icon512.length + ' bytes)');

console.log('\n✅ All PWA icons created successfully!');
console.log('Icons saved to:', iconsDir);
