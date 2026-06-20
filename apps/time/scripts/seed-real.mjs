#!/usr/bin/env node
/**
 * Seed РЕАЛЬНЫХ клиентов/проектов Кредо-С на dev-сервер Twenty (REST API).
 *
 * Источник реальных клиентов и проектов — выгрузка Директум 5
 * (research/directum5/trudozatraty-dir5.xlsx): «Организация»=клиент, «Проект»=проект.
 * Демо-компании (Notion/Stripe и пр.) НЕ используются — создаём реальные Company.
 *
 * Что делает (детерминированно, фикс. seed, без Math.random на значениях):
 *   1. Создаёт/находит реальные Company по уникальным клиентам Директум5.
 *   2. Заливает credosTimeDepartment / credosTimeWorkType / credosTimeEmployee
 *      (resume по code/name/email — без дублей).
 *   3. Перезаливает credosTimeProject (--wipe-projects):
 *        ОВ — реальные Directum-проекты с реальными кодами/названиями;
 *        ОИБ/ОПИБ/ТЦ/ОПР — правдоподобные ИБ/ИТ-проекты под реальных клиентов.
 *      companyId -> реальные Company. category WorkCategory (БЕЗ billable).
 *   4. Перезаливает credosTimeEntry (--wipe-entries) — ~400 записей янв-июнь 2026,
 *      пере-привязанных к новым проектам (employee/project/workType, hours decimal).
 *
 * Доступ: set -a; source .env; set +a; node apps/time/scripts/seed-real.mjs --wipe-projects --wipe-entries
 */

const URL = process.env.TWENTY_DEV_URL;
const KEY = process.env.TWENTY_DEV_API_KEY;

if (!URL || !KEY) {
  console.error('Нет TWENTY_DEV_URL / TWENTY_DEV_API_KEY. Выполни: set -a; source .env; set +a');
  process.exit(1);
}

const WIPE_PROJECTS = process.argv.includes('--wipe-projects');
const WIPE_ENTRIES = process.argv.includes('--wipe-entries');

const HEADERS = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Лимит сервера: 100 запросов / 60000 мс. Держим ~85/60с => 700мс/запрос.
const RATE_MS = 700;
let lastReq = 0;
async function throttle() {
  const wait = RATE_MS - (Date.now() - lastReq);
  if (wait > 0) await sleep(wait);
  lastReq = Date.now();
}

async function post(plural, body, retries = 5) {
  await throttle();
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${URL}/rest/${plural}`, {
      method: 'POST', headers: HEADERS, body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      const data = json.data || json;
      return data[Object.keys(data)[0]];
    }
    if (res.status === 429 && attempt < retries) {
      console.log(`  429 rate limit — пауза 60с (попытка ${attempt + 1})`);
      await sleep(61000); lastReq = Date.now(); continue;
    }
    throw new Error(`POST ${plural} -> ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
  }
}

async function getAll(plural) {
  const out = [];
  let cursor = null;
  for (let i = 0; i < 80; i++) {
    const u = new global.URL(`${URL}/rest/${plural}`);
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
  const res = await fetch(`${URL}/rest/${plural}?limit=1`, { headers: HEADERS });
  const json = await res.json();
  return json.totalCount ?? '(нет totalCount)';
}

async function del(plural, id) {
  await throttle();
  await fetch(`${URL}/rest/${plural}/${id}`, { method: 'DELETE', headers: HEADERS });
}

async function wipe(plural) {
  const recs = await getAll(plural);
  for (const r of recs) await del(plural, r.id);
  console.log(`  wipe ${plural}: удалено ${recs.length}`);
}

// --- Детерминированный PRNG (mulberry32) — только для РАСПРЕДЕЛЕНИЯ записей ---
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260620);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];

// WorkCategory (PascalCase в скрипте) -> UPPER_SNAKE значение SELECT на сервере.
const CAT = {
  Client: 'CLIENT', Presale: 'PRESALE', Pilot: 'PILOT',
  Internal: 'INTERNAL', Infrastructure: 'INFRASTRUCTURE', Training: 'TRAINING',
};

// ===========================================================================
// ДАННЫЕ
// ===========================================================================

