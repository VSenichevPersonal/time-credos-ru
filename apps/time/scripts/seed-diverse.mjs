#!/usr/bin/env node
/**
 * SEED_DIVERSE — реалистичный разнородный сид проектов + факта против прода.
 * ТЗ: docs/data-model/SEED_DIVERSE_TZ.md (§2 проекты, §3 записи факта, §8 цели).
 *
 * ПРОБЛЕМА (заказчик): util ~9%, везде −1000ч — мало данных факта. Цель — засеять
 * целевой fact/norm по отделам (OV перегруз 108–118%, OPR недогруз 50–60%, др ~норма),
 * разнородный портфель (DONE/ACTIVE/ON_HOLD/PLANNED + перебюджет), а также записи
 * ЗАКАЗЧИКА (vs@credos.ru) за июнь+H1, чтобы «Мои таймшиты» не были пусты.
 *
 * ЧТО ДЕЛАЕТ (идемпотентно, детерминированно — фикс. seed, без Math.random):
 *   1. Создаёт/находит разнородные проекты §2c (resume по code). category/status UPPER_SNAKE.
 *   2. Генерит ~6800 записей факта янв–июн 2026 по целевому факт/чел отдела (§1/§3):
 *      рабочие дни РФ, вычитая дни отсутствий; клиентская доля по отделам; статусы по месяцам.
 *      Заказчик включён как сотрудник OV (реалистичный личный объём, июнь не пуст).
 *   3. PATCH factHours/budgetRemaining проектов из Σ часов их записей
 *      (REST-создание записи НЕ дёргает rollup-триггер — см. project-fact-rollup-events.ts).
 *
 * ИДЕМПОТЕНТНОСТЬ записи: ключ = employeeId|projectId|workTypeId|date(10).
 *   Грузим существующие записи, пропускаем совпадающие. Повтор не плодит дубли
 *   (уник-индекс на БД тоже защищает; здесь — чтобы не ловить 409 на каждой).
 * ИДЕМПОТЕНТНОСТЬ проекта: resume по code (не создаём повторно).
 *
 * Доступ: cd apps/time; set -a; source ../../.env; set +a; node scripts/seed-diverse.mjs
 * Флаги:
 *   --only-customer   только записи заказчика (быстрый прогон, без 6800)
 *   --no-entries      только проекты + rollup (без массовой генерации факта)
 *   --no-rollup       пропустить PATCH factHours
 */

const BASE = process.env.TWENTY_DEV_URL;
const KEY = process.env.TWENTY_DEV_API_KEY;
if (!BASE || !KEY) {
  console.error('Нет TWENTY_DEV_URL / TWENTY_DEV_API_KEY. set -a; source ../../.env; set +a');
  process.exit(1);
}

const ONLY_CUSTOMER = process.argv.includes('--only-customer');
const NO_ENTRIES = process.argv.includes('--no-entries');
const NO_ROLLUP = process.argv.includes('--no-rollup');

const H = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RATE_MS = 700;
let lastReq = 0;
async function throttle() {
  const wait = RATE_MS - (Date.now() - lastReq);
  if (wait > 0) await sleep(wait);
  lastReq = Date.now();
}

