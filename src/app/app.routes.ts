import { Routes } from '@angular/router';
import { BranchesComponent } from './pages/branches/branches.component';
import { StoresComponent } from './pages/stores/stores.component';
import { DeviceCategoriesComponent } from './pages/device-categories/device-categories.component';
import { BranchRequestsComponent } from './pages/branch-requests/branch-requests.component';

export const routes: Routes = [
  { path: 'branches', component: BranchesComponent },
  { path: 'stores', component: StoresComponent },
  { path: 'device-categories', component: DeviceCategoriesComponent },
  { path: 'branch-requests', component: BranchRequestsComponent },
  { path: '', redirectTo: '/stores', pathMatch: 'full' }
];
