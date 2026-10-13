import sharp from 'sharp';
await sharp('branding/share-card.svg').png().toFile('public/share-card.png');
console.log('Exported public/share-card.png (1200 × 630).');
