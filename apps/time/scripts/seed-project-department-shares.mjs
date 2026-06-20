#!/usr/bin/env node
/**
 * REQ-0013 13a (бэкфилл): миграция жёсткой связи project.departmentId -> доля 100%
 * в join-объекте credosTimeProjectDepartment (project × department × часы доли).
 * Обратная совместимость: до перехода на мульти-отдел каждый проект имел один
 * departmentId; создаём ОДНУ долю на проект с plannedEffortShare = весь
 * plannedEffort проекта (вся плановая ёмкость отдела == ёмкость проекта).
 *
 * Поле доли (см. src/objects/credos-time-project-department.object.ts):
 *   plannedEffortShare — NUMBER (FLOAT, decimals 2), ЧАСЫ (не %). Ставим =
 *   project.plannedEffort. Если у проекта нет plannedEffort (null/0) — ставим 0
 *   (долю всё равно создаём для обратной совместимости связи отдел↔проект).
 *
 * Связи POST:
 *   projectId    — credosTimeProjectDepartment.project -> Project (joinColumnName projectId)
 *   departmentId — credosTimeProjectDepartment.department -> Department (joinColumnName departmentId)
 *
 * ИДЕМПОТЕНТНО: ключ = `${projectId}|${departmentId}`. Перед созданием грузим
 *   все существующие доли и пропускаем совпадающие — повторный прогон не дублирует.
 * Проекты без departmentId пропускаем (нет отдела -> нет доли).
 *
 * ВАЖНО: объект credosTimeProjectDepartment должен быть ЗАДЕПЛОЕН. До деплоя
 *   /rest/credosTimeProjectDepartments вернёт 400/404 — скрипт обнаружит и выйдет.
 *
 * Доступ: cd apps/time; set -a; source ../../.env; set +a; node scripts/seed-project-department-shares.mjs
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

const keyOf = (projectId, departmentId) => `${projectId}|${departmentId}`;

async function run() {
  console.log(`Сервер: ${BASE}`);

  // Проверка деплоя объекта.
  await throttle();
  const probe = await fetch(`${BASE}/rest/credosTimeProjectDepartments?limit=1`, { headers: H });
  if (probe.status === 400 || probe.status === 404) {
    console.error(
      `\nОбъект credosTimeProjectDepartment ещё не задеплоен (GET -> ${probe.status}).\n` +
      `Сначала синхронизируй приложение: yarn twenty dev. Затем повтори бэкфилл.`,
    );
    process.exit(2);
  }

  // Все проекты.
  const projects = await getAll('credosTimeProjects');
  console.log(`Проектов всего: ${projects.length}`);
  const projectIds = new Set(projects.map((p) => p.id));

  // Все отделы — для проверки orphan-departmentId у проектов.
  const departments = await getAll('credosTimeDepartments');
  const deptIds = new Set(departments.map((d) => d.id));
  console.log(`Отделов всего: ${departments.length}`);

  // Существующие доли — идемпотентность.
  const existing = await getAll('credosTimeProjectDepartments');
  const existingKeys = new Set(
    existing
      .filter((e) => e.projectId && e.departmentId)
      .map((e) => keyOf(e.projectId, e.departmentId)),
  );
  console.log(`Долей уже есть: ${existing.length}`);

  let created = 0, skipped = 0, noDept = 0, badDept = 0;
  for (const p of projects) {
    if (!p.departmentId) {
      noDept++;
      console.log(`  ! проект ${p.code || p.id} без departmentId — пропуск`);
      continue;
    }
    if (!deptIds.has(p.departmentId)) {
      badDept++;
      console.log(`  ! проект ${p.code || p.id}: departmentId ${p.departmentId} не найден среди отделов — пропуск`);
      continue;
    }
    const key = keyOf(p.id, p.departmentId);
    if (existingKeys.has(key)) {
      skipped++;
      console.log(`  = ${p.code || p.id} — доля уже есть`);
      continue;
    }
    const share = typeof p.plannedEffort === 'number' ? p.plannedEffort : 0;
    const body = {
      projectId: p.id,
      departmentId: p.departmentId,
      plannedEffortShare: share,
    };
    await send('POST', '/rest/credosTimeProjectDepartments', body);
    existingKeys.add(key);
    created++;
    console.log(`  + ${p.code || p.id} -> доля ${share}ч (100% plannedEffort)`);
  }

  console.log(
    `\nИтог: создано ${created}, пропущено (уже было) ${skipped}, ` +
    `проектов без отдела ${noDept}, с битым departmentId ${badDept}.`,
  );

  // --- Верификация ---
  console.log('\n[ВЕРИФИКАЦИЯ]');
  const after = await getAll('credosTimeProjectDepartments');
  let orphanProject = 0, orphanDept = 0, noShare = 0;
  for (const e of after) {
    if (!e.projectId || !projectIds.has(e.projectId)) orphanProject++;
    if (!e.departmentId || !deptIds.has(e.departmentId)) orphanDept++;
    if (e.plannedEffortShare == null) noShare++;
  }
  console.log(`  totalCount долей: ${after.length}`);
  console.log(`  orphan projectId: ${orphanProject}`);
  console.log(`  orphan departmentId: ${orphanDept}`);
  console.log(`  без plannedEffortShare: ${noShare}`);
  console.log(`  count > 0: ${after.length > 0 ? 'OK' : 'FAIL'}`);
  console.log('\nГотово.');
}

run().catch((e) => {
  console.error('\nОШИБКА:', e.message);
  process.exit(1);
});
