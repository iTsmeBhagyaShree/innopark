/**
 * Generate PWA Icons Script
 * Creates PNG icons for PWA from Node.js
 */

const fs = require('fs');
const path = require('path');

// Base64 encoded 192x192 PNG icon (purple background with white "D")
// This is a simple placeholder icon
const icon192Base64 = `iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF
8GlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0w
TXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRh
LyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4xLWMwMDIgNzkuYTZhNjM5NiwgMjAyNC8wMy8w
Ni0xMTozMjoxMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9y
Zy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9
IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0
cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25z
LmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5j
b20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAv
c1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI1
LjkgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNi0wMS0wOFQxMTozNTowMCswNTozMCIg
eG1wOk1vZGlmeURhdGU9IjIwMjYtMDEtMDhUMTE6MzU6MDArMDU6MzAiIHhtcDpNZXRhZGF0YURh
dGU9IjIwMjYtMDEtMDhUMTE6MzU6MDArMDU6MzAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90
b3Nob3A6Q29sb3JNb2RlPSIzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0
RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowMDAwMDAwMC0w
MDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiIHN0RXZ0OndoZW49IjIwMjYtMDEtMDhUMTE6MzU6
MDArMDU6MzAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyNS45IChXaW5k
b3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwv
cmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7pP3ufAAAEqUlEQVR4nO3d
W3LbMBAFUI76/peudJJMbNkSCexjH3xN80ESwOKCIETqy9fX19cLAAAAfuhX9QYAAACAf/1t+I9n
AwIAAAAAfupnrQ0AAAAA/vJV9QYAAACA//pa9QYAAACA/+fCNQAAAAC4eo0AAAAAAHyXBwAAAADg
2hcCAAAAAPA9DgAAAADApa8VAAAAAID/8gAAAAAAXHoNAAAAAAD+wtsAAAAAXPk0AAAAAADuXQMA
AAAA4NK3AQAAAADwNz4IAAAAAC59CgAAAACA/3ADAAAAAC7dBgAAAADAXz4FAAAAAMC1TwAAAADA
/34LAAAAAIC/+yEAAAAAAC59GQAAAAAA/+EGAAAAAFy6DwAAAACAv/kmAAAAAAD+xVsAAAAAALhy
AwAAAACA//ANAAAAAIC/810AAAAAANy7DQAAAACA//JNAAAAAID/8RYAAAAAAJ98AAAAAAC49gMA
AAAAuPYFAAAAAID/+CkAAAAAAO5dAAAAAADA/3gDAAAAAOA7PAAAAAAA4C98AgAAAADgr7wGAAAA
AIDvuQMAAAAAgG+4AQAAAACA7/EGAAAAAAB/4xMAAAAAAH5yBwAAAACA73ADAAAAAAA/4Q0AAAAA
AP7DVwAAAAAA+J5vAAAAAADg2iUAAAAAANwBAAAAAMAVbwAAAAAA4C/uAQAAAADgL24BAAAAAOAP
/gEAAAAA4C8+AAAAAAD4kxsAAAAAALjyAQAAAACA7/kAAAAAAIC/cQcAAAAAgJ9wBwAAAACAnzgA
AAAAAMBfuAMAAAAAgD+5BQAAAACAnzgAAAAAAMAVDwAAAAAA+M4HAAAAAAB/4h4AAAAAAL7jAAAA
AACAn3AHAAAAAIDvcAcAAAAAgJ9wBwAAAACAKw8AAAAAAPjOBwAAAAAAruQCAAAAAOBPbgEAAAAA
4AccAAAAAADgL9wBAAAAAOAnHAAAAAAA4A/uAAAAAADgB5wBAAAAAOA73AEAAAAAwE+4AwAAAADA
X7gDAAAAAIAfcQAAAAAAgD+5AwAAAADAH9wCAAAAAMBP3AEAAAAAwE/cAgAAAADATzgAAAAAAMAP
OAAAAAAAwHe4AwAAAADAT9wBAAAAAOAvrgAAAAAA4CfuAAAAAADwE+4AAAAAAHDlCgAAAAAA/uIO
AAAAAAB/4g4AAAAAAD/hDgAAAAAAf+IGAAAAAACu3AEAAAAAwB/cAgAAAADATzgAAAAAAMB3uAMA
AAAAwE/cAQAAAADAXzgAAAAAAMAf3AIAAAAAwJ/cAQAAAADgOw4AAAAAAHDFAQAAAAAAvscdAAAA
AAD+4hYAAAAAAH7AAQAAAAAA/uIOAAAAAAA/4QYAAAAAAD/hAAAAAACAP7gFAAAAAICfuAMAAAAA
wN9dAQAAAADAn9wBAAAAAOBHHAAAAAAA4A/uAAAAAADgB9wAAAAAAOA7bAEAAAAA4CccAAAAAADg
B+4AAAAAAOA7bgEAAAAA4AdcAAAAAADgB5wBAAAAAOAP7gAAAAAA4DtuAQAAAADgJ24BAAAAAOA7
HAAAAAAAuOIAAAAAAABXHAAAAAAA4IoDAAAAAACuOAAAAAAAwBUHAAAAAAC44gAAAAAAAFccAAAA
AADgigMAAAAAAFzxAAAAAAAAV24BAAAAAOCKOwAAAAAAXLkAAAAAAAAHAAAAAAD4jlsAAAAAALji
AAAAAAAAV7wAAAAAAIArDgAAAAAAcMUB+A+vr6/VmwAAwMt9qd4AAACAWh9Vf/nfx8cHAAAA0MuH
6g0AAACoZgMAAACglQMAAAAAtHKq3gAAAIBaDgAAAADQ6m/1BgAAAFT7B4xL+SAfL5X5AAAAAElF
TkSuQmCC`;

// Create a simple 192x192 PNG icon
function createSimpleIcon192() {
    // PNG header and IHDR chunk for 192x192 RGBA
    const width = 192;
    const height = 192;

    // Create canvas-like buffer (simplified approach)
    const { createCanvas } = require('canvas');
    if (!createCanvas) {
        console.log('Canvas not available, using fallback SVG...');
        return null;
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw rounded rectangle background
    const radius = 38;
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, radius);
    ctx.fill();

    // Draw "D" letter
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 100px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('D', width / 2, height / 2 + 5);

    return canvas.toBuffer('image/png');
}

// Fallback: Create SVG that looks like PNG
function createSVGIcon(size) {
    const radius = size * 0.2;
    const fontSize = size * 0.52;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#6366f1" rx="${radius}"/>
  <text x="${size / 2}" y="${size / 2 + size * 0.05}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">D</text>
</svg>`;
}

const iconsDir = './public/icons';

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Create SVG icons (these work as fallback)
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.svg'), createSVGIcon(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.svg'), createSVGIcon(512));

console.log('✅ SVG icons created!');
console.log('For proper PWA support, you need PNG icons.');
console.log('Open http://localhost:5173/generate-icons.html to download PNG icons.');
