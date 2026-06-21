#!/usr/bin/env node
/**
 * Мини-сид ОТСУТСТВИЙ (credosTimeAbsence, F-D), чтобы раздел «Отсутствия»
 * не пустовал. Создаёт ~11 отсутствий (отпуска/больничные/без содержания/иное)
 * на разных сотрудников, даты в окне июнь–сентябрь 2026.
 *
 * Поля отсутствия:
 *   absenceType — SELECT, значения UPPER_CASE (VACATION/SICK/UNPAID/OTHER),
 *                 совпадают с ABSENCE_TYPE_OPTIONS из src/constants/select-options.ts.
 *   startDate / endDate — DATE_TIME (ISO), период [start, end].
 *   note — TEXT (опц.), русское примечание.
 *   employeeId — связь Absence.employee -> Employee (реальные id из
 *                GET /rest/credosTimeEmployees).
 *
 * ИДЕМПОТЕНТНО: ключ = `${employeeId}|${absenceType}|${startDate(10)}`.
 *   Перед созданием грузим все отсутствия и пропускаем совпадающие по ключу.
 *   Повторный прогон не плодит дубли.
 * ДЕТЕРМИНИРОВАННО: сотрудники выбираются по стабильной сортировке id (с непустым
 *   name), без Math.random — один и тот же набор при каждом прогоне.
 *
 * ВАЖНО: объект credosTimeAbsence должен быть задеплоен на сервер
 *   (`yarn twenty dev`). До деплоя endpoint /rest/credosTimeAbsences вернёт 400/404 —
 *   скрипт это обнаружит и аккуратно завершится с подсказкой.
 *
 * Доступ: cd apps/time; set -a; source ../../.env; set +a; node scripts/seed-absences.mjs
 */

const BASE = process.env.TWENTY_DEV_URL;
const KEY = process.env.TWENTY_DEV_API_KEY;
if (!BASE || !KEY) {
  console.error('Нет TWENTY_DEV_URL / TWENTY_DEV_API_KEY. set -a; source ../../.env; set +a');
  process.exit(1);
}

const H = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RATE_MS = 700;
let lastReq = 0;
async function throttle() {
  const wait = RATE_MS - (Date.now() - lastReq);
  if (wait > 0) await sleep(wait);
  lastReq = Date.now();
}

