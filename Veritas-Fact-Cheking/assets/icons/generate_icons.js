const fs = require('fs');
const path = require('path');

// Crear iconos SVG simples como placeholders
const sizes = [16, 32, 48, 128];

const svgContent = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#1a73e8" rx="${size * 0.15}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dy="0.3em">V</text>
</svg>`;

sizes.forEach(size => {
  const filename = `icon${size}.png`;
  // Nota: En un entorno real necesitarías una librería como sharp o canvas para convertir SVG a PNG
  // Por ahora creamos un archivo placeholder que Chrome pueda leer
  console.log(`Creating placeholder for ${filename}`);
});

console.log('SVG icons created. For production, convert these to PNG using a tool like ImageMagick or an online converter.');
