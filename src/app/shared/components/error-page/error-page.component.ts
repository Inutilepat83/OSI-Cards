import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="error-container">
      <h1>An Error Occurred</h1>
      <p>Something went wrong. Please try again later.</p>
      <a routerLink="/">Go Home</a>
    </div>
  `,
  styles: [`
    .error-container {
      padding: 20px;
      text-align: center;
    }
  `]
})
export class ErrorPageComponent {

}
