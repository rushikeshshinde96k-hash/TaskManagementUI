import { DeadlineFilter, TaskPriority, TaskStatus, UserRole } from '../models/models';

export const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'ToDo', label: 'To Do' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'Done', label: 'Done' }
];

export const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' }
];

export const DEADLINES: { value: DeadlineFilter; label: string }[] = [
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Today', label: 'Due today' },
  { value: 'ThisWeek', label: 'Due in 7 days' },
  { value: 'ThisMonth', label: 'Due in 30 days' },
  { value: 'NoDueDate', label: 'No due date' }
];

export const ROLES: UserRole[] = ['Admin', 'Manager', 'User'];

export function statusLabel(status: TaskStatus): string {
  return STATUSES.find((s) => s.value === status)?.label ?? status;
}

/** yyyy-MM-dd for <input type="date"> from an ISO string (due dates are calendar dates stored at UTC midnight). */
export function toDateInput(iso?: string | null): string {
  return iso ? iso.substring(0, 10) : '';
}

export function todayInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function initials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}
