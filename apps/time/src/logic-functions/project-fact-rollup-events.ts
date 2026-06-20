import type { DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { recalcProjects } from './project-fact-rollup';

// Общие хендлеры database-event триггеров пересчёта rollup-поля проекта
// (factHours/budgetRemaining). Вынесены сюда, чтобы три файла-функции
// (created/updated/deleted — SDK требует один defineLogicFunction на файл)
// делили одну логику.
//
// /s/time-entry уже пересчитывает rollup на своих upsert/delete, НО запись можно
// изменить и МИМО него: CSV-импорт, прямое редактирование в гриде Twenty, любой
// REST/GraphQL-вызов. Эти пути не дёргают /s/time-entry → хранимое factHours
// дрейфует (баг заказчика: пустые «Факт/Остаток»). Триггеры на created/updated/
// deleted ловят ВСЕ пути → дрейфа нет by design.
//
// Пересчёт идемпотентен (полный Σ из источника, не дельта): повтор события или
// двойной вызов (триггер + /s/time-entry) дают тот же результат.

// Запись трудозатрат в payload события. projectId — join-колонка relation проекта.
type EntryRecord = { projectId?: string | null };

const projectIdOf = (rec: EntryRecord | undefined | null): string | null =>
  rec?.projectId ?? null;

export const onEntryCreated = async (
  event: DatabaseEventPayload,
): Promise<{ ok: boolean; recalced: number }> => {
  const after = event.properties.after as EntryRecord | undefined;
  return { ok: true, recalced: await recalcProjects([projectIdOf(after)]) };
};

// updated: пересчитать старый И новый проект (смена проекта/часов записи).
// recalcProjects дедуплицирует — если проект не менялся, пересчёт один.
export const onEntryUpdated = async (
  event: DatabaseEventPayload,
): Promise<{ ok: boolean; recalced: number }> => {
  const before = event.properties.before as EntryRecord | undefined;
  const after = event.properties.after as EntryRecord | undefined;
  return { ok: true, recalced: await recalcProjects([projectIdOf(before), projectIdOf(after)]) };
};

export const onEntryDeleted = async (
  event: DatabaseEventPayload,
): Promise<{ ok: boolean; recalced: number }> => {
  const before = event.properties.before as EntryRecord | undefined;
  return { ok: true, recalced: await recalcProjects([projectIdOf(before)]) };
};

// Обёртка: ошибка пересчёта не валит обработку события (лог + ok:false).
export const wrapEvent =
  (fn: (e: DatabaseEventPayload) => Promise<{ ok: boolean; recalced: number }>) =>
  async (event: DatabaseEventPayload): Promise<object> => {
    try {
      return await fn(event);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(
        '[project-fact-rollup] пересчёт factHours: %s',
        e instanceof Error ? e.message : String(e),
      );
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  };
