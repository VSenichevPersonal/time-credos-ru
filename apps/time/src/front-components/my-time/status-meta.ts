import { ENTRY_STATUS, type EntryStatusCode } from 'src/constants/approval';
import { T } from 'src/front-components/grid/tokens';

// REQ-0014: метка + тон статуса периода (UPPER_CASE-код БД → русская подпись).
// SSOT русских подписей — labels.ts (ключи PascalCase), здесь мостим UPPER_CASE.

export type StatusMeta = { label: string; fg: string; bg: string };

const META: Record<EntryStatusCode, StatusMeta> = {
  [ENTRY_STATUS.DRAFT]: { label: 'Черновик', fg: T.textMuted, bg: T.headerBg },
  [ENTRY_STATUS.SUBMITTED]: { label: 'На согласовании', fg: T.accent, bg: T.accentSoft },
  [ENTRY_STATUS.APPROVED]: { label: 'Согласовано', fg: T.ok, bg: T.okSoft },
  [ENTRY_STATUS.REJECTED]: { label: 'Отклонено', fg: T.over, bg: T.overSoft },
};

export const statusMeta = (status: EntryStatusCode): StatusMeta =>
  META[status] ?? META[ENTRY_STATUS.DRAFT];
