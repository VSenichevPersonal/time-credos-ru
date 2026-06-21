import { useEffect, useState } from 'react';

import { RestApiClient } from 'twenty-client-sdk/rest';

// WI-56 аудит-подписи: резолв userWorkspaceId (resolvedBy/revokedBy на записи) →
// читаемая подпись «кто решил/отозвал». Поля записи хранят server-truth UUID
// (event.userWorkspaceId), а НЕ ФИО — сопоставляем с сотрудником по
// employee.userWorkspaceRef[eq] (тот же мост, что resolveActor на сервере).
//
// ПДн (CISO-007, 152-ФЗ): ФИО показываем ТОЛЬКО при reveal=true (настройка
// revealEmployeeNames). Иначе — стабильный КОД сотрудника (без ФИО/UUID).
//
// Чтение read-only по Core REST (как time-rest.fetch*) — серверный гард не нужен.

const client = () => new RestApiClient();

type ListResp<T> = { data: Record<string, T[]> };
const pickList = <T>(resp: ListResp<T>, key: string): T[] => resp.data?.[key] ?? [];

// UUID-гард (CISO-006): userWorkspaceRef интерполируется в filter — только UUID.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ActorEmployee = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  departmentId?: string | null;
  userWorkspaceRef?: string | null;
};

// Чистая функция: подпись сотрудника. reveal=true → ФИО (Фамилия Имя),
// иначе — стабильный КОД (без ПДн). Пустое ФИО при reveal → откат на КОД.
export const actorLabel = (emp: ActorEmployee, reveal: boolean): string => {
  if (reveal) {
    const name = [emp.lastName, emp.firstName].filter(Boolean).join(' ').trim();
    if (name) return name;
  }
  // КОД без ПДн: последние 4 hex id (UI-локальный, не зависит от reports-calc).
  const suffix = emp.id.replace(/[^0-9a-fA-F]/g, '').slice(-4).toUpperCase() || emp.id.slice(0, 4);
  return `Сотрудник·${suffix}`;
};

// Чистая функция: карта userWorkspaceId → подпись из набора сотрудников.
// Сотрудники без userWorkspaceRef в карту не попадают (нечего сопоставлять).
export const buildActorLabelMap = (
  employees: ReadonlyArray<ActorEmployee>,
  reveal: boolean,
): Map<string, string> => {
  const map = new Map<string, string>();
  for (const e of employees) {
    if (e.userWorkspaceRef) map.set(e.userWorkspaceRef, actorLabel(e, reveal));
  }
  return map;
};

// Резолв набора userWorkspaceId → подписи. Количество разных акторов в одном
// периоде мало (1–2 руководителя) → точечные запросы userWorkspaceRef[eq]
// (паттерн resolveSelfEmployee; REST `[in]` в этом стеке не используется).
// Невалидные/несопоставленные id просто отсутствуют в карте (вызывающий
// показывает запасную подпись).
export const fetchActorNames = async (
  ids: ReadonlyArray<string | null | undefined>,
  reveal: boolean,
): Promise<Map<string, string>> => {
  const unique = [...new Set(ids.filter((id): id is string => !!id && UUID_RE.test(id)))];
  if (unique.length === 0) return new Map();
  const c = client();
  const found = await Promise.all(
    unique.map(async (uwId) => {
      try {
        const resp = await c.get<ListResp<ActorEmployee>>('/rest/credosTimeEmployees', {
          query: { filter: `userWorkspaceRef[eq]:${uwId}`, limit: '1' },
        });
        return pickList(resp, 'credosTimeEmployees')[0] ?? null;
      } catch {
        return null; // сеть/права упали — пропускаем (подпись будет запасной)
      }
    }),
  );
  return buildActorLabelMap(
    found.filter((e): e is ActorEmployee => e !== null),
    reveal,
  );
};

// Хук: подпись одного актора по userWorkspaceId (для аудит-метки полосы согласования).
// null id / не сопоставлен → null (потребитель показывает запасную подпись/прячет).
// Песочница-safe (только REST). reveal — настройка revealEmployeeNames (ПДн).
export const useActorName = (id: string | null | undefined, reveal: boolean): string | null => {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setName(null);
      return;
    }
    let alive = true;
    void fetchActorNames([id], reveal).then((map) => {
      if (alive) setName(map.get(id) ?? null);
    });
    return () => {
      alive = false;
    };
  }, [id, reveal]);

  return name;
};
