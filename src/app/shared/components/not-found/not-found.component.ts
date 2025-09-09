import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="not-found-container">
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a routerLink="/">Go Home</a>
    </div>
  `,
  styles: [`
    .not-found-container {
      padding: 20px;
      text-align: center;
    }
  `]
})
export class NotFoundComponent {

}
