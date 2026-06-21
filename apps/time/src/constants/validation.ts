// gap-аудит v3 #4 — правила валидации таймшита как ДАННЫЕ + уровни.
// SSOT уровней (Ошибка/Предупреждение) и кодов правил. Сверка: Timetta
// `settings-time-accounting-timesheet-validation-rules` — два уровня:
//   · Ошибка (error)        — обязан устранить ДО отправки → блок операции;
//   · Предупреждение (warn) — система уведомляет, но позволяет отправить.
// Здесь минимальный набор (3 правила), не полный движок 10 правил Timetta.
// Пороги — данные из credosTimeSettings (singleton), не хардкод в logic.

// Уровень нарушения. SSOT — потребляют logic (блок vs флаг) и front (цвет).
export const VALIDATION_LEVEL = {
  ERROR: 'error',
  WARNING: 'warning',
} as const;

export type ValidationLevel =
  (typeof VALIDATION_LEVEL)[keyof typeof VALIDATION_LEVEL];

// Коды правил (тип правила Timetta → наш стабильный код). Соглашение уровней:
//   · превышение лимита часов/день → ERROR (блок ввода, целостность табеля);
//   · переработка сверх порога     → WARNING (флаг, не блок);
//   · недобор недельной нормы       → WARNING (флаг, не блок).
export const VALIDATION_CODE = {
  MAX_HOURS_PER_DAY: 'max_hours_per_day',
  OVERTIME_PER_DAY: 'overtime_per_day',
  MIN_HOURS_PER_WEEK: 'min_hours_per_week',
  // WI-52 / W5C.27: запись с hours<=0 (или пусто/NaN) не хранится — занимала бы
  // уникальный ключ (emp,proj,wt,date), блокируя реальную запись, но в факт не идёт.
  POSITIVE_HOURS_REQUIRED: 'positive_hours_required',
} as const;

export type ValidationCode =
  (typeof VALIDATION_CODE)[keyof typeof VALIDATION_CODE];

// Структурный результат одного нарушения (возвращается из validateEntry в
// массиве). message — готовый русский текст для пользователя/ответа API.
export type ValidationFinding = {
  level: ValidationLevel;
  code: ValidationCode;
  message: string;
};

// Дефолты порогов = дефолты полей credosTimeSettings (back-compat, если запись
// настроек не сидирована или поле пустое). HOURS_MAX historically = 24.
export const VALIDATION_DEFAULTS = {
  maxHoursPerDay: 24, // лимит часов/день (ERROR при превышении)
  overtimeWarnHours: 12, // порог переработки/день (WARNING) — уже в settings
  minHoursPerWeek: 0, // недобор недельной нормы (WARNING); 0 = выключено
} as const;

// Пороги валидации (срез credosTimeSettings, передаётся в чистые функции).
export type ValidationThresholds = {
  maxHoursPerDay: number;
  overtimeWarnHours: number;
  minHoursPerWeek: number;
};

// Срез одной записи трудозатрат для дневной валидации.
export type EntryToValidate = {
  hours: number;
};

// Чистая валидация ОДНОЙ записи (часы за день). Тестируемо, без сети/БД.
// Возвращает массив нарушений (может быть пустым). Семантика:
//   · hours < 0 или NaN          → ERROR max_hours_per_day («некорректно»);
//   · hours > maxHoursPerDay     → ERROR max_hours_per_day (блок);
//   · hours > overtimeWarnHours  → WARNING overtime_per_day (флаг, не блок).
// Лимит и переработка независимы: при hours между порогом и лимитом — только
// WARNING; выше лимита — ERROR (переработку не дублируем, лимит важнее).
export const validateEntry = (
  entry: EntryToValidate,
  thresholds: ValidationThresholds,
): ValidationFinding[] => {
  const findings: ValidationFinding[] = [];
  const { hours } = entry;
  const maxHours = thresholds.maxHoursPerDay;
  const overtime = thresholds.overtimeWarnHours;

  if (Number.isNaN(hours) || hours < 0 || hours > maxHours) {
    findings.push({
      level: VALIDATION_LEVEL.ERROR,
      code: VALIDATION_CODE.MAX_HOURS_PER_DAY,
      message: `Часы за день должны быть в диапазоне 0…${maxHours} ч`,
    });
    return findings; // лимит превышен → переработку не проверяем (она ниже лимита)
  }

  if (overtime > 0 && hours > overtime) {
    findings.push({
      level: VALIDATION_LEVEL.WARNING,
      code: VALIDATION_CODE.OVERTIME_PER_DAY,
      message: `Переработка: ${hours} ч за день превышает порог ${overtime} ч`,
    });
  }

  return findings;
};

// Чистая проверка недельного недобора (WARNING). weekHours — сумма часов за
// неделю; minHoursPerWeek — порог нормы. 0/отрицательный порог = правило
// выключено. Сверка: Timetta «отклонение от расписания» (недобор → warn).
export const validateWeekUnderfill = (
  weekHours: number,
  minHoursPerWeek: number,
): ValidationFinding | null => {
  if (minHoursPerWeek <= 0) return null;
  if (weekHours >= minHoursPerWeek) return null;
  const missing = Math.round((minHoursPerWeek - weekHours) * 10) / 10;
  return {
    level: VALIDATION_LEVEL.WARNING,
    code: VALIDATION_CODE.MIN_HOURS_PER_WEEK,
    message: `Недобор недельной нормы: ${weekHours} из ${minHoursPerWeek} ч (не хватает ${missing} ч)`,
  };
};

// WI-52 / W5C.27: запись трудозатрат требует положительных часов. hours<=0 / пусто
// / NaN → ERROR (не сохранять пустую запись — иначе она держит уникальный ключ
// (emp,proj,wt,date) и блокирует реальную, но в факт не попадает: reports-calc
// делает `if (hours===0) continue`). Отдельно от validateEntry (там 0 — валидный
// «низ диапазона», а WARNING/ERROR — про лимит/переработку): пустую запись надо
// УДАЛЯТЬ (или не создавать) на стороне UI, а на сервере явно отклонять как ERROR.
// Чистая, тестируемая. Возвращает finding или null (часы корректны и > 0).
export const validatePositiveHours = (hours: number): ValidationFinding | null => {
  if (Number.isFinite(hours) && hours > 0) return null;
  return {
    level: VALIDATION_LEVEL.ERROR,
    code: VALIDATION_CODE.POSITIVE_HOURS_REQUIRED,
    message: 'Часы должны быть больше 0 (пустую запись не сохраняем — удалите её)',
  };
};

// Есть ли среди нарушений блокирующее (ERROR). Хелпер для logic (block vs pass).
export const hasBlockingError = (findings: ValidationFinding[]): boolean =>
  findings.some((f) => f.level === VALIDATION_LEVEL.ERROR);
