import { bookingParts, BOOK_INK, BOOK_SOFT_INK } from 'src/front-components/capacity/cap-tokens';
import type { LoadCell } from 'src/front-components/capacity/types';

// REQ-0004 Часть C: тихий индикатор брони ПОД значением ячейки доски.
// HARD — сплошной (📌Nч), уже входит в Demand/load. SOFT — пунктирная подчёркнутая
// подстрока (⋯Nч), НЕ потребляет ёмкость (рисуется только когда includeSoft).
// impeccable: не badge, не заливка (заливка несёт load-тон); приглушённый тон,
// дублирование не-цветом (значок 📌 HARD / пунктир+⋯ SOFT). Возвращает null, если
// броней нет — высота ячейки не прыгает (родитель резервирует строку).

type Props = { cell: LoadCell };

export const BookingMarker = ({ cell }: Props) => {
  const { hard, soft, has } = bookingParts(cell);
  if (!has) return null;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 9.5,
        fontWeight: 600,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        pointerEvents: 'none',
      }}
    >
      {hard > 0 && (
        <span
          title={`Бронь (подтверждённая, HARD): ${hard} ч — входит в загрузку`}
          style={{ color: BOOK_INK, display: 'inline-flex', alignItems: 'center', gap: 2 }}
        >
          <span aria-hidden style={{ fontSize: 6 }}>▪</span>
          {hard}
        </span>
      )}
      {soft > 0 && (
        <span
          title={`Бронь (предварительная, SOFT): ${soft} ч — не потребляет ёмкость, учтена отдельным слоем (не в спросе)`}
          style={{
            // RG-приём SSOT-визуал: SOFT учтена «в другом месте» (отдельный слой,
            // не в Demand) → приглушаем opacity, чтобы глаз не складывал её в загрузку.
            opacity: 0.55,
            color: BOOK_SOFT_INK,
            borderBottom: `1px dashed ${BOOK_SOFT_INK}`,
            paddingBottom: 1,
          }}
        >
          {soft}
        </span>
      )}
    </span>
  );
};
