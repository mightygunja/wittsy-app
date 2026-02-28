/**
 * Generate a proper 1024x1024 app icon for iOS/Android.
 * The purple background fills the ENTIRE square - iOS applies its own corner rounding.
 * No white margins, no pre-rounded corners.
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZE = 1024;
const ASSETS = path.join(__dirname, '..', 'assets');

function generate() {
  var canvas = createCanvas(SIZE, SIZE);
  var ctx = canvas.getContext('2d');

  // Fill entire square with purple gradient (matches brand)
  var grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  grad.addColorStop(0, '#8B5CF6');   // lighter purple top-left
  grad.addColorStop(0.5, '#7C3AED'); // mid purple
  grad.addColorStop(1, '#6C63FF');   // brand purple bottom-right
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Draw the white "W" letter centered
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 620px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('W', SIZE / 2, SIZE / 2 - 30);

  // Save icon.png
  var buffer = canvas.toBuffer('image/png');
  var outputPath = path.join(ASSETS, 'icon.png');
  fs.writeFileSync(outputPath, buffer);
  console.log('Generated: icon.png (' + SIZE + 'x' + SIZE + ', ' + (buffer.length / 1024).toFixed(0) + ' KB)');

  // Also generate adaptive-icon.png for Android (same thing)
  var adaptivePath = path.join(ASSETS, 'adaptive-icon.png');
  fs.writeFileSync(adaptivePath, buffer);
  console.log('Generated: adaptive-icon.png (copy of icon.png)');

  console.log('Done! iOS will apply its own corner rounding to the square icon.');
}

generate();
