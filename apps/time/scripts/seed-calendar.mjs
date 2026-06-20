#!/usr/bin/env node
/**
 * Сид производственного календаря РФ 2026 в credosTimeWorkdayCalendar (REST).
 *
 * Все 365 дней 2026 года с типом дня:
 *   HOLIDAY  (0ч) — нерабочие праздничные дни РФ + переносы;
 *   SHORT    (7ч) — предпраздничные сокращённые рабочие дни;
 *   WEEKEND  (0ч) — суббота/воскресенье (кроме перенесённых рабочих);
 *   WORKDAY  (8ч) — обычный рабочий день.
 *
 * Идемпотентность — по полю date: существующий день обновляется (PATCH),
 * новый создаётся (POST). Повторный запуск не плодит дубли.
 *
 * Доступ: cd apps/time; set -a; source ../../.env; set +a
 *         node scripts/seed-calendar.mjs
 */

const URL = process.env.TWENTY_DEV_URL;
const KEY = process.env.TWENTY_DEV_API_KEY;
if (!URL || !KEY) {
  console.error('Нет TWENTY_DEV_URL / TWENTY_DEV_API_KEY. Выполни: set -a; source ../../.env; set +a');
  process.exit(1);
}

const YEAR = 2026;
const HEADERS = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Лимит сервера ~100 req/60с. Держим 700мс/запрос + ретрай 429.
const RATE_MS = 700;
let lastReq = 0;
async function throttle() {
  const wait = RATE_MS - (Date.now() - lastReq);
  if (wait > 0) await sleep(wait);
  lastReq = Date.now();
}

async function req(method, path, body, retries = 5) {
  for (let attempt = 0; ; attempt++) {
    await throttle();
    const res = await fetch(`${URL}${path}`, {
      method,
      headers: HEADERS,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) return json.data || json;
    if (res.status === 429 && attempt < retries) {
      console.log(`  429 — пауза 60с (попытка ${attempt + 1})`);
      await sleep(61000);
      lastReq = Date.now();
      continue;
    }
    throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
  }
}

// --- Производственный календарь РФ 2026 (официальный) ---
const iso = (m, d) => `${YEAR}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// Праздничные нерабочие дни + переносы выходных. note — повод.
const HOLIDAYS = {
  [iso(1, 1)]: 'Новогодние каникулы',
  [iso(1, 2)]: 'Новогодние каникулы',
  [iso(1, 3)]: 'Новогодние каникулы',
  [iso(1, 4)]: 'Новогодние каникулы',
  [iso(1, 5)]: 'Новогодние каникулы',
  [iso(1, 6)]: 'Новогодние каникулы',
  [iso(1, 7)]: 'Рождество Христово',
  [iso(1, 8)]: 'Новогодние каникулы',
  [iso(1, 9)]: 'Перенос выходного (с 3 января)', // ПП РФ N1466: сб 3.01 → пт 9.01
  [iso(2, 23)]: 'День защитника Отечества',
  [iso(3, 9)]: 'Перенос выходного (8 марта)',
  [iso(5, 1)]: 'Праздник Весны и Труда',
  [iso(5, 9)]: 'День Победы',
  [iso(5, 11)]: 'Перенос выходного (9 мая)',
  [iso(6, 12)]: 'День России',
  [iso(11, 4)]: 'День народного единства',
  [iso(12, 31)]: 'Перенос выходного (с 4 января)', // ПП РФ N1466: вс 4.01 → чт 31.12
};

// Предпраздничные сокращённые рабочие дни (7ч) — официально 4 (ст.95 ТК РФ 2026):
// накануне 1 мая, 9 мая, 12 июня, 4 ноября. (22.02=вс, 07.03=сб — выходные, НЕ short.)
const SHORT = {
  [iso(4, 30)]: 'Предпраздничный день',
  [iso(5, 8)]: 'Предпраздничный день',
  [iso(6, 11)]: 'Предпраздничный день',
  [iso(11, 3)]: 'Предпраздничный день',
};

function classifyDay(date) {
  const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  if (HOLIDAYS[key]) return { dayType: 'HOLIDAY', hours: 0, note: HOLIDAYS[key] };
  if (SHORT[key]) return { dayType: 'SHORT', hours: 7, note: SHORT[key] };
  const dow = date.getUTCDay(); // 0=вс, 6=сб
  if (dow === 0 || dow === 6) return { dayType: 'WEEKEND', hours: 0, note: null };
  return { dayType: 'WORKDAY', hours: 8, note: null };
}

async function fetchExisting() {
  const map = new Map(); // dateKey(YYYY-MM-DD) -> id
  let cursor = null;
  for (let i = 0; i < 30; i++) {
    const u = new global.URL(`${URL}/rest/credosTimeWorkdayCalendars`);
    u.searchParams.set('limit', '60');
    u.searchParams.set('filter', `year[eq]:${YEAR}`);
    if (cursor) u.searchParams.set('starting_after', cursor);
    await throttle();
    const res = await fetch(u, { headers: HEADERS });
    const json = await res.json();
    const recs = json.data?.credosTimeWorkdayCalendars ?? [];
    for (const r of recs) map.set(String(r.date).slice(0, 10), r.id);
    cursor = json.pageInfo?.endCursor ?? json.data?.pageInfo?.endCursor ?? null;
    if (!json.pageInfo?.hasNextPage && !cursor) break;
    if (recs.length < 60) break;
  }
  return map;
}

async function main() {
  console.log(`Сид производственного календаря РФ ${YEAR}...`);
  const existing = await fetchExisting();
  console.log(`Уже в базе за ${YEAR}: ${existing.size} дней`);

  const start = Date.UTC(YEAR, 0, 1);
  const end = Date.UTC(YEAR, 11, 31);
  const stats = { WORKDAY: 0, WEEKEND: 0, HOLIDAY: 0, SHORT: 0, created: 0, updated: 0 };

  for (let t = start; t <= end; t += 86400000) {
    const date = new Date(t);
    const key = date.toISOString().slice(0, 10);
    const { dayType, hours, note } = classifyDay(date);
    stats[dayType]++;
    const body = { date: `${key}T00:00:00.000Z`, year: YEAR, dayType, hours, note };
    const id = existing.get(key);
    if (id) {
      await req('PATCH', `/rest/credosTimeWorkdayCalendars/${id}`, body);
      stats.updated++;
    } else {
      await req('POST', '/rest/credosTimeWorkdayCalendars', body);
      stats.created++;
    }
    if ((stats.created + stats.updated) % 30 === 0) {
      process.stdout.write(`  ${stats.created + stats.updated} дней...\r`);
    }
  }

  console.log('\nГотово.');
  console.log(`  Рабочих: ${stats.WORKDAY}, Выходных: ${stats.WEEKEND}, Праздников: ${stats.HOLIDAY}, Предпраздничных: ${stats.SHORT}`);
  console.log(`  Создано: ${stats.created}, обновлено: ${stats.updated}`);
}

main().catch((e) => {
  console.error('Ошибка:', e.message);
  process.exit(1);
});
