#!/usr/bin/env node
/**
 * Пере-сид кодов проектов модуля time по консистентной схеме [ОТДЕЛ]-[ГОД]-[NNN].
 *
 * Делает (через PATCH, БЕЗ пересоздания — id сохраняются, трудозатраты целы):
 *   1. Группирует 42 проекта по отделу (ОВ/ОИБ/ОПИБ/ТЦ/ОПР).
 *   2. Сортирует стабильно (по текущему code), присваивает сквозной NNN (001..).
 *   3. Новый code = `<ОТДЕЛ>-<ГОД>-<NNN>` (ГОД = год startDate, иначе 2026).
 *   4. Реальный клиентский/Директум-код (текущий code не формата [ОТДЕЛ]-ГОД-NNN)
 *      переносит в поле externalCode. У ИБ/ИТ-проектов externalCode пуст.
 *   5. name пересобирает: `<НОВЫЙ_КОД> · <Клиент> · <Краткое название>`.
 *
 * Запуск:
 *   set -a; source .env; set +a
 *   node apps/time/scripts/reseed-codes.mjs           # применить (PATCH)
 *   node apps/time/scripts/reseed-codes.mjs --dry-run # только план, без записи
 */

const BASE = process.env.TWENTY_DEV_URL;
const KEY = process.env.TWENTY_DEV_API_KEY;
if (!BASE || !KEY) {
  console.error('Нет TWENTY_DEV_URL / TWENTY_DEV_API_KEY. Выполни: set -a; source .env; set +a');
  process.exit(1);
}

const DRY = process.argv.includes('--dry-run');
const HEADERS = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const RATE_MS = 700;
let lastReq = 0;
async function throttle() {
  const wait = RATE_MS - (Date.now() - lastReq);
  if (wait > 0) await sleep(wait);
  lastReq = Date.now();
}

async function getAll(plural) {
  const out = [];
  let cursor = null;
  for (let i = 0; i < 80; i++) {
    const u = new URL(`${BASE}/rest/${plural}`);
    u.searchParams.set('limit', '60');
    if (cursor) u.searchParams.set('starting_after', cursor);
    await throttle();
    const res = await fetch(u, { headers: HEADERS });
    const json = await res.json();
    const data = json.data || json;
    let recs = data[plural] || data.records || data;
    if (recs && recs.records) recs = recs.records;
    if (!Array.isArray(recs)) recs = [];
    out.push(...recs);
    const pi = json.pageInfo || (data && data.pageInfo);
    if (!pi || !pi.hasNextPage || recs.length === 0) break;
    cursor = pi.endCursor || recs[recs.length - 1].id;
  }
  return out;
}

async function totalCount(plural) {
  await throttle();
  const res = await fetch(`${BASE}/rest/${plural}?limit=1`, { headers: HEADERS });
  const json = await res.json();
  return json.totalCount ?? '(нет totalCount)';
}

async function patch(plural, id, body, retries = 5) {
  await throttle();
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${BASE}/rest/${plural}/${id}`, {
      method: 'PATCH', headers: HEADERS, body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) return json;
    if (res.status === 429 && attempt < retries) {
      console.log(`  429 rate limit — пауза 60с (попытка ${attempt + 1})`);
      await sleep(61000); lastReq = Date.now(); continue;
    }
    throw new Error(`PATCH ${plural}/${id} -> ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
  }
}

// Префикс отдела (code департамента -> кириллический префикс кода проекта).
const DEPT_PREFIX = { OV: 'ОВ', OIB: 'ОИБ', OPIB: 'ОПИБ', TC: 'ТЦ', OPR: 'ОПР' };
// Порядок отделов в отчёте.
const DEPT_ORDER = ['OV', 'OIB', 'OPIB', 'TC', 'OPR'];

// Внутренний код формата [ОТДЕЛ]-[ГОД]-[NNN] (кириллические префиксы).
const INTERNAL_RE = /^(ОВ|ОИБ|ОПИБ|ТЦ|ОПР)-\d{4}-\d+$/;

// Краткое название проекта по СТАРОМУ коду (стабильный ключ).
// Чистое короткое имя без клиента и тегов категории.
const SHORT_NAME = {
  // --- ОВ (Directum) ---
  '2021-0544': 'DIRECTUM RX',
  'К2023-450-С5': 'Спец5. ОВКА',
  '2023-210': 'Развитие RX',
  '2023-210-С4': 'Спец4. Интеграция с MS Exchange',
  '2024-158': 'DIRECTUM RX',
  '2024-656-ТП': 'Техподдержка',
  '2022-25': 'DIRECTUM RX (разработка + 1С)',
  'КР-2025-255': 'Развитие',
  '2022-1012': 'DIRECTUM RX',
  '2023-111': 'Внедрение',
  '3-ТНК': 'DIRECTUM (тендер)',
  '2021-49': 'DIRECTUM RX',
  '2021-502': 'DIRECTUM 5, канцелярия',
  '30332': 'МКДО DIRECTUM 5',
  'КР-2026-2007': 'СЭД',
  'КР-2026-2181': 'HR PRO',
  '2021-001': 'DIRECTUM RX с разработкой',
  '2024-206': 'DIRECTUM RX',
  '30432': 'DIRECTUM RX',
  '2020-544': 'DIRECTUM RX, HR-процессы',
  // --- ОИБ ---
  'ОИБ-2026-001': 'Категорирование КИИ',
  'ОИБ-2026-002': 'Защита ПДн (152-ФЗ)',
  'ОИБ-2026-003': 'Аудит ИБ',
  'ОИБ-2026-004': 'Аттестация ГИС',
  'ОИБ-2026-005': 'Аудит ГОСТ Р 57580',
  'ОИБ-2026-006': 'Моделирование угроз и ОРД (пресейл)',
  'ОИБ-2026-007': 'Пилот защиты АРМ',
  // --- ОПИБ ---
  'ОПИБ-2026-001': 'Пентест внешнего периметра',
  'ОПИБ-2026-002': 'Анализ защищённости web-приложения',
  'ОПИБ-2026-003': 'Внутренний пентест',
  'ОПИБ-2026-004': 'Киберучения / фишинг',
  'ОПИБ-2026-005': 'Анализ защищённости (пресейл)',
  'ОПИБ-2026-006': 'Пилот мониторинга ИБ',
  // --- ТЦ ---
  'ТЦ-2026-001': 'Комплексное администрирование ИТ',
  'ТЦ-2026-002': 'Импортозамещение инфраструктуры',
  'ТЦ-2026-003': 'Мониторинг ИТ',
  'ТЦ-2026-004': 'Облачная миграция (пресейл)',
  'ТЦ-2026-005': 'Обслуживание ИТ-инфраструктуры Кредо-С',
  // --- ОПР ---
  'ОПР-2026-001': 'Модуль учёта трудозатрат (time)',
  'ОПР-2026-002': 'Доработка платформы Twenty',
  'ОПР-2026-003': 'R&D / повышение квалификации',
  'ОПР-2026-004': 'Внутренний инструмент аналитики',
};

