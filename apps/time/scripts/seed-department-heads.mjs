#!/usr/bin/env node
/**
 * REQ-0018 (бэкфилл): проставить руководителя отдела (Department.head -> Employee)
 * на основании имеющихся данных. Источник «кто руковод» — employee.isManager:
 * для каждого отдела берём ОДНОГО сотрудника отдела с isManager=true как head.
 *
 * Стратегия выбора head для отдела (детерминированно, без матрицы — один head/отдел):
 *   1. Кандидаты = активные сотрудники отдела (employee.departmentId == dept.id) c isManager=true.
 *   2. Если кандидатов несколько — берём самого «старшего» детерминированно:
 *      сортировка по (lastName, firstName, id) по возрастанию → первый. Так повторный
 *      прогон на тех же данных всегда выбирает одного и того же.
 *   3. Если кандидатов нет — отдел остаётся без head (head=null), это норма.
 *
 * parentDepartment НЕ трогаем — структура Кредо-С плоская (см. ниже «иерархия/циклы»).
 *
 * ИДЕМПОТЕНТНО:
 *   - Если у отдела head уже выставлен — НЕ перезаписываем (уважаем ручную правку),
 *     только логируем. Меняем headId лишь когда он пуст и найден кандидат.
 *   - Повторный прогон без новых данных = 0 изменений.
 *
 * ИЕРАРХИЯ / ЗАЩИТА ОТ ЦИКЛОВ (parentDepartment, self MANY_TO_ONE):
 *   SDK декларативно цикл self-relation не запрещает (A.parent=B, B.parent=A — БД проглотит).
 *   Решение по правилу «не усложнять»: на этапе бэкфилла иерархия ПЛОСКАЯ
 *   (parentDepartment у всех = null), поэтому цикл физически невозможен. Этот скрипт
 *   parentDepartment не пишет. Если иерархию будут заполнять позже (вручную через UI или
 *   отдельным скриптом) — нужен гард обхода вверх по цепочке parent (depth-limit / visited-set)
 *   ПЕРЕД установкой parentId, отвергающий ребро, замыкающее цикл. Эскиз гарда (для
 *   будущего скрипта/логики иерархии), parentMap: Map<deptId, parentDeptId|null>:
 *
 *     function wouldCreateCycle(deptId, candidateParentId, parentMap) {
 *       if (!candidateParentId) return false;
 *       if (candidateParentId === deptId) return true; // сам себе родитель
 *       const visited = new Set([deptId]);
 *       let cur = candidateParentId, guard = 0;
 *       while (cur && guard++ < 1000) {
 *         if (visited.has(cur)) return true;       // замыкание цепочки
 *         visited.add(cur);
 *         cur = parentMap.get(cur) || null;        // идём вверх к корню
 *       }
 *       return false;
 *     }
 *
 *   Альтернатива «по-настоящему серверно» — database-event logic-function на update
 *   credosTimeDepartment, отвергающая PATCH parentDepartmentId при wouldCreateCycle.
 *   Не реализуем сейчас (иерархия плоская, данных об иерархии нет → нечего охранять).
 *
 * Доступ:
 *   cd apps/time; set -a; source ../../.env; set +a; node scripts/seed-department-heads.mjs
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

async function getAll(plural, params = {}) {
  const out = [];
  let cursor = null;
  for (let i = 0; i < 60; i++) {
    const u = new URL(`${BASE}/rest/${plural}`);
    u.searchParams.set('limit', '60');
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
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

const empLabel = (e) =>
  [e.lastName, e.firstName].filter(Boolean).join(' ').trim() || e.name || e.id;

// Детерминированный выбор: (lastName, firstName, id) по возрастанию.
function pickHead(candidates) {
  const sorted = [...candidates].sort((a, b) => {
    const la = (a.lastName || '').localeCompare(b.lastName || '', 'ru');
    if (la !== 0) return la;
    const fa = (a.firstName || '').localeCompare(b.firstName || '', 'ru');
    if (fa !== 0) return fa;
    return (a.id || '').localeCompare(b.id || '');
  });
  return sorted[0];
}

async function run() {
  console.log(`Сервер: ${BASE}`);

  // Проверка деплоя поля head (нужен PATCH headId). Если поля нет — schema не задеплоена.
  await throttle();
  const probe = await fetch(`${BASE}/rest/credosTimeDepartments?limit=1`, { headers: H });
  if (probe.status === 400 || probe.status === 404) {
    console.error(
      `\nОбъект credosTimeDepartment недоступен (GET -> ${probe.status}).\n` +
      `Сначала синхронизируй приложение: yarn twenty dev. Затем повтори бэкфилл.`,
    );
    process.exit(2);
  }

  const departments = await getAll('credosTimeDepartments');
  console.log(`Отделов: ${departments.length}`);
  if (departments.length === 0) {
    console.log('Нет отделов — нечего бэкфиллить.');
    return;
  }

  // Все сотрудники (активные); группируем по departmentId, отбираем isManager.
  const employees = await getAll('credosTimeEmployees', { filter: 'active[eq]:true' });
  console.log(`Активных сотрудников: ${employees.length}`);

  const managersByDept = new Map(); // deptId -> Employee[] (isManager=true)
  let noDept = 0;
  for (const e of employees) {
    if (e.isManager !== true) continue;
    if (!e.departmentId) { noDept++; continue; }
    if (!managersByDept.has(e.departmentId)) managersByDept.set(e.departmentId, []);
    managersByDept.get(e.departmentId).push(e);
  }
  if (noDept > 0) {
    console.log(`  (i) руководителей без departmentId: ${noDept} — не привязываются к отделу`);
  }

  let setCount = 0, alreadySet = 0, noCandidate = 0, multi = 0;
  for (const d of departments) {
    const label = d.code || d.name || d.id;

    if (d.headId) {
      alreadySet++;
      console.log(`  = ${label}: head уже задан (${d.headId}) — не трогаю`);
      continue;
    }

    const candidates = managersByDept.get(d.id) || [];
    if (candidates.length === 0) {
      noCandidate++;
      console.log(`  - ${label}: нет сотрудника-руководителя (isManager) в отделе — head=null`);
      continue;
    }
    if (candidates.length > 1) {
      multi++;
      console.log(
        `  (!) ${label}: руководителей-кандидатов ${candidates.length} ` +
        `(${candidates.map(empLabel).join(', ')}) — выбираю детерминированно одного`,
      );
    }

    const head = pickHead(candidates);
    await send('PATCH', `/rest/credosTimeDepartments/${d.id}`, { headId: head.id });
    setCount++;
    console.log(`  + ${label}: head = ${empLabel(head)} (${head.id})`);
  }

  console.log(
    `\nИтог: проставлено head ${setCount}, уже было ${alreadySet}, ` +
    `без кандидата ${noCandidate}, отделов с >1 кандидатом ${multi}.`,
  );

  // --- Верификация ---
  console.log('\n[ВЕРИФИКАЦИЯ] head по отделам:');
  const after = await getAll('credosTimeDepartments');
  const empById = new Map(employees.map((e) => [e.id, e]));
  let withHead = 0;
  for (const d of after) {
    const label = d.code || d.name || d.id;
    if (d.headId) {
      withHead++;
      const h = empById.get(d.headId);
      console.log(`  ${label}: head=${h ? empLabel(h) : d.headId}`);
    } else {
      console.log(`  ${label}: head=—`);
    }
  }
  console.log(`  отделов с head: ${withHead} / ${after.length}`);

  // Иерархия: подтверждаем плоскую структуру (parentDepartmentId=null у всех).
  const withParent = after.filter((d) => d.parentDepartmentId).length;
  console.log(`  отделов с parentDepartment: ${withParent} (ожидаемо 0 — плоская структура)`);

  console.log('\nГотово.');
}

run().catch((e) => {
  console.error('\nОШИБКА:', e.message);
  process.exit(1);
});
