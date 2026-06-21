// Участник команды проекта = сотрудник, списывавший время, с агрегатами.
export type TeamMember = {
  employeeId: string;
  name: string;
  hours: number; // суммарно часов на проекте
  entries: number; // число записей
  lastDate: string | null; // последняя дата списания (YYYY-MM-DD)
  share: number; // доля от часов проекта, 0..1
};

// Проект сотрудника = проект, где сотрудник списывал время, с агрегатами (#5-часть2).
export type EmployeeProject = {
  projectId: string;
  name: string;
  code: string | null;
  hours: number; // суммарно часов сотрудника на проекте
  entries: number; // число записей
  lastDate: string | null; // последняя дата списания (YYYY-MM-DD)
  share: number; // доля от всех часов сотрудника, 0..1
};