const DEPT_LABELS = {
  OV: 'Отдел проектирования и внедрения ИС',
  OIB: 'Отдел информационной безопасности',
  OPIB: 'Отдел практической информационной безопасности',
  TC: 'Технический центр',
  OPR: 'Отдел продуктовой разработки',
};

const DEPARTMENTS = [
  { code: 'OV', headcount: 11, approvalRequired: true, capacityFactor: 0.8 },
  { code: 'OIB', headcount: 11, approvalRequired: true, capacityFactor: 0.8 },
  { code: 'OPIB', headcount: 9, approvalRequired: false, capacityFactor: 0.8 },
  { code: 'TC', headcount: 6, approvalRequired: false, capacityFactor: 0.8 },
  { code: 'OPR', headcount: 5, approvalRequired: false, capacityFactor: 0.8 },
];

// Виды работ (без billable). group: PRODUCTION/PROJECT_MANAGEMENT/PRESALE/MEETINGS/TRAINING/INTERNAL
const WORK_TYPES = [
  { name: 'Предпроектное обследование', group: 'PRODUCTION', dept: 'OV' },
  { name: 'Проектирование решения', group: 'PRODUCTION', dept: 'OV' },
  { name: 'Настройка системы', group: 'PRODUCTION', dept: 'OV' },
  { name: 'Миграция данных', group: 'PRODUCTION', dept: 'OV' },
  { name: 'Интеграция с внешними системами', group: 'PRODUCTION', dept: 'OV' },
  { name: 'Тестирование и приёмка', group: 'PRODUCTION', dept: 'OV' },
  { name: 'Обучение пользователей', group: 'PRODUCTION', dept: 'OV' },
  { name: 'Сопровождение и поддержка', group: 'PRODUCTION', dept: 'OV' },
  { name: 'Разработка документации (ОВ)', group: 'PRODUCTION', dept: 'OV' },

  { name: 'Аудит ИБ', group: 'PRODUCTION', dept: 'OIB' },
  { name: 'Экспертный аудит ПДн', group: 'PRODUCTION', dept: 'OIB' },
  { name: 'Аудит КИИ / категорирование', group: 'PRODUCTION', dept: 'OIB' },
  { name: 'Аудит ГОСТ Р 57580', group: 'PRODUCTION', dept: 'OIB' },
  { name: 'Разработка ОРД', group: 'PRODUCTION', dept: 'OIB' },
  { name: 'Моделирование угроз', group: 'PRODUCTION', dept: 'OIB' },
  { name: 'Разработка ТЗ/техпроекта на СЗИ', group: 'PRODUCTION', dept: 'OIB' },
  { name: 'Внедрение СЗИ', group: 'PRODUCTION', dept: 'OIB' },
  { name: 'Аттестация / оценка соответствия', group: 'PRODUCTION', dept: 'OIB' },

  { name: 'Анализ защищённости', group: 'PRODUCTION', dept: 'OPIB' },
  { name: 'Пентест внешний', group: 'PRODUCTION', dept: 'OPIB' },
  { name: 'Пентест внутренний', group: 'PRODUCTION', dept: 'OPIB' },
  { name: 'Пентест web-приложений', group: 'PRODUCTION', dept: 'OPIB' },
  { name: 'Киберучения / фишинг', group: 'PRODUCTION', dept: 'OPIB' },
  { name: 'Мониторинг ИБ / расследование инцидентов', group: 'PRODUCTION', dept: 'OPIB' },

  { name: 'Комплексное администрирование ИТ', group: 'PRODUCTION', dept: 'TC' },
  { name: 'Импортозамещение ИТ', group: 'PRODUCTION', dept: 'TC' },
  { name: 'Мониторинг ИТ', group: 'PRODUCTION', dept: 'TC' },
  { name: 'Облачные услуги / обновление решений', group: 'PRODUCTION', dept: 'TC' },

  { name: 'Разработка ПО', group: 'PRODUCTION', dept: 'OPR' },
  { name: 'Code review / тестирование', group: 'PRODUCTION', dept: 'OPR' },

  { name: 'Управление проектом', group: 'PROJECT_MANAGEMENT', dept: null },
  { name: 'Пресейл', group: 'PRESALE', dept: null },
  { name: 'Пилотный проект', group: 'PRESALE', dept: null },
  { name: 'Оперативное совещание отдела', group: 'MEETINGS', dept: null },
  { name: 'Оргвопросы / поручения руководителя', group: 'MEETINGS', dept: null },
  { name: 'Обучение / повышение квалификации', group: 'TRAINING', dept: null },
  { name: 'Самостоятельное изучение', group: 'TRAINING', dept: null },
  { name: 'Внутренняя автоматизация', group: 'INTERNAL', dept: null },
];

