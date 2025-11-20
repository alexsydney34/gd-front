const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

// Функция для рекурсивного получения всех файлов
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

// Функция конвертации
async function convertToWebP(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  
  // Конвертируем PNG, JPG и SVG
  if (!['.png', '.jpg', '.jpeg', '.svg'].includes(ext)) {
    return;
  }

  const outputPath = inputPath.replace(/\.(png|jpg|jpeg|svg)$/i, '.webp');
  
  try {
    await sharp(inputPath)
      .webp({ quality: 90, effort: 6 }) // Хорошее качество с оптимизацией
      .toFile(outputPath);
    
    console.log(`✅ Converted: ${path.relative(publicDir, inputPath)} -> ${path.basename(outputPath)}`);
    
    // Удаляем оригинал после конвертации
    fs.unlinkSync(inputPath);
    console.log(`🗑️  Removed: ${path.relative(publicDir, inputPath)}`);
  } catch (error) {
    console.error(`❌ Error converting ${inputPath}:`, error.message);
  }
}


// Главная функция
async function main() {
  console.log('🚀 Starting WebP conversion...\n');
  
  const allFiles = getAllFiles(publicDir);
  const imageFiles = allFiles.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.svg'].includes(ext);
  });

  console.log(`Found ${imageFiles.length} images to convert\n`);

  for (const file of imageFiles) {
    await convertToWebP(file);
  }

  console.log('\n✨ Conversion complete!');
}

main().catch(console.error);
