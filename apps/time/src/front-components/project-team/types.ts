// Участник команды проекта = сотрудник, списывавший время, с агрегатами.
export type TeamMember = {
  employeeId: string;
  name: string;
  hours: number; // суммарно часов на проекте
  entries: number; // число записей
  lastDate: string | null; // последняя дата списания (YYYY-MM-DD)
  share: number; // доля от часов проекта, 0..1
};
