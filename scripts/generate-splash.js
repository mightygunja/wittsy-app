/**
 * Generate splash-icon.png for expo-splash-screen plugin.
 * This is a transparent PNG with just the white W speech-bubble logo.
 * The plugin handles background color (#6C63FF) and centering on all devices.
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function generate() {
  // 512x512 transparent icon with the W logo
  var size = 512;
  var canvas = createCanvas(size, size);
  var ctx = canvas.getContext('2d');

  // Transparent background (default for canvas)

  // Draw the white W letter - large and bold, centered
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 380px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('W', size / 2, size / 2 - 20);

  // Save as PNG
  var outputPath = path.join(ASSETS, 'splash-icon.png');
  var buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log('Generated: splash-icon.png (' + size + 'x' + size + ', ' + (buffer.length / 1024).toFixed(0) + ' KB)');

  // Also generate the full splash.png (2732x2732) as a fallback
  var fullSize = 2732;
  var fullCanvas = createCanvas(fullSize, fullSize);
  var fullCtx = fullCanvas.getContext('2d');

  // Purple background
  fullCtx.fillStyle = '#6C63FF';
  fullCtx.fillRect(0, 0, fullSize, fullSize);

  // White W centered
  fullCtx.fillStyle = '#FFFFFF';
  fullCtx.font = 'bold 500px Arial, Helvetica, sans-serif';
  fullCtx.textAlign = 'center';
  fullCtx.textBaseline = 'middle';
  fullCtx.fillText('W', fullSize / 2, fullSize / 2 - 60);

  // Wittz text below
  fullCtx.font = 'bold 180px Arial, Helvetica, sans-serif';
  fullCtx.fillText('Wittz', fullSize / 2, fullSize / 2 + 220);

  var fullOutputPath = path.join(ASSETS, 'splash.png');
  var fullBuffer = fullCanvas.toBuffer('image/png');
  fs.writeFileSync(fullOutputPath, fullBuffer);
  console.log('Generated: splash.png (' + fullSize + 'x' + fullSize + ', ' + (fullBuffer.length / 1024).toFixed(0) + ' KB)');

  console.log('Done!');
}

generate();
