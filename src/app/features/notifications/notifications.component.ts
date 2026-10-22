import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppNotification, NotificationType } from '../../core/models/models';
import { NotificationApiService } from '../../core/services/api.services';
import { NotificationStore } from '../../core/services/notification-store.service';
import { IconComponent } from '../../shared/components/icon.component';

const TYPE_ICON: Record<NotificationType, string> = {
  TaskAssigned: 'tasks',
  TaskStatusChanged: 'check',
  TaskCommented: 'comment',
  TeamMembership: 'teams'
};

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page narrow">
      <div class="page-header">
        <div>
          <h1>Notifications</h1>
          <p>Task assignments, status updates and comments. An email copy is sent for each one (or logged by the mock mailer).</p>
        </div>
        <div class="row">
          <div class="segmented" role="group" aria-label="Show">
            <button type="button" [attr.aria-pressed]="!unreadOnly()" (click)="setUnread(false)">All</button>
            <button type="button" [attr.aria-pressed]="unreadOnly()" (click)="setUnread(true)">Unread</button>
          </div>
          <button type="button" class="btn" (click)="markAll()" [disabled]="store.unread() === 0">Mark all read</button>
        </div>
      </div>

      <section class="card">
        @if (loading()) {
          <div class="spinner" role="status" aria-label="Loading notifications"></div>
        } @else {
          @for (n of items(); track n.id) {
            <button type="button" class="item" [class.unread]="!n.isRead" (click)="open(n)">
              <span class="item-icon" aria-hidden="true"><app-icon [name]="icon(n.type)" [size]="16" /></span>
              <span class="item-body">
                <strong>{{ n.title }}</strong>
                <span class="msg">{{ n.message }}</span>
                <span class="small muted">
                  {{ n.createdAt | date: 'MMM d, y, h:mm a' }}
                  @if (n.emailSent) { · <app-icon name="mail" [size]="12" /> emailed }
                </span>
              </span>
              @if (!n.isRead) { <span class="dot" aria-label="Unread"></span> }
            </button>
          } @empty {
            <div class="empty"><h3>No notifications</h3><p>You're all caught up.</p></div>
          }
        }
      </section>
    </div>
  `,
  styles: [`
    .narrow { max-width: 860px; }
    .item { display: flex; gap: 12px; align-items: flex-start; width: 100%; padding: 14px 20px; border: none; border-bottom: 1px solid var(--border); background: none; font: inherit; color: inherit; text-align: left; cursor: pointer; }
    .item:last-child { border-bottom: none; }
    .item:hover { background: var(--surface-2); }
    .item.unread { background: #f8f9ff; }
    .item-icon { display: inline-flex; padding: 8px; border-radius: 50%; background: var(--primary-50); color: var(--primary); }
    .item-body { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .msg { color: var(--text-2); }
    .small app-icon { vertical-align: -2px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary); margin-top: 8px; }
  `]
})
export class NotificationsComponent implements OnInit {
  private readonly api = inject(NotificationApiService);
  private readonly router = inject(Router);
  protected readonly store = inject(NotificationStore);

  protected readonly items = signal<AppNotification[]>([]);
  protected readonly loading = signal(true);
  protected readonly unreadOnly = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list(this.unreadOnly(), 100).subscribe({
      next: (n) => { this.items.set(n); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  setUnread(v: boolean): void {
    this.unreadOnly.set(v);
    this.load();
  }

  icon(type: NotificationType): string {
    return TYPE_ICON[type] ?? 'bell';
  }

  open(n: AppNotification): void {
    if (!n.isRead) {
      this.api.markRead(n.id).subscribe(() => {
        this.items.update((list) => list.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
        this.store.refresh();
      });
    }
    if (n.taskId) this.router.navigate(['/tasks', n.taskId]);
  }

  markAll(): void {
    this.api.markAllRead().subscribe(() => {
      this.items.update((list) => list.map((x) => ({ ...x, isRead: true })));
      this.store.unread.set(0);
    });
  }
}
