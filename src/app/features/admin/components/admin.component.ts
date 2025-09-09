import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-container">
      <h1>Administration Panel</h1>
      <p>Admin functionality coming soon...</p>
    </div>
  `,
  styles: [`
    .admin-container {
      padding: 20px;
    }
  `]
})
export class AdminComponent {

}
