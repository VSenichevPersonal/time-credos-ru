// Палитра/типографика — общий SSOT в shared/tokens. Здесь только grid-специфика
// (cellFill). Re-export сохраняет существующий путь импорта потребителей.
export { T, FONT } from 'src/front-components/shared/tokens';

// Заливка ячейки пропорционально часам (8ч = насыщеннее). Не side-stripe.
export const cellFill = (hours: number): string => {
  if (hours <= 0) return 'transparent';
  const a = Math.min(0.14, 0.03 + (hours / 8) * 0.11);
  return `rgba(59, 111, 224, ${a.toFixed(3)})`;
};
