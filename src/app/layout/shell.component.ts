import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AppNotification, UserRole } from '../core/models/models';
import { NotificationApiService } from '../core/services/api.services';
import { AuthService } from '../core/services/auth.service';
import { NotificationStore } from '../core/services/notification-store.service';
import { AvatarComponent, RoleBadgeComponent } from '../shared/components/badges.component';
import { IconComponent } from '../shared/components/icon.component';

interface NavItem { path: string; label: string; icon: string; roles?: UserRole[] }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, AvatarComponent, RoleBadgeComponent, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  protected readonly store = inject(NotificationStore);
  private readonly notificationsApi = inject(NotificationApiService);
  private readonly router = inject(Router);

  protected readonly sidebarOpen = signal(false);
  protected readonly bellOpen = signal(false);
  protected readonly recent = signal<AppNotification[]>([]);

  private readonly nav: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/tasks', label: 'Tasks', icon: 'tasks' },
    { path: '/teams', label: 'Teams', icon: 'teams' },
    { path: '/users', label: 'Users', icon: 'users', roles: ['Admin'] },
    { path: '/notifications', label: 'Notifications', icon: 'bell' }
  ];

  protected readonly navItems = computed(() =>
    this.nav.filter((n) => !n.roles || this.auth.hasRole(...n.roles))
  );

  ngOnInit(): void {
    this.store.start();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.sidebarOpen.set(false);
      this.bellOpen.set(false);
    });
  }

  ngOnDestroy(): void {
    this.store.stop();
  }

  toggleBell(event: Event): void {
    event.stopPropagation();
    const open = !this.bellOpen();
    this.bellOpen.set(open);
    if (open) this.notificationsApi.list(false, 6).subscribe((n) => this.recent.set(n));
  }

  openNotification(n: AppNotification): void {
    if (!n.isRead) {
      this.notificationsApi.markRead(n.id).subscribe(() => this.store.refresh());
    }
    this.bellOpen.set(false);
    if (n.taskId) this.router.navigate(['/tasks', n.taskId]);
  }

  markAllRead(): void {
    this.notificationsApi.markAllRead().subscribe(() => {
      this.recent.update((list) => list.map((n) => ({ ...n, isRead: true })));
      this.store.unread.set(0);
    });
  }

  @HostListener('document:click')
  closeMenus(): void {
    this.bellOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.bellOpen.set(false);
    this.sidebarOpen.set(false);
  }
}
