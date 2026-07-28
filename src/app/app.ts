import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('BeyadAmi');
  readonly sidebarOpen = signal(true);

  readonly menuItems = [
    { label: 'סניפים', route: '/branches', icon: 'pi pi-building' },
    { label: 'חנויות', route: '/stores', icon: 'pi pi-shop' },
    { label: 'קטגוריות מכשירים', route: '/device-categories', icon: 'pi pi-tags' },
    { label: 'בקשות סניפים', route: '/branch-requests', icon: 'pi pi-file' },
    { label: 'מכשירים', route: '/devices', icon: 'pi pi-mobile' },
    { label: 'השאלות', route: '/loans', icon: 'pi pi-arrow-right-arrow-left' },
    { label: 'רכישות', route: '/purchases', icon: 'pi pi-shopping-cart' },
  ];

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }
}
