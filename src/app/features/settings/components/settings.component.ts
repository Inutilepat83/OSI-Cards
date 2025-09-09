import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-container">
      <h1>Settings</h1>
      <p>Application settings coming soon...</p>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 20px;
    }
  `]
})
export class SettingsComponent {

}
