import { describe, expect, it } from 'vitest';

import { loadTone, formatPct, formatCell, gapHours, gapPct, gapTone, gapIcon, formatGap, formatGapHours, formatGapPctShort, colWidth, COL_W, COL_W_GAP, childCell, overbookTip } from './cap-tokens';
import type { LoadCell } from './types';

const cell = (capacity: number, load: number): LoadCell => ({
  capacity,
  load,
  free: capacity - load,
  ratio: capacity > 0 ? load / capacity : null,
  hardBooking: 0,
  softBooking: 0,
  conflict: false,
});

// Ячейка-перегруз: тот же, но с conflict=true (Demand>ёмкости).
const overCell = (capacity: number, load: number): LoadCell => ({
  ...cell(capacity, load),
  conflict: true,
});

// ─── loadTone ─────────────────────────────────────────────────────────────

describe('loadTone', () => {
  it('null ratio → нейтральный (нет ёмкости)', () => {
    const t = loadTone(null);
    // T.textFaint = '#7c8089' (hex из tokens, поднят до AA — WI-34)
    expect(t.fg).toBe('#7c8089');
    expect(t.bg).toBeTruthy();
  });

  it('ratio > 1 → тревога (терракот)', () => {
    const t = loadTone(1.1);
    expect(t.bg).toBe('#fbe4dd');
    expect(t.fg).toBe('#b3401a');
  });

  it('ratio = 1.0 (ровно полная загрузка) → НЕ тревога', () => {
    const t = loadTone(1.0);
    expect(t.bg).not.toBe('#fbe4dd');
  });

  it('ratio ≈ 1 (free ≤ 0.02) → прозрачный нейтрал', () => {
    const t = loadTone(0.99); // free = 0.01 ≤ 0.02
    expect(t.bg).toBe('transparent');
  });

  it('ratio = 0.5 → зелёный фон (свободно 50%)', () => {
    const t = loadTone(0.5);
    expect(t.bg).toMatch(/^rgba\(21, 128, 61,/);
    expect(t.fg).toBeTruthy();
  });

  it('ratio = 0 → максимальная прозрачность зелёного (свободно 100%)', () => {
    const t0 = loadTone(0);   // free=1 → a=0.25
    const t5 = loadTone(0.5); // free=0.5 → a=0.15
    // alpha ratio=0 должен быть больше чем ratio=0.5
    const alphaOf = (bg: string): number => parseFloat(bg.match(/[\d.]+\)$/)![0]);
    expect(alphaOf(t0.bg)).toBeGreaterThan(alphaOf(t5.bg));
  });
});

// ─── formatPct ────────────────────────────────────────────────────────────

describe('formatPct', () => {
  it('null → ""', () => expect(formatPct(null)).toBe(''));
  it('0% при ratio=0', () => expect(formatPct(0)).toBe('0%'));
  it('65% округляет', () => expect(formatPct(0.654)).toBe('65%'));
  it('100% при ratio=1', () => expect(formatPct(1)).toBe('100%'));
  it('>100 не обрезает (это задача loadTone)', () => expect(formatPct(1.5)).toBe('150%'));
});

// ─── formatCell ───────────────────────────────────────────────────────────

describe('formatCell', () => {
  it('capacity=0 → "" (нет ёмкости, не рисуем)', () => {
    expect(formatCell('pct', cell(0, 0))).toBe('');
    expect(formatCell('free', cell(0, 0))).toBe('');
    expect(formatCell('plan', cell(0, 0))).toBe('');
  });

  it('метрика pct → процент', () => {
    expect(formatCell('pct', cell(160, 80))).toBe('50%');
  });

  it('метрика plan → плановые часы (0 → "")', () => {
    expect(formatCell('plan', cell(160, 80))).toBe('80');
    expect(formatCell('plan', cell(160, 0))).toBe('');
  });

  it('метрика free → свободные часы со знаком', () => {
    expect(formatCell('free', cell(160, 80))).toBe('+80');  // свободно
    expect(formatCell('free', cell(160, 200))).toBe('-40'); // перегруз
    expect(formatCell('free', cell(160, 160))).toBe('0');   // точно ноль
  });

  it('метрика gap → Demand−Capacity со знаком и %', () => {
    expect(formatCell('gap', cell(160, 200))).toBe('+40ч 25%'); // дефицит
    expect(formatCell('gap', cell(160, 80))).toBe('-80ч 50%');  // профицит
    expect(formatCell('gap', cell(160, 160))).toBe('0ч 0%');    // баланс
    expect(formatCell('gap', cell(0, 0))).toBe('');             // нет ёмкости
  });
});

// ─── Resource Gap ───────────────────────────────────────────────────────────

describe('gapHours / gapPct', () => {
  it('gap = Demand − Capacity (дефицит положителен)', () => {
    expect(gapHours(cell(160, 200))).toBe(40);   // перегруз
    expect(gapHours(cell(160, 80))).toBe(-80);   // профицит
    expect(gapHours(cell(160, 160))).toBe(0);
  });

  it('gapPct = ratio − 1 (null без ёмкости)', () => {
    expect(gapPct(cell(160, 200))).toBeCloseTo(0.25);
    expect(gapPct(cell(160, 80))).toBeCloseTo(-0.5);
    expect(gapPct(cell(0, 0))).toBeNull();
  });
});

