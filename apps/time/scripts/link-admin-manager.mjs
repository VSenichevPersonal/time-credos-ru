#!/usr/bin/env node
/**
 * data-fix: привязать админ-пользователя (workspaceMember) к credosTimeEmployee
 * и выставить isManager=true. Цель — чтобы фронт-гейт «Планировать» (isManager)
 * был виден, а согласование/планирование работали под текущим юзером.
 *
 * Что делает (идемпотентно):
 *   1. GET /rest/workspaceMembers → берёт админа из env TWENTY_DEV_EMAIL (по userEmail),
 *      иначе — единственного активного workspaceMember.
 *   2. GET /rest/credosTimeEmployees → ищет employee по workspaceMemberRef == wmId,
 *      иначе по email == userEmail. Если нет — СОЗДАЁТ employee (имя из WM).
 *   3. PATCH employee: workspaceMemberRef = wmId + isManager = true
 *      (только если значения отличаются — повторный прогон ничего не меняет).
 *
 * Доступ: cd apps/time; set -a; source ../../.env; set +a; node scripts/link-admin-manager.mjs
 */

const BASE = process.env.TWENTY_DEV_URL;
const KEY = process.env.TWENTY_DEV_API_KEY;
if (!BASE || !KEY) {
  console.error('Нет TWENTY_DEV_URL / TWENTY_DEV_API_KEY. set -a; source ../../.env; set +a');
  process.exit(1);
}

const ADMIN_EMAIL = 'vs@credos.ru'; // приоритетный админ-юзер

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

const emailOfWm = (wm) =>
  wm.userEmail || (wm.user && wm.user.email) || null;
const nameOfWm = (wm) => ({
  firstName: (wm.name && wm.name.firstName) || '',
  lastName: (wm.name && wm.name.lastName) || '',
});

async function run() {
  console.log(`Сервер: ${BASE}`);

  // 1. workspaceMember: приоритет vs@credos.ru, иначе единственный.
  const members = await getAll('workspaceMembers');
  console.log(`workspaceMembers: ${members.length}`);
  if (members.length === 0) {
    console.error('Нет workspaceMembers — некого привязывать.');
    process.exit(1);
  }
  let wm = members.find((m) => emailOfWm(m) === ADMIN_EMAIL);
  if (!wm) {
    if (members.length === 1) {
      wm = members[0];
      console.log(`  ${ADMIN_EMAIL} не найден → беру единственного workspaceMember.`);
    } else {
      console.error(`Не найден ${ADMIN_EMAIL}, а workspaceMembers > 1 — уточни кого привязать.`);
      process.exit(1);
    }
  }
  const wmId = wm.id;
  const wmEmail = emailOfWm(wm);
  const wmName = nameOfWm(wm);
  console.log(`Целевой workspaceMember: ${wmId} (${wmEmail}) ${wmName.lastName} ${wmName.firstName}`);

  // 2. employee: по workspaceMemberRef, иначе по email.
  const employees = await getAll('credosTimeEmployees');
  console.log(`credosTimeEmployees: ${employees.length}`);
  let emp =
    employees.find((e) => e.workspaceMemberRef && e.workspaceMemberRef === wmId) ||
    (wmEmail ? employees.find((e) => (e.email || '') === wmEmail) : undefined);

  if (!emp) {
    console.log('  Подходящий employee не найден → создаю.');
    const body = {
      firstName: wmName.firstName || 'Админ',
      lastName: wmName.lastName || 'Пользователь',
      email: wmEmail || ADMIN_EMAIL,
      active: true,
      workspaceMemberRef: wmId,
      isManager: true,
    };
    const created = await send('POST', '/rest/credosTimeEmployees', body);
    emp = created.data?.createCredosTimeEmployee || created.data || created;
    console.log(`  + создан employee ${emp.id} (${body.lastName} ${body.firstName}), isManager=true, ref=${wmId}`);
  } else {
    console.log(`  Найден employee ${emp.id} (${emp.lastName} ${emp.firstName}, email=${emp.email})`);
    const patch = {};
    if ((emp.workspaceMemberRef || '') !== wmId) patch.workspaceMemberRef = wmId;
    if (emp.isManager !== true) patch.isManager = true;
    if (Object.keys(patch).length === 0) {
      console.log('  = уже привязан и isManager=true — ничего не меняю (идемпотентно).');
    } else {
      await send('PATCH', `/rest/credosTimeEmployees/${emp.id}`, patch);
      console.log(`  ~ PATCH employee ${emp.id}: ${JSON.stringify(patch)}`);
    }
  }

  // 3. Верификация.
  console.log('\n[ВЕРИФИКАЦИЯ]');
  await throttle();
  const r = await fetch(`${BASE}/rest/credosTimeEmployees/${emp.id}`, { headers: H });
  const j = await r.json();
  const cur = j.data?.credosTimeEmployee || j.data || j;
  console.log(
    `  employee ${cur.id}: ${cur.lastName} ${cur.firstName} | email=${cur.email} | ` +
    `workspaceMemberRef=${cur.workspaceMemberRef} | isManager=${cur.isManager}`,
  );
  const ok = cur.workspaceMemberRef === wmId && cur.isManager === true;
  console.log(ok ? '\n✓ Готово: админ привязан, isManager=true.' : '\n✗ Привязка не подтвердилась — проверь вручную.');
  if (!ok) process.exit(1);
}

run().catch((e) => {
  console.error('\nОШИБКА:', e.message);
  process.exit(1);
});
