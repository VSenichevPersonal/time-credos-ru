// Сериализация состояния вида «Отчёты» для per-user persist (итер.127 #2).
//
// КОНТЕКСТ-ОГРАНИЧЕНИЕ (research §9, PLAYBOOK): front-component живёт в песочнице
// Web Worker Remote DOM — НЕТ localStorage/sessionStorage/window, а SDK
// front-component НЕ отдаёт per-user storage / view-state / preferences API
// (см. twenty-sdk/front-component: только useUserId/navigate). Реального дешёвого
// канала хранения состояния между сессиями сейчас нет. Поэтому здесь — лишь ЧИСТЫЙ
// сериализатор: компактная строка ↔ состояние вида. Он:
//   · тестируется без React/host (требование задачи: тесты чистым функциям);
//   · готовит почву для будущего persist (per-user объект в RBAC-волну, либо
//     view-state API, если Twenty его добавит) — тогда останется лишь подключить
//     transport (GET/PATCH stateJson по userWorkspaceRef-мосту, CISO-005);
//   · НЕ тянет backend сейчас — на каждый чих писать REST-запись дорого и шумно
//     ([[keep-it-simple]]), решение развилки «дёшево нельзя → не строить силой».
//
// Сохраняем НЕДОРОГОЙ срез состояния: режим вида, гранулярность+смещение периода,
// срез группировки, пресет утилизации, фильтр категорий, путь drill (значения по
// осям — лейблы НЕ храним, они реконструируются из данных при восстановлении).

import type { GroupBy } from 'src/front-components/reports/report-types';
import type { PeriodGran } from 'src/front-components/reports/use-period';

export type ReportView = 'summary' | 'trend' | 'projects' | 'missing';

// Drill-уровень в персисте: только ось+значение (лейблы — из данных, не храним).
export type DrillCrumbPersist = { dim: string; value: string };

export type ReportViewState = {
  view: ReportView;
  gran: PeriodGran;
  offset: number; // 0 = текущий период, <0 = прошлые (в будущее не уходим)
  groupBy: GroupBy;
  utilPreset: boolean;
  catFilter: string[]; // отсортированные значения категорий
  drill: DrillCrumbPersist[]; // путь провала (оси/значения), [] = корень
};

// Версия схемы — на случай эволюции формата (миграция старых строк → дефолт).
const SCHEMA_VERSION = 1;

const VIEWS: ReportView[] = ['summary', 'trend', 'projects', 'missing'];
const GRANS: PeriodGran[] = ['month', 'quarter', 'year'];
const GROUPS: GroupBy[] = ['dept', 'project', 'employee'];

export const DEFAULT_VIEW_STATE: ReportViewState = {
  view: 'summary',
  gran: 'month',
  offset: 0,
  groupBy: 'dept',
  utilPreset: false,
  catFilter: [],
  drill: [],
};

const isView = (v: unknown): v is ReportView => VIEWS.includes(v as ReportView);
const isGran = (v: unknown): v is PeriodGran => GRANS.includes(v as PeriodGran);
const isGroup = (v: unknown): v is GroupBy => GROUPS.includes(v as GroupBy);

// Нормализация offset: целое, не положительное (в будущее период не уходит).
const normOffset = (v: unknown): number => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return 0;
  const i = Math.trunc(v);
  return i > 0 ? 0 : i;
};

// Строка непустой длины ≤ 256 (защита от мусора/раздувания stateJson).
const isStr = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0 && v.length <= 256;

const sanitizeDrill = (v: unknown): DrillCrumbPersist[] => {
  if (!Array.isArray(v)) return [];
  const out: DrillCrumbPersist[] = [];
  for (const item of v) {
    if (
      item &&
      typeof item === 'object' &&
      isStr((item as { dim?: unknown }).dim) &&
      isStr((item as { value?: unknown }).value)
    ) {
      out.push({
        dim: (item as { dim: string }).dim,
        value: (item as { value: string }).value,
      });
    }
    if (out.length >= 8) break; // глубина drill практически ограничена осями
  }
  return out;
};

const sanitizeCats = (v: unknown): string[] => {
  if (!Array.isArray(v)) return [];
  const uniq = new Set<string>();
  for (const c of v) if (isStr(c)) uniq.add(c);
  return [...uniq].sort(); // детерминированный порядок (стабильная сериализация)
};

// Состояние → компактная JSON-строка (для записи в stateJson / queryParam).
// Детерминирована при равных входах (catFilter сортируется), чтобы не плодить
// лишние записи при одинаковом наборе фильтров в другом порядке.
export const serializeViewState = (s: ReportViewState): string =>
  JSON.stringify({
    v: SCHEMA_VERSION,
    view: s.view,
    gran: s.gran,
    offset: normOffset(s.offset),
    groupBy: s.groupBy,
    util: s.utilPreset,
    cats: sanitizeCats(s.catFilter),
    drill: sanitizeDrill(s.drill),
  });

// Строка → состояние. ЛЮБОЙ невалидный/чужой/устаревший вход → DEFAULT_VIEW_STATE
// (никогда не кидает — восстановление не должно ронять дашборд).
export const deserializeViewState = (raw: unknown): ReportViewState => {
  if (typeof raw !== 'string' || raw.length === 0) return DEFAULT_VIEW_STATE;
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return DEFAULT_VIEW_STATE;
  }
  if (!obj || typeof obj !== 'object') return DEFAULT_VIEW_STATE;
  const o = obj as Record<string, unknown>;
  if (o.v !== SCHEMA_VERSION) return DEFAULT_VIEW_STATE; // чужая версия схемы
  const d = DEFAULT_VIEW_STATE;
  return {
    view: isView(o.view) ? o.view : d.view,
    gran: isGran(o.gran) ? o.gran : d.gran,
    offset: normOffset(o.offset),
    groupBy: isGroup(o.groupBy) ? o.groupBy : d.groupBy,
    utilPreset: typeof o.util === 'boolean' ? o.util : d.utilPreset,
    catFilter: sanitizeCats(o.cats),
    drill: sanitizeDrill(o.drill),
  };
};
