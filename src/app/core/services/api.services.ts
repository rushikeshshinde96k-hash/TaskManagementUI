import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AppNotification, Comment, DashboardSummary, PagedResult, Task, TaskFilter, TaskPayload,
  TaskStatus, Team, TeamDetail, User, UserRole
} from '../models/models';
import { SKIP_ERROR_TOAST, toParams } from '../utils/http';

const API = environment.apiUrl;

/** Request option for calls whose errors are shown inline by the component. */
export const silent = () => ({ context: new HttpContext().set(SKIP_ERROR_TOAST, true) });

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);

  list(filter: TaskFilter): Observable<PagedResult<Task>> {
    return this.http.get<PagedResult<Task>>(`${API}/tasks`, { params: toParams(filter) });
  }
  get(id: number): Observable<Task> {
    return this.http.get<Task>(`${API}/tasks/${id}`);
  }
  create(payload: TaskPayload): Observable<Task> {
    return this.http.post<Task>(`${API}/tasks`, payload, silent());
  }
  update(id: number, payload: TaskPayload): Observable<Task> {
    return this.http.put<Task>(`${API}/tasks/${id}`, payload, silent());
  }
  updateStatus(id: number, status: TaskStatus): Observable<Task> {
    return this.http.patch<Task>(`${API}/tasks/${id}/status`, { status });
  }
  assign(id: number, assignedToId: number | null): Observable<Task> {
    return this.http.patch<Task>(`${API}/tasks/${id}/assign`, { assignedToId });
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/tasks/${id}`);
  }

  comments(taskId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${API}/tasks/${taskId}/comments`);
  }
  addComment(taskId: number, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${API}/tasks/${taskId}/comments`, { content });
  }
  updateComment(taskId: number, commentId: number, content: string): Observable<Comment> {
    return this.http.put<Comment>(`${API}/tasks/${taskId}/comments/${commentId}`, { content });
  }
  deleteComment(taskId: number, commentId: number): Observable<void> {
    return this.http.delete<void>(`${API}/tasks/${taskId}/comments/${commentId}`);
  }
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly http = inject(HttpClient);

  list(): Observable<Team[]> {
    return this.http.get<Team[]>(`${API}/teams`);
  }
  get(id: number): Observable<TeamDetail> {
    return this.http.get<TeamDetail>(`${API}/teams/${id}`);
  }
  create(payload: { name: string; description?: string | null; managerId?: number | null }): Observable<TeamDetail> {
    return this.http.post<TeamDetail>(`${API}/teams`, payload, silent());
  }
  update(id: number, payload: { name: string; description?: string | null; managerId?: number | null }): Observable<TeamDetail> {
    return this.http.put<TeamDetail>(`${API}/teams/${id}`, payload, silent());
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/teams/${id}`);
  }
  addMembers(id: number, userIds: number[]): Observable<TeamDetail> {
    return this.http.post<TeamDetail>(`${API}/teams/${id}/members`, { userIds });
  }
  removeMember(id: number, userId: number): Observable<TeamDetail> {
    return this.http.delete<TeamDetail>(`${API}/teams/${id}/members/${userId}`);
  }
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  list(query: { search?: string | null; role?: UserRole | null; isActive?: boolean | null } = {}): Observable<User[]> {
    return this.http.get<User[]>(`${API}/users`, { params: toParams(query) });
  }
  assignable(teamId?: number | null): Observable<User[]> {
    return this.http.get<User[]>(`${API}/users/assignable`, { params: toParams({ teamId }) });
  }
  create(payload: { fullName: string; email: string; password: string; role: UserRole }): Observable<User> {
    return this.http.post<User>(`${API}/users`, payload, silent());
  }
  updateRole(id: number, role: UserRole): Observable<User> {
    return this.http.put<User>(`${API}/users/${id}/role`, { role });
  }
  updateStatus(id: number, isActive: boolean): Observable<User> {
    return this.http.put<User>(`${API}/users/${id}/status`, { isActive });
  }
  me(): Observable<User> {
    return this.http.get<User>(`${API}/auth/me`);
  }
  updateProfile(fullName: string): Observable<User> {
    return this.http.put<User>(`${API}/users/me/profile`, { fullName }, silent());
  }
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${API}/users/me/password`, { currentPassword, newPassword }, silent());
  }
}

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private readonly http = inject(HttpClient);

  list(unreadOnly = false, take = 30): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${API}/notifications`, { params: toParams({ unreadOnly, take }) });
  }
  unreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${API}/notifications/unread-count`, silent());
  }
  markRead(id: number): Observable<void> {
    return this.http.patch<void>(`${API}/notifications/${id}/read`, {});
  }
  markAllRead(): Observable<void> {
    return this.http.patch<void>(`${API}/notifications/read-all`, {});
  }
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  summary(filter: TaskFilter): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${API}/dashboard/summary`, { params: toParams(filter) });
  }
}
