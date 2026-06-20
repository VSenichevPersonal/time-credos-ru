// CISO-006: валидация client-supplied params ПЕРЕД интерполяцией в Twenty REST
// filter-строки. В Twenty REST запятая = разделитель условий фильтра, а
// URLSearchParams не экранирует значение → строка вида `...,someField[eq]:x`
// инъектирует лишние условия. Этот модуль — чистый (без SDK/SDK-импортов), чтобы
// переиспользоваться всеми logic-functions (reports / time-entry-api / approval)
// и покрываться unit-тестами без рантайма песочницы.

// ISO-date (YYYY-MM-DD) или ISO-datetime (…THH:MM:SS[.sss]Z).
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/;
export const isIsoDate = (v: string): boolean => ISO_DATE.test(v);

// UUID (8-4-4-4-12 hex). Для employeeId / id / workspaceMemberRef.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string): boolean => UUID.test(v);

// from/to: отсутствует/пусто → дефолт горизонта; присутствует и невалиден → throw
// (НЕ молчаливый фолбэк на «всё время» — иначе инъекция-попытка расширила бы
// выборку на все данные вместо отказа). Бросок ловит handler → { ok: false }.
export const validDateParam = (raw: string | undefined, fallback: string): string => {
  if (raw == null || raw === '') return fallback;
  if (!isIsoDate(raw)) throw new Error('invalid date parameter');
  return raw;
};

// Опциональный UUID-параметр: отсутствует → null; присутствует и невалиден → throw.
export const validUuidParam = (raw: string | undefined): string | null => {
  if (raw == null || raw === '') return null;
  if (!isUuid(raw)) throw new Error('invalid id parameter');
  return raw;
};
