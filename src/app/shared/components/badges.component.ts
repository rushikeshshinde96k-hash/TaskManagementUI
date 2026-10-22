import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TaskPriority, TaskStatus, UserRole } from '../../core/models/models';
import { initials, statusLabel } from '../../core/utils/labels';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="'badge status-' + status()"><span class="dot"></span>{{ label() }}</span>`
})
export class StatusBadgeComponent {
  readonly status = input.required<TaskStatus>();
  protected readonly label = computed(() => statusLabel(this.status()));
}

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="'badge priority-' + priority()">{{ priority() }}</span>`
})
export class PriorityBadgeComponent {
  readonly priority = input.required<TaskPriority>();
}

@Component({
  selector: 'app-role-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="'badge role-' + role()">{{ role() }}</span>`
})
export class RoleBadgeComponent {
  readonly role = input.required<UserRole>();
}

@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="avatar" [class.avatar-sm]="small()" [attr.title]="name()" aria-hidden="true">{{ text() }}</span>`
})
export class AvatarComponent {
  readonly name = input<string | null | undefined>('');
  readonly small = input(false);
  protected readonly text = computed(() => initials(this.name()));
}
