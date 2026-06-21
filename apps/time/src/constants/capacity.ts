// SSOT коэффициента ёмкости (capacityFactor). До этого жили 3 разных fallback:
// reports-calc `?? 1`, calc-load `?? 0.8`, настройка defaultCapacityFactor=0.8 —
// норма/ёмкость расходились. Единый источник: значение отдела ?? настройка ?? константа.
//
// Совпадает с defaultValue полей: credos-time-department.capacityFactor = 0.8 и
// credos-time-settings.defaultCapacityFactor = 0.8 (hard-fallback на случай null).

// Жёсткий fallback, когда не задан ни factor отдела, ни настройка воркспейса.
export const DEFAULT_CAPACITY_FACTOR = 0.8;

// Единый резолв коэффициента ёмкости:
//   factor отдела ?? defaultCapacityFactor из настроек ?? DEFAULT_CAPACITY_FACTOR.
// Использовать ВЕЗДЕ, где считается норма/ёмкость (reports-calc, calc-load).
export const resolveCapacityFactor = (
  deptCapacityFactor: number | null | undefined,
  settingsDefault: number | null | undefined = null,
): number => deptCapacityFactor ?? settingsDefault ?? DEFAULT_CAPACITY_FACTOR;