async function send(method, path, body, retries = 5) {
  await throttle();
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${BASE}${path}`, {
      method, headers: H, body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.ok) return res.json().catch(() => ({}));
    if (res.status === 429 && attempt < retries) {
      console.log(`  429 — пауза 60с (попытка ${attempt + 1})`);
      await sleep(61000); lastReq = Date.now(); continue;
    }
    const txt = await res.text().catch(() => '');
    throw new Error(`${method} ${path} -> ${res.status}: ${txt.slice(0, 300)}`);
  }
}

async function getAll(plural) {
  const out = [];
  let cursor = null;
  for (let i = 0; i < 60; i++) {
    const u = new URL(`${BASE}/rest/${plural}`);
    u.searchParams.set('limit', '60');
    if (cursor) u.searchParams.set('starting_after', cursor);
    await throttle();
    const r = await fetch(u, { headers: H });
    const j = await r.json();
    const d = j.data || j;
    let recs = d[plural] || d.records || d;
    if (recs && recs.records) recs = recs.records;
    if (!Array.isArray(recs)) recs = [];
    out.push(...recs);
    const pi = j.pageInfo || (d && d.pageInfo);
    if (!pi || !pi.hasNextPage || recs.length === 0) break;
    cursor = pi.endCursor || recs[recs.length - 1].id;
  }
  return out;
}

// Валидные значения SELECT absenceType (UPPER_CASE) — синхронно с ABSENCE_TYPE_OPTIONS.
const TYPE = { VACATION: 'VACATION', SICK: 'SICK', UNPAID: 'UNPAID', OTHER: 'OTHER' };

// Рабочее «сегодня» (см. контекст 2026-06-20). Часть отсутствий в прошлом,
// часть текущие, часть будущие — чтобы раздел выглядел живым.
const at = (y, m, d, h) =>
  new Date(Date.UTC(y, m - 1, d, h ?? 9, 0, 0)).toISOString();

// План отсутствий §6: idx — индекс сотрудника в детерминированном списке.
// ~16 записей: ~10 отпусков (концентрация в АВГУСТЕ — сезон, снижает capacity августа),
// ~4 больничных (июл–сен), ~2 без содержания/иное + 1–2 коротких отпуска в H1
// (просадка нормы факта у пары людей). Июнь–сентябрь 2026.
const PLAN = [
  // H1 — короткие отпуска
  { idx: 14, type: TYPE.VACATION, start: at(2026, 2, 9, 9),   end: at(2026, 2, 13, 18), note: 'Отпуск (зимняя часть)' },
  { idx: 15, type: TYPE.VACATION, start: at(2026, 4, 13, 9),  end: at(2026, 4, 17, 18), note: 'Отпуск (весенняя часть)' },
  // Горизонт июн–сен
  { idx: 0,  type: TYPE.VACATION, start: at(2026, 6, 23, 9),  end: at(2026, 7, 6, 18),  note: 'Ежегодный оплачиваемый отпуск' },
  { idx: 1,  type: TYPE.SICK,     start: at(2026, 6, 16, 9),  end: at(2026, 6, 20, 18), note: 'Больничный лист' },
  { idx: 2,  type: TYPE.VACATION, start: at(2026, 7, 13, 9),  end: at(2026, 7, 26, 18), note: 'Отпуск, основная часть' },
  { idx: 3,  type: TYPE.UNPAID,   start: at(2026, 6, 29, 9),  end: at(2026, 6, 30, 18), note: 'Отпуск без сохранения зарплаты' },
  { idx: 4,  type: TYPE.OTHER,    start: at(2026, 7, 1, 9),   end: at(2026, 7, 3, 18),  note: 'Командировка' },
  // АВГУСТ — пик отпусков (capacity августа ниже июля у затронутых отделов)
  { idx: 5,  type: TYPE.VACATION, start: at(2026, 8, 3, 9),   end: at(2026, 8, 14, 18), note: 'Летний отпуск' },
  { idx: 6,  type: TYPE.SICK,     start: at(2026, 7, 20, 9),  end: at(2026, 7, 24, 18), note: 'Больничный (ОРВИ)' },
  { idx: 7,  type: TYPE.VACATION, start: at(2026, 8, 17, 9),  end: at(2026, 8, 28, 18), note: 'Ежегодный отпуск' },
  { idx: 16, type: TYPE.VACATION, start: at(2026, 8, 3, 9),   end: at(2026, 8, 14, 18), note: 'Летний отпуск' },
  { idx: 17, type: TYPE.VACATION, start: at(2026, 8, 10, 9),  end: at(2026, 8, 21, 18), note: 'Летний отпуск' },
  { idx: 18, type: TYPE.VACATION, start: at(2026, 8, 24, 9),  end: at(2026, 9, 4, 18),  note: 'Отпуск на стыке месяцев' },
  { idx: 8,  type: TYPE.UNPAID,   start: at(2026, 9, 1, 9),   end: at(2026, 9, 2, 18),  note: 'Отпуск за свой счёт' },
  { idx: 9,  type: TYPE.OTHER,    start: at(2026, 9, 7, 9),   end: at(2026, 9, 9, 18),  note: 'Обучение / повышение квалификации' },
  { idx: 10, type: TYPE.SICK,     start: at(2026, 9, 14, 9),  end: at(2026, 9, 18, 18), note: 'Больничный лист' },
];

const keyOf = (employeeId, type, startISO) =>
  `${employeeId}|${type}|${startISO.slice(0, 10)}`;

async function run() {
  console.log(`Сервер: ${BASE}`);

  // Проверка, что объект отсутствий задеплоен.
  await throttle();
  const probe = await fetch(`${BASE}/rest/credosTimeAbsences?limit=1`, { headers: H });
  if (probe.status === 400 || probe.status === 404) {
    console.error(
      `\nОбъект credosTimeAbsence ещё не задеплоен (GET /rest/credosTimeAbsences -> ${probe.status}).\n` +
      `Сначала задеплой приложение: yarn twenty dev. Затем повтори сид.`
    );
    process.exit(2);
  }

  // Детерминированный список сотрудников с непустым name (стабильная сортировка id).
  const employees = (await getAll('credosTimeEmployees'))
    .filter((e) => e && e.id && (e.name || '').trim())
    .sort((a, b) => a.id.localeCompare(b.id));
  const maxIdx = Math.max(...PLAN.map((p) => p.idx));
  if (employees.length <= maxIdx) {
    console.error(`Сотрудников недостаточно: есть ${employees.length}, нужен idx до ${maxIdx}.`);
    process.exit(1);
  }
  console.log(`Сотрудников доступно: ${employees.length}`);

  // Существующие отсутствия — для идемпотентности по ключу.
  const existing = await getAll('credosTimeAbsences');
  const existingKeys = new Set(
    existing
      .filter((a) => a.employeeId && (a.absenceType || a.type) && a.startDate)
      .map((a) => keyOf(a.employeeId, a.absenceType || a.type, a.startDate)),
  );
  console.log(`Отсутствий уже есть: ${existing.length}`);

  let created = 0, skipped = 0;
  for (const row of PLAN) {
    const emp = employees[row.idx];
    const key = keyOf(emp.id, row.type, row.start);
    if (existingKeys.has(key)) {
      skipped++;
      console.log(`  = [${row.type}] ${emp.name} ${row.start.slice(0, 10)} — уже есть`);
      continue;
    }
    const body = {
      absenceType: row.type,
      startDate: row.start,
      endDate: row.end,
      note: row.note,
      employeeId: emp.id,
    };
    await send('POST', '/rest/credosTimeAbsences', body);
    existingKeys.add(key);
    created++;
    console.log(
      `  + [${row.type}] ${emp.name} ${row.start.slice(0, 10)}…${row.end.slice(0, 10)} «${row.note}»`,
    );
  }

  console.log(`\nИтог: создано отсутствий ${created}, пропущено (уже было) ${skipped}.`);

  // --- Верификация ---
  console.log('\n[ВЕРИФИКАЦИЯ]');
  const after = await getAll('credosTimeAbsences');
  const empIds = new Set(employees.map((e) => e.id));
  const validType = new Set(Object.values(TYPE));
  let badEmp = 0, badType = 0, badRange = 0;
  for (const a of after) {
    if (!a.employeeId || !empIds.has(a.employeeId)) badEmp++;
    const t = a.absenceType || a.type;
    if (!validType.has(t)) badType++;
    if (a.startDate && a.endDate && a.endDate < a.startDate) badRange++;
  }
  const byType = {};
  for (const a of after) {
    const t = a.absenceType || a.type;
    byType[t] = (byType[t] || 0) + 1;
  }
  console.log(`  totalCount отсутствий: ${after.length}`);
  console.log(`  битый employeeId: ${badEmp}`);
  console.log(`  невалидный absenceType: ${badType}`);
  console.log(`  end < start: ${badRange}`);
  console.log(`  по типам: ${JSON.stringify(byType)}`);
  console.log('\nГотово.');
}

run().catch((e) => {
  console.error('\nОШИБКА:', e.message);
  process.exit(1);
});