describe('gapTone (шкала ±5/15%)', () => {
  const alphaOf = (bg: string): number => parseFloat(bg.match(/[\d.]+\)$/)![0]);

  it('null → нейтральный (нет ёмкости)', () => {
    expect(gapTone(null).fg).toBe('#7c8089'); // T.textFaint (AA, WI-34)
  });

  it('|gap| ≤ 10% → баланс (прозрачно)', () => {
    expect(gapTone(0).bg).toBe('transparent');
    expect(gapTone(0.09).bg).toBe('transparent');
    expect(gapTone(-0.09).bg).toBe('transparent');
  });

  it('дефицит 10..20% → янтарь, >20% → терракот', () => {
    expect(gapTone(0.15).bg).toBe('#fef3c7');  // T.warnTint
    expect(gapTone(0.25).bg).toBe('#fbe4dd');  // терракот
  });

  it('профицит → синий, сильнее при >20%', () => {
    expect(gapTone(-0.15).bg).toMatch(/^rgba\(46, 71, 215,/); // бренд-индиго ACCENT_RGB
    expect(alphaOf(gapTone(-0.25).bg)).toBeGreaterThan(alphaOf(gapTone(-0.15).bg));
  });
});

describe('gapIcon (не цвет — для доступности)', () => {
  it('баланс ●, дефицит ▲, профицит ▼', () => {
    expect(gapIcon(0)).toBe('●');
    expect(gapIcon(0.2)).toBe('▲');
    expect(gapIcon(-0.2)).toBe('▼');
    expect(gapIcon(null)).toBe('');
  });
});

describe('formatGap', () => {
  it('дефицит со знаком +, профицит с −', () => {
    expect(formatGap(cell(160, 200))).toBe('+40ч 25%');
    expect(formatGap(cell(160, 80))).toBe('-80ч 50%');
    expect(formatGap(cell(0, 0))).toBe('');
  });
});

// ─── Раздельный gap (вмещение ячейки: часы — главное, % — вторичное) ─────────
describe('formatGapHours / formatGapPctShort', () => {
  it('часы со знаком (+дефицит / −профицит), без %', () => {
    expect(formatGapHours(cell(160, 200))).toBe('+40ч');
    expect(formatGapHours(cell(160, 80))).toBe('-80ч');
    expect(formatGapHours(cell(0, 0))).toBe('');
  });
  it('% без знака (знак несут часы/иконка)', () => {
    expect(formatGapPctShort(cell(160, 200))).toBe('25%');
    expect(formatGapPctShort(cell(160, 80))).toBe('50%');
    expect(formatGapPctShort(cell(0, 0))).toBe('');
  });
});

// ─── colWidth (gap-режим шире — вмещает «−1112ч 83%» одной строкой) ──────────
describe('colWidth', () => {
  it('gap → расширенная, прочие → базовая', () => {
    expect(colWidth('gap')).toBe(COL_W_GAP);
    expect(colWidth('free')).toBe(COL_W);
    expect(colWidth('pct')).toBe(COL_W);
    expect(colWidth('plan')).toBe(COL_W);
    expect(COL_W_GAP).toBeGreaterThan(COL_W);
  });
});

// ─── childCell (метрика на ДОЧЕРНЕМ уровне — баг заказчика) ──────────────────
// Дочерняя строка (проект / план без проекта) должна СОГЛАСОВАННО менять значение
// при переключении метрики (Свободно / План / Gap / Загрузка %), а не «застывать»
// на плановых часах. v = плановые часы строки за период, capacity = ёмкость отдела.
describe('childCell (метрика проекта/плана внутри раскрытого отдела)', () => {
  it('plan → плановые часы строки', () => {
    expect(childCell('plan', 40, 160)).toBe('40');
  });

  it('pct → доля от ёмкости отдела', () => {
    expect(childCell('pct', 40, 160)).toBe('25%');
    expect(childCell('pct', 40, 0)).toBe(''); // нет ёмкости
    expect(childCell('pct', 40, undefined)).toBe('');
  });

  it('gap → +ч (строка увеличивает спрос → дефицит)', () => {
    expect(childCell('gap', 40, 160)).toBe('+40');
  });

  it('free → -ч (строка потребляет ёмкость → меньше свободно)', () => {
    expect(childCell('free', 40, 160)).toBe('-40');
  });

  it('каждая метрика даёт РАЗНЫЙ вывод для одних данных (не застывает)', () => {
    const outs = (['plan', 'pct', 'gap', 'free'] as const).map((m) => childCell(m, 40, 160));
    expect(new Set(outs).size).toBe(4); // все четыре различны
  });

  it('нулевой вклад → пусто на любой метрике', () => {
    for (const m of ['plan', 'pct', 'gap', 'free'] as const) {
      expect(childCell(m, 0, 160)).toBe('');
    }
  });
});

// ─── overbookTip (W6C.23 RG elastic-overtime: разбивка перегруза для тултипа) ──
describe('overbookTip', () => {
  it('нет конфликта → пусто (даже если load > capacity без флага)', () => {
    expect(overbookTip(cell(160, 200))).toBe(''); // conflict=false
  });

  it('конфликт → «Перегруз: спрос / ёмкость (+превышение)» по-русски, целые часы', () => {
    expect(overbookTip(overCell(160, 200))).toBe('Перегруз: 200 ч спрос / 160 ч ёмкость (+40 ч)');
  });

  it('округляет дробные часы', () => {
    expect(overbookTip(overCell(159.6, 200.4))).toBe('Перегруз: 200 ч спрос / 160 ч ёмкость (+41 ч)');
  });

  it('дробный перегруз < 1 ч → показывает «+1 ч» (не «+0 ч»)', () => {
    expect(overbookTip(overCell(160, 160.4))).toBe('Перегруз: 160 ч спрос / 160 ч ёмкость (+1 ч)');
  });
});
