/**
 * Generate splash screens for iPhone and iPad.
 * - splash.png: 2732x2732 square (works for all phones via contain)
 * - splash-tablet.png: 2048x2732 portrait iPad (12.9" iPad Pro native res)
 * Draws the Wittz "W" speech-bubble logo and text from scratch.
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const BG_COLOR = '#6C63FF';
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

function drawSplash(width, height, outputName) {
  var canvas = createCanvas(width, height);
  var ctx = canvas.getContext('2d');

  // Fill background with the brand purple
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, height);

  // --- Draw the W speech-bubble logo ---
  var cx = width / 2;
  var cy = height / 2 - 120;

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
  var outputPath = path.join(ASSETS, outputName);
  var buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log('Generated: ' + outputName + ' (' + width + 'x' + height + ', ' + (buffer.length / 1024).toFixed(0) + ' KB)');
}

// Phone splash: 2732x2732 square
drawSplash(2732, 2732, 'splash.png');

// Tablet splash: 2048x2732 portrait (iPad Pro 12.9" native resolution)
drawSplash(2048, 2732, 'splash-tablet.png');

console.log('Done!');
