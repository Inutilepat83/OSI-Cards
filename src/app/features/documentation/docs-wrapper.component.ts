import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { NgDocRootComponent, NgDocNavbarComponent, NgDocSidebarComponent, provideNgDocApp } from '@ng-doc/app';

/**
 * Wrapper component for ng-doc documentation
 * Provides the root layout for ng-doc pages with navbar, sidebar, and content area
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
    NgDocSidebarComponent
  ],
  providers: [
    // Provide ng-doc app functionality only for documentation routes
    provideNgDocApp()
  ],
  template: `
    <ng-doc-root>
      <ng-doc-navbar></ng-doc-navbar>
      <ng-doc-sidebar></ng-doc-sidebar>
      <router-outlet></router-outlet>
    </ng-doc-root>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class DocsWrapperComponent {}

