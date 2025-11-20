// Mapping duck keys to translation keys
export const DUCK_NAME_MAP: Record<string, string> = {
  'grayduck': 'grayDuck',
  'gray': 'grayDuck',
  'blackduck': 'blackDuck',
  'black': 'blackDuck',
  'greenduck': 'greenDuck',
  'green': 'greenDuck',
  'blueduck': 'blueDuck2',
  'blue': 'blueDuck2',
  'redduck': 'redDuck2',
  'red': 'redDuck2',
  'pinkduck': 'pinkDuck2',
  'pink': 'pinkDuck2',
  'orangeduck': 'orangeDuck2',
  'orange': 'orangeDuck2',
  'whiteduck': 'whiteDuck2',
  'white': 'whiteDuck2',
  'purpleduck': 'purpleDuck',
  'purple': 'purpleDuck',
  'wineduck': 'wineDuck',
  'wine': 'wineDuck',
  'brownduck': 'brownDuck',
  'brown': 'brownDuck',
  'goldduck': 'goldDuck',
  'gold': 'goldDuck',
};

// Mapping duck keys to image paths
export const DUCK_IMAGE_MAP: Record<string, string> = {
  'gray': '/main/ducks/gray.webp',
  'black': '/main/ducks/dark.webp',
  'blue': '/main/ducks/blue.webp',
  'red': '/main/ducks/red.webp',
  'pink': '/main/ducks/pink.webp',
  'orange': '/main/ducks/orange.webp',
  'white': '/main/ducks/white.webp',
  'purple': '/main/ducks/purple.webp',
  'green': '/main/ducks/gray.webp',
  'wine': '/main/ducks/wine.webp',
  'brown': '/main/ducks/browjn.webp',
  'gold': '/main/ducks/gold.webp',
};

export const DEFAULT_DUCK_IMAGE = '/main/ducks/gray.webp';
export const DEFAULT_DUCK_NAME = 'grayDuck';

// Маппинг названий уток на ключи переводов (для рефералки)
export const DUCK_NAME_TO_KEY: Record<string, string> = {
  // Русские названия
  'Серая': 'grayDuck',
  'Черная': 'blackDuck',
  'Зеленая': 'greenDuck',
  'Синяя': 'blueDuck2',
  'Красная': 'redDuck2',
  'Розовая': 'pinkDuck2',
  'Оранжевая': 'orangeDuck2',
  'Белая': 'whiteDuck',
  'Лиловая': 'purpleDuck',
  'Винная': 'wineDuck',
  'Коричневая': 'brownDuck',
  'Золотая': 'goldDuck',
  // Английские названия
  'Gray': 'grayDuck',
  'Black': 'blackDuck',
  'Green': 'greenDuck',
  'Blue': 'blueDuck',
  'Red': 'redDuck',
  'Pink': 'pinkDuck',
  'Orange': 'orangeDuck',
  'White': 'whiteDuck',
  'Purple': 'purpleDuck',
  'Wine': 'wineDuck',
  'Brown': 'brownDuck',
  'Gold': 'goldDuck',
};
