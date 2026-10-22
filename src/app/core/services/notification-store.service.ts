import { Injectable, inject, signal } from '@angular/core';
import { Subscription, interval, startWith, switchMap, catchError, of } from 'rxjs';
import { NotificationApiService } from './api.services';

const POLL_MS = 30_000;

/** Keeps the unread-notification badge up to date while the user is signed in. */
@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly api = inject(NotificationApiService);
  private sub?: Subscription;

  readonly unread = signal(0);

  start(): void {
    this.stop();
    this.sub = interval(POLL_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.api.unreadCount().pipe(catchError(() => of(null))))
      )
      .subscribe((r) => r && this.unread.set(r.count));
  }

  stop(): void {
    this.sub?.unsubscribe();
  }

  refresh(): void {
    this.api.unreadCount().subscribe({ next: (r) => this.unread.set(r.count), error: () => {} });
  }
}
