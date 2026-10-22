import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TeamDetail, TeamMember, User } from '../../core/models/models';
import { TeamService, UserService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';
import { AvatarComponent, RoleBadgeComponent } from '../../shared/components/badges.component';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { TeamFormComponent } from './team-form.component';

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, IconComponent, AvatarComponent, RoleBadgeComponent, ModalComponent, TeamFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './team-detail.component.html',
  styles: [`
    .back { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 14px; color: var(--text-2); font-weight: 500; }
    .pick-list { max-height: 320px; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .pick { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-bottom: 1px solid var(--border); cursor: pointer; }
    .pick:last-child { border-bottom: none; }
    .pick:hover { background: var(--surface-2); }
    .pick input { width: 16px; height: 16px; accent-color: var(--primary); }
    .stats { display: flex; gap: 24px; flex-wrap: wrap; margin-top: 12px; }
  `]
})
export class TeamDetailComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly teamsApi = inject(TeamService);
  private readonly usersApi = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly team = signal<TeamDetail | null>(null);
  protected readonly notFound = signal(false);
  protected readonly editing = signal(false);
  protected readonly adding = signal(false);
  protected readonly candidates = signal<User[]>([]);
  protected readonly selected = signal<Set<number>>(new Set());
  protected readonly search = signal('');

  protected readonly canManageMembers = computed(() => {
    const t = this.team();
    return !!t && (this.auth.isAdmin() || t.managerId === this.auth.user()?.id);
  });

  protected readonly filteredCandidates = computed(() => {
    const q = this.search().toLowerCase();
    return this.candidates().filter((u) => !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    this.teamsApi.get(Number(this.id())).subscribe({
      next: (t) => this.team.set(t),
      error: () => this.notFound.set(true)
    });
  }

  openAdd(): void {
    const t = this.team();
    if (!t) return;
    // Managers may only add 'User' accounts; admins may add managers too.
    const role = this.auth.isAdmin() ? null : 'User';
    this.usersApi.list({ role, isActive: true }).subscribe((users) => {
      const memberIds = new Set(t.members.map((m) => m.userId));
      this.candidates.set(users.filter((u) => u.role !== 'Admin' && !memberIds.has(u.id) && u.id !== t.managerId));
      this.selected.set(new Set());
      this.search.set('');
      this.adding.set(true);
    });
  }

  toggle(id: number, checked: boolean): void {
    this.selected.update((s) => {
      const next = new Set(s);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  }

  addSelected(): void {
    const t = this.team();
    const ids = [...this.selected()];
    if (!t || ids.length === 0) return;
    this.teamsApi.addMembers(t.id, ids).subscribe((updated) => {
      this.team.set(updated);
      this.adding.set(false);
      this.toast.success(`${ids.length} member(s) added. They have been notified.`);
    });
  }

  async removeMember(m: TeamMember): Promise<void> {
    const t = this.team();
    if (!t) return;
    const ok = await this.confirm.ask({
      title: 'Remove member?',
      message: `${m.fullName} will be removed from ${t.name}. Their existing tasks stay assigned.`,
      confirmText: 'Remove',
      danger: true
    });
    if (!ok) return;
    this.teamsApi.removeMember(t.id, m.userId).subscribe((updated) => {
      this.team.set(updated);
      this.toast.success(`${m.fullName} removed.`);
    });
  }

  async deleteTeam(): Promise<void> {
    const t = this.team();
    if (!t) return;
    const ok = await this.confirm.ask({
      title: 'Delete team?',
      message: `"${t.name}" will be deleted. Its tasks are kept but no longer belong to a team.`,
      confirmText: 'Delete team',
      danger: true
    });
    if (!ok) return;
    this.teamsApi.delete(t.id).subscribe(() => {
      this.toast.success('Team deleted.');
      this.router.navigate(['/teams']);
    });
  }

  onSaved(updated: TeamDetail): void {
    this.team.set(updated);
    this.editing.set(false);
  }
}
