#!/usr/bin/env node
/**
 * Сид ПЕРЕГРУЗА (заказчик [user-direct]): на доске «Планирование» всё было
 * зелёное (util ~25-70%). Задача — реалистичный микс: ОВ перегружен (красный),
 * 1-2 сотрудника ОВ перегружены (срез «Люди»), ОПР остаётся недогружен,
 * остальные подняты к оптимуму (~50-70%).
 *
 * НОВЫЙ скрипт (прежние seed-* НЕ трогаются). Идемпотентно.
 *
 * МОДЕЛЬ ДЕМАНДА (front-components/capacity/calc-load.ts):
 *   capacity(отдел) = workHours(период) × headcount × 0.8
 *     headcount = Σ FTE активных назначений (fteHeadcountByDept) на «сегодня».
 *   load (Demand) = Σ часов проектов отдела (по долям) + Σ deptPlan отдела
 *                   + Σ HARD-броней сотрудников отдела.
 *   перегруз (красный) когда load > capacity.
 *   В срезе «Люди»: личная ёмкость = workHours×0.8; личный деманд =
 *     deptLoad/headcount + личные HARD-брони сотрудника (брони НЕ делятся).
 *
 * ЗАМЕР LIVE (2026, ёмкость/деманд по месяцам, /tmp/sim до сида):
 *   OV:  cap 1840/1680/1760, load 1265/1196/761  (util 69/71/43%) → недогруз
 *   OPR: cap 633/578/605,    load 254/224/194    (util 40/39/32%) → оставляем
 *
 * ЧЕМ ГРУЗИМ ОВ (до перегруза >100% июл-сен):
 *   A) deptPlan ОВ (раскид по месяцу на весь отдел): +500 июл, +560 авг, +950 сен.
 *   B) 2 HARD-брони людям ОВ по 210 ч/мес (июл-сен) → эти ЛЮДИ перегружены
 *      персонально И добавляют HARD к деманду отдела (×2 ≈ +420 ч/мес).
 *   Итого добавка ОВ ≈ +920 июл / +980 авг / +1370 сен → load > cap (красный).
 *
 * ПОДДЕРЖКА «оптимума» (опц.): небольшие deptPlan OIB/OPIB/TC → util ~50-65%.
 * ОПР НЕ грузим (остаётся ~32-40%, недогруз для контраста).
 *
 * ИДЕМПОТЕНТНО:
 *   deptPlan: ключ `${departmentId}|${label}|${startDate(10)}`.
 *   booking:  ключ `${employeeId}|${label}|${startDate(10)}`.
 *
 * Доступ: cd apps/time; set -a; source ../../.env; set +a; node scripts/seed-overload.mjs
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

const at = (y, m, d, h) => new Date(Date.UTC(y, m - 1, d, h ?? 9, 0, 0)).toISOString();
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const monthStart = (y, m) => at(y, m, 1, 9);
const monthEnd = (y, m) => at(y, m, lastDay(y, m), 18);

// --- A) deptPlans (раскид на весь отдел) ---
// ОВ — перегруз июл-сен; OIB/OPIB/TC — небольшой подъём к оптимуму; ОПР НЕ грузим.
const DEPT_PLANS = [
  // ОВ — крупные резервы (перегруз). category UPPER_CASE = toUpperSnake('Presale'|'Internal').
  { code: 'OV',   label: 'Внедрение АБС (пик)',          category: 'CLIENT',   effort: 500, m: 7 },
  { code: 'OV',   label: 'Миграция инфраструктуры (пик)', category: 'CLIENT',   effort: 560, m: 8 },
  { code: 'OV',   label: 'Развёртывание ИС у заказчика',  category: 'CLIENT',   effort: 950, m: 9 },
  // Подъём прочих отделов к оптимуму (не перегруз).
  { code: 'OIB',  label: 'Аудит ИБ заказчика',           category: 'CLIENT',   effort: 400, m: 7 },
  { code: 'OIB',  label: 'Сопровождение СЗИ',            category: 'CLIENT',   effort: 450, m: 8 },
  { code: 'OPIB', label: 'Серия пентестов',              category: 'CLIENT',   effort: 350, m: 8 },
  { code: 'TC',   label: 'Поддержка по SLA',             category: 'INTERNAL', effort: 180, m: 7 },
];

// --- B) HARD-брони людям ОВ (перегруз ЛЮДЕЙ + добавка HARD к отделу) ---
// emp: [deptCode, ordinal] — N-й сотрудник отдела (стабильная сортировка id).
// 210 ч/мес >> личной ёмкости после долевого деманда → персональный перегруз.
const HARD_BOOKINGS = [
  { emp: ['OV', 1], label: 'Ключевой архитектор — контракт', hours: 210, m: 7, note: 'Перегруз: занят на критичном внедрении' },
  { emp: ['OV', 1], label: 'Ключевой архитектор — контракт', hours: 210, m: 8, note: 'Перегруз: занят на критичном внедрении' },
  { emp: ['OV', 1], label: 'Ключевой архитектор — контракт', hours: 210, m: 9, note: 'Перегруз: занят на критичном внедрении' },
  { emp: ['OV', 2], label: 'Ведущий инженер — внедрение',    hours: 210, m: 7, note: 'Перегруз: параллельные проекты' },
  { emp: ['OV', 2], label: 'Ведущий инженер — внедрение',    hours: 210, m: 8, note: 'Перегруз: параллельные проекты' },
  { emp: ['OV', 2], label: 'Ведущий инженер — внедрение',    hours: 210, m: 9, note: 'Перегруз: параллельные проекты' },
];

const dpKey = (departmentId, label, startISO) => `${departmentId}|${label}|${startISO.slice(0, 10)}`;
const bkKey = (employeeId, label, startISO) => `${employeeId}|${label}|${startISO.slice(0, 10)}`;

async function run() {
  console.log(`Сервер: ${BASE}`);

  // Пробы деплоя.
  for (const p of ['credosTimeDeptPlans', 'credosTimeBookings']) {
    await throttle();
    const probe = await fetch(`${BASE}/rest/${p}?limit=1`, { headers: H });
    if (probe.status === 400 || probe.status === 404) {
      console.error(`\nОбъект для ${p} не задеплоен (GET -> ${probe.status}). Сначала yarn twenty dev.`);
      process.exit(2);
    }
  }

  const departments = await getAll('credosTimeDepartments');
  const idByCode = new Map(departments.map((d) => [d.code, d.id]));
  const codeById = new Map(departments.map((d) => [d.id, d.code]));

  const employees = (await getAll('credosTimeEmployees'))
    .filter((e) => e && e.id && e.departmentId && (e.name || '').trim())
    .sort((a, b) => a.id.localeCompare(b.id));
  const byDept = new Map();
  for (const e of employees) {
    const code = codeById.get(e.departmentId);
    if (!code) continue;
    if (!byDept.has(code)) byDept.set(code, []);
    byDept.get(code).push(e);
  }
  console.log(`Сотрудников: ${employees.length}. По отделам: ${[...byDept].map(([c, l]) => `${c}:${l.length}`).join(' ')}`);

  // === A) deptPlans ===
  const existingDP = await getAll('credosTimeDeptPlans');
  const dpKeys = new Set(
    existingDP.filter((p) => p.departmentId && p.label && p.startDate)
      .map((p) => dpKey(p.departmentId, p.label, p.startDate)),
  );
  let dpCreated = 0, dpSkip = 0;
  for (const row of DEPT_PLANS) {
    const departmentId = idByCode.get(row.code);
    if (!departmentId) { console.log(`  ! нет отдела ${row.code} — пропуск «${row.label}»`); continue; }
    const start = monthStart(2026, row.m), end = monthEnd(2026, row.m);
    const key = dpKey(departmentId, row.label, start);
    if (dpKeys.has(key)) { dpSkip++; console.log(`  = deptPlan «${row.label}» ${row.code} — уже есть`); continue; }
    const body = { label: row.label, plannedEffort: row.effort, startDate: start, endDate: end, departmentId };
    if (row.category) body.category = row.category;
    await send('POST', '/rest/credosTimeDeptPlans', body);
    dpKeys.add(key); dpCreated++;
    console.log(`  + deptPlan «${row.label}» ${row.code} ${row.effort}ч ${start.slice(0, 10)}…${end.slice(0, 10)}`);
  }

  // === B) HARD-брони ===
  const existingBK = await getAll('credosTimeBookings');
  const bkKeys = new Set(
    existingBK.filter((b) => b.employeeId && b.label && b.startDate)
      .map((b) => bkKey(b.employeeId, b.label, b.startDate)),
  );
  let bkCreated = 0, bkSkip = 0, noEmp = 0;
  for (const row of HARD_BOOKINGS) {
    const [code, ord] = row.emp;
    const emp = (byDept.get(code) || [])[ord - 1];
    if (!emp) { noEmp++; console.log(`  ! нет сотрудника ${code}#${ord} — пропуск «${row.label}»`); continue; }
    const start = monthStart(2026, row.m), end = monthEnd(2026, row.m);
    const key = bkKey(emp.id, row.label, start);
    if (bkKeys.has(key)) { bkSkip++; console.log(`  = HARD «${row.label}» ${emp.name} ${row.m}/26 — уже есть`); continue; }
    await send('POST', '/rest/credosTimeBookings', {
      label: row.label, bookingType: 'HARD', hours: row.hours,
      startDate: start, endDate: end, note: row.note, employeeId: emp.id,
    });
    bkKeys.add(key); bkCreated++;
    console.log(`  + HARD «${row.label}» ${emp.name} ${row.hours}ч ${start.slice(0, 10)}…${end.slice(0, 10)}`);
  }

  console.log(`\nИтог: deptPlans +${dpCreated} (=${dpSkip}); HARD-брони +${bkCreated} (=${bkSkip}); без сотрудника ${noEmp}.`);
  console.log('Перегруз ОВ задан крупными deptPlan (Client) + HARD-бронями людей ОВ. Проверь доску «Планирование» → ОВ красный июл-сен.');
}

run().catch((e) => { console.error('\nОШИБКА:', e.message); process.exit(1); });
