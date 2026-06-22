#!/usr/bin/env node
/**
 * Мини-сид ПЕРСОНАЛЬНЫХ план-слотов (credosTimePlanSlot с employeeId) — чтобы доска
 * «Планировать по: Людям» показывала записи планирования на уровне СОТРУДНИКА, а не
 * пустоту. Слот = (project × employee × periodMonth) → plannedHours; departmentId =
 * отдел сотрудника (роллап отдела вычитает персональные из остатка, анти-двойной-счёт).
 *
 * Поля записи credosTimePlanSlot (REST create):
 *   periodMonth  — TEXT 'YYYY-MM'
 *   plannedHours — NUMBER (часы месяца)
 *   projectId / departmentId / employeeId — связи (joinColumn)
 *
 * ИДЕМПОТЕНТНО: ключ = `${projectId}|${employeeId}|${periodMonth}`; перед созданием
 *   грузим все слоты и пропускаем совпадающие. ДЕТЕРМИНИРОВАННО (без Math.random).
 *
 * ВАЖНО: объект credosTimePlanSlot должен быть ЗАДЕПЛОЕН (sync). До деплоя endpoint
 *   /rest/credosTimePlanSlots вернёт 400/404 — скрипт обнаружит и завершится с подсказкой.
 *
 * Запуск: cd apps/time; set -a; source ../../.env; set +a; node scripts/seed-person-plan-slots.mjs
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
    if (!r.ok) throw new Error(`GET ${plural} -> ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    const recs = j.data?.[plural] ?? [];
    out.push(...recs);
    const pi = j.pageInfo ?? j.data?.pageInfo;
    if (!pi?.hasNextPage || recs.length === 0 || !pi.endCursor) break;
    cursor = pi.endCursor;
  }
  return out;
}

// Месяцы и часы (детерминированно). 3 месяца, профиль часов варьируется по индексу
// сотрудника — чтобы доска показала разную загрузку (не плоскую).
const MONTHS = ['2026-07', '2026-08', '2026-09'];
const HOURS_PROFILE = [
  [120, 100, 80],
  [80, 120, 60],
  [100, 80, 100],
  [60, 90, 120],
];

async function main() {
  console.log('→ Загрузка сотрудников / проектов / слотов…');
  let employees, projects, existing;
  try {
    [employees, projects, existing] = await Promise.all([
      getAll('credosTimeEmployees'),
      getAll('credosTimeProjects'),
      getAll('credosTimePlanSlots'),
    ]);
  } catch (e) {
    console.error('✖ Не удалось прочитать данные (объект PlanSlot задеплоен?):', e.message);
    process.exit(1);
  }

  const activeEmps = employees.filter((e) => e.active !== false && e.departmentId);
  const projByDept = new Map();
  for (const p of projects) {
    if (!p.departmentId) continue;
    if (!projByDept.has(p.departmentId)) projByDept.set(p.departmentId, []);
    projByDept.get(p.departmentId).push(p);
  }

  // Существующие ключи (идемпотентность).
  const seen = new Set(
    existing.map((s) => `${s.projectId}|${s.employeeId}|${s.periodMonth}`),
  );

  // Берём до 10 первых активных сотрудников, у чьего отдела есть проект.
  const targets = activeEmps.filter((e) => (projByDept.get(e.departmentId) ?? []).length > 0).slice(0, 10);
  if (targets.length === 0) {
    console.error('✖ Нет активных сотрудников с проектами в их отделе — нечего сидировать.');
    process.exit(1);
  }

  let created = 0, skipped = 0;
  for (let i = 0; i < targets.length; i++) {
    const emp = targets[i];
    const deptProjects = projByDept.get(emp.departmentId);
    // Детерминированный выбор проекта: i-й проект отдела (по кругу).
    const project = deptProjects[i % deptProjects.length];
    const hours = HOURS_PROFILE[i % HOURS_PROFILE.length];
    const who = `${emp.lastName ?? ''} ${emp.firstName ?? ''}`.trim() || emp.id.slice(0, 8);
    for (let m = 0; m < MONTHS.length; m++) {
      const periodMonth = MONTHS[m];
      const key = `${project.id}|${emp.id}|${periodMonth}`;
      if (seen.has(key)) { skipped++; continue; }
      await send('POST', '/rest/credosTimePlanSlots', {
        periodMonth,
        plannedHours: hours[m],
        projectId: project.id,
        departmentId: emp.departmentId,
        employeeId: emp.id,
      });
      seen.add(key);
      created++;
      console.log(`  + ${who} · ${project.code ?? project.id.slice(0, 6)} · ${periodMonth} = ${hours[m]} ч`);
    }
  }

  console.log(`✓ Готово. Создано слотов: ${created}, пропущено (уже были): ${skipped}, сотрудников: ${targets.length}.`);
}

main().catch((e) => {
  console.error('✖', e.message);
  process.exit(1);
});
