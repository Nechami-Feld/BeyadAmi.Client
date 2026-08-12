import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { BranchesComponent } from './pages/branches/branches.component';
import { StoresComponent } from './pages/stores/stores.component';
import { DeviceCategoriesComponent } from './pages/device-categories/device-categories.component';
import { BranchRequestsComponent } from './pages/branch-requests/branch-requests.component';
import { DevicesComponent } from './pages/devices/devices.component';
import { LoansComponent } from './pages/loans/loans.component';
import { PurchasesComponent } from './pages/purchases/purchases.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'branches', component: BranchesComponent, canActivate: [authGuard] },
  { path: 'stores', component: StoresComponent, canActivate: [authGuard] },
  { path: 'device-categories', component: DeviceCategoriesComponent, canActivate: [authGuard] },
  { path: 'branch-requests', component: BranchRequestsComponent, canActivate: [authGuard] },
  { path: 'devices', component: DevicesComponent, canActivate: [authGuard] },
  { path: 'loans', component: LoansComponent, canActivate: [authGuard] },
  { path: 'purchases', component: PurchasesComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/branches', pathMatch: 'full' }
];
