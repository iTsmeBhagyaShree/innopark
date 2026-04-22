/**
 * Create PNG Icons for PWA
 * This script creates simple valid PNG icons
 */

const fs = require('fs');
const path = require('path');

// Minimal valid PNG structure
// This creates a simple purple square with white center

function createMinimalPNG(size) {
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk
    function createIHDR(width, height) {
        const data = Buffer.alloc(13);
        data.writeUInt32BE(width, 0);
        data.writeUInt32BE(height, 4);
        data.writeUInt8(8, 8);   // bit depth
        data.writeUInt8(2, 9);   // color type (RGB)
        data.writeUInt8(0, 10);  // compression
        data.writeUInt8(0, 11);  // filter
        data.writeUInt8(0, 12);  // interlace
        return createChunk('IHDR', data);
    }

    // Create PNG chunk
    function createChunk(type, data) {
        const length = Buffer.alloc(4);
        length.writeUInt32BE(data.length, 0);

        const typeBuffer = Buffer.from(type);
        const crc = crc32(Buffer.concat([typeBuffer, data]));
        const crcBuffer = Buffer.alloc(4);
        crcBuffer.writeUInt32BE(crc, 0);

        return Buffer.concat([length, typeBuffer, data, crcBuffer]);
    }

    // Simple CRC32
    function crc32(data) {
        let crc = 0xFFFFFFFF;
        const table = makeCRCTable();
        for (let i = 0; i < data.length; i++) {
            crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

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

    // Create simple image data (purple background)
    function createIDAT(width, height) {
        const zlib = require('zlib');

        // Create raw image data
        const rawData = [];
        const centerStart = Math.floor(width * 0.3);
        const centerEnd = Math.floor(width * 0.7);

        for (let y = 0; y < height; y++) {
            rawData.push(0); // filter byte
            for (let x = 0; x < width; x++) {
                // Purple background: #6366f1
                const isCenter = x >= centerStart && x < centerEnd &&
                    y >= centerStart && y < centerEnd;
                if (isCenter) {
                    // White center
                    rawData.push(255, 255, 255);
                } else {
                    // Purple: RGB(99, 102, 241)
                    rawData.push(99, 102, 241);
                }
            }
        }

        const compressed = zlib.deflateSync(Buffer.from(rawData));
        return createChunk('IDAT', compressed);
    }

    // IEND chunk
    function createIEND() {
        return createChunk('IEND', Buffer.alloc(0));
    }

    const ihdr = createIHDR(size, size);
    const idat = createIDAT(size, size);
    const iend = createIEND();

    return Buffer.concat([pngSignature, ihdr, idat, iend]);
}

const iconsDir = path.join(__dirname, 'public', 'icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Create icons
console.log('Creating PWA icons...');

try {
    const icon192 = createMinimalPNG(192);
    fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), icon192);
    console.log('✅ Created icon-192x192.png');

    const icon512 = createMinimalPNG(512);
    fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), icon512);
    console.log('✅ Created icon-512x512.png');

    console.log('\n✅ All PWA icons created successfully!');
    console.log('Icons location:', iconsDir);
} catch (error) {
    console.error('Error creating icons:', error);
}
