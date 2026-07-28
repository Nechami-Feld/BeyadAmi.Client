import { Routes } from '@angular/router';
import { BranchesComponent } from './pages/branches/branches.component';
import { StoresComponent } from './pages/stores/stores.component';

export const routes: Routes = [
  { path: 'branches', component: BranchesComponent },
  { path: 'stores', component: StoresComponent },
  { path: '', redirectTo: '/stores', pathMatch: 'full' }
];