// Запасная очистка имени, если SHORT_NAME нет: режем клиентский суффикс « — Клиент»
// и оставляем как есть.
function fallbackShort(name) {
  return name.split(' — ')[0].trim();
}

async function run() {
  console.log(`Сервер: ${BASE}`);
  console.log(`Режим: ${DRY ? 'DRY-RUN (без записи)' : 'ПРИМЕНИТЬ (PATCH)'}\n`);

  const projects = await getAll('credosTimeProjects');
  const depts = await getAll('credosTimeDepartments');
  const companies = await getAll('companies');
  const deptCodeById = {};
  for (const d of depts) deptCodeById[d.id] = d.code;
  const coNameById = {};
  for (const c of companies) coNameById[c.id] = c.name;

  console.log(`Проектов получено: ${projects.length}`);
  if (projects.length !== 42) {
    console.warn(`  ВНИМАНИЕ: ожидалось 42, получено ${projects.length}`);
  }

  // Группировка по отделу.
  const byDept = {};
  for (const p of projects) {
    const dc = deptCodeById[p.departmentId] || 'UNKNOWN';
    (byDept[dc] ||= []).push(p);
  }

  const plan = []; // { id, dept, oldCode, newCode, externalCode, name }
  for (const dc of DEPT_ORDER) {
    const list = byDept[dc] || [];
    // Стабильная сортировка: по текущему коду (локаль-сравнение).
    list.sort((a, b) => String(a.code).localeCompare(String(b.code), 'ru'));
    let nnn = 0;
    for (const p of list) {
      nnn++;
      const prefix = DEPT_PREFIX[dc] || dc;
      const year = (p.startDate && /^\d{4}/.test(p.startDate))
        ? p.startDate.slice(0, 4) : '2026';
      const newCode = `${prefix}-${year}-${String(nnn).padStart(3, '0')}`;

      // Внешний код: если текущий code — клиентский (не внутренний формат).
      const oldCode = String(p.code || '');
      const externalCode = INTERNAL_RE.test(oldCode) ? null : oldCode;

      // Краткое название.
      const short = SHORT_NAME[oldCode] || fallbackShort(p.name || '');
      const client = coNameById[p.companyId];
      const nameParts = [newCode];
      if (client) nameParts.push(client);
      nameParts.push(short);
      const name = nameParts.join(' · ');

      plan.push({ id: p.id, dept: dc, oldCode, newCode, externalCode, name });
    }
  }

  // Проверка уникальности новых кодов.
  const seen = new Set();
  const dups = [];
  for (const it of plan) {
    if (seen.has(it.newCode)) dups.push(it.newCode);
    seen.add(it.newCode);
  }
  if (dups.length) { console.error('ДУБЛИ новых кодов:', dups); process.exit(1); }

  // Печать плана.
  console.log('\nПЛАН (oldCode -> newCode | externalCode | name):');
  for (const dc of DEPT_ORDER) {
    console.log(`\n[${DEPT_PREFIX[dc]}]`);
    for (const it of plan.filter((x) => x.dept === dc)) {
      console.log(`  ${it.oldCode.padEnd(14)} -> ${it.newCode}  ext=${(it.externalCode || '-').padEnd(14)}  ${it.name}`);
    }
  }

  if (DRY) {
    console.log('\nDRY-RUN: ничего не записано.');
    return;
  }

  // Применение PATCH.
  console.log('\n[PATCH] Обновление проектов...');
  let done = 0;
  for (const it of plan) {
    await patch('credosTimeProjects', it.id, {
      code: it.newCode,
      externalCode: it.externalCode,
      name: it.name,
    });
    done++;
    if (done % 10 === 0) console.log(`  ...обновлено ${done}/${plan.length}`);
  }
  console.log(`  обновлено проектов: ${done}`);

  console.log('\n[ВЕРИФИКАЦИЯ] totalCount:');
  console.log(`  credosTimeProjects: ${await totalCount('credosTimeProjects')}`);
  console.log(`  credosTimeEntries:  ${await totalCount('credosTimeEntries')}`);
  console.log('\nГотово.');
}

run().catch((e) => {
  console.error('\nОШИБКА:', e.message);
  process.exit(1);
});
