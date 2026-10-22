import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Comment, Task, TaskStatus } from '../../core/models/models';
import { TaskService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';
import { STATUSES, statusLabel } from '../../core/utils/labels';
import { canChangeStatus, canManageTask } from '../../core/utils/permissions';
import { AvatarComponent, PriorityBadgeComponent, RoleBadgeComponent, StatusBadgeComponent } from '../../shared/components/badges.component';
import { IconComponent } from '../../shared/components/icon.component';
import { TaskFormComponent } from './task-form.component';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [
    DatePipe, FormsModule, RouterLink, IconComponent, StatusBadgeComponent, PriorityBadgeComponent,
    AvatarComponent, RoleBadgeComponent, TaskFormComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.css'
})
export class TaskDetailComponent {
  /** Route param bound via withComponentInputBinding(). */
  readonly id = input.required<string>();

  private readonly tasksApi = inject(TaskService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly statuses = STATUSES;
  protected readonly task = signal<Task | null>(null);
  protected readonly comments = signal<Comment[]>([]);
  protected readonly notFound = signal(false);
  protected readonly editing = signal(false);
  protected readonly newComment = signal('');
  protected readonly posting = signal(false);
  protected readonly editingCommentId = signal<number | null>(null);
  protected readonly editText = signal('');

  protected readonly canManage = computed(() => { const t = this.task(); return !!t && canManageTask(t, this.auth.user()); });
  protected readonly canStatus = computed(() => { const t = this.task(); return !!t && canChangeStatus(t, this.auth.user()); });

  constructor() {
    // Reload when navigating between tasks (e.g. from a notification) while this component is reused.
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.load(id));
    });
  }

  load(id: number): void {
    this.task.set(null);
    this.notFound.set(false);
    this.editing.set(false);
    this.tasksApi.get(id).subscribe({
      next: (t) => this.task.set(t),
      error: () => this.notFound.set(true)
    });
    this.tasksApi.comments(id).subscribe({ next: (c) => this.comments.set(c), error: () => {} });
  }

  setStatus(status: TaskStatus): void {
    const t = this.task();
    if (!t || t.status === status) return;
    this.tasksApi.updateStatus(t.id, status).subscribe((updated) => {
      this.task.set(updated);
      this.toast.success(`Status changed to ${statusLabel(status)}.`);
    });
  }

  onSaved(updated: Task): void {
    this.task.set(updated);
    this.editing.set(false);
  }

  async remove(): Promise<void> {
    const t = this.task();
    if (!t) return;
    const ok = await this.confirm.ask({
      title: 'Delete task?',
      message: `"${t.title}" and its comments will be permanently deleted.`,
      confirmText: 'Delete',
      danger: true
    });
    if (!ok) return;
    this.tasksApi.delete(t.id).subscribe(() => {
      this.toast.success('Task deleted.');
      this.router.navigate(['/tasks']);
    });
  }

  postComment(): void {
    const t = this.task();
    const content = this.newComment().trim();
    if (!t || !content) return;
    this.posting.set(true);
    this.tasksApi.addComment(t.id, content).subscribe({
      next: (c) => {
        this.comments.update((list) => [...list, c]);
        this.task.update((x) => x && { ...x, commentCount: x.commentCount + 1 });
        this.newComment.set('');
        this.posting.set(false);
      },
      error: () => this.posting.set(false)
    });
  }

  startEdit(c: Comment): void {
    this.editingCommentId.set(c.id);
    this.editText.set(c.content);
  }

  saveEdit(c: Comment): void {
    const content = this.editText().trim();
    if (!content) return;
    this.tasksApi.updateComment(c.taskId, c.id, content).subscribe((updated) => {
      this.comments.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
      this.editingCommentId.set(null);
    });
  }

  async deleteComment(c: Comment): Promise<void> {
    const ok = await this.confirm.ask({ title: 'Delete comment?', message: 'This cannot be undone.', confirmText: 'Delete', danger: true });
    if (!ok) return;
    this.tasksApi.deleteComment(c.taskId, c.id).subscribe(() => {
      this.comments.update((list) => list.filter((x) => x.id !== c.id));
      this.task.update((x) => x && { ...x, commentCount: Math.max(0, x.commentCount - 1) });
    });
  }

  canDeleteComment(c: Comment): boolean {
    return c.userId === this.auth.user()?.id || this.auth.isAdmin();
  }
}
