import { T, loadTone, gapTone, BOOK_INK, BOOK_SOFT_INK, CONFLICT_RING } from 'src/front-components/capacity/cap-tokens';
import type { CellMetric } from 'src/front-components/capacity/types';

// Легенда цветовой шкалы доски: что значит цвет ячейки. Без неё новый юзер не
// читает heatmap (зелёный=свободно — контринтуитивно для деливери). DP-0006 §1.
// Для метрики «Gap» шкала иная (отклонение спрос−ёмкость), показываем её.

const Swatch = ({ bg, label, icon }: { bg: string; label: string; icon?: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
    <span
      aria-hidden
      style={{
        width: 14,
        height: 14,
        borderRadius: 3,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 8,
        color: T.textMuted,
        background: bg === 'transparent' ? T.surface : bg,
        border: `1px solid ${T.border}`,
      }}
    >
      {icon ?? ''}
    </span>
    <span style={{ fontSize: 11, color: T.textMuted }}>{label}</span>
  </span>
);

const LoadSwatch = ({ ratio, label }: { ratio: number; label: string }) => (
  <Swatch bg={loadTone(ratio).bg} label={label} />
);

// Легенда Gap: профицит (▼ синий) / баланс (● прозр.) / дефицит (▲ янтарь/красный).
const GapLegend = () => (
  <>
    <span style={{ fontSize: 11, fontWeight: 600, color: T.textFaint }}>
      Gap = спрос − ёмкость:
    </span>
    <Swatch bg={gapTone(-0.2).bg} label="профицит (свободно)" icon="▼" />
    <Swatch bg={gapTone(0).bg} label="баланс ±5%" icon="●" />
    <Swatch bg={gapTone(0.1).bg} label="близко к дефициту" icon="▲" />
    <Swatch bg={gapTone(0.2).bg} label="дефицит / перегруз" icon="▲" />
  </>
);

const LoadLegend = () => (
  <>
    <span style={{ fontSize: 11, fontWeight: 600, color: T.textFaint }}>Цвет = загрузка:</span>
    <LoadSwatch ratio={0.2} label="много свободно" />
    <LoadSwatch ratio={0.7} label="оптимально" />
    <LoadSwatch ratio={0.99} label="полная" />
    <LoadSwatch ratio={1.2} label="перегруз" />
  </>
);

// REQ-0004 Часть C: легенда слоя брони. HARD — в загрузке (▪N); SOFT — пунктир,
// не потребляет, показ по тумблеру tentativeBookingEnabled; ▲ — овербукинг.
const BookingLegend = ({ includeSoft }: { includeSoft: boolean }) => (
  <>
    <span style={{ width: 1, height: 14, background: T.border }} aria-hidden />
    <span style={{ fontSize: 11, fontWeight: 600, color: T.textFaint }}>Бронь:</span>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
      <span aria-hidden style={{ fontSize: 10, color: BOOK_INK, fontWeight: 700 }}>▪ N</span>
      <span style={{ fontSize: 11, color: T.textMuted }}>HARD (в загрузке)</span>
    </span>
    {includeSoft && (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
        <span aria-hidden style={{ fontSize: 10, color: BOOK_SOFT_INK, fontWeight: 700, borderBottom: `1px dashed ${BOOK_SOFT_INK}` }}>N</span>
        <span style={{ fontSize: 11, color: T.textMuted }}>SOFT (предв., не потребляет)</span>
      </span>
    )}
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
      <span aria-hidden style={{ fontSize: 10, color: CONFLICT_RING, fontWeight: 700 }}>▲</span>
      <span style={{ fontSize: 11, color: T.textMuted }}>овербукинг</span>
    </span>
  </>
);

export const BoardLegend = ({
  metric,
  includeSoft = false,
}: {
  metric: CellMetric;
  includeSoft?: boolean;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '5px 14px',
      borderBottom: `1px solid ${T.border}`,
      background: T.surface,
      flexWrap: 'wrap',
    }}
  >
    {metric === 'gap' ? <GapLegend /> : <LoadLegend />}
    <BookingLegend includeSoft={includeSoft} />
  </div>
);
