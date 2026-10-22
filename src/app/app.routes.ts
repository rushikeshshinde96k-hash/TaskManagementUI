import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guards';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Sign in · TaskFlow',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    title: 'Create account · TaskFlow',
    loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard · TaskFlow',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'tasks',
        title: 'Tasks · TaskFlow',
        loadComponent: () => import('./features/tasks/task-list.component').then((m) => m.TaskListComponent)
      },
      {
        path: 'tasks/:id',
        title: 'Task · TaskFlow',
        loadComponent: () => import('./features/tasks/task-detail.component').then((m) => m.TaskDetailComponent)
      },
      {
        path: 'teams',
        title: 'Teams · TaskFlow',
        loadComponent: () => import('./features/teams/team-list.component').then((m) => m.TeamListComponent)
      },
      {
        path: 'teams/:id',
        title: 'Team · TaskFlow',
        loadComponent: () => import('./features/teams/team-detail.component').then((m) => m.TeamDetailComponent)
      },
      {
        path: 'users',
        title: 'Users · TaskFlow',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./features/users/user-list.component').then((m) => m.UserListComponent)
      },
      {
        path: 'notifications',
        title: 'Notifications · TaskFlow',
        loadComponent: () => import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent)
      },
      {
        path: 'profile',
        title: 'Profile · TaskFlow',
        loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
