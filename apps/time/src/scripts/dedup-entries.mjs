// dedup-entries.mjs — разовый скрипт дедупликации записей трудозатрат
// (credosTimeEntry) ПЕРЕД введением уникального ключа (employeeId, projectId,
// workTypeId, date-день).
//
// ЗАЧЕМ: до защиты от дублей два клиента/повторный CSV-импорт могли создать
// несколько записей с одним и тем же ключом → factHours двойной/тройной счёт
// (баг заказчика «пустые/неверные Факт/Остаток»). Уникальный индекс на схеме
// НЕ применится, пока в данных есть дубли, поэтому их нужно слить заранее.
//
// СЕМАНТИКА СЛИЯНИЯ:
//   - в группе с одинаковым ключом выбирается «выживший» (survivor):
//       APPROVED важнее (целостность табеля/1С) → иначе самая ранняя по
//       createdAt/id (детерминированно);
//   - по умолчанию (как в DATA_INTEGRITY_AUDIT) hours выжившего = Σ hours
//     группы — это верно, когда дубли = РАЗНЫЕ сеансы работы за день;
//   - флаг --keep-hours: hours выжившего НЕ меняются (дубли = точная копия
//     одной и той же записи, напр. повторный ввод/импорт того же дня —
//     суммирование завысило бы факт). Лишние всё равно удаляются.
//   Округление Σ до 2 знаков (как в SSOT computeProjectRollup).
//
// ЗАПУСК:
//   cd apps/time && set -a; source ../../.env; set +a
//   node src/scripts/dedup-entries.mjs                      # dry-run, суммирование
//   node src/scripts/dedup-entries.mjs --apply              # слияние с суммированием
//   node src/scripts/dedup-entries.mjs --apply --keep-hours # слияние без суммы (копии)
//
// REST: $TWENTY_DEV_URL + Bearer $TWENTY_DEV_API_KEY (как остальные скрипты).
// После apply пересчёт factHours затронутых проектов делает backfill post-install
// / database-event триггеры (SSOT), но скрипт сам пересчитывает их для чистоты.

const BASE = (process.env.TWENTY_DEV_URL ?? '').replace(/\/$/, '');
const KEY = process.env.TWENTY_DEV_API_KEY ?? '';
const APPLY = process.argv.includes('--apply');
const KEEP_HOURS = process.argv.includes('--keep-hours');

const AUTH = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const get = async (path, query) => {
  const qs = new URLSearchParams(query).toString();
  const r = await fetch(`${BASE}${path}?${qs}`, { headers: AUTH });
  if (!r.ok) throw new Error(`GET ${path} -> ${r.status} ${await r.text()}`);
  return r.json();
};
const patch = async (path, body) => {
  const r = await fetch(`${BASE}${path}`, { method: 'PATCH', headers: AUTH, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`PATCH ${path} -> ${r.status} ${await r.text()}`);
  return r.json().catch(() => ({}));
};
const del = async (path) => {
  const r = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: AUTH });
  if (!r.ok) throw new Error(`DELETE ${path} -> ${r.status} ${await r.text()}`);
  return r.json().catch(() => ({}));
};

// Курсорный сбор ВСЕХ записей (как recalcProjectFactHours — без limit-потолка).
const fetchAllEntries = async () => {
  const all = [];
  let cursor = null;
  for (let i = 0; i < 1000; i++) {
    const q = { limit: '60', orderBy: 'id[AscNullsFirst]' };
    if (cursor) q.starting_after = cursor;
    const j = await get('/rest/credosTimeEntries', q);
    const rows = j.data?.credosTimeEntries ?? [];
    all.push(...rows);
    const pi = j.pageInfo ?? j.data?.pageInfo;
    cursor = pi?.endCursor;
    if (!pi?.hasNextPage || rows.length === 0) break;
  }
  return all;
};

// --- Чистые хелперы (экспортируются для unit-тестов) ---
export const dayKey = (d) => String(d ?? '').slice(0, 10);
export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
export const keyOf = (e) =>
  [e.employeeId ?? '-', e.projectId ?? '-', e.workTypeId ?? '-', dayKey(e.date)].join('|');

// Выбор выжившего: APPROVED важнее, затем самая ранняя (createdAt → id).
export const pickSurvivor = (group) =>
  [...group].sort((a, b) => {
    const ap = (a.status === 'APPROVED' ? 0 : 1) - (b.status === 'APPROVED' ? 0 : 1);
    if (ap !== 0) return ap;
    const ac = String(a.createdAt ?? '');
    const bc = String(b.createdAt ?? '');
    if (ac !== bc) return ac < bc ? -1 : 1;
    return String(a.id) < String(b.id) ? -1 : 1;
  })[0];

