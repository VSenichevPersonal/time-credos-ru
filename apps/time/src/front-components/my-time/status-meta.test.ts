import { describe, expect, it } from 'vitest';

import { ENTRY_STATUS } from 'src/constants/approval';
import { statusMeta } from './status-meta';

describe('statusMeta', () => {
  it('DRAFT → Черновик', () => {
    const m = statusMeta(ENTRY_STATUS.DRAFT);
    expect(m.label).toBe('Черновик');
    expect(m.fg).toBeTruthy();
    expect(m.bg).toBeTruthy();
  });

  it('SUBMITTED → На согласовании', () => {
    expect(statusMeta(ENTRY_STATUS.SUBMITTED).label).toBe('На согласовании');
  });

  it('APPROVED → Согласовано', () => {
    expect(statusMeta(ENTRY_STATUS.APPROVED).label).toBe('Согласовано');
  });

  it('REJECTED → Отклонено', () => {
    expect(statusMeta(ENTRY_STATUS.REJECTED).label).toBe('Отклонено');
  });

  it('неизвестный статус → fallback к DRAFT (не падает)', () => {
    const m = statusMeta('UNKNOWN' as never);
    expect(m.label).toBe('Черновик');
  });

  it('каждый статус имеет уникальную метку (SSOT-guard)', () => {
    const statuses = [
      ENTRY_STATUS.DRAFT,
      ENTRY_STATUS.SUBMITTED,
      ENTRY_STATUS.APPROVED,
      ENTRY_STATUS.REJECTED,
    ] as const;
    const labels = statuses.map((s) => statusMeta(s).label);
    expect(new Set(labels).size).toBe(statuses.length);
  });

  it('fg и bg все 4 статусов — непустые строки', () => {
    [ENTRY_STATUS.DRAFT, ENTRY_STATUS.SUBMITTED, ENTRY_STATUS.APPROVED, ENTRY_STATUS.REJECTED].forEach((s) => {
      const m = statusMeta(s);
      expect(typeof m.fg).toBe('string');
      expect(m.fg.length).toBeGreaterThan(0);
      expect(typeof m.bg).toBe('string');
      expect(m.bg.length).toBeGreaterThan(0);
    });
  });
});
