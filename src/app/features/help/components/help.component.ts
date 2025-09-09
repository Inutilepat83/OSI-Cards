import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="help-container">
      <h1>Help & Documentation</h1>
      <p>Help documentation coming soon...</p>
    </div>
  `,
  styles: [`
    .help-container {
      padding: 20px;
    }
  `]
})
export class HelpComponent {

}
