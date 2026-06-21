import { describe, expect, it } from 'vitest';

// P1 (FIELDS_COLUMNS_AUDIT §7): тест чистой логики бэкфилла WorkType.name.
// Проверяет различимость (суффикс #N при коллизии), идемпотентность (не трогает
// заполненные), формат имени из группы + кода отдела. Сеть не затрагивается.
import {
  baseName,
  groupLabel,
  isBlank,
  planBackfill,
} from './backfill-work-type-name.mjs';

const wt = (over: Record<string, unknown> = {}) => ({
  id: 'wt-' + Math.random().toString(36).slice(2),
  group: 'production',
  title: null,
  departmentCode: null,
  ...over,
});

describe('isBlank', () => {
  it('пустые значения = blank', () => {
    expect(isBlank(null)).toBe(true);
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank('   ')).toBe(true);
  });
  it('непустая строка = не blank', () => {
    expect(isBlank('Разработка')).toBe(false);
  });
});

describe('groupLabel', () => {
  it('маппит известную группу на русскую метку', () => {
    expect(groupLabel('production')).toBe('Производственная');
    expect(groupLabel('presale')).toBe('Пресейл');
  });
  it('неизвестная/пустая группа → безопасный фолбэк', () => {
    expect(groupLabel('unknown')).toBe('unknown');
    expect(groupLabel(null)).toBe('Вид работ');
  });
});

describe('baseName', () => {
  it('без отдела = только метка группы', () => {
    expect(baseName(wt({ group: 'training' }))).toBe('Обучение');
  });
  it('с отделом = метка · код отдела', () => {
    expect(baseName(wt({ group: 'production', departmentCode: 'ОИБ' }))).toBe(
      'Производственная · ОИБ',
    );
  });
});

describe('planBackfill', () => {
  it('заполняет только пустые title', () => {
    const rows = [
      wt({ id: 'a', title: 'Готовое имя' }),
      wt({ id: 'b', title: null }),
    ];
    const plan = planBackfill(rows);
    expect(plan).toHaveLength(1);
    expect(plan[0].id).toBe('b');
  });

  it('разводит коллизии суффиксом #N → имена различимы', () => {
    const rows = [
      wt({ id: 'a', group: 'production' }),
      wt({ id: 'b', group: 'production' }),
      wt({ id: 'c', group: 'production' }),
    ];
    const plan = planBackfill(rows);
    const names = plan.map((p) => p.name);
    expect(new Set(names).size).toBe(3); // все уникальны
    expect(names).toContain('Производственная');
    expect(names).toContain('Производственная #2');
    expect(names).toContain('Производственная #3');
  });

  it('не конфликтует с уже занятым именем', () => {
    const rows = [
      wt({ id: 'a', group: 'training', title: 'Обучение' }),
      wt({ id: 'b', group: 'training', title: null }),
    ];
    const plan = planBackfill(rows);
    expect(plan[0].name).toBe('Обучение #2');
  });

  it('пустой вход → пустой план', () => {
    expect(planBackfill([])).toEqual([]);
  });
});
