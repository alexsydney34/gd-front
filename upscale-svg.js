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

// Функция для увеличения SVG
function upscaleSVG(inputPath, scale = 10) {
  const ext = path.extname(inputPath).toLowerCase();
  
  if (ext !== '.svg') {
    return;
  }

  try {
    let svgContent = fs.readFileSync(inputPath, 'utf8');
    
    // Ищем width и height в SVG
    const widthMatch = svgContent.match(/width="(\d+(?:\.\d+)?)"/);
    const heightMatch = svgContent.match(/height="(\d+(?:\.\d+)?)"/);
    const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
    
    if (widthMatch && heightMatch) {
      const originalWidth = parseFloat(widthMatch[1]);
      const originalHeight = parseFloat(heightMatch[1]);
      const newWidth = originalWidth * scale;
      const newHeight = originalHeight * scale;
      
      // Заменяем width и height
      svgContent = svgContent.replace(/width="\d+(?:\.\d+)?"/, `width="${newWidth}"`);
      svgContent = svgContent.replace(/height="\d+(?:\.\d+)?"/, `height="${newHeight}"`);
      
      console.log(`✅ Upscaled: ${path.relative(publicDir, inputPath)} (${originalWidth}x${originalHeight} -> ${newWidth}x${newHeight})`);
    } else if (viewBoxMatch) {
      // Если есть viewBox, добавляем width и height
      const viewBox = viewBoxMatch[1].split(' ');
      if (viewBox.length === 4) {
        const vbWidth = parseFloat(viewBox[2]);
        const vbHeight = parseFloat(viewBox[3]);
        const newWidth = vbWidth * scale;
        const newHeight = vbHeight * scale;
        
        // Добавляем width и height после viewBox
        svgContent = svgContent.replace(
          /viewBox="[^"]+"/,
          `viewBox="${viewBoxMatch[1]}" width="${newWidth}" height="${newHeight}"`
        );
        
        console.log(`✅ Upscaled: ${path.relative(publicDir, inputPath)} (viewBox -> ${newWidth}x${newHeight})`);
      }
    } else {
      console.log(`⚠️  Skipped: ${path.relative(publicDir, inputPath)} (no dimensions found)`);
      return;
    }
    
    // Сохраняем обновленный SVG
    fs.writeFileSync(inputPath, svgContent, 'utf8');
    
  } catch (error) {
    console.error(`❌ Error upscaling ${inputPath}:`, error.message);
  }
}

// Главная функция
async function main() {
  console.log('🚀 Starting SVG upscaling (10x)...\n');
  
  const allFiles = getAllFiles(publicDir);
  const svgFiles = allFiles.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ext === '.svg';
  });

  console.log(`Found ${svgFiles.length} SVG files to upscale\n`);

  for (const file of svgFiles) {
    upscaleSVG(file, 10);
  }

  console.log('\n✨ Upscaling complete!');
}

main().catch(console.error);

