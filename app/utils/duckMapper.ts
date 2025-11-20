/**
 * Маппинг названий уток из API в названия файлов
 * API может возвращать: "Gray Duck", "Blue Duck" и т.д.
 * Файлы называются: gray.svg, blue.svg и т.д.
 */

export const normalizeDuckKey = (apiKey: string): string => {
  // Убираем " Duck" и пробелы, переводим в lowercase
  let normalized = apiKey
    .replace(' Duck', '')
    .replace(/\s+/g, '')
    .toLowerCase();
  
  // Специальные случаи (опечатки в именах файлов)
  const specialCases: Record<string, string> = {
    'brown': 'browjn',  // Опечатка в имени файла browjn.webp
  };
  
  if (specialCases[normalized]) {
    normalized = specialCases[normalized];
  }
  
  // Валидируем что утка существует
  const validDucks = [
    'gold', 'blue', 'red', 'orange', 'pink',
    'purple', 'white', 'gray', 'dark', 'browjn', 'wine',
    'black', 'green'  // black мапится на dark.webp, green пока на gray.webp
  ];
  
  if (!validDucks.includes(normalized)) {
    console.warn(`Unknown duck key: ${apiKey} (normalized: ${normalized}), using gold as fallback`);
    return 'gold';
  }
  
  return normalized;
};

// Обратный маппинг для отображения (если нужно)
export const getDuckDisplayName = (fileKey: string): string => {
  const displayNames: Record<string, string> = {
    'gold': 'Gold Duck',
    'blue': 'Blue Duck',
    'red': 'Red Duck',
    'orange': 'Orange Duck',
    'pink': 'Pink Duck',
    'purple': 'Purple Duck',
    'white': 'White Duck',
    'gray': 'Gray Duck',
    'dark': 'Dark Duck',
    'browjn': 'Brown Duck',
    'wine': 'Wine Duck',
  };
  
  return displayNames[fileKey] || fileKey;
};

