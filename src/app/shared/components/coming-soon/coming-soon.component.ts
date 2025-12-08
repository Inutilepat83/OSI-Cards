import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideIconsModule } from '../../icons/lucide-icons.module';

/**
 * Configuration for coming soon page content
 */
export interface ComingSoonConfig {
  /** Page title */
  title: string;
  /** Subtitle shown below title */
  subtitle: string;
  /** Icon name from Lucide icons */
  icon: string;
  /** Description of what's coming */
  description: string;
}

/**
 * Reusable "Coming Soon" placeholder component
 *
 * Used for pages that are under development to provide consistent
 * messaging and styling across the application.
 *
 * @example
 * ```html
 * <app-coming-soon [config]="{
 *   title: 'About',
 *   subtitle: 'Learn more about OSI Cards',
 *   icon: 'info',
 *   description: 'This page is under development. Check back soon for information about our mission and team.'
 * }"></app-coming-soon>
 * ```
 */
@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>{{ config.title }}</h1>
        <p class="page-subtitle">{{ config.subtitle }}</p>
      </div>

      <div class="page-content">
        <div class="coming-soon">
          <lucide-icon [name]="config.icon" [size]="48"></lucide-icon>
          <h2>Coming Soon</h2>
          <p>{{ config.description }}</p>
          <a routerLink="/" class="back-link">
            <lucide-icon name="arrow-left" [size]="16"></lucide-icon>
            Back to Home
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .page-container {
        min-height: 100vh;
        padding: 2rem;
        background: var(--osi-background, #0f0f0f);
        color: var(--osi-text, #fff);
      }

      .page-header {
        text-align: center;
        margin-bottom: 3rem;
      }

      .page-header h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }

      .page-subtitle {
        font-size: 1.125rem;
        opacity: 0.7;
      }

      .page-content {
        max-width: 600px;
        margin: 0 auto;
      }

      .coming-soon {
        text-align: center;
        padding: 3rem;
        background: var(--osi-card-background, rgba(255, 255, 255, 0.05));
        border-radius: 1rem;
        border: 1px solid var(--osi-border, rgba(255, 255, 255, 0.1));
      }

      .coming-soon lucide-icon {
        color: var(--osi-primary, #ff7900);
        margin-bottom: 1.5rem;
      }

      .coming-soon h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
      }

      .coming-soon p {
        opacity: 0.8;
        margin-bottom: 2rem;
        line-height: 1.6;
      }

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--osi-primary, #ff7900);
        text-decoration: none;
        font-weight: 500;
        transition: opacity 0.2s ease;
      }

      .back-link:hover {
        opacity: 0.8;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComingSoonComponent {
  @Input({ required: true }) config!: ComingSoonConfig;
}



