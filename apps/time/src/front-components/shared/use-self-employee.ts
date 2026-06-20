import { useEffect, useState } from 'react';

import { RestApiClient } from 'twenty-client-sdk/rest';
import { useUserId } from 'twenty-sdk/front-component';

// Единый резолв роли текущего пользователя во фронте (A1/A2).
// Цепочка (см. docs/data-model/A1_CURRENT_USER_RESEARCH.md):
//   useUserId()                                              → userId (UUID платформы)
//   /rest/workspaceMembers?filter=userId[eq]:<userId>        → workspaceMember.id
//   /rest/credosTimeEmployees?filter=workspaceMemberRef[eq]  → employee.id, isManager
//
// Если у юзера нет workspaceMember или employee не привязан (нет ref / не приглашён)
// → isManager=false, employeeId=null (рядовой). Падать нельзя.
//
// TODO(ciso-005): это UX-гейт (видимость кнопок), НЕ защита. Реальный RBAC —
// на сервере (approval.logic resolveActor + isManager-guard). Здесь лишь решаем,
// показывать ли «Согласовать/Отклонить» и фильтр «Сотрудник».

export type SelfEmployee = {
  employeeId: string | null;
  isManager: boolean;
  loading: boolean;
};

const client = () => new RestApiClient();

type ListResp<T> = { data: Record<string, T[]> };
const pickList = <T>(resp: ListResp<T>, key: string): T[] => resp.data?.[key] ?? [];

// Защита от filter-injection (CISO-006): userId из SDK обязан быть UUID. Чужой
// формат — не строим запрос, считаем «не резолвлено» (рядовой пользователь).
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RawMember = { id: string };
type RawEmp = { id: string; isManager?: boolean | null };

// Чистый резолвер (unit-тестируемый): userId → { employeeId, isManager }.
// Не-UUID / отсутствие записей → рядовой (employeeId=null, isManager=false).
export const resolveSelfEmployee = async (
  userId: string | null,
): Promise<{ employeeId: string | null; isManager: boolean }> => {
  if (!userId || !UUID_RE.test(userId)) return { employeeId: null, isManager: false };
  const c = client();

  const memberResp = await c.get<ListResp<RawMember>>('/rest/workspaceMembers', {
    query: { filter: `userId[eq]:${userId}`, limit: '1' },
  });
  const member = pickList(memberResp, 'workspaceMembers')[0];
  if (!member) return { employeeId: null, isManager: false };

  const empResp = await c.get<ListResp<RawEmp>>('/rest/credosTimeEmployees', {
    query: { filter: `workspaceMemberRef[eq]:${member.id}`, limit: '1' },
  });
  const emp = pickList(empResp, 'credosTimeEmployees')[0];
  if (!emp) return { employeeId: null, isManager: false };

  return { employeeId: emp.id, isManager: emp.isManager === true };
};

// Хук: резолвит роль один раз на смену userId. Песочница-safe (только REST,
// без host-DOM). Мемо — через зависимость useEffect от userId.
export const useSelfEmployee = (): SelfEmployee => {
  const userId = useUserId();
  const [state, setState] = useState<SelfEmployee>({
    employeeId: null,
    isManager: false,
    loading: true,
  });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    resolveSelfEmployee(userId)
      .then(({ employeeId, isManager }) => {
        if (alive) setState({ employeeId, isManager, loading: false });
      })
      .catch(() => {
        // Сеть/права упали → не блокируем UI, считаем рядовым.
        if (alive) setState({ employeeId: null, isManager: false, loading: false });
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  return state;
};
