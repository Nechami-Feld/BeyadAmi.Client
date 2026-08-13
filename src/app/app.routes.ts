import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized.component';
import { BranchesComponent } from './pages/branches/branches.component';
import { StoresComponent } from './pages/stores/stores.component';
import { DeviceCategoriesComponent } from './pages/device-categories/device-categories.component';
import { BranchRequestsComponent } from './pages/branch-requests/branch-requests.component';
import { DevicesComponent } from './pages/devices/devices.component';
import { LoansComponent } from './pages/loans/loans.component';
import { PurchasesComponent } from './pages/purchases/purchases.component';
import { ProductsComponent } from './pages/products/products.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: 'branches', component: BranchesComponent, canActivate: [authGuard] },
  { path: 'stores', component: StoresComponent, canActivate: [authGuard] },
  { path: 'device-categories', component: DeviceCategoriesComponent, canActivate: [authGuard] },
  { path: 'branch-requests', component: BranchRequestsComponent, canActivate: [authGuard] },
  { path: 'devices', component: DevicesComponent, canActivate: [authGuard] },
  { path: 'loans', component: LoansComponent, canActivate: [authGuard] },
  { path: 'purchases', component: PurchasesComponent, canActivate: [authGuard] },
  { path: 'products', component: ProductsComponent, canActivate: [authGuard] },
  { path: 'admin', canActivate: [authGuard, adminGuard], children: [
    { path: 'users', redirectTo: '/branches', pathMatch: 'full' },
    { path: '', redirectTo: '/branches', pathMatch: 'full' }
  ] },
  { path: '', redirectTo: '/branches', pathMatch: 'full' }
];
