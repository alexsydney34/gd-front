/**
 * Форматирует число в короткий вид с суффиксами K, M, B
 * 1000 -> 1K
 * 1500 -> 1.5K
 * 1000000 -> 1M
 * 1234567 -> 1.23M
 */
export function formatCompactNumber(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  const absNum = Math.abs(num);
  
  // Меньше 1000 - показываем как есть
  if (absNum < 1000) {
    return num.toFixed(decimals).replace(/\.?0+$/, '');
  }
  
  // Тысячи (K)
  if (absNum < 1000000) {
    const k = num / 1000;
    return k.toFixed(decimals).replace(/\.?0+$/, '') + 'K';
  }
  
  // Миллионы (M)
  if (absNum < 1000000000) {
    const m = num / 1000000;
    return m.toFixed(decimals).replace(/\.?0+$/, '') + 'M';
  }
  
  // Миллиарды (B)
  const b = num / 1000000000;
  return b.toFixed(decimals).replace(/\.?0+$/, '') + 'B';
}

/**
 * Форматирует число с сохранением двух знаков после запятой
 * но с компактной нотацией для больших чисел
 */
export function formatBalance(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0.00';
  
  const absNum = Math.abs(num);
  
  // Меньше 1000 - показываем как есть с двумя знаками
  if (absNum < 1000) {
    return num.toFixed(2);
  }
  
  return formatCompactNumber(num, 2);
}