// --- Сотрудники (ПДн-safe, 152-ФЗ / CISO #001) ---
// ПРИНЦИП: реальные ФИО/email НЕ хранятся в трекаемых файлах. Источник реальных
// ПДн читается в рантайме из gitignored-файлов (см. .gitignore). Сам скрипт
// содержит ТОЛЬКО синтетический набор (@example.test). Приоритет источников:
//   1. research/directum5/bitrix-users/roster.csv (gitignored) — первичный реестр
//      Битрикс. Формат: "Сотрудник,Подразделение,E-Mail". Парсится в рантайме,
//      подразделение мэппится на код отдела, посторонние подразделения отсеиваются.
//   2. apps/time/scripts/.employees.local.json (gitignored) — массив
//      [["Имя","Фамилия","mail","OV"], ...] (явный override на dev).
//   3. Синтетический набор @example.test (если gitignored-источников нет).
// Цель: 0 реальных @credos.ru/ФИО в трекаемых файлах.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const LOCAL_EMP = join(__dir, '.employees.local.json');
const ROSTER_CSV = resolve(__dir, '../../../research/directum5/bitrix-users/roster.csv');

// Синтетический набор: распределение OV 11 / OIB 11 / OPIB 9 / TC 6 / OPR 5 = 42.
const SYNTH_DIST = { OV: 11, OIB: 11, OPIB: 9, TC: 6, OPR: 5 };
const SYNTH_EMPLOYEES = Object.entries(SYNTH_DIST).flatMap(([dept, n]) =>
  Array.from({ length: n }, (_, i) => [
    'Сотрудник',
    `${dept}-${i + 1}`,
    `emp.${dept.toLowerCase()}.${i + 1}@example.test`,
    dept,
  ]),
);

// Маппинг названий подразделений Битрикса -> код отдела модели (5 учётных отделов).
// Подразделения вне этого набора (АХО, Руководство, бухгалтерия и т.п.) отсеиваются.
const ROSTER_DEPT_MAP = [
  [/проектирован|внедрен/i, 'OV'],
  [/практическ/i, 'OPIB'],
  [/информационной безопасн/i, 'OIB'],
  [/технический центр/i, 'TC'],
  [/продуктов|разработк/i, 'OPR'],
];

