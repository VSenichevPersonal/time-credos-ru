#!/usr/bin/env node
/**
 * REQ-0012: мини-сид ПЛАНОВЫХ ЗАГРУЗОК ОТДЕЛА БЕЗ ПРОЕКТА (credosTimeDeptPlan),
 * чтобы раздел «Плановые загрузки» и доска capacity не пустовали резервом.
 * Создаёт несколько броней резерва/пресейла по разным отделам (июль–август 2026).
 *
 * Поля deptPlan:
 *   label         — TEXT, назначение брони («Резерв», «Пресейл-бронь», «Прочее»).
 *   category      — SELECT (опц.), UPPER_CASE из WORK_CATEGORY_OPTIONS
 *                   (CLIENT/PRESALE/PILOT/INTERNAL/INFRASTRUCTURE/TRAINING).
 *   plannedEffort — NUMBER (FLOAT), плановые часы.
 *   startDate / endDate — DATE_TIME (ISO), период [start, end].
 *   departmentId  — связь DeptPlan.department -> Department по коду отдела
 *                   (SELECT UPPER_CASE: OV/OIB/OPIB/TC/OPR).
 *
 * ИДЕМПОТЕНТНО: ключ = `${departmentId}|${label}|${startDate(10)}`.
 *   Перед созданием грузим все deptPlans и пропускаем совпадающие по ключу.
 * ДЕТЕРМИНИРОВАННО: без Math.random; отделы резолвятся по коду.
 *
 * ВАЖНО: объект credosTimeDeptPlan должен быть ЗАДЕПЛОЕН на сервер
 *   (`yarn twenty dev` / sync). До деплоя endpoint /rest/credosTimeDeptPlans
 *   вернёт 400/404 — скрипт это обнаружит и аккуратно завершится с подсказкой.
 *   ЗАПУСКАТЬ ПОСЛЕ синхронизации объекта (Dev2 НЕ запускал — только подготовил).
 *
 * Доступ: cd apps/time; set -a; source ../../.env; set +a; node scripts/seed-dept-plans.mjs
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

const at = (y, m, d, h) =>
  new Date(Date.UTC(y, m - 1, d, h ?? 9, 0, 0)).toISOString();

// План резервов: code — код отдела (SELECT UPPER_CASE), category — UPPER_CASE
// из WORK_CATEGORY_OPTIONS (синхронно с src/constants/select-options.ts).
const PLAN = [
  { code: 'OPIB', label: 'Резерв',        category: 'INTERNAL', effort: 40, start: at(2026, 7, 1, 9),  end: at(2026, 7, 31, 18) },
  { code: 'OV',   label: 'Пресейл-бронь', category: 'PRESALE',  effort: 60, start: at(2026, 8, 1, 9),  end: at(2026, 8, 31, 18) },
  { code: 'TC',   label: 'Прочее',        category: null,       effort: 20, start: at(2026, 7, 6, 9),  end: at(2026, 7, 17, 18) },
];

const keyOf = (deptId, label, startISO) => `${deptId}|${label}|${startISO.slice(0, 10)}`;

async function run() {
  console.log(`Сервер: ${BASE}`);

  // Проверка деплоя объекта.
  await throttle();
  const probe = await fetch(`${BASE}/rest/credosTimeDeptPlans?limit=1`, { headers: H });
  if (probe.status === 400 || probe.status === 404) {
    console.error(
      `\nОбъект credosTimeDeptPlan ещё не задеплоен (GET /rest/credosTimeDeptPlans -> ${probe.status}).\n` +
      `Сначала синхронизируй приложение: yarn twenty dev. Затем повтори сид.`
    );
    process.exit(2);
  }

  // Отделы по коду.
  const departments = await getAll('credosTimeDepartments');
  const deptByCode = new Map();
  for (const d of departments) {
    if (d && d.id && d.code) deptByCode.set(d.code, d);
  }
  console.log(`Отделов доступно: ${departments.length} (коды: ${[...deptByCode.keys()].join(', ')})`);

  // Существующие планы — для идемпотентности.
  const existing = await getAll('credosTimeDeptPlans');
  const existingKeys = new Set(
    existing
      .filter((p) => p.departmentId && p.label && p.startDate)
      .map((p) => keyOf(p.departmentId, p.label, p.startDate)),
  );
  console.log(`Плановых загрузок уже есть: ${existing.length}`);

  let created = 0, skipped = 0, missing = 0;
  for (const row of PLAN) {
    const dept = deptByCode.get(row.code);
    if (!dept) {
      missing++;
      console.log(`  ! отдел с кодом ${row.code} не найден — пропуск «${row.label}»`);
      continue;
    }
    const key = keyOf(dept.id, row.label, row.start);
    if (existingKeys.has(key)) {
      skipped++;
      console.log(`  = [${row.code}] «${row.label}» ${row.start.slice(0, 10)} — уже есть`);
      continue;
    }
    const body = {
      label: row.label,
      plannedEffort: row.effort,
      startDate: row.start,
      endDate: row.end,
      departmentId: dept.id,
    };
    if (row.category) body.category = row.category;
    await send('POST', '/rest/credosTimeDeptPlans', body);
    existingKeys.add(key);
    created++;
    console.log(
      `  + [${row.code}] «${row.label}» ${row.start.slice(0, 10)}…${row.end.slice(0, 10)} ${row.effort}ч`,
    );
  }

  console.log(`\nИтог: создано ${created}, пропущено (уже было) ${skipped}, отдел не найден ${missing}.`);

  // --- Верификация ---
  console.log('\n[ВЕРИФИКАЦИЯ]');
  const after = await getAll('credosTimeDeptPlans');
  const deptIds = new Set(departments.map((d) => d.id));
  let badDept = 0, badRange = 0, noEffort = 0;
  for (const p of after) {
    if (!p.departmentId || !deptIds.has(p.departmentId)) badDept++;
    if (p.startDate && p.endDate && p.endDate < p.startDate) badRange++;
    if (p.plannedEffort == null) noEffort++;
  }
  console.log(`  totalCount планов: ${after.length}`);
  console.log(`  битый departmentId: ${badDept}`);
  console.log(`  end < start: ${badRange}`);
  console.log(`  без plannedEffort: ${noEffort}`);
  console.log('\nГотово.');
}

run().catch((e) => {
  console.error('\nОШИБКА:', e.message);
  process.exit(1);
});
