#!/usr/bin/env node
/**
 * REQ-0013 13b (демо мульти-отдел): делает 1-2 крупных проекта МУЛЬТИ-ОТДЕЛЬНЫМИ,
 * чтобы на доске планирования был виден раскид plannedEffort по долям отделов.
 *
 * Контекст: бэкфилл 13a (seed-project-department-shares.mjs) создал каждому проекту
 * ОДНУ долю credosTimeProjectDepartment = 100% plannedEffort на его departmentId.
 * Здесь для выбранных проектов заменяем эту одну долю на ДВЕ (60%/40% часов на два
 * разных отдела). Σ долей = plannedEffort (инвариант сохранён).
 *
 * Сверка с Timetta (правило 8): часы проекта раскладываются по подразделениям
 * команды. Доля = ЧАСЫ (plannedEffortShare, FLOAT). Не переусложняем: фикс % 60/40.
 *
 * ИДЕМПОТЕНТНО: для каждого целевого проекта приводим набор долей к ЭТАЛОНУ —
 * удаляем все его текущие доли credosTimeProjectDepartment и создаём ровно нужные.
 * Повторный прогон даёт тот же результат (удалит-пересоздаст те же 2 доли).
 *
 * Целевые проекты (крупные, длинный горизонт H2-2026 — видны на доске):
 *   ОВ-2026-019: OV 60% + TC  40%
 *   ОВ-2026-020: OV 60% + OPR 40%
 * Проекты ищем по code; отделы — по code. Если чего-то нет — пропуск с предупреждением.
 *
 * Доступ: cd apps/time; set -a; source ../../.env; set +a; node scripts/seed-multidept-demo.mjs
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
      method,
      headers: H,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.ok) return res.json().catch(() => ({}));
    if (res.status === 429 && attempt < retries) {
      console.log(`  429 — пауза 60с (попытка ${attempt + 1})`);
      await sleep(61000);
      lastReq = Date.now();
      continue;
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

// Целевые раскиды: код проекта → [{ deptCode, ratio }]. Σ ratio = 1.
const PLAN = {
  'ОВ-2026-019': [
    { deptCode: 'OV', ratio: 0.6 },
    { deptCode: 'TC', ratio: 0.4 },
  ],
  'ОВ-2026-020': [
    { deptCode: 'OV', ratio: 0.6 },
    { deptCode: 'OPR', ratio: 0.4 },
  ],
};

// Часы доли = round2(plannedEffort × ratio). Последняя доля добирает остаток,
// чтобы Σ долей точно совпала с plannedEffort (без копеечного дрейфа округления).
const round2 = (n) => Math.round(n * 100) / 100;
function splitHours(total, ratios) {
  const out = [];
  let acc = 0;
  for (let i = 0; i < ratios.length; i++) {
    if (i === ratios.length - 1) out.push(round2(total - acc));
    else {
      const h = round2(total * ratios[i]);
      out.push(h);
      acc += h;
    }
  }
  return out;
}

async function run() {
  console.log(`Сервер: ${BASE}`);

  // Проверка деплоя объекта.
  await throttle();
  const probe = await fetch(`${BASE}/rest/credosTimeProjectDepartments?limit=1`, { headers: H });
  if (probe.status === 400 || probe.status === 404) {
    console.error(
      `\nОбъект credosTimeProjectDepartment ещё не задеплоен (GET -> ${probe.status}).\n` +
        `Сначала синхронизируй приложение: yarn twenty dev. Затем повтори.`,
    );
    process.exit(2);
  }

  const projects = await getAll('credosTimeProjects');
  const departments = await getAll('credosTimeDepartments');
  const shares = await getAll('credosTimeProjectDepartments');
  console.log(`Проектов ${projects.length}, отделов ${departments.length}, долей ${shares.length}`);

  const projByCode = new Map(projects.map((p) => [p.code, p]));
  const deptByCode = new Map(departments.map((d) => [d.code, d]));

  // Доли по проектам — для удаления старого набора.
  const sharesByProject = new Map();
  for (const s of shares) {
    if (!s.projectId) continue;
    const arr = sharesByProject.get(s.projectId) ?? [];
    arr.push(s);
    sharesByProject.set(s.projectId, arr);
  }

  let projectsDone = 0,
    created = 0,
    deleted = 0,
    skipped = 0;

  for (const [projCode, allocs] of Object.entries(PLAN)) {
    const proj = projByCode.get(projCode);
    if (!proj) {
      console.log(`  ! проект ${projCode} не найден — пропуск`);
      skipped++;
      continue;
    }
    const total = typeof proj.plannedEffort === 'number' ? proj.plannedEffort : 0;
    if (total <= 0) {
      console.log(`  ! проект ${projCode}: plannedEffort=${total} — пропуск (нечего делить)`);
      skipped++;
      continue;
    }
    // Резолв отделов.
    const targets = [];
    let bad = false;
    for (const a of allocs) {
      const d = deptByCode.get(a.deptCode);
      if (!d) {
        console.log(`  ! отдел ${a.deptCode} не найден — пропуск проекта ${projCode}`);
        bad = true;
        break;
      }
      targets.push({ departmentId: d.id, deptCode: a.deptCode, ratio: a.ratio });
    }
    if (bad) {
      skipped++;
      continue;
    }

    const hours = splitHours(total, targets.map((t) => t.ratio));

    // Эталон: набор (departmentId -> hours). Идемпотентность через сравнение.
    const desired = new Map(targets.map((t, i) => [t.departmentId, hours[i]]));
    const current = sharesByProject.get(proj.id) ?? [];
    const currentMap = new Map(current.filter((s) => s.departmentId).map((s) => [s.departmentId, s]));

    const sameSet =
      current.length === desired.size &&
      [...desired.entries()].every(([dId, h]) => {
        const s = currentMap.get(dId);
        return s && Math.abs((s.plannedEffortShare ?? -1) - h) < 0.005;
      });

    if (sameSet) {
      console.log(`  = ${projCode} (${total}ч) уже мульти-отдел эталонно — пропуск`);
      skipped++;
      continue;
    }

    console.log(
      `  ~ ${projCode} (${total}ч): ` +
        targets.map((t, i) => `${t.deptCode} ${hours[i]}ч`).join(' + '),
    );

    // Удаляем все текущие доли проекта.
    for (const s of current) {
      await send('DELETE', `/rest/credosTimeProjectDepartments/${s.id}`);
      deleted++;
      console.log(`    - удалена доля ${s.id} (dept ${s.departmentId})`);
    }
    // Создаём эталонные доли.
    for (const t of targets) {
      const share = desired.get(t.departmentId);
      await send('POST', '/rest/credosTimeProjectDepartments', {
        projectId: proj.id,
        departmentId: t.departmentId,
        plannedEffortShare: share,
      });
      created++;
      console.log(`    + доля ${t.deptCode} = ${share}ч`);
    }
    projectsDone++;
  }

  console.log(
    `\nИтог: проектов сделано мульти-отдел ${projectsDone}, ` +
      `создано долей ${created}, удалено ${deleted}, пропущено ${skipped}.`,
  );

  // --- Верификация: Σ долей целевых проектов == plannedEffort ---
  console.log('\n[ВЕРИФИКАЦИЯ]');
  const after = await getAll('credosTimeProjectDepartments');
  const afterByProject = new Map();
  for (const s of after) {
    if (!s.projectId) continue;
    const arr = afterByProject.get(s.projectId) ?? [];
    arr.push(s);
    afterByProject.set(s.projectId, arr);
  }
  for (const projCode of Object.keys(PLAN)) {
    const proj = projByCode.get(projCode);
    if (!proj) continue;
    const arr = afterByProject.get(proj.id) ?? [];
    const sum = round2(arr.reduce((a, s) => a + (s.plannedEffortShare ?? 0), 0));
    const ok = Math.abs(sum - (proj.plannedEffort ?? 0)) < 0.01;
    console.log(
      `  ${projCode}: долей ${arr.length}, Σ=${sum}ч, plannedEffort=${proj.plannedEffort}ч -> ${ok ? 'OK' : 'РАСХОЖДЕНИЕ'}`,
    );
  }
  console.log('\nГотово.');
}

run().catch((e) => {
  console.error('\nОШИБКА:', e.message);
  process.exit(1);
});
