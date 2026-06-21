// backfill-work-type-name.mjs — разовый бэкфилл нового поля credosTimeWorkType.name
// (P1, FIELDS_COLUMNS_AUDIT §7).
//
// ЗАЧЕМ: у вида работ раньше не было собственного наименования — только group
// (SELECT) и department (RELATION). Виды в одной группе/отделе были НЕРАЗЛИЧИМЫ
// в реестре и пиклистах. Добавлено TEXT-поле `name` (labelIdentifier карточки).
// Существующие записи приходят с пустым name → нужно заполнить читаемым и
// РАЗЛИЧИМЫМ значением, иначе заголовки карточек/пики останутся одинаковыми.
//
// СЕМАНТИКА: title = «<метка группы>» + (если задан отдел) « · <код отдела>».
// (Слаг поля — `title`; «Наименование» в UI. См. credos-time-work-type.object.ts.)
// Если в одной группе+отделе несколько видов работ (коллизия) — добавляется
// порядковый суффикс « #2», « #3»… чтобы гарантировать различимость.
// Записи с уже заполненным name НЕ трогаются (идемпотентно).
//
// ЗАПУСК:
//   cd apps/time && set -a; source ../../.env; set +a
//   node src/scripts/backfill-work-type-name.mjs           # dry-run (только лог)
//   node src/scripts/backfill-work-type-name.mjs --apply    # реальная запись
//
// REST: $TWENTY_DEV_URL + Bearer $TWENTY_DEV_API_KEY (как dedup-entries.mjs).

const BASE = (process.env.TWENTY_DEV_URL ?? '').replace(/\/$/, '');
const KEY = process.env.TWENTY_DEV_API_KEY ?? '';
const APPLY = process.argv.includes('--apply');

const AUTH = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

// Метки групп — дублируют src/constants/labels.ts (WORK_TYPE_GROUP_LABELS).
// .mjs не импортирует TS; держим минимальную копию, синхронную с источником.
export const GROUP_LABELS = {
  production: 'Производственная',
  projectManagement: 'Управление проектом',
  presale: 'Пресейл',
  meetings: 'Совещания/процессные',
  training: 'Обучение',
  internal: 'Внутренние/инфраструктура',
};

const get = async (path, query) => {
  const qs = new URLSearchParams(query).toString();
  const r = await fetch(`${BASE}${path}?${qs}`, { headers: AUTH });
  if (!r.ok) throw new Error(`GET ${path} -> ${r.status} ${await r.text()}`);
  return r.json();
};
const patch = async (path, body) => {
  const r = await fetch(`${BASE}${path}`, { method: 'PATCH', headers: AUTH, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`PATCH ${path} -> ${r.status} ${await r.text()}`);
  return r.json().catch(() => ({}));
};

// Курсорный сбор всех видов работ.
const fetchAllWorkTypes = async () => {
  const all = [];
  let cursor = null;
  for (let i = 0; i < 1000; i++) {
    const q = { limit: '60', orderBy: 'id[AscNullsFirst]' };
    if (cursor) q.starting_after = cursor;
    const j = await get('/rest/credosTimeWorkTypes', q);
    const rows = j.data?.credosTimeWorkTypes ?? [];
    all.push(...rows);
    const pi = j.pageInfo ?? j.data?.pageInfo;
    cursor = pi?.endCursor;
    if (!pi?.hasNextPage || rows.length === 0) break;
  }
  return all;
};

// --- Чистые хелперы (экспортируются для unit-тестов) ---
export const isBlank = (s) => s === null || s === undefined || String(s).trim() === '';
export const groupLabel = (group) => GROUP_LABELS[group] ?? (group ? String(group) : 'Вид работ');

// Базовое имя из группы (+код отдела, если есть). deptCode — короткий код отдела
// или null. base детерминирован, суффикс различимости добавляется в plan.
export const baseName = (wt) => {
  const label = groupLabel(wt.group);
  const dept = wt.departmentCode ?? null;
  return dept ? `${label} · ${dept}` : label;
};

// Планирует бэкфилл: для записей с пустым title строит уникальное имя.
// Коллизии (одинаковый base в группе с пустыми именами) разводятся суффиксом #N.
// Возвращает [{ id, name }] только для записей, требующих обновления (name —
// целевое значение, пишется в поле `title`).
export const planBackfill = (workTypes) => {
  // Занятые имена (уже заполненные title) — чтобы новые не совпали.
  const used = new Set();
  for (const wt of workTypes) {
    if (!isBlank(wt.title)) used.add(String(wt.title).trim());
  }
  const plan = [];
  for (const wt of workTypes) {
    if (!isBlank(wt.title)) continue;
    const base = baseName(wt);
    let name = base;
    let n = 2;
    while (used.has(name)) {
      name = `${base} #${n}`;
      n += 1;
    }
    used.add(name);
    plan.push({ id: wt.id, name });
  }
  return plan;
};

const main = async () => {
  if (!BASE || !KEY) {
    console.error('Нет TWENTY_DEV_URL / TWENTY_DEV_API_KEY (source ../../.env).');
    process.exit(1);
  }
  console.log(`[backfill-name] режим: ${APPLY ? 'APPLY (реальная запись)' : 'DRY-RUN'}`);
  const workTypes = await fetchAllWorkTypes();
  console.log(`[backfill-name] всего видов работ: ${workTypes.length}`);

  const plan = planBackfill(workTypes);
  console.log(`[backfill-name] требуют заполнения name: ${plan.length}`);

  if (plan.length === 0) {
    console.log('[backfill-name] все виды работ уже имеют name — нечего делать.');
    return;
  }

  for (const p of plan) {
    console.log(`[backfill-name] ${p.id} → name="${p.name}"`);
    if (APPLY) await patch(`/rest/credosTimeWorkTypes/${p.id}`, { title: p.name });
  }

  console.log(
    `[backfill-name] ${APPLY ? 'ЗАПИСАНО' : 'будет записано'}: ${plan.length} видов работ.`,
  );
  if (!APPLY) console.log('[backfill-name] это dry-run. Запусти с --apply для записи.');
};

// Авто-запуск только при прямом вызове из CLI (не при import в тестах).
const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv?.[1] &&
  import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  main().catch((e) => {
    console.error('[backfill-name] ОШИБКА:', e.message);
    process.exit(1);
  });
}
