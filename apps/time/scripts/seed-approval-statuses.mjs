#!/usr/bin/env node
/**
 * seed-approval-statuses.mjs — Dev 2 (Data)
 *
 * Назначение: детерминированно проставить СТАТУСЫ согласования (status[SELECT])
 * на ПОДМНОЖЕСТВЕ записей трудозатрат (credosTimeEntries), чтобы экраны
 * «Согласование»/статусы ожили. Большинство записей остаётся DRAFT.
 *
 * Только DATA (REST PATCH). Код apps/time/src НЕ трогаем.
 *
 * Окно: записи за пару прошедших недель (по умолчанию 2026-05-25 .. 2026-06-19).
 * Внутри окна детерминированно (сортировка по id) делим:
 *   - первые SUBMITTED_N      -> SUBMITTED («На согласовании»)
 *   - следующие APPROVED_N    -> APPROVED  (+ approvedBy/approvedAt)
 *   - следующие REJECTED_N    -> REJECTED  (+ approvedBy/approvedAt)
 *   - остаток окна            -> DRAFT     (не трогаем, если уже DRAFT)
 *
 * Идемпотентность: разбиение — чистая функция от множества id в окне.
 * Повторный прогон сравнивает текущее значение с целевым и PATCH-ит только
 * РАСХОЖДЕНИЯ (status / approvedBy / approvedAt). Записи вне окна не трогаются.
 *
 * Доступ: из apps/time:  set -a; source ../../.env; set +a; node scripts/seed-approval-statuses.mjs
 * Флаги:  --dry  (только показать план, без PATCH)
 *
 * ВНИМАНИЕ: НЕ коммитить, НЕ деплоить.
 */

const URL = process.env.TWENTY_DEV_URL;
const KEY = process.env.TWENTY_DEV_API_KEY;
if (!URL || !KEY) {
  console.error('Нет TWENTY_DEV_URL / TWENTY_DEV_API_KEY в окружении. Сделай: set -a; source ../../.env; set +a');
  process.exit(1);
}

const DRY = process.argv.includes('--dry');

// --- Параметры демо-разметки ---
const WIN_START = '2026-05-25'; // включительно (YYYY-MM-DD по date[:10])
const WIN_END = '2026-06-19'; // включительно
const SUBMITTED_N = 36; // ~30-40 -> «На согласовании»
const APPROVED_N = 26; // ~20-30 -> согласовано
const REJECTED_N = 8; // ~5-10  -> отклонено
// остаток окна -> DRAFT (не размечаем сверх)

// approvedBy = workspaceMemberId руководителя (vs@credos.ru)
const APPROVER_WS_MEMBER_ID = '4674db8c-291a-4a46-9781-43145400527c';
// approvedAt: детерминированная дата согласования (день после конца окна)
const APPROVED_AT = '2026-06-20T09:00:00.000Z';

