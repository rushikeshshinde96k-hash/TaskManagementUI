import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Team, TeamDetail } from '../../core/models/models';
import { TeamService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/components/badges.component';
import { IconComponent } from '../../shared/components/icon.component';
import { TeamFormComponent } from './team-form.component';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [RouterLink, IconComponent, AvatarComponent, TeamFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Teams</h1>
          <p>{{ subtitle }}</p>
        </div>
        @if (auth.isAdmin()) {
          <button type="button" class="btn btn-primary" (click)="showForm.set(true)"><app-icon name="plus" /> New team</button>
        }
      </div>

      @if (loading()) {
        <div class="spinner" role="status" aria-label="Loading teams"></div>
      } @else {
        <div class="grid grid-cards">
          @for (t of teams(); track t.id) {
            <a class="card card-body card-link team-card" [routerLink]="['/teams', t.id]">
              <div class="row">
                <span class="team-icon" aria-hidden="true"><app-icon name="teams" /></span>
                <h2 class="truncate">{{ t.name }}</h2>
                @if (t.managerId === auth.user()?.id) { <span class="badge role-Manager">You manage</span> }
              </div>
              <p class="muted desc">{{ t.description || 'No description.' }}</p>
              <div class="row team-foot">
                <app-avatar [name]="t.managerName ?? '?'" [small]="true" />
                <span class="small truncate">{{ t.managerName ?? 'No manager' }}</span>
                <span class="spacer"></span>
                <span class="small muted">{{ t.memberCount }} members · {{ t.taskCount }} tasks</span>
              </div>
            </a>
          } @empty {
            <div class="card empty" style="grid-column:1/-1">
              <h3>No teams yet</h3>
              <p>{{ auth.isAdmin() ? 'Create the first team to start assigning work.' : 'You have not been added to a team.' }}</p>
            </div>
          }
        </div>
      }
    </div>

    @if (showForm()) {
      <app-team-form (saved)="onSaved($event)" (cancelled)="showForm.set(false)" />
    }
  `,
  styles: [`
    .team-card { display: flex; flex-direction: column; gap: 10px; color: inherit; text-decoration: none; }
    .team-card:hover { text-decoration: none; }
    .team-icon { display: inline-flex; padding: 8px; border-radius: 8px; background: var(--primary-50); color: var(--primary); }
    .desc { min-height: 42px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .team-foot { border-top: 1px solid var(--border); padding-top: 10px; }
  `]
})
export class TeamListComponent implements OnInit {
  private readonly teamsApi = inject(TeamService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly teams = signal<Team[]>([]);
  protected readonly loading = signal(true);
  protected readonly showForm = signal(false);
  protected readonly subtitle = this.auth.isAdmin()
    ? 'Create teams, choose managers and organise members.'
    : this.auth.isManager()
      ? 'Teams you manage or belong to. Add users to the teams you manage.'
      : 'Teams you belong to.';

  ngOnInit(): void {
    this.teamsApi.list().subscribe({
      next: (t) => { this.teams.set(t); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSaved(team: TeamDetail): void {
    this.showForm.set(false);
    this.router.navigate(['/teams', team.id]);
  }
}
