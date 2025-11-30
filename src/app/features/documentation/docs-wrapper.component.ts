import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { 
  NgDocRootComponent, 
  NgDocNavbarComponent, 
  NgDocSidebarComponent,
  NgDocThemeToggleComponent
} from '@ng-doc/app';

/**
 * Wrapper component for ng-doc documentation
 * Provides the root layout for ng-doc pages with navbar, sidebar, and content area
 * 
 * NgDoc providers are already configured at the app level in app.config.ts
 */
@Component({
  selector: 'app-docs-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    NgDocRootComponent,
    NgDocNavbarComponent,
    NgDocSidebarComponent,
    NgDocThemeToggleComponent
  ],
  template: `
    <ng-doc-root>
      <ng-doc-navbar>
        <ng-doc-theme-toggle />
      </ng-doc-navbar>
      <ng-doc-sidebar></ng-doc-sidebar>
      <router-outlet></router-outlet>
    </ng-doc-root>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 100vh;
    }
    
    ng-doc-root {
      min-height: 100vh;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsWrapperComponent {}
