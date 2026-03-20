import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { ListComponent } from './pages/list/list';
import { SettingsComponent } from './pages/settings/settings';
import { OnboardingComponent } from './pages/onboarding/onboarding';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'list', component: ListComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'onboarding', component: OnboardingComponent },
];
