#!/usr/bin/env node
/**
 * Сид БРОНЕЙ ресурсов (credosTimeBooking, §5 SEED_DIVERSE_TZ.md) — слой Demand.
 * СЕЙЧАС СИДА НЕ БЫЛО — это новый скрипт. ~14 броней SOFT/HARD на горизонт июл–сен 2026.
 *
 * Смысл (доска ёмкости):
 *   HARD → потребляет ёмкость (входит в load). HARD-брони OV усиливают перегруз.
 *   SOFT → пунктирный слой (tentativeBookingEnabled) — «если пресейлы подтвердятся → конфликт».
 *
 * Поля брони:
 *   label — TEXT (заголовок).
 *   bookingType — SELECT UPPER_CASE (SOFT/HARD), синхронно BOOKING_TYPE_OPTIONS.
 *   hours — NUMBER (объём брони на период).
 *   startDate / endDate — DATE_TIME.
 *   note — TEXT (опц.).
 *   employeeId — Booking.employee -> Employee (на кого бронь).
 *   projectId — опц.
 *
 * ИДЕМПОТЕНТНО: ключ = `${employeeId}|${label}|${startDate(10)}`. Дубли пропускаются.
 * ДЕТЕРМИНИРОВАННО: сотрудники берутся как N-й по счёту в нужном отделе (стабильная
 *   сортировка id) — один и тот же набор при каждом прогоне, без Math.random.
 *
 * Доступ: cd apps/time; set -a; source ../../.env; set +a; node scripts/seed-bookings.mjs
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

const TYPE = { SOFT: 'SOFT', HARD: 'HARD' };
const at = (y, m, d, h) => new Date(Date.UTC(y, m - 1, d, h ?? 9, 0, 0)).toISOString();

// План броней §5. emp: [deptCode, ordinal] — N-й сотрудник отдела (1-based).
const PLAN = [
  // HARD — давят ёмкость (OV-перегруз вперёд)
  { emp: ['OV', 1], label: 'Бронь под контракт А', type: TYPE.HARD, hours: 80, start: at(2026, 7, 1), end: at(2026, 7, 31, 18), note: 'Подтверждён, давит ёмкость OV' },
  { emp: ['OV', 3], label: 'Бронь под контракт Б', type: TYPE.HARD, hours: 120, start: at(2026, 7, 1), end: at(2026, 8, 31, 18), note: 'Усиливает перегруз OV' },
  { emp: ['OPIB', 2], label: 'Пентест по договору', type: TYPE.HARD, hours: 60, start: at(2026, 8, 1), end: at(2026, 8, 31, 18), note: 'Подтверждённый пентест' },
  { emp: ['OIB', 4], label: 'Аудит ГОСТ Р 57580', type: TYPE.HARD, hours: 70, start: at(2026, 9, 1), end: at(2026, 9, 30, 18), note: 'Аудит по договору' },
  { emp: ['TC', 1], label: 'Поддержка клиента', type: TYPE.HARD, hours: 40, start: at(2026, 7, 1), end: at(2026, 7, 31, 18), note: 'SLA-сопровождение' },
  { emp: ['OV', 6], label: 'Внедрение продлено', type: TYPE.HARD, hours: 90, start: at(2026, 8, 1), end: at(2026, 9, 15, 18), note: 'Продление внедрения OV' },
  // SOFT — пресейл/возможные, пунктир
  { emp: ['OV', 5], label: 'Пресейл клиент В', type: TYPE.SOFT, hours: 100, start: at(2026, 8, 1), end: at(2026, 8, 31, 18), note: 'Пресейл, не подтверждён' },
  { emp: ['OIB', 2], label: 'Пресейл клиент Г', type: TYPE.SOFT, hours: 60, start: at(2026, 9, 1), end: at(2026, 9, 30, 18), note: 'Пресейл аудит' },
  { emp: ['OPIB', 5], label: 'Возможный пилот', type: TYPE.SOFT, hours: 50, start: at(2026, 7, 1), end: at(2026, 7, 31, 18), note: 'Пилот, обсуждается' },
  { emp: ['OPR', 1], label: 'Резерв разработки', type: TYPE.SOFT, hours: 80, start: at(2026, 8, 1), end: at(2026, 8, 31, 18), note: 'Demand под OPR' },
  { emp: ['TC', 3], label: 'Возможная миграция', type: TYPE.SOFT, hours: 70, start: at(2026, 9, 1), end: at(2026, 9, 30, 18), note: 'Пресейл импортозамещение' },
  { emp: ['OIB', 7], label: 'Пресейл КИИ', type: TYPE.SOFT, hours: 90, start: at(2026, 7, 15), end: at(2026, 8, 15, 18), note: 'Категорирование КИИ, пресейл' },
  { emp: ['OPIB', 1], label: 'Резерв киберучений', type: TYPE.SOFT, hours: 40, start: at(2026, 9, 1), end: at(2026, 9, 20, 18), note: 'Возможные киберучения' },
  { emp: ['OPR', 3], label: 'R&D-бронь', type: TYPE.SOFT, hours: 60, start: at(2026, 7, 1), end: at(2026, 7, 31, 18), note: 'Исследовательская задача' },
];

const keyOf = (employeeId, label, startISO) => `${employeeId}|${label}|${startISO.slice(0, 10)}`;

async function run() {
  console.log(`Сервер: ${BASE}`);

  // Проверка деплоя объекта.
  await throttle();
  const probe = await fetch(`${BASE}/rest/credosTimeBookings?limit=1`, { headers: H });
  if (probe.status === 400 || probe.status === 404) {
    console.error(`\nОбъект credosTimeBooking не задеплоен (GET -> ${probe.status}). Сначала yarn twenty dev.`);
    process.exit(2);
  }

  // Отделы (id -> code) + сотрудники по отделам (стабильный порядок id).
  const departments = await getAll('credosTimeDepartments');
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

  // Существующие брони — идемпотентность.
  const existing = await getAll('credosTimeBookings');
  const existingKeys = new Set(
    existing.filter((b) => b.employeeId && b.label && b.startDate)
      .map((b) => keyOf(b.employeeId, b.label, b.startDate)),
  );
  console.log(`Броней уже есть: ${existing.length}`);

  let created = 0, skipped = 0, noEmp = 0;
  for (const row of PLAN) {
    const [code, ord] = row.emp;
    const list = byDept.get(code) || [];
    const emp = list[ord - 1];
    if (!emp) { noEmp++; console.log(`  ! нет сотрудника ${code}#${ord} — пропуск «${row.label}»`); continue; }
    const key = keyOf(emp.id, row.label, row.start);
    if (existingKeys.has(key)) {
      skipped++;
      console.log(`  = [${row.type}] «${row.label}» ${emp.name} — уже есть`);
      continue;
    }
    await send('POST', '/rest/credosTimeBookings', {
      label: row.label, bookingType: row.type, hours: row.hours,
      startDate: row.start, endDate: row.end, note: row.note, employeeId: emp.id,
    });
    existingKeys.add(key);
    created++;
    console.log(`  + [${row.type}] «${row.label}» ${emp.name} ${row.hours}ч ${row.start.slice(0, 10)}…${row.end.slice(0, 10)}`);
  }

  console.log(`\nИтог: создано ${created}, пропущено ${skipped}, без сотрудника ${noEmp}.`);

  // --- Верификация ---
  const after = await getAll('credosTimeBookings');
  const byType = {};
  for (const b of after) byType[b.bookingType] = (byType[b.bookingType] || 0) + 1;
  console.log(`[ВЕРИФИКАЦИЯ] всего броней: ${after.length}, по типам: ${JSON.stringify(byType)}`);
  console.log('Готово.');
}

run().catch((e) => {
  console.error('\nОШИБКА:', e.message);
  process.exit(1);
});