// Парсер roster.csv (gitignored): "Полное ФИО, Подразделение, email".
// ФИО приходит как "Имя Фамилия" (иногда с отчеством) — берём первое слово как
// имя, последнее как фамилию. Возвращает строки формата [first, last, email, dept].
function parseRoster(text) {
  const rows = [];
  const lines = text.split(/\r?\n/).slice(1); // пропускаем заголовок
  for (const line of lines) {
    if (!line.trim()) continue;
    // Простой CSV с кавычками вокруг поля подразделения.
    const cells = line.match(/(?:"[^"]*"|[^,])+/g);
    if (!cells || cells.length < 3) continue;
    const [fio, deptRaw, email] = cells.map((c) => c.replace(/^"|"$/g, '').trim());
    if (!email) continue;
    const matched = ROSTER_DEPT_MAP.find(([re]) => re.test(deptRaw));
    if (!matched) continue; // не учётный отдел
    const parts = fio.split(/\s+/).filter(Boolean);
    if (parts.length < 2) continue;
    const first = parts[0];
    const last = parts[parts.length === 3 ? 1 : parts.length - 1];
    rows.push([first, last, email, matched[1]]);
  }
  return rows;
}

let EMPLOYEES;
let empSource;
if (existsSync(ROSTER_CSV)) {
  EMPLOYEES = parseRoster(readFileSync(ROSTER_CSV, 'utf8'));
  empSource = `roster.csv (${EMPLOYEES.length} чел.)`;
}
if ((!EMPLOYEES || EMPLOYEES.length === 0) && existsSync(LOCAL_EMP)) {
  EMPLOYEES = JSON.parse(readFileSync(LOCAL_EMP, 'utf8'));
  empSource = `.employees.local.json (${EMPLOYEES.length} чел.)`;
}
if (!EMPLOYEES || EMPLOYEES.length === 0) {
  EMPLOYEES = SYNTH_EMPLOYEES;
  empSource = `синтетический набор @example.test (${EMPLOYEES.length} чел.)`;
}
console.log(`  [сотрудники] источник: ${empSource}`);

// --- РЕАЛЬНЫЕ клиенты Директум5: ключ = короткое имя (Company.name), legal = юрлицо.
const CLIENTS = [
  { key: 'Мостоотряд-47', legal: 'ООО ФСК "Мостоотряд-47"' },
  { key: 'Никольская Консалтинг', legal: 'ООО "Никольская Консалтинг"' },
  { key: 'КрафтХайнц Восток', legal: 'ООО «КрафтХайнц Восток»' },
  { key: 'НКТех (АЕОН)', legal: 'ООО ИК «Аеон»' },
  { key: 'Белоблводоканал', legal: 'ГУП "Белгородский Областной Водоканал"' },
  { key: 'Донбасстеплоэнерго', legal: 'ГУП ДНР "Донбасстеплоэнерго"' },
  { key: 'ТехноНиколь', legal: 'ООО "Управление КВ" (ТехноНиколь)' },
  { key: 'Геберит Рус', legal: 'ООО "Геберит Рус"' },
  { key: 'Аэросила', legal: 'ПАО НПП "Аэросила"' },
  { key: 'ТАМАК', legal: 'АО "ТАМАК"' },
  { key: 'Гипростроймост — СПб', legal: 'АО "Институт Гипростроймост - Санкт-Петербург"' },
  { key: 'Автодор-Инжиниринг', legal: 'ООО "Автодор-Инжиниринг"' },
  { key: 'Гайде', legal: 'АО СК "Гайде"' },
  { key: 'Евротэк-Югра', legal: 'АО "Евротэк-Югра"' },
  { key: 'ИДС Боржоми', legal: 'ООО "Идс Боржоми"' },
];
const CLIENT_KEYS = CLIENTS.map((c) => c.key);

// --- ОВ: реальные Directum-проекты (код + название из выгрузки), привязка к client.
const OV_PROJECTS = [
  { code: '2021-0544', name: 'Мостоотряд-47 (DIRECTUM RX)', client: 'Мостоотряд-47' },
  { code: 'К2023-450-С5', name: 'МО-47. Спец5. ОВКА', client: 'Мостоотряд-47' },
  { code: '2023-210', name: 'НИКО. Развитие. RX', client: 'Никольская Консалтинг' },
  { code: '2023-210-С4', name: 'НИКО. Спец4. Интеграция с MS Exchange', client: 'Никольская Консалтинг' },
  { code: '2024-158', name: 'Хайнц (Heinz)', client: 'КрафтХайнц Восток' },
  { code: '2024-656-ТП', name: 'Хайнц. Техподдержка', client: 'КрафтХайнц Восток' },
  { code: '2022-25', name: 'АЕОН (Directum RX, разработка + интеграция с 1С)', client: 'НКТех (АЕОН)' },
  { code: 'КР-2025-255', name: 'НКТех (бывш. АЕОН). Развитие', client: 'НКТех (АЕОН)' },
  { code: '2022-1012', name: 'Белоблводоканал (DIRECTUM RX)', client: 'Белоблводоканал' },
  { code: '2023-111', name: 'ДТЭ. Внедрение', client: 'Донбасстеплоэнерго' },
  { code: '3-ТНК', name: 'Проект DIRECTUM для Технониколь (тендер)', client: 'ТехноНиколь' },
  { code: '2021-49', name: 'Геберит РУС (DIRECTUM RX)', client: 'Геберит Рус' },
  { code: '2021-502', name: 'Аэросила (DIRECTUM 5, канцелярия)', client: 'Аэросила' },
  { code: '30332', name: 'ТАМАК. Проект МКДО DIRECTUM 5', client: 'ТАМАК' },
  { code: 'КР-2026-2007', name: 'Гипростроймост. СЭД', client: 'Гипростроймост — СПб' },
  { code: 'КР-2026-2181', name: 'Гипростроймост. HR PRO', client: 'Гипростроймост — СПб' },
  { code: '2021-001', name: 'Автодор-Инжиниринг (DIRECTUM RX с разработкой)', client: 'Автодор-Инжиниринг' },
  { code: '2024-206', name: 'Гайде (Directum RX)', client: 'Гайде' },
  { code: '30432', name: 'Евротэк-Югра (DIRECTUM RX)', client: 'Евротэк-Югра' },
  { code: '2020-544', name: 'Боржоми (DIRECTUM RX, HR-процессы)', client: 'ИДС Боржоми' },
];

// --- ИБ/ИТ-проекты под реальных клиентов (правдоподобные, по профилю Кредо-С).
const IB_PROJECTS = {
  OIB: [
    { suffix: 'Категорирование КИИ', client: 'Аэросила', category: 'Client' },
    { suffix: 'Защита ПДн (152-ФЗ)', client: 'Белоблводоканал', category: 'Client' },
    { suffix: 'Аудит ИБ', client: 'Гипростроймост — СПб', category: 'Client' },
    { suffix: 'Аттестация ГИС', client: 'Донбасстеплоэнерго', category: 'Client' },
    { suffix: 'Аудит ГОСТ Р 57580', client: 'Гайде', category: 'Client' },
    { suffix: 'Моделирование угроз и ОРД', category: 'Presale' },
    { suffix: 'Пилот защиты АРМ', client: 'ТАМАК', category: 'Pilot' },
  ],
  OPIB: [
    { suffix: 'Пентест внешнего периметра', client: 'НКТех (АЕОН)', category: 'Client' },
    { suffix: 'Анализ защищённости web-приложения', client: 'КрафтХайнц Восток', category: 'Client' },
    { suffix: 'Внутренний пентест', client: 'Мостоотряд-47', category: 'Client' },
    { suffix: 'Киберучения / фишинг', client: 'Геберит Рус', category: 'Client' },
    { suffix: 'Анализ защищённости', category: 'Presale' },
    { suffix: 'Пилот мониторинга ИБ', client: 'Евротэк-Югра', category: 'Pilot' },
  ],
  TC: [
    { suffix: 'Комплексное администрирование ИТ', client: 'ТАМАК', category: 'Client' },
    { suffix: 'Импортозамещение инфраструктуры', client: 'Автодор-Инжиниринг', category: 'Client' },
    { suffix: 'Мониторинг ИТ', client: 'Боржоми (ИДС Боржоми)', category: 'Client' },
    { suffix: 'Облачная миграция', category: 'Presale' },
    { suffix: 'Обслуживание ИТ-инфраструктуры Кредо-С', category: 'Infrastructure' },
  ],
  OPR: [
    { suffix: 'Разработка модуля учёта трудозатрат (time)', category: 'Internal' },
    { suffix: 'Доработка платформы Twenty', category: 'Internal' },
    { suffix: 'R&D / повышение квалификации', category: 'Training' },
    { suffix: 'Внутренний инструмент аналитики', category: 'Internal' },
  ],
};

// ===========================================================================
// ЗАЛИВКА
// ===========================================================================

async function run() {
  console.log(`Сервер: ${URL}`);
  console.log(`Режим: wipe-projects=${WIPE_PROJECTS} wipe-entries=${WIPE_ENTRIES}`);

  // --- 0. Wipe (записи -> проекты, в нужном порядке из-за CASCADE) ---
  if (WIPE_ENTRIES) {
    console.log('\n[0a] Очистка credosTimeEntries...');
    await wipe('credosTimeEntries');
  }
  if (WIPE_PROJECTS) {
    console.log('[0b] Очистка credosTimeProjects...');
    await wipe('credosTimeProjects');
  }

  // --- 1. Реальные Company (resume по name) ---
  console.log('\n[1] Реальные Company (клиенты Директум5)...');
  const existingCo = await getAll('companies');
  const coIdByName = {};
  for (const c of existingCo) if (c.name) coIdByName[c.name.trim()] = c.id;
  const clientCompanyId = {};
  let coNew = 0;
  for (const c of CLIENTS) {
    let id = coIdByName[c.key];
    if (!id) {
      const rec = await post('companies', { name: c.key });
      id = rec.id; coNew++;
      console.log(`  + Company "${c.key}" -> ${id}`);
    }
    clientCompanyId[c.key] = id;
  }
  console.log(`  реальных клиентов: ${CLIENTS.length} (создано новых ${coNew})`);

  // --- 2. Departments (resume по code) ---
  console.log('\n[2] credosTimeDepartments...');
  const existingDepts = await getAll('credosTimeDepartments');
  const deptIdByCode = {};
  for (const d of existingDepts) if (d.code) deptIdByCode[d.code] = d.id;
  for (const d of DEPARTMENTS) {
    if (deptIdByCode[d.code]) { continue; }
    const rec = await post('credosTimeDepartments', {
      name: DEPT_LABELS[d.code], code: d.code,
      approvalRequired: d.approvalRequired, capacityFactor: d.capacityFactor, headcount: d.headcount,
    });
    deptIdByCode[d.code] = rec.id;
  }
  console.log(`  отделов: ${Object.keys(deptIdByCode).length}`);

  // --- 3. WorkTypes (resume по name; БЕЗ billableByDefault) ---
  console.log('\n[3] credosTimeWorkTypes...');
  const existingWt = await getAll('credosTimeWorkTypes');
  const wtIdByName = {};
  for (const w of existingWt) if (w.name) wtIdByName[w.name] = w.id;
  const workTypes = [];
  let wtNew = 0;
  for (const w of WORK_TYPES) {
    let id = wtIdByName[w.name];
    if (!id) {
      const body = { name: w.name, group: w.group };
      if (w.dept) body.departmentId = deptIdByCode[w.dept];
      const rec = await post('credosTimeWorkTypes', body);
      id = rec.id; wtNew++;
    }
    workTypes.push({ id, name: w.name, group: w.group, dept: w.dept });
  }
  console.log(`  видов работ: ${workTypes.length} (новых ${wtNew})`);

  // --- 4. Employees (resume по email) ---
  console.log('\n[4] credosTimeEmployees...');
  const existingEmp = await getAll('credosTimeEmployees');
  const empIdByEmail = {};
  for (const e of existingEmp) if (e.email) empIdByEmail[e.email] = e.id;
  const employees = [];
  let empNew = 0;
  for (const [first, last, email, dept] of EMPLOYEES) {
    let id = empIdByEmail[email];
    if (!id) {
      const rec = await post('credosTimeEmployees', {
        name: `${last} ${first}`, firstName: first, lastName: last,
        email, active: true, departmentId: deptIdByCode[dept],
      });
      id = rec.id; empNew++;
    }
    employees.push({ id, dept });
  }
  console.log(`  работников: ${employees.length} (новых ${empNew})`);

  // --- 5. Projects (реальные коды/названия; companyId -> реальные Company) ---
  console.log('\n[5] credosTimeProjects (реальные)...');
  const projects = []; // { id, dept, category, code }
  let projNew = 0;

  // D2-2: раскидать endDate по H1-H2 2026 (часть продлить за июнь), чтобы CAPACITY
  // вперёд (июль+) не была пустой. Детерминированно по счётчику (≈5/7 уходят в H2).
  const PROJECT_END_DATES = [
    '2026-06-26', '2026-07-31', '2026-08-28', '2026-09-25',
    '2026-10-30', '2026-11-27', '2026-12-25',
  ];
  let endSpreadIdx = 0;
  const nextEndDate = () =>
    `${PROJECT_END_DATES[endSpreadIdx++ % PROJECT_END_DATES.length]}T18:00:00.000Z`;

  // 5a. ОВ — реальные Directum-проекты
  for (const p of OV_PROJECTS) {
    const rec = await post('credosTimeProjects', {
      name: p.name,
      code: p.code,
      category: CAT.Client,
      status: 'ACTIVE',
      plannedEffort: 80 + (p.code.length * 13) % 320,
      startDate: '2026-01-12T09:00:00.000Z',
      endDate: nextEndDate(),
      departmentId: deptIdByCode.OV,
      companyId: clientCompanyId[p.client],
    });
    projNew++;
    projects.push({ id: rec.id, dept: 'OV', category: 'Client', code: p.code });
  }

  // 5b. ОИБ/ОПИБ/ТЦ/ОПР — ИБ/ИТ-проекты
  const deptPrefix = { OIB: 'ОИБ', OPIB: 'ОПИБ', TC: 'ТЦ', OPR: 'ОПР' };
  for (const dept of ['OIB', 'OPIB', 'TC', 'OPR']) {
    const list = IB_PROJECTS[dept];
    let idx = 0;
    for (const it of list) {
      idx++;
      const code = `${deptPrefix[dept]}-2026-${String(idx).padStart(3, '0')}`;
      const clientName = it.client ? ` — ${it.client}` : '';
      const tag = it.category === 'Presale' ? ' (пресейл)'
        : it.category === 'Pilot' ? ' (пилот)'
        : it.category === 'Internal' ? ' (внутр.)'
        : it.category === 'Infrastructure' ? ' (инфра)'
        : it.category === 'Training' ? ' (обучение)' : '';
      const name = `${it.suffix}${clientName}${tag}`;
      const body = {
        name, code, category: CAT[it.category], status: 'ACTIVE',
        plannedEffort: 40 + (idx * 37) % 280,
        startDate: '2026-02-02T09:00:00.000Z',
        endDate: nextEndDate(),
        departmentId: deptIdByCode[dept],
      };
      // Клиентские/пилотные привязываем к реальной Company.
      if (it.client && clientCompanyId[it.client]) body.companyId = clientCompanyId[it.client];
      else if ((it.category === 'Client' || it.category === 'Pilot')) {
        body.companyId = clientCompanyId[CLIENT_KEYS[idx % CLIENT_KEYS.length]];
      }
      const rec = await post('credosTimeProjects', body);
      projNew++;
      projects.push({ id: rec.id, dept, category: it.category, code });
    }
  }
  console.log(`  проектов создано: ${projNew}`);

  // --- 6. TimeEntries — ~400 записей, пере-привязаны к новым проектам ---
  console.log('\n[6] credosTimeEntries...');
  const workdays = [];
  for (let m = 0; m < 6; m++) {
    const d = new Date(Date.UTC(2026, m, 1));
    while (d.getUTCMonth() === m) {
      const dow = d.getUTCDay();
      if (dow !== 0 && dow !== 6) workdays.push(new Date(d));
      d.setUTCDate(d.getUTCDate() + 1);
    }
  }

  const DEPT_CODES = DEPARTMENTS.map((d) => d.code);
  const projByDept = {};
  const wtByDept = {};
  const crossWt = workTypes.filter((w) => w.dept === null);
  for (const code of DEPT_CODES) {
    projByDept[code] = projects.filter((p) => p.dept === code);
    wtByDept[code] = workTypes.filter((w) => w.dept === code);
  }

  const TARGET = 420;
  const perEmployee = Math.ceil(TARGET / employees.length);
  const batch = [];
  let entryCount = 0;
  for (const emp of employees) {
    const deptProj = projByDept[emp.dept].length ? projByDept[emp.dept] : projects;
    const deptWt = wtByDept[emp.dept];
    for (let k = 0; k < perEmployee; k++) {
      if (entryCount >= TARGET) break;
      const proj = pick(deptProj);
      const wt = (rng() < 0.75 && deptWt.length) ? pick(deptWt) : pick(crossWt);
      const day = pick(workdays);
      const dateStr = day.toISOString().slice(0, 10) + 'T10:00:00.000Z';
      const hours = pick([0.5, 1, 1.5, 2, 2, 3, 4, 4, 6, 8]);
      const status = rng() < 0.55 ? 'APPROVED' : 'DRAFT';
      batch.push({
        date: dateStr, hours, description: wt.name, status,
        employeeId: emp.id, projectId: proj.id, workTypeId: wt.id,
      });
      entryCount++;
    }
  }

  let done = 0;
  for (const b of batch) {
    await post('credosTimeEntries', b);
    done++;
    if (done % 50 === 0) console.log(`  ...записей: ${done}/${batch.length}`);
  }
  console.log(`  создано записей: ${done}`);

  // --- Верификация ---
  console.log('\n[ВЕРИФИКАЦИЯ] totalCount:');
  for (const p of ['companies', 'credosTimeDepartments', 'credosTimeWorkTypes', 'credosTimeEmployees', 'credosTimeProjects', 'credosTimeEntries']) {
    console.log(`  ${p}: ${await totalCount(p)}`);
  }
  console.log('\nГотово.');
}

run().catch((e) => {
  console.error('\nОШИБКА:', e.message);
  process.exit(1);
});
