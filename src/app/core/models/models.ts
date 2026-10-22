export type UserRole = 'Admin' | 'Manager' | 'User';
export type TaskStatus = 'ToDo' | 'InProgress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type DeadlineFilter = 'Overdue' | 'Today' | 'ThisWeek' | 'ThisMonth' | 'NoDueDate';
export type NotificationType = 'TaskAssigned' | 'TaskStatusChanged' | 'TaskCommented' | 'TeamMembership';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  teams: { teamId: number; teamName: string }[];
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: User;
}

export interface Team {
  id: number;
  name: string;
  description?: string | null;
  managerId?: number | null;
  managerName?: string | null;
  memberCount: number;
  taskCount: number;
  createdAt: string;
}

export interface TeamMember {
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
  joinedAt: string;
}

export interface TeamDetail extends Team {
  members: TeamMember[];
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  teamId?: number | null;
  teamName?: string | null;
  teamManagerId?: number | null;
  assignedToId?: number | null;
  assignedToName?: string | null;
  createdById: number;
  createdByName: string;
  commentCount: number;
  isOverdue: boolean;
}

export interface TaskFilter {
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
  deadline?: DeadlineFilter | null;
  dueFrom?: string | null;
  dueTo?: string | null;
  assignedToId?: number | null;
  teamId?: number | null;
  assignedToMe?: boolean | null;
  search?: string | null;
  sortBy?: string | null;
  sortDir?: 'asc' | 'desc' | null;
  page?: number;
  pageSize?: number;
}

export interface TaskPayload {
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
  teamId?: number | null;
  assignedToId?: number | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface Comment {
  id: number;
  taskId: number;
  content: string;
  userId: number;
  userName: string;
  userRole: UserRole;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  emailSent: boolean;
  taskId?: number | null;
  createdAt: string;
}

export interface UserTaskStats {
  userId?: number | null;
  userName: string;
  toDo: number;
  inProgress: number;
  done: number;
  overdue: number;
  total: number;
}

export interface DashboardSummary {
  total: number;
  toDo: number;
  inProgress: number;
  done: number;
  overdue: number;
  dueThisWeek: number;
  completionRate: number;
  byPriority: { priority: TaskPriority; count: number }[];
  byUser: UserTaskStats[];
  upcomingDeadlines: Task[];
}
