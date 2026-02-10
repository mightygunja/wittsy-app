/**
 * Generate a proper 2732x2732 PNG splash screen for iPad/iPhone.
 * Draws the Wittz "W" speech-bubble logo and text from scratch
 * so there are no white-background artifacts from icon.png.
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZE = 2732;
const BG_COLOR = '#6C63FF';
const OUTPUT = path.join(__dirname, '..', 'assets', 'splash.png');

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
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');

  // Fill background with the brand purple
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // --- Draw the W speech-bubble logo ---
  // Center point of the canvas, offset up for text below
  var cx = SIZE / 2;
  var cy = SIZE / 2 - 120;

  // Draw a darker purple rounded-rect "card" behind the W
  var cardSize = 500;
  var cardX = cx - cardSize / 2;
  var cardY = cy - cardSize / 2;
  var cardRadius = 90;

  // Gradient for the card (darker purple to match icon style)
  var cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardSize, cardY + cardSize);
  cardGrad.addColorStop(0, '#8B7FFF');
  cardGrad.addColorStop(1, '#5A4FD4');
  drawRoundedRect(ctx, cardX, cardY, cardSize, cardSize, cardRadius);
  ctx.fillStyle = cardGrad;
  ctx.fill();

  // Subtle shadow/glow around card
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;
  drawRoundedRect(ctx, cardX, cardY, cardSize, cardSize, cardRadius);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Draw the "W" letter centered in the card
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 340px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('W', cx, cy - 10);

  // Draw a small speech-bubble tail at bottom-right of the card
  ctx.fillStyle = '#5A4FD4';
  ctx.beginPath();
  ctx.moveTo(cx + 100, cardY + cardSize - 30);
  ctx.lineTo(cx + 170, cardY + cardSize + 50);
  ctx.lineTo(cx + 40, cardY + cardSize - 5);
  ctx.closePath();
  ctx.fill();

  // --- Draw "Wittz" text below ---
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 180px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Wittz', cx, cy + cardSize / 2 + 100);

  // Save as PNG
  var buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(OUTPUT, buffer);
  console.log('Splash screen generated: ' + OUTPUT);
  console.log('Size: ' + SIZE + 'x' + SIZE + ' PNG');
  console.log('File size: ' + (buffer.length / 1024).toFixed(0) + ' KB');
}

generate();
