#!/usr/bin/env node
/**
 * REQ-0011 (бэкфилл): миграция жёсткой связи employee.departmentId -> FTE-назначение
 * 100% в join-объекте credosTimeEmployeeDepartment (employee × department × % FTE
 * × даты). Обратная совместимость: до перехода на мульти-отдел/частичную занятость
 * каждый сотрудник имел один departmentId; создаём ОДНУ запись назначения на
 * сотрудника с ftePercent=100, startDate=null, endDate=null (действует бессрочно).
 * После бэкфилла численность отдела по Σ FTE = прежний count активных сотрудников.
 *
 * Поля (см. src/objects/credos-time-employee-department.object.ts):
 *   ftePercent — NUMBER (FLOAT, decimals 2), 0..100. Ставим 100.
 *   startDate/endDate — DATE_TIME nullable. Ставим null (бессрочно).
 *
 * Связи POST:
 *   employeeId   — credosTimeEmployeeDepartment.employee   -> Employee   (joinColumnName employeeId)
 *   departmentId — credosTimeEmployeeDepartment.department -> Department (joinColumnName departmentId)
 *
 * ИДЕМПОТЕНТНО: ключ = `${employeeId}|${departmentId}`. Перед созданием грузим все
 *   существующие назначения и пропускаем совпадающие — повторный прогон не дублирует.
 * Сотрудников без departmentId пропускаем (нет отдела -> нет назначения).
 *
 * ВАЖНО: объект credosTimeEmployeeDepartment должен быть ЗАДЕПЛОЕН. До деплоя
 *   /rest/credosTimeEmployeeDepartments вернёт 400/404 — скрипт обнаружит и выйдет.
 *
 * Доступ: cd apps/time; set -a; source ../../.env; set +a; node scripts/seed-employee-department.mjs
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

async function getAll(plural, params = {}) {
  const out = [];
  let cursor = null;
  for (let i = 0; i < 60; i++) {
    const u = new URL(`${BASE}/rest/${plural}`);
    u.searchParams.set('limit', '60');
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
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

const keyOf = (employeeId, departmentId) => `${employeeId}|${departmentId}`;

// §7 FTE/мульти-отдел: точечные назначения (~8). emp: [deptCode, ordinal] — N-й
// сотрудник отдела (1-based, стабильная сортировка id). fte — ftePercent.
// kind: 'base' = подправить «родное» назначение сотрудника (partial FTE);
//       'extra' = добавить назначение в ДРУГОЙ отдел (мульти-отдел).
// start — опц. дата начала (датированное назначение, напр. новый сотрудник).
const at = (y, m, d) => new Date(Date.UTC(y, m - 1, d, 9, 0, 0)).toISOString();
const FTE_PLAN = [
  { emp: ['TC', 5],  toDept: 'TC',   fte: 50,  kind: 'base',  note: 'частичная занятость' },
  { emp: ['TC', 6],  toDept: 'TC',   fte: 80,  kind: 'base',  note: 'частичная занятость' },
  { emp: ['OPR', 4], toDept: 'OPR',  fte: 80,  kind: 'base',  note: 'частичная занятость' },
  { emp: ['OPR', 5], toDept: 'OPR',  fte: 50,  kind: 'base',  note: 'мульти: 50% в OPR' },
  { emp: ['OPR', 5], toDept: 'OV',   fte: 50,  kind: 'extra', note: 'мульти: 50% помогает OV (перегруз)' },
  { emp: ['OIB', 7], toDept: 'OIB',  fte: 60,  kind: 'base',  note: 'мульти: 60% в OIB' },
  { emp: ['OIB', 7], toDept: 'OPIB', fte: 40,  kind: 'extra', note: 'мульти ИБ↔практич.ИБ: 40% в OPIB' },
  { emp: ['OV', 11], toDept: 'OV',   fte: 100, kind: 'base',  note: 'новый сотрудник с апреля', start: at(2026, 4, 1) },
];

async function run() {
  console.log(`Сервер: ${BASE}`);

  // Проверка деплоя объекта.
  await throttle();
  const probe = await fetch(`${BASE}/rest/credosTimeEmployeeDepartments?limit=1`, { headers: H });
  if (probe.status === 400 || probe.status === 404) {
    console.error(
      `\nОбъект credosTimeEmployeeDepartment ещё не задеплоен (GET -> ${probe.status}).\n` +
      `Сначала синхронизируй приложение: yarn twenty dev. Затем повтори бэкфилл.`,
    );
    process.exit(2);
  }

  // Все активные сотрудники.
  const employees = await getAll('credosTimeEmployees', { filter: 'active[eq]:true' });
  console.log(`Активных сотрудников: ${employees.length}`);
  const empIds = new Set(employees.map((e) => e.id));

  // Все отделы — для проверки orphan-departmentId у сотрудников.
  const departments = await getAll('credosTimeDepartments');
  const deptIds = new Set(departments.map((d) => d.id));
  console.log(`Отделов всего: ${departments.length}`);

  // Существующие назначения — идемпотентность.
  const existing = await getAll('credosTimeEmployeeDepartments');
  const existingKeys = new Set(
    existing
      .filter((e) => e.employeeId && e.departmentId)
      .map((e) => keyOf(e.employeeId, e.departmentId)),
  );
  console.log(`Назначений уже есть: ${existing.length}`);

  let created = 0, skipped = 0, noDept = 0, badDept = 0;
  const headcountByDept = new Map();
  for (const e of employees) {
    if (!e.departmentId) {
      noDept++;
      console.log(`  ! сотрудник ${e.name || e.id} без departmentId — пропуск`);
      continue;
    }
    if (!deptIds.has(e.departmentId)) {
      badDept++;
      console.log(`  ! сотрудник ${e.name || e.id}: departmentId ${e.departmentId} не найден — пропуск`);
      continue;
    }
    headcountByDept.set(e.departmentId, (headcountByDept.get(e.departmentId) ?? 0) + 1);
    const key = keyOf(e.id, e.departmentId);
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }
    const body = {
      employeeId: e.id,
      departmentId: e.departmentId,
      ftePercent: 100,
      startDate: null,
      endDate: null,
    };
    await send('POST', '/rest/credosTimeEmployeeDepartments', body);
    existingKeys.add(key);
    created++;
    console.log(`  + ${e.name || e.id} -> 100% FTE в отделе ${e.departmentId}`);
  }

  console.log(
    `\nИтог (бэкфилл 100%): создано ${created}, пропущено (уже было) ${skipped}, ` +
    `сотрудников без отдела ${noDept}, с битым departmentId ${badDept}.`,
  );

  // --- §7: точечные FTE/мульти-отдел назначения ---
  console.log('\n[FTE/мульти §7] Применяю точечные назначения...');
  const codeToId = new Map();
  const idToCode = new Map();
  for (const d of departments) { if (d.code) { codeToId.set(d.code, d.id); idToCode.set(d.id, d.code); } }
  // сотрудники по «родному» отделу, стабильный порядок id.
  const byDept = new Map();
  for (const e of employees.slice().sort((a, b) => a.id.localeCompare(b.id))) {
    const code = idToCode.get(e.departmentId);
    if (!code) continue;
    if (!byDept.has(code)) byDept.set(code, []);
    byDept.get(code).push(e);
  }
  // освежить существующие назначения (после бэкфилла).
  const assigns = await getAll('credosTimeEmployeeDepartments');
  const assignByKey = new Map(assigns.filter((a) => a.employeeId && a.departmentId)
    .map((a) => [keyOf(a.employeeId, a.departmentId), a]));
  let ftePatched = 0, fteCreated = 0, fteSkip = 0, fteNoEmp = 0;
  for (const row of FTE_PLAN) {
    const [code, ord] = row.emp;
    const emp = (byDept.get(code) || [])[ord - 1];
    const toDeptId = codeToId.get(row.toDept);
    if (!emp || !toDeptId) { fteNoEmp++; console.log(`  ! нет сотрудника ${code}#${ord} или отдела ${row.toDept} — пропуск`); continue; }
    const key = keyOf(emp.id, toDeptId);
    const cur = assignByKey.get(key);
    const body = { employeeId: emp.id, departmentId: toDeptId, ftePercent: row.fte, startDate: row.start ?? null, endDate: null };
    if (cur) {
      if (cur.ftePercent === row.fte && (cur.startDate || null) === (row.start ?? null)) { fteSkip++; continue; }
      await send('PATCH', `/rest/credosTimeEmployeeDepartments/${cur.id}`, { ftePercent: row.fte, startDate: row.start ?? null });
      ftePatched++;
      console.log(`  ~ ${emp.name} ${row.toDept}: FTE → ${row.fte}% (${row.note})`);
    } else {
      const r = await send('POST', '/rest/credosTimeEmployeeDepartments', body);
      const id = ((r.data || r)[Object.keys(r.data || r)[0]] || {}).id;
      if (id) assignByKey.set(key, { id, ftePercent: row.fte });
      fteCreated++;
      console.log(`  + ${emp.name} ${row.toDept}: ${row.fte}% (${row.note})`);
    }
  }
  console.log(`  FTE-итог: изменено ${ftePatched}, создано ${fteCreated}, пропущено ${fteSkip}, не найдено ${fteNoEmp}.`);

  // --- Верификация: Σ FTE по отделам должна совпасть с count активных сотрудников ---
  console.log('\n[ВЕРИФИКАЦИЯ] headcount = count активных по отделам (ожидаемый = Σ FTE 100%):');
  const after = await getAll('credosTimeEmployeeDepartments');
  const fteByDept = new Map();
  let orphanEmp = 0, orphanDept = 0;
  for (const a of after) {
    if (!a.employeeId || !empIds.has(a.employeeId)) orphanEmp++;
    if (!a.departmentId || !deptIds.has(a.departmentId)) orphanDept++;
    if (a.departmentId) {
      const pct = a.ftePercent == null ? 100 : a.ftePercent;
      fteByDept.set(a.departmentId, (fteByDept.get(a.departmentId) ?? 0) + pct / 100);
    }
  }
  for (const d of departments) {
    const count = headcountByDept.get(d.id) ?? 0;
    const fte = fteByDept.get(d.id) ?? 0;
    const mark = Math.abs(count - fte) < 1e-6 ? 'OK' : 'РАСХОЖДЕНИЕ';
    console.log(`  ${d.code || d.id}: count=${count}, ΣFTE=${fte} — ${mark}`);
  }
  console.log(`  totalCount назначений: ${after.length}`);
  console.log(`  orphan employeeId: ${orphanEmp}`);
  console.log(`  orphan departmentId: ${orphanDept}`);
  console.log('\nГотово.');
}

run().catch((e) => {
  console.error('\nОШИБКА:', e.message);
  process.exit(1);
});