// Чистое планирование дедупа: группирует по ключу, для дублей считает выжившего,
// целевые часы (Σ или без изменений при keepHours) и удаляемых. Без сети —
// тестируется напрямую. Возвращает { groups, plan: [{key, survivorId,
// survivorHours, targetHours, deleteIds, projectIds}] }.
export const planDedup = (entries, { keepHours = false } = {}) => {
  const groups = new Map();
  for (const e of entries) {
    const k = keyOf(e);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(e);
  }
  const plan = [];
  for (const [k, group] of groups) {
    if (group.length <= 1) continue;
    const survivor = pickSurvivor(group);
    const sum = round2(group.reduce((s, e) => s + (Number(e.hours) || 0), 0));
    plan.push({
      key: k,
      survivorId: survivor.id,
      survivorHours: round2(survivor.hours),
      targetHours: keepHours ? round2(survivor.hours) : sum,
      deleteIds: group.filter((e) => e.id !== survivor.id).map((e) => e.id),
      projectIds: [...new Set(group.map((e) => e.projectId).filter(Boolean))],
    });
  }
  return { uniqueKeys: groups.size, plan };
};

const main = async () => {
  if (!BASE || !KEY) {
    console.error('Нет TWENTY_DEV_URL / TWENTY_DEV_API_KEY (source ../../.env).');
    process.exit(1);
  }
  console.log(`[dedup] режим: ${APPLY ? 'APPLY (реальное слияние)' : 'DRY-RUN'}`);
  const entries = await fetchAllEntries();
  console.log(`[dedup] всего записей: ${entries.length}`);

  const { uniqueKeys, plan } = planDedup(entries, { keepHours: KEEP_HOURS });
  console.log(`[dedup] уникальных ключей: ${uniqueKeys}`);
  console.log(`[dedup] групп с дублями: ${plan.length}`);

  if (plan.length === 0) {
    console.log('[dedup] дублей нет — данные готовы к введению уникального ключа.');
    return;
  }

  const affectedProjects = new Set();
  let deleted = 0;

  for (const g of plan) {
    console.log(
      `[dedup] ключ ${g.key}: выживший ${g.survivorId}, hours ${g.survivorHours} → ${g.targetHours}; ` +
        `удаляем ${g.deleteIds.join(', ')}`,
    );
    for (const pid of g.projectIds) affectedProjects.add(pid);

    if (APPLY) {
      // 1) приводим часы выжившего (Σ, либо без изменений при --keep-hours)
      if (g.survivorHours !== g.targetHours) await patch(`/rest/credosTimeEntries/${g.survivorId}`, { hours: g.targetHours });
      // 2) удаляем лишние
      for (const id of g.deleteIds) {
        await del(`/rest/credosTimeEntries/${id}`);
        deleted++;
      }
    } else {
      deleted += g.deleteIds.length;
    }
  }

  console.log(
    `[dedup] ${APPLY ? 'СЛИТО' : 'будет слито'}: групп ${plan.length}, удалено записей ${deleted}, ` +
      `затронуто проектов ${affectedProjects.size}`,
  );

  if (APPLY) {
    // Пересчёт factHours затронутых проектов через REST (та же Σ, что в SSOT).
    for (const pid of affectedProjects) {
      const ej = await get('/rest/credosTimeEntries', {
        filter: `projectId[eq]:${pid}`,
        limit: '200',
      });
      const rows = ej.data?.credosTimeEntries ?? [];
      const fact = round2(rows.reduce((s, e) => s + (Number(e.hours) || 0), 0));
      const pj = await get('/rest/credosTimeProjects', { filter: `id[eq]:${pid}`, limit: '1' });
      const planned = pj.data?.credosTimeProjects?.[0]?.plannedEffort ?? null;
      const body = { factHours: fact };
      if (planned !== null && planned !== undefined) body.budgetRemaining = round2(planned - fact);
      await patch(`/rest/credosTimeProjects/${pid}`, body);
      console.log(`[dedup] проект ${pid}: factHours=${fact}`);
    }
    console.log('[dedup] готово. Теперь данные готовы к уникальному индексу.');
  } else {
    console.log('[dedup] это dry-run. Запусти с --apply для реального слияния.');
  }
};

// Авто-запуск только при прямом вызове из CLI (не при import в тестах).
const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv?.[1] &&
  import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  main().catch((e) => {
    console.error('[dedup] ОШИБКА:', e.message);
    process.exit(1);
  });
}
