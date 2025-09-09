import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="about-container">
      <h1>About OSI Cards</h1>
      <p>Advanced AI-powered card management platform</p>
    </div>
  `,
  styles: [`
    .about-container {
      padding: 20px;
    }
  `]
})
export class AboutComponent {

}