const THROTTLE_MS = 700;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiFetch(path, opts = {}, attempt = 0) {
  const res = await fetch(`${URL}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (res.status === 429) {
    if (attempt >= 5) throw new Error(`429 retry exhausted: ${path}`);
    const wait = THROTTLE_MS * (attempt + 2);
    console.warn(`  429 -> retry через ${wait}ms (${path})`);
    await sleep(wait);
    return apiFetch(path, opts, attempt + 1);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status} ${path}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

// Пагинация всех записей (REST date-фильтр ненадёжен — тянем всё, фильтруем локально).
async function fetchAllEntries() {
  const all = [];
  let cursor = null;
  for (;;) {
    const q = new URLSearchParams({ limit: '60', depth: '0', order_by: 'date[AscNullsLast]' });
    if (cursor) q.set('starting_after', cursor);
    const d = await apiFetch(`/rest/credosTimeEntries?${q.toString()}`);
    const items = d?.data?.credosTimeEntries ?? [];
    all.push(...items);
    const pi = d?.pageInfo ?? {};
    if (!pi.hasNextPage) break;
    cursor = pi.endCursor;
    await sleep(THROTTLE_MS);
  }
  return all;
}

function planTargets(entries) {
  // Окно по дате
  const win = entries
    .filter((e) => {
      const d = (e.date || '').slice(0, 10);
      return d >= WIN_START && d <= WIN_END;
    })
    // Детерминированная сортировка по id (стабильна между прогонами)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const target = new Map(); // id -> {status, approvedBy, approvedAt}
  win.forEach((e, i) => {
    if (i < SUBMITTED_N) {
      target.set(e.id, { status: 'SUBMITTED', approvedBy: '', approvedAt: null });
    } else if (i < SUBMITTED_N + APPROVED_N) {
      target.set(e.id, { status: 'APPROVED', approvedBy: APPROVER_WS_MEMBER_ID, approvedAt: APPROVED_AT });
    } else if (i < SUBMITTED_N + APPROVED_N + REJECTED_N) {
      target.set(e.id, { status: 'REJECTED', approvedBy: APPROVER_WS_MEMBER_ID, approvedAt: APPROVED_AT });
    } else {
      // остаток окна -> приводим к DRAFT (если ранее был помечен) и чистим approval
      target.set(e.id, { status: 'DRAFT', approvedBy: '', approvedAt: null });
    }
  });
  return { win, target };
}

function norm(v) {
  return v === undefined || v === null ? null : v === '' ? '' : v;
}

function diff(entry, t) {
  const patch = {};
  if (entry.status !== t.status) patch.status = t.status;
  if (norm(entry.approvedBy) !== norm(t.approvedBy)) patch.approvedBy = t.approvedBy;
  if (norm(entry.approvedAt) !== norm(t.approvedAt)) patch.approvedAt = t.approvedAt;
  return patch;
}

async function main() {
  console.log(`Окно: ${WIN_START} .. ${WIN_END}  цели: SUBMITTED=${SUBMITTED_N} APPROVED=${APPROVED_N} REJECTED=${REJECTED_N}${DRY ? '  [DRY-RUN]' : ''}`);
  const entries = await fetchAllEntries();
  console.log(`Всего записей: ${entries.length}`);

  const byId = new Map(entries.map((e) => [e.id, e]));
  const { win, target } = planTargets(entries);
  console.log(`В окне: ${win.length} записей -> размечаем ${Math.min(win.length, SUBMITTED_N + APPROVED_N + REJECTED_N)}, остаток DRAFT`);

  let patched = 0;
  let skipped = 0;
  for (const [id, t] of target) {
    const entry = byId.get(id);
    const patch = diff(entry, t);
    if (Object.keys(patch).length === 0) {
      skipped += 1;
      continue;
    }
    if (DRY) {
      console.log(`  PLAN ${id} ${entry.date.slice(0, 10)} ${entry.status} -> ${JSON.stringify(patch)}`);
      patched += 1;
      continue;
    }
    await apiFetch(`/rest/credosTimeEntries/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    patched += 1;
    if (patched % 10 === 0) console.log(`  ...PATCH ${patched}`);
    await sleep(THROTTLE_MS);
  }
  console.log(`PATCH: ${patched}  без изменений: ${skipped}`);

  // Итоговое распределение по всему объекту
  console.log('Проверка распределения (GET по статусам)...');
  const dist = {};
  for (const S of ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']) {
    const q = new URLSearchParams({ limit: '1', depth: '0' });
    q.set('filter', `status[eq]:${S}`);
    const d = await apiFetch(`/rest/credosTimeEntries?${q.toString()}`);
    dist[S] = d.totalCount ?? 0;
    await sleep(THROTTLE_MS);
  }
  console.log('РАСПРЕДЕЛЕНИЕ:', JSON.stringify(dist));
  return dist;
}

main().catch((e) => {
  console.error('ОШИБКА:', e.message);
  process.exit(1);
});
