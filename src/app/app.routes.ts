import { Routes } from '@angular/router';
import { BranchesComponent } from './pages/branches/branches.component';

export const routes: Routes = [
  { path: 'branches', component: BranchesComponent },
  { path: '', redirectTo: '/branches', pathMatch: 'full' }
];
