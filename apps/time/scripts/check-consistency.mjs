#!/usr/bin/env node
/**
 * Проверка консистентности данных модуля time после импорта (Задача 3).
 *
 *  - totalCount по всем credosTime* непусто;
 *  - каждая запись имеет employeeId + projectId + workTypeId (нет битых связей);
 *  - проекты привязаны к реальным Company (companyId, не демо Notion/Stripe);
 *  - категории/группы валидны (UPPER_SNAKE из наших enum);
 *  - нет дублей кодов проектов.
 *
 * Доступ: set -a; source .env; set +a; node apps/time/scripts/check-consistency.mjs
 */

const URL = process.env.TWENTY_DEV_URL;
const KEY = process.env.TWENTY_DEV_API_KEY;
if (!URL || !KEY) { console.error('Нет TWENTY_DEV_URL / TWENTY_DEV_API_KEY'); process.exit(1); }

const HEADERS = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastReq = 0;
async function throttle() { const w = 700 - (Date.now() - lastReq); if (w > 0) await sleep(w); lastReq = Date.now(); }

async function getAll(plural) {
  const out = []; let cursor = null;
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
  return (await res.json()).totalCount ?? null;
}

const VALID_CATEGORY = ['CLIENT', 'PRESALE', 'PILOT', 'INTERNAL', 'INFRASTRUCTURE', 'TRAINING'];
const VALID_GROUP = ['PRODUCTION', 'PROJECT_MANAGEMENT', 'PRESALE', 'MEETINGS', 'TRAINING', 'INTERNAL'];
const DEMO_COMPANIES = ['Notion', 'Stripe', 'Figma', 'Airbnb', 'Anthropic'];

function fk(rec, base) {
  // companyId / employeeId / projectId / workTypeId либо вложенный объект.
  return rec[`${base}Id`] || (rec[base] && rec[base].id) || null;
}

async function run() {
  console.log('=== ПРОВЕРКА КОНСИСТЕНТНОСТИ time ===');
  console.log(`Сервер: ${URL}\n`);
  const problems = [];

  // 1. totalCount непусто
  console.log('[1] totalCount по объектам:');
  const objs = ['credosTimeDepartments', 'credosTimeWorkTypes', 'credosTimeEmployees', 'credosTimeProjects', 'credosTimeEntries'];
  for (const o of objs) {
    const c = await totalCount(o);
    console.log(`  ${o}: ${c}`);
    if (!c || c === 0) problems.push(`Объект ${o} ПУСТ (totalCount=${c})`);
  }

  // Загружаем данные
  const companies = await getAll('companies');
  const coById = {}; for (const c of companies) coById[c.id] = c.name;
  const projects = await getAll('credosTimeProjects');
  const entries = await getAll('credosTimeEntries');
  const workTypes = await getAll('credosTimeWorkTypes');

  // 2. Записи: employeeId + projectId + workTypeId
  console.log('\n[2] Целостность связей записей трудозатрат:');
  let brokenEmp = 0, brokenProj = 0, brokenWt = 0;
  for (const e of entries) {
    if (!fk(e, 'employee')) brokenEmp++;
    if (!fk(e, 'project')) brokenProj++;
    if (!fk(e, 'workType')) brokenWt++;
  }
  console.log(`  записей: ${entries.length}; без employee: ${brokenEmp}; без project: ${brokenProj}; без workType: ${brokenWt}`);
  if (brokenEmp) problems.push(`${brokenEmp} записей без employeeId`);
  if (brokenProj) problems.push(`${brokenProj} записей без projectId`);
  if (brokenWt) problems.push(`${brokenWt} записей без workTypeId`);

  // 3. Проекты привязаны к РЕАЛЬНЫМ Company (не демо)
  console.log('\n[3] Привязка проектов к реальным клиентам:');
  let noCompany = 0, demoLinked = 0, realLinked = 0;
  const clientCats = ['CLIENT', 'PILOT'];
  const usedCompanies = new Set();
  for (const p of projects) {
    const coId = fk(p, 'company');
    const coName = coId ? coById[coId] : null;
    if (coId) usedCompanies.add(coName);
    if (clientCats.includes(p.category)) {
      if (!coId) { noCompany++; continue; }
      if (DEMO_COMPANIES.includes(coName)) demoLinked++;
      else realLinked++;
    }
  }
  console.log(`  клиентских/пилотных проектов c реальной Company: ${realLinked}`);
  console.log(`  привязано к ДЕМО-компаниям: ${demoLinked}`);
  console.log(`  клиентских/пилотных без companyId: ${noCompany}`);
  console.log(`  задействованные компании: ${[...usedCompanies].join(', ')}`);
  if (demoLinked) problems.push(`${demoLinked} клиентских проектов привязаны к ДЕМО-компаниям`);

  // 4. Валидность категорий/групп
  console.log('\n[4] Валидность категорий проектов и групп видов работ:');
  const badCat = projects.filter((p) => !VALID_CATEGORY.includes(p.category));
  const badGroup = workTypes.filter((w) => !VALID_GROUP.includes(w.group));
  console.log(`  невалидных category проектов: ${badCat.length}`);
  console.log(`  невалидных group видов работ: ${badGroup.length}`);
  if (badCat.length) problems.push(`Невалидные category: ${badCat.map((p) => `${p.code}:${p.category}`).join(', ')}`);
  if (badGroup.length) problems.push(`Невалидные group: ${badGroup.map((w) => `${w.name}:${w.group}`).join(', ')}`);

  // 5. Дубли кодов проектов
  console.log('\n[5] Дубли кодов проектов:');
  const codeCount = {};
  for (const p of projects) codeCount[p.code] = (codeCount[p.code] || 0) + 1;
  const dups = Object.entries(codeCount).filter(([, n]) => n > 1);
  console.log(`  проектов: ${projects.length}; уникальных кодов: ${Object.keys(codeCount).length}; дублей: ${dups.length}`);
  if (dups.length) problems.push(`Дубли кодов: ${dups.map(([c, n]) => `${c}×${n}`).join(', ')}`);

  // Категории-сводка
  const byCat = {};
  for (const p of projects) byCat[p.category] = (byCat[p.category] || 0) + 1;
  console.log(`  распределение по категориям: ${JSON.stringify(byCat)}`);

  // --- ИТОГ ---
  console.log('\n=== ИТОГ ===');
  if (problems.length === 0) {
    console.log('✓ Все проверки пройдены. Проблем не обнаружено.');
  } else {
    console.log(`✗ Обнаружено проблем: ${problems.length}`);
    for (const p of problems) console.log(`  - ${p}`);
  }
}

run().catch((e) => { console.error('ОШИБКА:', e.message); process.exit(1); });
