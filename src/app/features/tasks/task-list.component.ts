import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PagedResult, Task, TaskFilter, TaskStatus, Team, User } from '../../core/models/models';
import { TaskService, TeamService, UserService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { STATUSES, statusLabel } from '../../core/utils/labels';
import { canChangeStatus } from '../../core/utils/permissions';
import { AvatarComponent, PriorityBadgeComponent, StatusBadgeComponent } from '../../shared/components/badges.component';
import { IconComponent } from '../../shared/components/icon.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { TaskFiltersComponent } from '../../shared/components/task-filters.component';
import { TaskFormComponent } from './task-form.component';

type View = 'list' | 'board';
const VIEW_KEY = 'tm.tasks.view';
const NUMERIC_KEYS = ['teamId', 'assignedToId', 'page'];

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    DatePipe, FormsModule, RouterLink, IconComponent, TaskFiltersComponent, PaginationComponent,
    StatusBadgeComponent, PriorityBadgeComponent, AvatarComponent, TaskFormComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css'
})
export class TaskListComponent implements OnInit {
  private readonly tasksApi = inject(TaskService);
  private readonly teamsApi = inject(TeamService);
  private readonly usersApi = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly statuses = STATUSES;
  protected readonly result = signal<PagedResult<Task> | null>(null);
  protected readonly loading = signal(true);
  protected readonly teams = signal<Team[]>([]);
  protected readonly assignees = signal<User[]>([]);
  protected readonly filter = signal<TaskFilter>({});
  protected readonly view = signal<View>((localStorage.getItem(VIEW_KEY) as View) ?? 'list');
  protected readonly showForm = signal(false);
  protected readonly initialFilter: TaskFilter;

  protected readonly columns = computed(() => {
    const items = this.result()?.items ?? [];
    return STATUSES.map((s) => ({ ...s, tasks: items.filter((t) => t.status === s.value) }));
  });

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    const f: Record<string, unknown> = {};
    for (const key of params.keys) {
      const raw = params.get(key);
      f[key] = NUMERIC_KEYS.includes(key) ? Number(raw) : key === 'assignedToMe' ? raw === 'true' : raw;
    }
    this.initialFilter = f as TaskFilter;
    this.filter.set({ sortBy: 'createdAt', sortDir: 'desc', ...this.initialFilter });
  }

  ngOnInit(): void {
    this.teamsApi.list().subscribe((t) => this.teams.set(t));
    if (this.auth.canManageTasks()) {
      this.usersApi.assignable().subscribe((u) => this.assignees.set(u));
    }
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const pageSize = this.view() === 'board' ? 100 : 10;
    this.tasksApi.list({ ...this.filter(), pageSize }).subscribe({
      next: (r) => {
        this.result.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onFilter(f: TaskFilter): void {
    this.update({ ...f, page: 1 });
  }

  setSort(value: string): void {
    const [sortBy, sortDir] = value.split(':') as [string, 'asc' | 'desc'];
    this.update({ sortBy, sortDir, page: 1 });
  }

  toggleMine(checked: boolean): void {
    this.update({ assignedToMe: checked || null, page: 1 });
  }

  setView(v: View): void {
    this.view.set(v);
    localStorage.setItem(VIEW_KEY, v);
    this.update({ page: 1 });
  }

  goToPage(page: number): void {
    this.update({ page });
  }

  canChange(task: Task): boolean {
    return canChangeStatus(task, this.auth.user());
  }

  changeStatus(task: Task, status: TaskStatus): void {
    if (task.status === status) return;
    this.tasksApi.updateStatus(task.id, status).subscribe({
      next: (updated) => {
        this.toast.success(`"${updated.title}" moved to ${statusLabel(status)}.`);
        this.result.update((r) => r && { ...r, items: r.items.map((t) => (t.id === updated.id ? updated : t)) });
      },
      // Re-sync the select with the server state.
      error: () => this.load()
    });
  }

  onSaved(task: Task): void {
    this.showForm.set(false);
    this.router.navigate(['/tasks', task.id]);
  }

  sortValue(): string {
    return `${this.filter().sortBy ?? 'createdAt'}:${this.filter().sortDir ?? 'desc'}`;
  }

  private update(patch: Partial<TaskFilter>): void {
    this.filter.update((f) => ({ ...f, ...patch }));
    const queryParams: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(this.filter())) {
      queryParams[k] = v === null || v === '' || v === undefined || (k === 'page' && v === 1) ? null : v;
    }
    this.router.navigate([], { queryParams, replaceUrl: true });
    this.load();
  }
}
