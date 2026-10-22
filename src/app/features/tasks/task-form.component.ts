import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Task, TaskPriority, TaskStatus, Team, User } from '../../core/models/models';
import { TaskService, TeamService, UserService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/utils/http';
import { PRIORITIES, STATUSES, toDateInput, todayInput } from '../../core/utils/labels';
import { ModalComponent } from '../../shared/components/modal.component';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [title]="task() ? 'Edit task' : 'New task'" [wide]="true" (closed)="cancelled.emit()">
      @if (error()) { <div class="alert alert-error" role="alert" style="margin-bottom:14px">{{ error() }}</div> }

      <form class="form" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="field">
          <label for="t-title">Title</label>
          <input id="t-title" class="input" formControlName="title" maxlength="200" [class.invalid]="invalid('title')" />
          @if (invalid('title')) { <span class="field-error">Title must be 3–200 characters.</span> }
        </div>
        <div class="field">
          <label for="t-desc">Description</label>
          <textarea id="t-desc" class="textarea" formControlName="description" maxlength="4000" rows="4"></textarea>
        </div>

        <div class="grid grid-3">
          <div class="field">
            <label for="t-priority">Priority</label>
            <select id="t-priority" class="select" formControlName="priority">
              @for (p of priorities; track p.value) { <option [ngValue]="p.value">{{ p.label }}</option> }
            </select>
          </div>
          <div class="field">
            <label for="t-due">Due date</label>
            <input id="t-due" class="input" type="date" formControlName="dueDate" [min]="task() ? '' : today" />
          </div>
          @if (task()) {
            <div class="field">
              <label for="t-status">Status</label>
              <select id="t-status" class="select" formControlName="status">
                @for (s of statuses; track s.value) { <option [ngValue]="s.value">{{ s.label }}</option> }
              </select>
            </div>
          }
        </div>

        <div class="grid grid-2">
          <div class="field">
            <label for="t-team">Team</label>
            <select id="t-team" class="select" formControlName="teamId">
              <option [ngValue]="null">{{ auth.isAdmin() ? 'No team' : 'No team (assign to my team members)' }}</option>
              @for (t of teams(); track t.id) { <option [ngValue]="t.id">{{ t.name }}</option> }
            </select>
          </div>
          <div class="field">
            <label for="t-assignee">Assign to</label>
            <select id="t-assignee" class="select" formControlName="assignedToId">
              <option [ngValue]="null">Unassigned</option>
              @for (u of assignees(); track u.id) { <option [ngValue]="u.id">{{ u.fullName }} ({{ u.role }})</option> }
            </select>
            <span class="hint">{{ assigneeHint() }}</span>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-ghost" (click)="cancelled.emit()">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ saving() ? 'Saving…' : (task() ? 'Save changes' : 'Create task') }}</button>
        </div>
      </form>
    </app-modal>
  `
})
export class TaskFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tasksApi = inject(TaskService);
  private readonly teamsApi = inject(TeamService);
  private readonly usersApi = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);

  readonly task = input<Task | null>(null);
  readonly saved = output<Task>();
  readonly cancelled = output<void>();

  protected readonly priorities = PRIORITIES;
  protected readonly statuses = STATUSES;
  protected readonly today = todayInput();
  protected readonly teams = signal<Team[]>([]);
  protected readonly assignees = signal<User[]>([]);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly assigneeHint = computed(() =>
    this.auth.isAdmin() ? 'Admins can assign to any manager or user.' : 'Only members of your teams can be assigned.'
  );

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    description: [''],
    priority: ['Medium' as TaskPriority, Validators.required],
    status: ['ToDo' as TaskStatus],
    dueDate: [''],
    teamId: [null as number | null],
    assignedToId: [null as number | null]
  });

  ngOnInit(): void {
    const t = this.task();
    if (t) {
      this.form.patchValue({
        title: t.title,
        description: t.description ?? '',
        priority: t.priority,
        status: t.status,
        dueDate: toDateInput(t.dueDate),
        teamId: t.teamId ?? null,
        assignedToId: t.assignedToId ?? null
      });
    }

    // Managers may only create tasks for teams they manage.
    this.teamsApi.list().subscribe((teams) => {
      const me = this.auth.user()?.id;
      this.teams.set(this.auth.isAdmin() ? teams : teams.filter((x) => x.managerId === me));
    });

    this.loadAssignees(this.form.controls.teamId.value, false);
    this.form.controls.teamId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((teamId) => this.loadAssignees(teamId, true));
  }

  invalid(name: 'title'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload = {
      title: v.title!.trim(),
      description: v.description?.trim() || null,
      priority: v.priority!,
      status: v.status ?? 'ToDo',
      dueDate: v.dueDate || null,
      teamId: v.teamId,
      assignedToId: v.assignedToId
    };

    this.saving.set(true);
    this.error.set(null);
    const existing = this.task();
    const request = existing ? this.tasksApi.update(existing.id, payload) : this.tasksApi.create(payload);

    request.subscribe({
      next: (task) => {
        this.toast.success(existing ? 'Task updated.' : 'Task created.');
        this.saved.emit(task);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.saving.set(false);
      }
    });
  }

  private loadAssignees(teamId: number | null, resetIfMissing: boolean): void {
    this.usersApi.assignable(teamId).subscribe((users) => {
      this.assignees.set(users);
      const current = this.form.controls.assignedToId.value;
      if (resetIfMissing && current && !users.some((u) => u.id === current)) {
        this.form.controls.assignedToId.setValue(null);
      }
    });
  }
}
