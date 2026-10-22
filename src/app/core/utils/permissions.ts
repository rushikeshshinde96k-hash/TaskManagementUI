import { Task, User } from '../models/models';

// Mirrors TaskAccessPolicy on the API. Used only to show/hide controls; the API enforces the rules.

export function canManageTask(task: Task, user: User | null): boolean {
  if (!user) return false;
  if (user.role === 'Admin') return true;
  return user.role === 'Manager' && (task.createdById === user.id || task.teamManagerId === user.id);
}

export function canChangeStatus(task: Task, user: User | null): boolean {
  return !!user && (canManageTask(task, user) || task.assignedToId === user.id);
}
