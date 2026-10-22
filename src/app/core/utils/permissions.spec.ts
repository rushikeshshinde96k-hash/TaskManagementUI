import { Task, User, UserRole } from '../models/models';
import { canChangeStatus, canManageTask } from './permissions';

const user = (id: number, role: UserRole): User =>
  ({ id, role, fullName: 'x', email: 'x', isActive: true, createdAt: '', teams: [] });

const task = {
  id: 1, title: 't', status: 'ToDo', priority: 'Low', createdAt: '', commentCount: 0, isOverdue: false,
  createdById: 2, createdByName: 'Manager', teamManagerId: 2, assignedToId: 4
} as Task;

describe('task permissions', () => {
  it('lets admins manage any task', () => {
    expect(canManageTask(task, user(1, 'Admin'))).toBeTrue();
  });

  it('lets the team manager manage, but not another manager', () => {
    expect(canManageTask(task, user(2, 'Manager'))).toBeTrue();
    expect(canManageTask(task, user(3, 'Manager'))).toBeFalse();
  });

  it('lets the assignee change status but not manage', () => {
    expect(canChangeStatus(task, user(4, 'User'))).toBeTrue();
    expect(canManageTask(task, user(4, 'User'))).toBeFalse();
  });

  it('denies unrelated users and anonymous', () => {
    expect(canChangeStatus(task, user(5, 'User'))).toBeFalse();
    expect(canChangeStatus(task, null)).toBeFalse();
  });
});
