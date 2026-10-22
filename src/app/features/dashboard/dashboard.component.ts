import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DashboardSummary, TaskFilter, Team, UserTaskStats } from '../../core/models/models';
import { DashboardService, TeamService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent, PriorityBadgeComponent, StatusBadgeComponent } from '../../shared/components/badges.component';
import { IconComponent } from '../../shared/components/icon.component';
import { TaskFiltersComponent } from '../../shared/components/task-filters.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, IconComponent, TaskFiltersComponent, AvatarComponent, StatusBadgeComponent, PriorityBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly dashboard = inject(DashboardService);
  private readonly teamsApi = inject(TeamService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly teams = signal<Team[]>([]);
  protected readonly loading = signal(true);
  protected readonly filter = signal<TaskFilter>({});

  protected readonly firstName = computed(() => this.auth.user()?.fullName.split(' ')[0] ?? '');
  protected readonly maxPriority = computed(() => Math.max(1, ...(this.summary()?.byPriority.map((p) => p.count) ?? [1])));
  protected readonly scopeText = computed(() => {
    switch (this.auth.role()) {
      case 'Admin': return 'Overview of every task across the organization.';
      case 'Manager': return 'Tasks you created and tasks in the teams you manage.';
      default: return 'Your assigned tasks at a glance.';
    }
  });

  ngOnInit(): void {
    this.teamsApi.list().subscribe((t) => this.teams.set(t));
    this.load();
  }

  onFilter(f: TaskFilter): void {
    this.filter.set(f);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.dashboard.summary(this.filter()).subscribe({
      next: (s) => {
        this.summary.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  pct(part: number, total: number): number {
    return total === 0 ? 0 : (part / total) * 100;
  }

  openUser(row: UserTaskStats): void {
    if (row.userId == null || !this.auth.canManageTasks()) return;
    this.router.navigate(['/tasks'], { queryParams: { ...this.cleanFilter(), assignedToId: row.userId } });
  }

  viewTasksParams(): Record<string, string | number> {
    return this.cleanFilter();
  }

  private cleanFilter(): Record<string, string | number> {
    const out: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(this.filter())) {
      if (v !== null && v !== undefined && v !== '') out[k] = v as string | number;
    }
    return out;
  }
}
