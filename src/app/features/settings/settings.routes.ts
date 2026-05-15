import { Routes } from '@angular/router';
import { SettingsComponent } from './pages/settings/settings.component';
import { authGuard } from '../../core/guards/auth.guard';

export const settingsRoutes: Routes = [
  {
    path: '',
    component: SettingsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    component: SettingsComponent,
    canActivate: [authGuard],
  },
];

