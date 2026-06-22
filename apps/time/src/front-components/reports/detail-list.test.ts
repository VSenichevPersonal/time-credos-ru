import { describe, expect, it } from 'vitest';

import { leafDetailFilter } from './detail-list';
import type { OlapFilter } from 'src/front-components/reports/olap-types';

// Чистая функция проекции пути drill + листовой строки в detail-фильтр
// (deptId/projectId/employeeId). Прочее (category/workType) → null (нет контракта).

describe('leafDetailFilter', () => {
  it('лист по оси dept без пути → только deptId', () => {
    expect(leafDetailFilter([], 'dept', 'd1')).toEqual({ deptId: 'd1' });
  });

  it('лист по оси project → projectId', () => {
    expect(leafDetailFilter([], 'project', 'p1')).toEqual({ projectId: 'p1' });
  });

  it('лист по оси employee → employeeId', () => {
    expect(leafDetailFilter([], 'employee', 'e1')).toEqual({ employeeId: 'e1' });
  });

  it('путь dept→employee: фильтр AND (deptId+employeeId)', () => {
    const path: OlapFilter[] = [{ dim: 'dept', value: 'd1' }];
    expect(leafDetailFilter(path, 'employee', 'e1')).toEqual({ deptId: 'd1', employeeId: 'e1' });
  });

  it('путь dept→project→employee: три фильтра', () => {
    const path: OlapFilter[] = [
      { dim: 'dept', value: 'd1' },
      { dim: 'project', value: 'p1' },
    ];
    expect(leafDetailFilter(path, 'employee', 'e1')).toEqual({
      deptId: 'd1',
      projectId: 'p1',
      employeeId: 'e1',
    });
  });

  it('непроецируемая ось листа (category) → null', () => {
    expect(leafDetailFilter([], 'category', 'CLIENT')).toBeNull();
  });

  it('непроецируемая ось листа (workType) → null', () => {
    expect(leafDetailFilter([{ dim: 'dept', value: 'd1' }], 'workType', 'wt1')).toBeNull();
  });

  it('непроецируемые оси в пути игнорируются (category в пути)', () => {
    const path: OlapFilter[] = [
      { dim: 'category', value: 'CLIENT' },
      { dim: 'project', value: 'p1' },
    ];
    expect(leafDetailFilter(path, 'employee', 'e1')).toEqual({
      projectId: 'p1',
      employeeId: 'e1',
    });
  });
});
