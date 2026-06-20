#!/usr/bin/env node
/**
 * Досид ЭТАПОВ (credosTimeStage) для части проектов (сейчас Stages=0).
 * Для ~12 проектов (приоритет — крупные ОВ DIRECTUM + пара ОИБ/ОПИБ/ТЦ)
 * создаём 2–4 реалистичных этапа с русскими названиями по профилю отдела.
 *
 * Профили этапов:
 *   ОВ   (внедрение DIRECTUM): Обследование → Проектирование/Настройка →
 *        Разработка/Интеграция → Опытная эксплуатация → Промышленная эксплуатация.
 *   ОИБ  (аудит/комплаенс): Сбор данных/обследование → Анализ/моделирование →
 *        Разработка ОРД/отчёт → Защита/сдача.
 *   ОПИБ (пентест): Разведка → Анализ уязвимостей → Эксплуатация → Отчёт.
 *   ТЦ   (техцентр): Аудит ИТ → Внедрение → Поддержка.
 *
 * Поля этапа: code (<КОД_ПРОЕКТА>-Э1…), name (рус), status (PLANNED/ACTIVE/
 * ON_HOLD/DONE — реальные SELECT объекта), startDate/endDate (внутри периода
 * проекта, последовательно), plannedEffort (плановые часы проекта разбиты по
 * весам этапов), projectId (связь).
 *
 * ИДЕМПОТЕНТНО: ключ = code этапа. Перед созданием грузим все этапы и пропускаем
 * уже существующие по code. Повторный прогон не плодит дубли.
 * ДЕТЕРМИНИРОВАННО: статус считается от фикс. NOW (2026-06-20), без Math.random.
 *
 * Доступ: cd apps/time; set -a; source ../../.env; set +a; node scripts/seed-stages.mjs
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

// Фикс. «сегодня» проекта (см. контекст: 2026-06-20). Статусы детерминированы.
const NOW = new Date('2026-06-20T12:00:00.000Z');

// Профили этапов по типу проекта. weight — доля плановых часов проекта.
const PROFILES = {
  // Внедрение DIRECTUM (5 этапов).
  OV: [
    { name: 'Обследование и сбор требований', weight: 1 },
    { name: 'Проектирование и настройка', weight: 1.5 },
    { name: 'Разработка и интеграция', weight: 2 },
    { name: 'Опытная эксплуатация', weight: 1 },
    { name: 'Промышленная эксплуатация', weight: 0.8 },
  ],
  // Поддержка/развитие DIRECTUM (3 этапа) — для проектов «Техподдержка/Развитие».
  OV_SUPPORT: [
    { name: 'Анализ обращений и приоритизация', weight: 1 },
    { name: 'Доработка и тестирование', weight: 1.5 },
    { name: 'Передача в эксплуатацию', weight: 1 },
  ],
  // Аудит/комплаенс ИБ (4 этапа).
  OIB: [
    { name: 'Сбор данных и обследование', weight: 1 },
    { name: 'Анализ и моделирование угроз', weight: 1.3 },
    { name: 'Разработка ОРД и отчёта', weight: 1.5 },
    { name: 'Защита и сдача результатов', weight: 0.7 },
  ],
  // Пентест (4 этапа).
  OPIB: [
    { name: 'Разведка и сбор информации', weight: 1 },
    { name: 'Анализ уязвимостей', weight: 1.3 },
    { name: 'Эксплуатация', weight: 1.2 },
    { name: 'Отчёт и рекомендации', weight: 0.8 },
  ],
  // Техцентр (3 этапа).
  TC: [
    { name: 'Аудит ИТ-инфраструктуры', weight: 1 },
    { name: 'Внедрение и настройка', weight: 1.5 },
    { name: 'Поддержка и сопровождение', weight: 1 },
  ],
};

// Выбор профиля по коду + названию проекта.
function profileFor(code, name) {
  const n = (name || '').toLowerCase();
  if (code.startsWith('ОВ')) {
    if (/техпод|поддерж|развитие/.test(n)) return PROFILES.OV_SUPPORT;
    return PROFILES.OV;
  }
  if (code.startsWith('ОИБ')) return PROFILES.OIB;
  if (code.startsWith('ОПИБ')) return PROFILES.OPIB;
  if (code.startsWith('ТЦ')) return PROFILES.TC;
  return PROFILES.OV;
}

// Список целевых проектов (по коду). 7 ОВ (крупные внедрения DIRECTUM) +
// 2 ОИБ + 2 ОПИБ + 1 ТЦ = 12. Стабильный явный список — детерминизм выбора.
const TARGET_CODES = [
  'ОВ-2026-005',  // Аэросила · DIRECTUM 5
  'ОВ-2026-006',  // Белоблводоканал · DIRECTUM
  'ОВ-2026-003',  // Мостоотряд-47 · DIRECTUM RX
  'ОВ-2026-017',  // Мостоотряд-47 · Спец5 ОВК (крупный, 236ч)
  'ОВ-2026-019',  // Гипростроймост — СПб · СЭД (236ч)
  'ОВ-2026-018',  // НКТех (АЕОН) · Развитие (223ч)
  'ОВ-2026-013',  // КрафтХайнц · Техподдержка (профиль OV_SUPPORT)
  'ОИБ-2026-002', // Белоблводоканал · Защита
  'ОИБ-2026-005', // Гайде · Аудит ГОСТ Р 57580 (225ч)
  'ОПИБ-2026-002',// КрафтХайнц · Анализ
  'ОПИБ-2026-004',// Геберит Рус · Киберучения (188ч)
  'ТЦ-2026-003',  // НКТех (АЕОН) · Мониторинг
];

// Разбить [start;end] на N последовательных отрезков. Возвращает [{s,e}].
// Рабочее время этапа: начало 09:00Z, конец 18:00Z. Границы внутри периода.
function splitPeriod(startISO, endISO, n) {
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  const span = end - start;
  const seg = [];
  for (let i = 0; i < n; i++) {
    const s = new Date(start + (span * i) / n);
    const e = new Date(start + (span * (i + 1)) / n);
    // Нормализуем часы к рабочим (09:00 начало, 18:00 конец).
    const sd = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate(), 9, 0, 0));
    const ed = new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate(), 18, 0, 0));
    seg.push({ s: sd, e: ed });
  }
  return seg;
}

// Статус этапа по датам относительно NOW (детерминированно).
function statusFor(s, e) {
  if (e <= NOW) return 'DONE';
  if (s <= NOW && NOW < e) return 'ACTIVE';
  return 'PLANNED';
}

// Округление часов до 0.5.
const round05 = (x) => Math.round(x * 2) / 2;

async function run() {
  console.log(`Сервер: ${BASE}`);
  console.log(`NOW (для статусов): ${NOW.toISOString()}`);

  const projects = await getAll('credosTimeProjects');
  const byCode = new Map(projects.map((p) => [p.code, p]));

  // Существующие этапы — для идемпотентности по code.
  const existing = await getAll('credosTimeStages');
  const existingCodes = new Set(existing.map((s) => s.code).filter(Boolean));
  console.log(`Проектов: ${projects.length}, этапов уже есть: ${existing.length}`);

  let created = 0, skipped = 0, projDone = 0;
  const examples = [];

  for (const code of TARGET_CODES) {
    const p = byCode.get(code);
    if (!p) { console.log(`  ! проект ${code} не найден — пропуск`); continue; }
    if (!p.startDate || !p.endDate) { console.log(`  ! ${code} без дат — пропуск`); continue; }

    const profile = profileFor(code, p.name);
    const segs = splitPeriod(p.startDate, p.endDate, profile.length);
    const totalWeight = profile.reduce((a, s) => a + s.weight, 0);
    const totalEffort = Number(p.plannedEffort) || 0;

    projDone++;
    console.log(`\n${code} (${profile.length} эт., ${totalEffort}ч, ${p.startDate.slice(0,10)}…${p.endDate.slice(0,10)})`);

    for (let i = 0; i < profile.length; i++) {
      const stCode = `${code}-Э${i + 1}`;
      const { s, e } = segs[i];
      const status = statusFor(s, e);
      const effort = round05((totalEffort * profile[i].weight) / totalWeight);

      if (existingCodes.has(stCode)) {
        skipped++;
        console.log(`  = ${stCode} уже есть — пропуск`);
        continue;
      }

      const body = {
        code: stCode,
        name: profile[i].name,
        status,
        projectId: p.id,
        startDate: s.toISOString(),
        endDate: e.toISOString(),
        plannedEffort: effort,
      };
      await send('POST', '/rest/credosTimeStages', body);
      existingCodes.add(stCode);
      created++;
      console.log(`  + ${stCode} «${profile[i].name}» [${status}] ${s.toISOString().slice(0,10)}…${e.toISOString().slice(0,10)} ${effort}ч`);
      if (examples.length < 6) examples.push(`${stCode} «${profile[i].name}» [${status}] ${effort}ч`);
    }
  }

  console.log(`\nИтог: создано этапов ${created}, пропущено (уже было) ${skipped}, по проектам ${projDone}.`);

  // --- Верификация ---
  console.log('\n[ВЕРИФИКАЦИЯ]');
  const after = await getAll('credosTimeStages');
  const projIds = new Set(projects.map((p) => p.id));
  const validStatus = new Set(['PLANNED', 'ACTIVE', 'ON_HOLD', 'DONE']);
  let badProj = 0, badStatus = 0, badDate = 0;
  const projDateById = new Map(projects.map((p) => [p.id, { s: p.startDate, e: p.endDate }]));
  for (const s of after) {
    if (!s.projectId || !projIds.has(s.projectId)) badProj++;
    if (!validStatus.has(s.status)) badStatus++;
    const pd = projDateById.get(s.projectId);
    if (pd && s.startDate && s.endDate) {
      if (s.startDate < pd.s.slice(0,10) || s.endDate.slice(0,10) > pd.e.slice(0,10)) badDate++;
    }
  }
  console.log(`  totalCount этапов: ${after.length}`);
  console.log(`  битый projectId: ${badProj}`);
  console.log(`  невалидный status: ${badStatus}`);
  console.log(`  даты вне периода проекта: ${badDate}`);
  const byStatus = {};
  for (const s of after) byStatus[s.status] = (byStatus[s.status] || 0) + 1;
  console.log(`  по статусам: ${JSON.stringify(byStatus)}`);

  // Инвариант: этап обязан быть привязан к существующему проекту (нет orphan).
  // Совпадает с моделью credosTimeStage.project (isNullable:false, CASCADE).
  if (badProj > 0) {
    console.error(`\nОШИБКА ИНВАРИАНТА: ${badProj} этап(ов) без валидного projectId (orphan). Сид невалиден.`);
    process.exit(1);
  }
  console.log('\nГотово. Orphan-этапов нет ✅');
}

run().catch((e) => {
  console.error('\nОШИБКА:', e.message);
  process.exit(1);
});
