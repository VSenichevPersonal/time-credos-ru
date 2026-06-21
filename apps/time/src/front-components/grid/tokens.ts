// Палитра/типографика — общий SSOT в shared/tokens. Здесь только grid-специфика
// (cellFill). Re-export сохраняет существующий путь импорта потребителей.
export { T, FONT } from 'src/front-components/shared/tokens';
import { ACCENT_RGB } from 'src/front-components/shared/tokens';

// Заливка ячейки пропорционально часам (8ч = насыщеннее). Не side-stripe.
// Тинт бренд-индиго (ACCENT_RGB) — единый с T.accent, без дрейфа.
export const cellFill = (hours: number): string => {
  if (hours <= 0) return 'transparent';
  const a = Math.min(0.14, 0.03 + (hours / 8) * 0.11);
  return `rgba(${ACCENT_RGB}, ${a.toFixed(3)})`;
};
