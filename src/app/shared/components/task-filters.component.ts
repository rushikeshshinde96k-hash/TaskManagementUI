import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DeadlineFilter, TaskFilter, TaskPriority, TaskStatus, Team, User } from '../../core/models/models';
import { DEADLINES, PRIORITIES, STATUSES } from '../../core/utils/labels';
import { IconComponent } from './icon.component';

/** Filter bar shared by the dashboard and the task list. Emits a partial TaskFilter on every change. */
@Component({
  selector: 'app-task-filters',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="filters" [formGroup]="form" (ngSubmit)="$event.preventDefault()" role="search" aria-label="Filter tasks">
      @if (showSearch()) {
        <div class="field search">
          <label for="f-search">Search</label>
          <div class="input-icon">
            <app-icon name="search" [size]="16" />
            <input id="f-search" class="input" formControlName="search" placeholder="Title or description" />
          </div>
        </div>
      }
      <div class="field">
        <label for="f-status">Status</label>
        <select id="f-status" class="select" formControlName="status">
          <option [ngValue]="null">All statuses</option>
          @for (s of statuses; track s.value) { <option [ngValue]="s.value">{{ s.label }}</option> }
        </select>
      </div>
      <div class="field">
        <label for="f-priority">Priority</label>
        <select id="f-priority" class="select" formControlName="priority">
          <option [ngValue]="null">All priorities</option>
          @for (p of priorities; track p.value) { <option [ngValue]="p.value">{{ p.label }}</option> }
        </select>
      </div>
      <div class="field">
        <label for="f-deadline">Deadline</label>
        <select id="f-deadline" class="select" formControlName="deadline">
          <option [ngValue]="null">Any deadline</option>
          @for (d of deadlines; track d.value) { <option [ngValue]="d.value">{{ d.label }}</option> }
        </select>
      </div>
      <div class="field">
        <label for="f-from">Due from</label>
        <input id="f-from" class="input" type="date" formControlName="dueFrom" />
      </div>
      <div class="field">
        <label for="f-to">Due to</label>
        <input id="f-to" class="input" type="date" formControlName="dueTo" />
      </div>
      @if (teams().length > 0) {
        <div class="field">
          <label for="f-team">Team</label>
          <select id="f-team" class="select" formControlName="teamId">
            <option [ngValue]="null">All teams</option>
            @for (t of teams(); track t.id) { <option [ngValue]="t.id">{{ t.name }}</option> }
          </select>
        </div>
      }
      @if (assignees().length > 0) {
        <div class="field">
          <label for="f-assignee">Assignee</label>
          <select id="f-assignee" class="select" formControlName="assignedToId">
            <option [ngValue]="null">Anyone</option>
            @for (u of assignees(); track u.id) { <option [ngValue]="u.id">{{ u.fullName }}</option> }
          </select>
        </div>
      }
      <div class="field">
        <button type="button" class="btn btn-ghost" (click)="reset()">Clear filters</button>
      </div>
    </form>
  `,
  styles: ['.search{grid-column:span 2} @media (max-width:640px){.search{grid-column:auto}}']
})
export class TaskFiltersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly value = input<TaskFilter>({});
  readonly teams = input<Team[]>([]);
  readonly assignees = input<User[]>([]);
  readonly showSearch = input(false);
  readonly changed = output<TaskFilter>();

  protected readonly statuses = STATUSES;
  protected readonly priorities = PRIORITIES;
  protected readonly deadlines = DEADLINES;

  protected readonly form = this.fb.group({
    search: [null as string | null],
    status: [null as TaskStatus | null],
    priority: [null as TaskPriority | null],
    deadline: [null as DeadlineFilter | null],
    dueFrom: [null as string | null],
    dueTo: [null as string | null],
    teamId: [null as number | null],
    assignedToId: [null as number | null]
  });

  ngOnInit(): void {
    const v = this.value();
    this.form.patchValue({
      search: v.search ?? null,
      status: v.status ?? null,
      priority: v.priority ?? null,
      deadline: v.deadline ?? null,
      dueFrom: v.dueFrom ?? null,
      dueTo: v.dueTo ?? null,
      teamId: v.teamId ?? null,
      assignedToId: v.assignedToId ?? null
    }, { emitEvent: false });

    this.form.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((v) => this.changed.emit({ ...v, search: v.search?.trim() || null }));
  }

  reset(): void {
    this.form.reset();
  }
}
