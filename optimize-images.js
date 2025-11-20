const { execSync } = require('child_process');

console.log('🎨 Starting image optimization pipeline...\n');

try {
  console.log('📐 Step 1: Upscaling SVG files (10x)...');
  execSync('node upscale-svg.js', { stdio: 'inherit' });
  
  console.log('\n🖼️  Step 2: Converting to WebP format...');
  execSync('node convert-to-webp.js', { stdio: 'inherit' });
  
  console.log('\n✨ Image optimization complete!');
} catch (error) {
  console.error('\n❌ Error during optimization:', error.message);
  process.exit(1);
}

