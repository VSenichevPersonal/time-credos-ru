#!/usr/bin/env node
/**
 * Сид БРОНЕЙ ПОД КОМПАНИЮ (заказчик): бронь ресурса может быть под ПРОЕКТ ИЛИ под
 * КОМПАНИЮ. Пресейл — клиент известен, проект ещё НЕ создан → бронь на company.
 *
 * НОВЫЙ скрипт (прежние seed-* НЕ трогаются). Идемпотентно.
 *
 * СХЕМА (ADDITIVE): credos-time-booking.object получил поле company (RELATION
 * MANY_TO_ONE -> стандартный Company, nullable) + обратная коллекция
 * company.credosTimeBookings (field). project уже nullable. БРОНЬ привязывается к
 * ОДНОМУ из двух: company (пресейл) ИЛИ project. Сверка: Timetta resource-plan
 * под клиента/проект, booking soft/hard. [[no-billable-concept]].
 *
 * ВАЖНО: поле company деплоит ARCH (yarn twenty dev). До деплоя REST не примет
 * companyId → скрипт это ДЕТЕКТИРУЕТ (пробой POST с companyId) и завершится с
 * понятным сообщением, НИЧЕГО частично не создав. После деплоя — прогон создаёт:
 *   - SOFT-брони под компанию БЕЗ проекта (пресейл);
 *   - пару SOFT/HARD под проект (контраст «проект vs компания»).
 *
 * ИДЕМПОТЕНТНО: ключ = `${label}|${startDate(10)}` (label включает имя клиента).
 *
 * Доступ: cd apps/time; set -a; source ../../.env; set +a; node scripts/seed-company-bookings.mjs
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
const keyOf = (label, startISO) => `${label}|${startISO.slice(0, 10)}`;

// Брони под КОМПАНИЮ (пресейл, без проекта) и под ПРОЕКТ (контраст).
// company / project задаются по ИМЕНИ (резолв в id из live); employee опц. (резерв).
const PLAN = [
  // --- ПОД КОМПАНИЮ (пресейл, проект ещё не создан) ---
  { kind: 'company', company: 'ТехноНиколь',  type: 'SOFT', hours: 120, start: at(2026, 7, 1), end: at(2026, 7, 31, 18), label: 'Пресейл: ТехноНиколь — внедрение СЗИ', note: 'Клиент известен, проект ещё не создан' },
  { kind: 'company', company: 'Геберит Рус',  type: 'SOFT', hours: 80,  start: at(2026, 8, 1), end: at(2026, 8, 31, 18), label: 'Пресейл: Геберит Рус — аудит ИБ',     note: 'Резерв под потенциальный контракт' },
  { kind: 'company', company: 'Евротэк-Югра', type: 'SOFT', hours: 100, start: at(2026, 9, 1), end: at(2026, 9, 30, 18), label: 'Пресейл: Евротэк-Югра — пилот ИС',    note: 'Пилот обсуждается, проект не заведён' },
  // --- ПОД ПРОЕКТ (контраст: обычная бронь под существующий проект) ---
  { kind: 'project', type: 'HARD', hours: 90, start: at(2026, 7, 1), end: at(2026, 7, 31, 18), label: 'Подтверждённая бронь под проект (контракт)', note: 'Бронь под уже созданный проект' },
  { kind: 'project', type: 'SOFT', hours: 60, start: at(2026, 8, 1), end: at(2026, 8, 31, 18), label: 'Предварительная бронь под проект',         note: 'Возможное расширение проекта' },
];

async function run() {
  console.log(`Сервер: ${BASE}`);

  // Проба деплоя объекта.
  await throttle();
  const probe = await fetch(`${BASE}/rest/credosTimeBookings?limit=1`, { headers: H });
  if (probe.status === 400 || probe.status === 404) {
    console.error(`\nОбъект credosTimeBooking не задеплоен (GET -> ${probe.status}). Сначала yarn twenty dev.`);
    process.exit(2);
  }

  // Проба поля company (ADDITIVE) — деплоит ARCH. Делаем заведомо невалидный POST
  // (без обязательных полей не пройдёт, но СНАЧАЛА проверяется наличие companyId):
  // если ответ «doesn't have any companyId field» → поле ещё не задеплоено.
  await throttle();
  const fieldProbe = await fetch(`${BASE}/rest/credosTimeBookings`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ label: '__probe_company_field__', bookingType: 'SOFT', companyId: '00000000-0000-4000-8000-000000000000' }),
  });
  const probeTxt = await fieldProbe.text().catch(() => '');
  // Поле не задеплоено: сервер отвечает 400 с упоминанием отсутствующего companyId.
  if (fieldProbe.status === 400 && /companyId/i.test(probeTxt)) {
    console.error('\nПоле credosTimeBooking.company ещё НЕ задеплоено (ADDITIVE-схема деплоит arch: yarn twenty dev).');
    console.error('Скрипт ничего не создал. Запусти повторно ПОСЛЕ деплоя схемы.');
    process.exit(3);
  }
  // Если проба случайно создала запись с companyId=нулевой UUID — удалим (cleanup).
  if (fieldProbe.ok) {
    const created = await fieldProbe.json().catch(() => ({}));
    const id = created?.data?.createCredosTimeBooking?.id || created?.data?.id || created?.id;
    if (id) { try { await send('DELETE', `/rest/credosTimeBookings/${id}`); } catch { /* ignore */ } }
  }

  // Справочники.
  const companies = await getAll('companies');
  const compByName = new Map(companies.map((c) => [(c.name || '').trim(), c.id]));
  const projects = await getAll('credosTimeProjects');
  const projectsSorted = projects.filter((p) => p && p.id).sort((a, b) => a.id.localeCompare(b.id));
  const fallbackProjectId = projectsSorted[0]?.id || null;

  const existing = await getAll('credosTimeBookings');
  const existingKeys = new Set(
    existing.filter((b) => b.label && b.startDate).map((b) => keyOf(b.label, b.startDate)),
  );
  console.log(`Компаний: ${companies.length}. Проектов: ${projects.length}. Броней уже: ${existing.length}`);

  let created = 0, skipped = 0, missing = 0;
  for (const row of PLAN) {
    const key = keyOf(row.label, row.start);
    if (existingKeys.has(key)) { skipped++; console.log(`  = «${row.label}» — уже есть`); continue; }

    const body = {
      label: row.label, bookingType: row.type, hours: row.hours,
      startDate: row.start, endDate: row.end, note: row.note,
    };
    if (row.kind === 'company') {
      const cid = compByName.get(row.company);
      if (!cid) { missing++; console.log(`  ! нет компании «${row.company}» — пропуск «${row.label}»`); continue; }
      body.companyId = cid; // под компанию, БЕЗ проекта (пресейл)
    } else {
      if (!fallbackProjectId) { missing++; console.log(`  ! нет проектов — пропуск «${row.label}»`); continue; }
      body.projectId = fallbackProjectId; // под проект
    }
    await send('POST', '/rest/credosTimeBookings', body);
    existingKeys.add(key);
    created++;
    const target = row.kind === 'company' ? `company:${row.company}` : `project:${fallbackProjectId.slice(0, 8)}`;
    console.log(`  + [${row.type}] «${row.label}» → ${target} ${row.hours}ч`);
  }

  console.log(`\nИтог: создано ${created}, пропущено ${skipped}, без справочника ${missing}.`);

  // Верификация: брони с companyId и без projectId (пресейл).
  const after = await getAll('credosTimeBookings');
  const presale = after.filter((b) => b.companyId && !b.projectId);
  console.log(`[ВЕРИФИКАЦИЯ] всего броней: ${after.length}; под компанию без проекта (пресейл): ${presale.length}`);
  for (const b of presale) console.log(`    company-бронь: «${b.label}» companyId=${(b.companyId || '').slice(0, 8)}`);
  console.log('Готово.');
}

run().catch((e) => { console.error('\nОШИБКА:', e.message); process.exit(1); });
