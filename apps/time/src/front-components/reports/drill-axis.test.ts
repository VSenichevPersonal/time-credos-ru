import { describe, expect, it } from 'vitest';

import { dimLabel, nextAxis, valueLabel } from './drill-axis';
import type { OlapDim } from './olap-types';

// ─── dimLabel ────────────────────────────────────────────────────────────────

describe('dimLabel', () => {
  it('все 7 осей имеют русские ярлыки', () => {
    const dims: OlapDim[] = ['dept', 'employee', 'project', 'workType', 'workTypeGroup', 'category', 'stage'];
    for (const d of dims) {
      const label = dimLabel(d);
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    }
  });

  it('dept → «Отдел»', () => expect(dimLabel('dept')).toBe('Отдел'));
  it('category → «Категория»', () => expect(dimLabel('category')).toBe('Категория'));
  it('неизвестная ось → возвращает ось как есть (деградация)', () => {
    expect(dimLabel('unknown' as OlapDim)).toBe('unknown');
  });
});

// ─── nextAxis ────────────────────────────────────────────────────────────────

describe('nextAxis', () => {
  it('dept → project (первый предпочтительный)', () => {
    expect(nextAxis('dept', ['dept', 'project', 'employee'])).toBe('project');
  });

  it('dept → employee если project недоступен', () => {
    expect(nextAxis('dept', ['employee', 'workType'])).toBe('employee');
  });

  it('drillable пуст → null', () => {
    expect(nextAxis('dept', [])).toBeNull();
  });

  it('все кандидаты отфильтрованы → null', () => {
    // dept хочет project/employee/category, но только stage доступен
    expect(nextAxis('dept', ['stage'])).toBeNull();
  });

  it('stage всегда фильтруется из drillable (не предлагается)', () => {
    expect(nextAxis('workTypeGroup', ['stage', 'workType'])).toBe('workType');
  });

  it('project → employee если оба доступны', () => {
    expect(nextAxis('project', ['employee', 'workType', 'category'])).toBe('employee');
  });

  it('employee → project если employee недоступен', () => {
    expect(nextAxis('employee', ['project'])).toBe('project');
  });
});

// ─── valueLabel ──────────────────────────────────────────────────────────────

describe('valueLabel', () => {
  it('category: возвращает label из categoryMeta (известная категория)', () => {
    const label = valueLabel('category', 'CLIENT', 'CLIENT');
    expect(typeof label).toBe('string');
    expect(label.length).toBeGreaterThan(0);
  });

  it('dept: display непустой → возвращает display или departmentLabel', () => {
    const label = valueLabel('dept', 'dept-id', 'ОПИБ');
    expect(typeof label).toBe('string');
    expect(label.length).toBeGreaterThan(0);
  });

  it('другие оси: возвращает display если непустой', () => {
    expect(valueLabel('project', 'proj-id', 'Проект А')).toBe('Проект А');
    expect(valueLabel('employee', 'emp-id', 'Иванов Иван')).toBe('Иванов Иван');
  });

  it('другие оси: display пустой → fallback на value', () => {
    expect(valueLabel('workType', 'wt-id', '')).toBe('wt-id');
  });
});
