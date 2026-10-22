import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Team, TeamDetail, User } from '../../core/models/models';
import { TeamService, UserService } from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/utils/http';
import { ModalComponent } from '../../shared/components/modal.component';

/** Admin-only: create or edit a team and choose its manager. */
@Component({
  selector: 'app-team-form',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [title]="team() ? 'Edit team' : 'New team'" (closed)="cancelled.emit()">
      @if (error()) { <div class="alert alert-error" role="alert" style="margin-bottom:14px">{{ error() }}</div> }
      <form class="form" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="field">
          <label for="team-name">Name</label>
          <input id="team-name" class="input" formControlName="name" maxlength="100"
                 [class.invalid]="form.controls.name.invalid && form.controls.name.touched" />
          @if (form.controls.name.invalid && form.controls.name.touched) {
            <span class="field-error">Name must be 2–100 characters.</span>
          }
        </div>
        <div class="field">
          <label for="team-desc">Description</label>
          <textarea id="team-desc" class="textarea" formControlName="description" rows="3" maxlength="500"></textarea>
        </div>
        <div class="field">
          <label for="team-manager">Manager</label>
          <select id="team-manager" class="select" formControlName="managerId">
            <option [ngValue]="null">No manager</option>
            @for (m of managers(); track m.id) { <option [ngValue]="m.id">{{ m.fullName }}</option> }
          </select>
          <span class="hint">Only users with the Manager role are listed. Change roles on the Users page.</span>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" (click)="cancelled.emit()">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save team' }}</button>
        </div>
      </form>
    </app-modal>
  `
})
export class TeamFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly teamsApi = inject(TeamService);
  private readonly usersApi = inject(UserService);
  private readonly toast = inject(ToastService);

  readonly team = input<Team | null>(null);
  readonly saved = output<TeamDetail>();
  readonly cancelled = output<void>();

  protected readonly managers = signal<User[]>([]);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: [''],
    managerId: [null as number | null]
  });

  ngOnInit(): void {
    const t = this.team();
    if (t) this.form.patchValue({ name: t.name, description: t.description ?? '', managerId: t.managerId ?? null });
    this.usersApi.list({ role: 'Manager', isActive: true }).subscribe((m) => this.managers.set(m));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload = { name: v.name!.trim(), description: v.description?.trim() || null, managerId: v.managerId };
    const existing = this.team();

    this.saving.set(true);
    this.error.set(null);
    (existing ? this.teamsApi.update(existing.id, payload) : this.teamsApi.create(payload)).subscribe({
      next: (team) => {
        this.toast.success(existing ? 'Team updated.' : 'Team created.');
        this.saved.emit(team);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.saving.set(false);
      }
    });
  }
}
