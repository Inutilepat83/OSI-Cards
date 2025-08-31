import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <app-global-error-boundary>
      <div class="app-container">
        <router-outlet></router-outlet>
        <app-offline-indicator></app-offline-indicator>
      </div>
    </app-global-error-boundary>
  `,
  styles: [
    `
      .app-container {
        min-height: 100vh;
        width: 100%;
        background-color: var(--bg-color);
        color: var(--text-color);
      }
    `,
  ],
})
export class AppComponent {
  title = 'OSI Cards';
}