async function send(method, path, body, retries = 6) {
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
const post = (plural, body) => send('POST', `/rest/${plural}`, body).then((j) => {
  const d = j.data || j; return d[Object.keys(d)[0]];
});
const patch = (plural, id, body) => send('PATCH', `/rest/${plural}/${id}`, body);

async function getAll(plural) {
  const out = [];
  let cursor = null;
  for (let i = 0; i < 200; i++) {
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

// --- Детерминированный PRNG (mulberry32) ---
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260621);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];

const at = (y, m, d, h) => new Date(Date.UTC(y, m - 1, d, h ?? 9, 0, 0)).toISOString();

// ===========================================================================
// §2c — РАЗНОРОДНЫЙ ПОРТФЕЛЬ ПРОЕКТОВ (коды детерминированы, синтетика)
// status UPPER_SNAKE: PLANNED/ACTIVE/ON_HOLD/DONE; category: CLIENT/PRESALE/PILOT/
// INTERNAL/INFRASTRUCTURE/TRAINING.
// fact — целевой Σ часов записей этого проекта (записи генерим под него в §3).
// ===========================================================================
const DIVERSE_PROJECTS = [
  // Завершённые (DONE) — факт закрыт ≈ план, записи только H1
  { code: 'OV-2026-DONE-01', dept: 'OV', cat: 'CLIENT', status: 'DONE', plan: 320, fact: 332, start: at(2026, 1, 12), end: at(2026, 4, 30, 18) },
  { code: 'OV-2026-DONE-02', dept: 'OV', cat: 'CLIENT', status: 'DONE', plan: 180, fact: 176, start: at(2026, 2, 2), end: at(2026, 4, 15, 18) },
  { code: 'OIB-2026-DONE-01', dept: 'OIB', cat: 'CLIENT', status: 'DONE', plan: 240, fact: 250, start: at(2026, 1, 19), end: at(2026, 5, 15, 18) },
  { code: 'OPIB-2026-DONE-01', dept: 'OPIB', cat: 'CLIENT', status: 'DONE', plan: 120, fact: 118, start: at(2026, 2, 9), end: at(2026, 3, 27, 18) },
  { code: 'TC-2026-DONE-01', dept: 'TC', cat: 'CLIENT', status: 'DONE', plan: 160, fact: 165, start: at(2026, 1, 12), end: at(2026, 3, 31, 18) },
  // ещё DONE для разнообразия (12 всего)
  { code: 'OV-2026-DONE-03', dept: 'OV', cat: 'CLIENT', status: 'DONE', plan: 220, fact: 215, start: at(2026, 2, 2), end: at(2026, 5, 8, 18) },
  { code: 'OIB-2026-DONE-02', dept: 'OIB', cat: 'CLIENT', status: 'DONE', plan: 140, fact: 138, start: at(2026, 2, 16), end: at(2026, 4, 24, 18) },
  { code: 'OPIB-2026-DONE-02', dept: 'OPIB', cat: 'CLIENT', status: 'DONE', plan: 100, fact: 104, start: at(2026, 3, 2), end: at(2026, 4, 17, 18) },
  { code: 'TC-2026-DONE-02', dept: 'TC', cat: 'CLIENT', status: 'DONE', plan: 90, fact: 88, start: at(2026, 1, 26), end: at(2026, 3, 13, 18) },
  { code: 'OV-2026-DONE-04', dept: 'OV', cat: 'CLIENT', status: 'DONE', plan: 260, fact: 268, start: at(2026, 1, 19), end: at(2026, 5, 22, 18) },
  { code: 'OIB-2026-DONE-03', dept: 'OIB', cat: 'PRESALE', status: 'DONE', plan: 60, fact: 58, start: at(2026, 3, 2), end: at(2026, 3, 27, 18) },
  { code: 'OPR-2026-DONE-01', dept: 'OPR', cat: 'INTERNAL', status: 'DONE', plan: 120, fact: 122, start: at(2026, 2, 2), end: at(2026, 4, 10, 18) },

  // С ПРЕВЫШЕНИЕМ бюджета (budgetRemaining < 0) — 8 шт §2b
  { code: 'OV-2026-OVR-01', dept: 'OV', cat: 'CLIENT', status: 'ACTIVE', plan: 400, fact: 540, start: at(2026, 1, 12), end: at(2026, 9, 25, 18) },
  { code: 'OV-2026-OVR-02', dept: 'OV', cat: 'CLIENT', status: 'ACTIVE', plan: 280, fact: 360, start: at(2026, 2, 2), end: at(2026, 8, 28, 18) },
  { code: 'OIB-2026-OVR-01', dept: 'OIB', cat: 'CLIENT', status: 'ACTIVE', plan: 200, fact: 250, start: at(2026, 1, 19), end: at(2026, 8, 14, 18) },
  { code: 'OPIB-2026-OVR-01', dept: 'OPIB', cat: 'CLIENT', status: 'DONE', plan: 160, fact: 232, start: at(2026, 1, 26), end: at(2026, 5, 29, 18) },
  { code: 'TC-2026-OVR-01', dept: 'TC', cat: 'CLIENT', status: 'ACTIVE', plan: 140, fact: 168, start: at(2026, 2, 9), end: at(2026, 7, 31, 18) },
  { code: 'OPIB-2026-OVR-02', dept: 'OPIB', cat: 'CLIENT', status: 'ACTIVE', plan: 180, fact: 222, start: at(2026, 2, 2), end: at(2026, 8, 28, 18) },
  { code: 'OV-2026-OVR-03', dept: 'OV', cat: 'CLIENT', status: 'ACTIVE', plan: 240, fact: 300, start: at(2026, 1, 19), end: at(2026, 9, 25, 18) },
  { code: 'OIB-2026-OVR-02', dept: 'OIB', cat: 'CLIENT', status: 'ACTIVE', plan: 160, fact: 196, start: at(2026, 2, 16), end: at(2026, 7, 31, 18) },

  // Активные крупные — драйверы перегруза вперёд (большой plan, факт частичный H1)
  { code: 'OV-2026-ACT-01', dept: 'OV', cat: 'CLIENT', status: 'ACTIVE', plan: 900, fact: 380, start: at(2026, 3, 2), end: at(2026, 10, 30, 18) },
  { code: 'OV-2026-ACT-02', dept: 'OV', cat: 'CLIENT', status: 'ACTIVE', plan: 700, fact: 300, start: at(2026, 4, 1), end: at(2026, 11, 27, 18) },
  { code: 'OV-2026-ACT-03', dept: 'OV', cat: 'CLIENT', status: 'ACTIVE', plan: 600, fact: 280, start: at(2026, 2, 2), end: at(2026, 10, 30, 18) },
  { code: 'OPIB-2026-ACT-01', dept: 'OPIB', cat: 'CLIENT', status: 'ACTIVE', plan: 480, fact: 180, start: at(2026, 5, 1), end: at(2026, 9, 25, 18) },
  { code: 'OIB-2026-ACT-01', dept: 'OIB', cat: 'CLIENT', status: 'ACTIVE', plan: 520, fact: 220, start: at(2026, 4, 13), end: at(2026, 10, 30, 18) },
  { code: 'OIB-2026-ACT-02', dept: 'OIB', cat: 'CLIENT', status: 'ACTIVE', plan: 360, fact: 180, start: at(2026, 3, 2), end: at(2026, 9, 25, 18) },
  { code: 'OPIB-2026-ACT-02', dept: 'OPIB', cat: 'CLIENT', status: 'ACTIVE', plan: 340, fact: 160, start: at(2026, 4, 1), end: at(2026, 10, 30, 18) },

  // В рамках бюджета — обычные активные (доп. факт H1 + вклад вперёд)
  { code: 'OV-2026-ACT-04', dept: 'OV', cat: 'CLIENT', status: 'ACTIVE', plan: 320, fact: 200, start: at(2026, 2, 2), end: at(2026, 8, 28, 18) },
  { code: 'OV-2026-ACT-05', dept: 'OV', cat: 'CLIENT', status: 'ACTIVE', plan: 280, fact: 160, start: at(2026, 3, 2), end: at(2026, 9, 25, 18) },
  { code: 'OIB-2026-ACT-03', dept: 'OIB', cat: 'CLIENT', status: 'ACTIVE', plan: 300, fact: 170, start: at(2026, 2, 16), end: at(2026, 8, 28, 18) },
  { code: 'OPIB-2026-ACT-03', dept: 'OPIB', cat: 'CLIENT', status: 'ACTIVE', plan: 260, fact: 150, start: at(2026, 3, 2), end: at(2026, 9, 25, 18) },
  { code: 'TC-2026-ACT-01', dept: 'TC', cat: 'CLIENT', status: 'ACTIVE', plan: 220, fact: 130, start: at(2026, 2, 2), end: at(2026, 7, 31, 18) },
  { code: 'TC-2026-ACT-02', dept: 'TC', cat: 'CLIENT', status: 'ACTIVE', plan: 180, fact: 90, start: at(2026, 3, 2), end: at(2026, 9, 25, 18) },

  // ON_HOLD — приостановлены (факт замер)
  { code: 'OV-2026-HLD-01', dept: 'OV', cat: 'CLIENT', status: 'ON_HOLD', plan: 200, fact: 110, start: at(2026, 2, 2), end: at(2026, 7, 31, 18) },
  { code: 'OIB-2026-HLD-01', dept: 'OIB', cat: 'CLIENT', status: 'ON_HOLD', plan: 160, fact: 80, start: at(2026, 3, 2), end: at(2026, 8, 28, 18) },
  { code: 'TC-2026-HLD-01', dept: 'TC', cat: 'INFRASTRUCTURE', status: 'ON_HOLD', plan: 120, fact: 50, start: at(2026, 2, 16), end: at(2026, 7, 31, 18) },

  // PLANNED — старт июль+, факт 0, только Demand вперёд (5 шт)
  { code: 'OV-2026-PLN-01', dept: 'OV', cat: 'CLIENT', status: 'PLANNED', plan: 360, fact: 0, start: at(2026, 7, 6), end: at(2026, 11, 27, 18) },
  { code: 'OIB-2026-PLN-01', dept: 'OIB', cat: 'PRESALE', status: 'PLANNED', plan: 200, fact: 0, start: at(2026, 7, 13), end: at(2026, 10, 30, 18) },
  { code: 'OPIB-2026-PLN-01', dept: 'OPIB', cat: 'CLIENT', status: 'PLANNED', plan: 240, fact: 0, start: at(2026, 8, 3), end: at(2026, 11, 27, 18) },
  { code: 'TC-2026-PLN-01', dept: 'TC', cat: 'CLIENT', status: 'PLANNED', plan: 160, fact: 0, start: at(2026, 7, 20), end: at(2026, 10, 30, 18) },
  { code: 'OPR-2026-PLN-01', dept: 'OPR', cat: 'INTERNAL', status: 'PLANNED', plan: 200, fact: 0, start: at(2026, 9, 1), end: at(2026, 12, 25, 18) },

  // OPR недогруз — внутренние/обучение (category НЕ CLIENT → низкий клиентский util)
  { code: 'OPR-2026-INT-01', dept: 'OPR', cat: 'INTERNAL', status: 'ACTIVE', plan: 600, fact: 280, start: at(2026, 1, 12), end: at(2026, 10, 30, 18) },
  { code: 'OPR-2026-INT-02', dept: 'OPR', cat: 'INTERNAL', status: 'ACTIVE', plan: 300, fact: 90, start: at(2026, 2, 2), end: at(2026, 9, 25, 18) },
  { code: 'OPR-2026-TRN-01', dept: 'OPR', cat: 'TRAINING', status: 'ACTIVE', plan: 200, fact: 60, start: at(2026, 1, 19), end: at(2026, 8, 28, 18) },
  // редкий клиентский кусок у OPR (даёт 10–25% клиентского util)
  { code: 'OPR-2026-CLI-01', dept: 'OPR', cat: 'CLIENT', status: 'ACTIVE', plan: 160, fact: 100, start: at(2026, 2, 2), end: at(2026, 7, 31, 18) },
];

// Целевой факт/чел H1 по отделам (§1) — для калибровки записей рядовых сотрудников.
const DEPT_FACT_TARGET = { OV: 840, OIB: 690, OPIB: 720, TC: 620, OPR: 430 };
// Клиентская доля часов (§3) — доля факта на CLIENT-проекты.
const DEPT_CLIENT_SHARE = { OV: 0.84, OIB: 0.81, OPIB: 0.86, TC: 0.75, OPR: 0.18 };

const CUSTOMER_EMAIL = 'vs@credos.ru';

// ===========================================================================
async function run() {
  console.log(`Сервер: ${BASE}`);
  console.log(`Режим: only-customer=${ONLY_CUSTOMER} no-entries=${NO_ENTRIES} no-rollup=${NO_ROLLUP}`);

  // --- Справочники ---
  const departments = await getAll('credosTimeDepartments');
  const deptById = new Map(departments.map((d) => [d.id, d]));
  const deptIdByCode = new Map();
  for (const d of departments) if (d.code) deptIdByCode.set(d.code, d.id);
  console.log(`Отделов: ${departments.length} (${[...deptIdByCode.keys()].join(', ')})`);

  const employees = (await getAll('credosTimeEmployees'))
    .filter((e) => e && e.id && e.departmentId)
    .sort((a, b) => a.id.localeCompare(b.id));
  const empByDept = new Map();
  for (const e of employees) {
    const code = deptById.get(e.departmentId)?.code;
    if (!code) continue;
    if (!empByDept.has(code)) empByDept.set(code, []);
    empByDept.get(code).push(e);
  }
  const customer = employees.find((e) => (e.email || '') === CUSTOMER_EMAIL);
  console.log(`Сотрудников: ${employees.length}. Заказчик ${CUSTOMER_EMAIL}: ${customer ? customer.id : 'НЕ НАЙДЕН'}`);

  const workTypes = await getAll('credosTimeWorkTypes');
  const crossWt = workTypes.filter((w) => !w.departmentId); // неклиентские кросс-виды
  const wtByDept = new Map();
  for (const w of workTypes) {
    if (!w.departmentId) continue;
    const code = deptById.get(w.departmentId)?.code;
    if (!code) continue;
    if (!wtByDept.has(code)) wtByDept.set(code, []);
    wtByDept.get(code).push(w);
  }

  // --- Отсутствия (вычесть дни из рабочих) ---
  const absences = await getAll('credosTimeAbsences');
  const absByEmp = new Map();
  for (const a of absences) {
    if (!a.employeeId || !a.startDate || !a.endDate) continue;
    if (!absByEmp.has(a.employeeId)) absByEmp.set(a.employeeId, []);
    absByEmp.get(a.employeeId).push([a.startDate.slice(0, 10), a.endDate.slice(0, 10)]);
  }
  const inAbsence = (empId, dayISO) => {
    const list = absByEmp.get(empId);
    if (!list) return false;
    return list.some(([s, e]) => dayISO >= s && dayISO <= e);
  };

  // --- 1. Проекты (resume по code) ---
  console.log('\n[1] Разнородные проекты §2c...');
  const existingProjects = await getAll('credosTimeProjects');
  const projByCode = new Map();
  for (const p of existingProjects) if (p.code) projByCode.set(p.code, p);
  const diverseRefs = []; // {id, code, dept, cat, targetFact}
  let projNew = 0;
  if (!ONLY_CUSTOMER) {
    for (const p of DIVERSE_PROJECTS) {
      let rec = projByCode.get(p.code);
      if (!rec) {
        rec = await post('credosTimeProjects', {
          name: `${p.code} · ${p.cat === 'CLIENT' ? 'клиентский проект' : p.cat === 'INTERNAL' ? 'внутренний проект' : p.cat === 'TRAINING' ? 'обучение/R&D' : p.cat === 'PRESALE' ? 'пресейл' : p.cat === 'INFRASTRUCTURE' ? 'инфраструктура' : 'пилот'} (синтетика)`,
          code: p.code,
          category: p.cat,
          status: p.status,
          plannedEffort: p.plan,
          startDate: p.start,
          endDate: p.end,
          departmentId: deptIdByCode.get(p.dept),
        });
        projNew++;
        console.log(`  + ${p.code} [${p.status}/${p.cat}] план ${p.plan}`);
      }
      diverseRefs.push({ id: rec.id, code: p.code, dept: p.dept, cat: p.cat, targetFact: p.fact });
    }
  }
  console.log(`  проектов из §2c: ${diverseRefs.length} (создано новых ${projNew})`);

  // Все проекты по отделам (диверс + ранее засеянные real) — для записей рядовых.
  const allProjects = await getAll('credosTimeProjects');
  const projByDept = new Map();
  for (const p of allProjects) {
    const code = deptById.get(p.departmentId)?.code;
    if (!code) continue;
    if (!projByDept.has(code)) projByDept.set(code, []);
    projByDept.get(code).push(p);
  }

  // --- Рабочие дни H1 2026 (без выходных; праздники РФ янв упрощённо после 9-го) ---
  const workdays = [];
  for (let m = 0; m < 6; m++) {
    const d = new Date(Date.UTC(2026, m, 1));
    while (d.getUTCMonth() === m) {
      const dow = d.getUTCDay();
      const dayISO = d.toISOString().slice(0, 10);
      const janHoliday = m === 0 && d.getUTCDate() <= 8; // новогодние каникулы
      if (dow !== 0 && dow !== 6 && !janHoliday) workdays.push(dayISO);
      d.setUTCDate(d.getUTCDate() + 1);
    }
  }
  // Статус записи по месяцу (§3): янв–апр закрыты, май–июнь свежие.
  const statusForDay = (dayISO) => {
    const m = Number(dayISO.slice(5, 7));
    const r = rng();
    if (m <= 4) return r < 0.85 ? 'APPROVED' : r < 0.97 ? 'SUBMITTED' : 'REJECTED';
    return r < 0.40 ? 'APPROVED' : r < 0.75 ? 'SUBMITTED' : r < 0.98 ? 'DRAFT' : 'REJECTED';
  };

  // CLIENT-проекты отдела (для клиентской доли) и не-CLIENT.
  const clientProjOf = (code) => (projByDept.get(code) || []).filter((p) => p.category === 'CLIENT');
  const nonClientProjOf = (code) => (projByDept.get(code) || []).filter((p) => p.category !== 'CLIENT');

  // --- Загрузка существующих записей для идемпотентности ---
  console.log('\n[2] Загрузка существующих записей (идемпотентность)...');
  const existingEntries = NO_ENTRIES ? [] : await getAll('credosTimeEntries');
  const entryKey = (empId, projId, wtId, dayISO) => `${empId}|${projId}|${wtId}|${dayISO}`;
  const existingKeys = new Set();
  for (const e of existingEntries) {
    if (e.employeeId && e.projectId && e.workTypeId && e.date) {
      existingKeys.add(entryKey(e.employeeId, e.projectId, e.workTypeId, e.date.slice(0, 10)));
    }
  }
  console.log(`  записей уже есть: ${existingEntries.length}`);

  // Σ часов на проект (для последующего rollup): стартуем с факта существующих.
  const projHours = new Map();
  for (const e of existingEntries) {
    if (e.projectId && typeof e.hours === 'number') {
      projHours.set(e.projectId, (projHours.get(e.projectId) || 0) + e.hours);
    }
  }

  // Генератор записей одного сотрудника под целевой Σ часов H1.
  // Пул крупнее (§3 «средняя запись крупнее») — avg ~5ч, чтобы при целевых
  // ~29000ч факта итог был ~6000–6800 записей (а не ~9500 мелких).
  const HOURS_POOL = [2, 3, 4, 4, 6, 6, 8, 8];
  function planEmployee(emp, deptCode, targetH, overtime) {
    const out = [];
    const empDays = workdays.filter((dayISO) => !inAbsence(emp.id, dayISO));
    if (empDays.length === 0) return out;
    const clientShare = DEPT_CLIENT_SHARE[deptCode] ?? 0.7;
    const clientProj = clientProjOf(deptCode);
    const nonClient = nonClientProjOf(deptCode);
    const deptWt = wtByDept.get(deptCode) || [];
    const dayCap = overtime ? 10 : 8; // редкий овертайм у перегруженных OV
    let acc = 0;
    // Идём по дням, заполняя 1–3 записями, пока не наберём targetH.
    let di = 0;
    let guard = 0;
    while (acc < targetH && guard < empDays.length * 4) {
      guard++;
      const dayISO = empDays[di % empDays.length];
      di++;
      // сколько часов в этот день (1–2 записи — крупнее, ближе к ~6800 итого)
      let dayHours = 0;
      const nRec = 1 + Math.floor(rng() * 2);
      for (let k = 0; k < nRec && acc < targetH; k++) {
        let h = pick(HOURS_POOL);
        if (dayHours + h > dayCap) h = Math.max(1, dayCap - dayHours);
        if (h <= 0) break;
        // клиентский vs неклиентский
        const wantClient = rng() < clientShare;
        const pool = wantClient && clientProj.length ? clientProj
          : (!wantClient && nonClient.length ? nonClient : (clientProj.length ? clientProj : nonClient));
        if (!pool.length) break;
        const proj = pick(pool);
        // вид работ: 75% профильный, 25% кросс (неклиентский характер часов)
        const wt = (rng() < 0.75 && deptWt.length) ? pick(deptWt) : (crossWt.length ? pick(crossWt) : pick(deptWt));
        if (!wt) break;
        out.push({
          date: `${dayISO}T10:00:00.000Z`, hours: h, description: wt.name,
          status: statusForDay(dayISO), employeeId: emp.id, projectId: proj.id, workTypeId: wt.id,
        });
        dayHours += h; acc += h;
      }
    }
    return out;
  }

  // --- 3. Записи факта ---
  const batch = [];
  if (ONLY_CUSTOMER) {
    if (customer) {
      const code = deptById.get(customer.departmentId)?.code || 'OV';
      // Заказчик OV: чуть выше нормы (перегруз отдела), овертайм.
      batch.push(...planEmployee(customer, code, DEPT_FACT_TARGET[code] ?? 840, true));
      console.log(`\n[3] Только заказчик: ${batch.length} записей запланировано`);
    }
  } else if (!NO_ENTRIES) {
    console.log('\n[3] Генерация записей по отделам под целевой факт/чел...');
    for (const [code, list] of empByDept) {
      const baseTarget = DEPT_FACT_TARGET[code] ?? 600;
      let idx = 0;
      for (const emp of list) {
        idx++;
        // Разброс ±: TC неравномерно, OV — 3–4 чел овертайм.
        let target = baseTarget;
        let overtime = false;
        if (code === 'TC') target = baseTarget * (0.6 + rng() * 0.7); // 0.6–1.3
        else if (code === 'OV') {
          if (idx <= 4) { target = baseTarget * 1.05; overtime = true; } // перегруз
          else target = baseTarget * (0.92 + rng() * 0.12);
        } else target = baseTarget * (0.9 + rng() * 0.18);
        const plan = planEmployee(emp, code, Math.round(target), overtime);
        batch.push(...plan);
      }
      const sum = batch.filter((b) => list.some((e) => e.id === b.employeeId)).length;
      console.log(`  ${code}: ${list.length} чел → ~${sum} записей`);
    }
  }

  // Записи заказчика всегда есть (если он отдельно не вошёл выше через empByDept).
  // Он входит в empByDept (OV) — отдельно не добавляем, чтобы не задвоить.

  // Отфильтровать дубли по ключу.
  const fresh = [];
  for (const b of batch) {
    const key = entryKey(b.employeeId, b.projectId, b.workTypeId, b.date.slice(0, 10));
    if (existingKeys.has(key)) continue;
    existingKeys.add(key);
    fresh.push(b);
  }
  console.log(`\n[4] К вставке записей: ${fresh.length} (после дедупликации, всего сгенерено ${batch.length})`);

  // --- Вставка ---
  let done = 0, errs = 0;
  for (const b of fresh) {
    try {
      await post('credosTimeEntries', b);
      projHours.set(b.projectId, (projHours.get(b.projectId) || 0) + b.hours);
      done++;
      if (done % 100 === 0) {
        const eta = ((fresh.length - done) * RATE_MS / 1000 / 60).toFixed(1);
        console.log(`  ...записей ${done}/${fresh.length} (ост. ~${eta} мин)`);
      }
    } catch (e) {
      errs++;
      if (errs <= 5) console.log(`  ! ошибка вставки: ${e.message.slice(0, 120)}`);
      if (errs > 50) throw new Error('Слишком много ошибок вставки — стоп.');
    }
  }
  console.log(`  создано записей: ${done} (ошибок ${errs})`);

  // --- 5. Rollup factHours/budgetRemaining проектов (REST не дёргает триггер) ---
  if (!NO_ROLLUP && !ONLY_CUSTOMER) {
    console.log('\n[5] PATCH factHours/budgetRemaining проектов из Σ часов...');
    let patched = 0;
    for (const p of allProjects) {
      const fact = Number((projHours.get(p.id) || 0).toFixed(2));
      const plan = typeof p.plannedEffort === 'number' ? p.plannedEffort : null;
      const budgetRemaining = plan == null ? null : Number((plan - fact).toFixed(2));
      // патчим только если изменилось
      if (p.factHours === fact && p.budgetRemaining === budgetRemaining) continue;
      await patch('credosTimeProjects', p.id, { factHours: fact, budgetRemaining });
      patched++;
      if (patched % 20 === 0) console.log(`  ...проектов обновлено ${patched}`);
    }
    console.log(`  обновлено проектов: ${patched}`);
  }

  // --- ВЕРИФИКАЦИЯ ---
  console.log('\n[ВЕРИФИКАЦИЯ]');
  const afterEntries = await getAll('credosTimeEntries');
  console.log(`  всего записей: ${afterEntries.length}`);
  // Σ часов и fact/norm по отделам H1 (norm = 944 × hc × 0.8 = 755/чел).
  const empDeptCode = new Map(employees.map((e) => [e.id, deptById.get(e.departmentId)?.code]));
  const factByDept = {}, clientByDept = {};
  const projCat = new Map(allProjects.map((p) => [p.id, p.category]));
  for (const e of afterEntries) {
    const code = empDeptCode.get(e.employeeId);
    if (!code || typeof e.hours !== 'number') continue;
    factByDept[code] = (factByDept[code] || 0) + e.hours;
    if (projCat.get(e.projectId) === 'CLIENT') clientByDept[code] = (clientByDept[code] || 0) + e.hours;
  }
  console.log('  fact/norm и client/fact по отделам (H1, norm 755/чел):');
  for (const [code, hc] of [['OV', 11], ['OIB', 11], ['OPIB', 9], ['TC', 6], ['OPR', 5]]) {
    const fact = factByDept[code] || 0;
    const norm = 944 * hc * 0.8;
    const cl = clientByDept[code] || 0;
    console.log(`    ${code}: fact ${fact.toFixed(0)} / norm ${norm.toFixed(0)} = ${(fact / norm * 100).toFixed(0)}% | client/fact ${fact ? (cl / fact * 100).toFixed(0) : 0}%`);
  }
  if (customer) {
    const cust = afterEntries.filter((e) => e.employeeId === customer.id);
    const june = cust.filter((e) => (e.date || '').slice(0, 7) === '2026-06');
    console.log(`  ЗАКАЗЧИК ${CUSTOMER_EMAIL}: записей ${cust.length}, из них июнь 2026: ${june.length} (Σ ${june.reduce((s, e) => s + (e.hours || 0), 0)} ч)`);
  }
  console.log('\nГотово.');
}

run().catch((e) => {
  console.error('\nОШИБКА:', e.message);
  process.exit(1);
});
