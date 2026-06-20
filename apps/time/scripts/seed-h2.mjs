#!/usr/bin/env node
/**
 * Досид H2-2026 (D2-2): раскидать endDate части CLIENT/ACTIVE проектов в
 * июль–декабрь 2026, чтобы capacity-доска показывала загрузку вперёд (сейчас
 * всё кончается в июне → H2 пуст). plannedEffort НЕ трогаем. Плюс чистка
 * пустых credosTimeEntry («Без названия», без project/hours).
 *
 * ИДЕМПОТЕНТНО: продлеваем только проекты с endDate <= 2026-06-30 (повторный
 * прогон видит уже-H2 даты и пропускает). Удаляем только записи без hours и
 * без projectId. Детерминированно (без Math.random на значениях).
 *
 * Доступ: cd apps/time; set -a; source ../../.env; set +a; node scripts/seed-h2.mjs
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

// Целевые окончания H2-2026 (разнообразно по месяцам, последний рабочий день).
// Часть проектов СОЗНАТЕЛЬНО оставляем в июне (короткие/завершающиеся) — для
// реалистичной убывающей загрузки. Циклически назначаем по индексу.
const H2_ENDS = [
  '2026-07-17T18:00:00.000Z',
  '2026-07-31T18:00:00.000Z',
  '2026-08-14T18:00:00.000Z',
  '2026-08-28T18:00:00.000Z',
  '2026-09-18T18:00:00.000Z',
  '2026-09-30T18:00:00.000Z',
  '2026-10-16T18:00:00.000Z',
  '2026-10-30T18:00:00.000Z',
  '2026-11-20T18:00:00.000Z',
  '2026-11-30T18:00:00.000Z',
  '2026-12-18T18:00:00.000Z',
  '2026-12-25T18:00:00.000Z',
];
const JUNE_CUTOFF = '2026-07-01';

async function run() {
  console.log(`Сервер: ${BASE}`);

  // --- 1. Продление CLIENT/ACTIVE проектов в H2 ---
  console.log('\n[1] Раскидка endDate CLIENT/ACTIVE в H2-2026...');
  const projects = await getAll('credosTimeProjects');
  const candidates = projects
    .filter((p) => p.category === 'CLIENT' && p.status === 'ACTIVE')
    .sort((a, b) => (a.code || '').localeCompare(b.code || '')); // детерминир. порядок

  // Какие проекты входят в H2-набор — решаем ДЕТЕРМИНИРОВАННО по стабильному
  // признаку (хэш code), НЕ по текущему endDate. Так повторный прогон даёт тот же
  // набор: H2-проекты уже в H2 (пропуск), июньские всегда вне набора (пропуск).
  // Это делает скрипт идемпотентным (см. шапку). Целевой endDate тоже детерминирован
  // по хэшу — фикс. распределение по месяцам без накопления.
  const hash = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  };
  // ~2/3 кандидатов в H2 (остальные завершаются в июне → реалистичный спад).
  const inH2 = (p) => hash(p.code || p.id) % 3 !== 0;

  let extended = 0;
  let skippedAlready = 0;
  for (const p of candidates) {
    if (!inH2(p)) continue; // сознательно оставляем в июне (стабильно)
    if ((p.endDate || '') >= JUNE_CUTOFF) { skippedAlready++; continue; } // уже в H2
    const newEnd = H2_ENDS[hash(p.code || p.id) % H2_ENDS.length];
    await send('PATCH', `/rest/credosTimeProjects/${p.id}`, { endDate: newEnd });
    extended++;
    console.log(`  ${p.code}: ${p.endDate?.slice(0, 10)} -> ${newEnd.slice(0, 10)} (pe ${p.plannedEffort})`);
  }
  console.log(
    `  продлено: ${extended}, уже в H2: ${skippedAlready}, кандидатов ${candidates.length} (часть стабильно в июне)`,
  );

  // --- 2. Чистка пустых записей трудозатрат ---
  console.log('\n[2] Чистка пустых credosTimeEntry...');
  const entries = await getAll('credosTimeEntries');
  const empty = entries.filter((e) => (!e.hours || e.hours === 0) && !e.projectId);
  for (const e of empty) {
    await send('DELETE', `/rest/credosTimeEntries/${e.id}`);
    console.log(`  - удалена пустая запись ${e.id} (${e.date})`);
  }
  console.log(`  удалено пустых: ${empty.length}`);

  // --- Верификация распределения endDate ---
  console.log('\n[ВЕРИФИКАЦИЯ] endDate по месяцам:');
  const after = await getAll('credosTimeProjects');
  const byEnd = {};
  for (const p of after) {
    const m = (p.endDate || 'нет').slice(0, 7);
    byEnd[m] = (byEnd[m] || 0) + 1;
  }
  console.log('  ' + JSON.stringify(byEnd, null, 0));
  console.log('\nГотово.');
}

run().catch((e) => {
  console.error('\nОШИБКА:', e.message);
  process.exit(1);
});
