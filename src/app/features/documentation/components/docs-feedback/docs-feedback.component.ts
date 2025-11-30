import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';

/**
 * Feedback & Community Components
 * Implements D21-D25 from the 100-point plan:
 * - D96: Page rating widget ("Was this helpful?")
 * - D97: Edit on GitHub link
 * - D98: Issue reporting
 * - D99: Community links (Discord, discussions)
 * - D100: Contribution guide link
 */

// =============================================================================
// D96: PAGE RATING WIDGET
// =============================================================================

@Component({
  selector: 'app-docs-page-rating',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideIconsModule],
  template: `
    <div class="page-rating" [class.submitted]="submitted()">
      @if (!submitted()) {
        <p class="rating-question">{{ question }}</p>
        <div class="rating-buttons">
          <button 
            class="rating-btn"
            [class.selected]="rating() === 'yes'"
            (click)="rate('yes')"
          >
            <lucide-icon name="thumbs-up" [size]="18"></lucide-icon>
            Yes
          </button>
          <button 
            class="rating-btn"
            [class.selected]="rating() === 'no'"
            (click)="rate('no')"
          >
            <lucide-icon name="thumbs-down" [size]="18"></lucide-icon>
            No
          </button>
        </div>
        
        @if (rating() === 'no' && showFeedbackForm()) {
          <div class="feedback-form">
            <label class="form-label">What could we improve?</label>
            <textarea 
              class="form-textarea"
              [value]="feedbackText()"
              (input)="onFeedbackInput($event)"
              placeholder="Tell us how we can make this page better..."
              rows="3"
            ></textarea>
            <div class="form-actions">
              <button class="cancel-btn" (click)="cancel()">Cancel</button>
              <button class="submit-btn" (click)="submitFeedback()">Submit</button>
            </div>
          </div>
        }
      } @else {
        <div class="rating-thanks">
          <lucide-icon name="check-circle" [size]="24"></lucide-icon>
          <span>{{ thankYouMessage }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-rating {
      margin: 2rem 0;
      padding: 1.5rem;
      background: var(--docs-bg-secondary, #f4f6f9);
      border-radius: var(--docs-radius-xl, 16px);
      text-align: center;
      
      &.submitted {
        padding: 1rem 1.5rem;
      }
    }
    
    .rating-question {
      margin: 0 0 1rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--docs-text, #1a1d23);
    }
    
    .rating-buttons {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
    }
    
    .rating-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--docs-text-secondary, #4a5568);
      background: var(--docs-surface, #fff);
      border: 1px solid var(--docs-border, #e2e8f0);
      border-radius: var(--docs-radius-full, 9999px);
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: var(--docs-primary, #ff7900);
        color: var(--docs-primary, #ff7900);
        transform: translateY(-2px);
        box-shadow: var(--docs-shadow-md, 0 4px 12px rgba(0,0,0,0.08));
      }
      
      &.selected {
        background: var(--docs-primary, #ff7900);
        border-color: var(--docs-primary, #ff7900);
        color: white;
      }
    }
    
    .feedback-form {
      margin-top: 1.25rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--docs-border, #e2e8f0);
      text-align: left;
      animation: slideDown 0.2s ease;
    }
    
    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--docs-text, #1a1d23);
    }
    
    .form-textarea {
      width: 100%;
      padding: 0.75rem;
      font-family: inherit;
      font-size: 0.875rem;
      color: var(--docs-text, #1a1d23);
      background: var(--docs-surface, #fff);
      border: 1px solid var(--docs-border, #e2e8f0);
      border-radius: var(--docs-radius-md, 8px);
      resize: vertical;
      
      &:focus {
        outline: none;
        border-color: var(--docs-primary, #ff7900);
        box-shadow: 0 0 0 3px var(--docs-primary-bg, rgba(255,121,0,0.06));
      }
      
      &::placeholder {
        color: var(--docs-text-muted, #8891a4);
      }
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
    
    .cancel-btn,
    .submit-btn {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: var(--docs-radius, 6px);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .cancel-btn {
      color: var(--docs-text-secondary, #4a5568);
      background: transparent;
      border: 1px solid var(--docs-border, #e2e8f0);
      
      &:hover {
        background: var(--docs-bg-tertiary, #eef1f5);
      }
    }
    
    .submit-btn {
      color: white;
      background: var(--docs-primary, #ff7900);
      border: 1px solid var(--docs-primary, #ff7900);
      
      &:hover {
        background: var(--docs-primary-dark, #e56d00);
      }
    }
    
    .rating-thanks {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      color: var(--docs-tip-text, #047857);
      font-size: 0.9375rem;
      font-weight: 500;
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsPageRatingComponent {
  @Input() question = 'Was this page helpful?';
  @Input() thankYouMessage = 'Thanks for your feedback!';
  @Input() pagePath?: string;
  
  @Output() ratingSubmitted = new EventEmitter<{ rating: string; feedback?: string; path?: string }>();
  
  rating = signal<'yes' | 'no' | null>(null);
  showFeedbackForm = signal(false);
  feedbackText = signal('');
  submitted = signal(false);
  
  rate(value: 'yes' | 'no') {
    this.rating.set(value);
    
    if (value === 'yes') {
      this.submitRating();
    } else {
      this.showFeedbackForm.set(true);
    }
  }
  
  onFeedbackInput(event: Event) {
    this.feedbackText.set((event.target as HTMLTextAreaElement).value);
  }
  
  cancel() {
    this.rating.set(null);
    this.showFeedbackForm.set(false);
    this.feedbackText.set('');
  }
  
  submitFeedback() {
    this.submitRating(this.feedbackText());
  }
  
  private submitRating(feedback?: string) {
    this.ratingSubmitted.emit({
      rating: this.rating()!,
      feedback,
      path: this.pagePath
    });
    this.submitted.set(true);
  }
}

// =============================================================================
// D97-D100: PAGE ACTIONS (Edit, Report, Community)
// =============================================================================

@Component({
  selector: 'app-docs-page-actions',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="page-actions">
      <!-- D97: Edit on GitHub -->
      @if (editUrl) {
        <a [href]="editUrl" target="_blank" rel="noopener noreferrer" class="action-link">
          <lucide-icon name="edit" [size]="16"></lucide-icon>
          <span>Edit this page</span>
        </a>
      }
      
      <!-- D98: Report Issue -->
      @if (issueUrl) {
        <a [href]="issueUrl" target="_blank" rel="noopener noreferrer" class="action-link">
          <lucide-icon name="bug" [size]="16"></lucide-icon>
          <span>Report an issue</span>
        </a>
      }
      
      <!-- View Source -->
      @if (sourceUrl) {
        <a [href]="sourceUrl" target="_blank" rel="noopener noreferrer" class="action-link">
          <lucide-icon name="code" [size]="16"></lucide-icon>
          <span>View source</span>
        </a>
      }
    </div>
  `,
  styles: [`
    .page-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1.5rem;
      margin: 2rem 0;
      padding: 1rem 0;
      border-top: 1px solid var(--docs-border, #e2e8f0);
    }
    
    .action-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--docs-text-muted, #8891a4);
      text-decoration: none;
      transition: color 0.15s ease;
      
      &:hover {
        color: var(--docs-primary, #ff7900);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsPageActionsComponent {
  @Input() editUrl?: string;
  @Input() issueUrl?: string;
  @Input() sourceUrl?: string;
}

// =============================================================================
// D99: COMMUNITY LINKS
// =============================================================================

@Component({
  selector: 'app-docs-community-links',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="community-links">
      <h4 class="community-title">
        <lucide-icon name="users" [size]="18"></lucide-icon>
        {{ title || 'Join the Community' }}
      </h4>
      <p class="community-desc">{{ description || 'Get help, share ideas, and connect with other developers.' }}</p>
      
      <div class="community-cards">
        @if (githubUrl) {
          <a [href]="githubUrl" target="_blank" rel="noopener noreferrer" class="community-card github">
            <lucide-icon name="github" [size]="24"></lucide-icon>
            <div class="card-content">
              <span class="card-title">GitHub</span>
              <span class="card-desc">Star us on GitHub</span>
            </div>
          </a>
        }
        
        @if (discordUrl) {
          <a [href]="discordUrl" target="_blank" rel="noopener noreferrer" class="community-card discord">
            <lucide-icon name="message-circle" [size]="24"></lucide-icon>
            <div class="card-content">
              <span class="card-title">Discord</span>
              <span class="card-desc">Join our server</span>
            </div>
          </a>
        }
        
        @if (discussionsUrl) {
          <a [href]="discussionsUrl" target="_blank" rel="noopener noreferrer" class="community-card discussions">
            <lucide-icon name="messages-square" [size]="24"></lucide-icon>
            <div class="card-content">
              <span class="card-title">Discussions</span>
              <span class="card-desc">Ask questions</span>
            </div>
          </a>
        }
        
        @if (twitterUrl) {
          <a [href]="twitterUrl" target="_blank" rel="noopener noreferrer" class="community-card twitter">
            <lucide-icon name="twitter" [size]="24"></lucide-icon>
            <div class="card-content">
              <span class="card-title">Twitter</span>
              <span class="card-desc">Follow for updates</span>
            </div>
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .community-links {
      margin: 2rem 0;
      padding: 1.5rem;
      background: var(--docs-bg-secondary, #f4f6f9);
      border-radius: var(--docs-radius-xl, 16px);
    }
    
    .community-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--docs-text, #1a1d23);
    }
    
    .community-desc {
      margin: 0 0 1.25rem;
      font-size: 0.875rem;
      color: var(--docs-text-secondary, #4a5568);
    }
    
    .community-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.75rem;
    }
    
    .community-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: var(--docs-surface, #fff);
      border: 1px solid var(--docs-border, #e2e8f0);
      border-radius: var(--docs-radius-lg, 12px);
      text-decoration: none;
      transition: all 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--docs-shadow-md, 0 4px 12px rgba(0,0,0,0.08));
      }
      
      &.github:hover {
        border-color: #24292f;
        color: #24292f;
      }
      
      &.discord:hover {
        border-color: #5865f2;
        color: #5865f2;
      }
      
      &.discussions:hover {
        border-color: var(--docs-primary, #ff7900);
        color: var(--docs-primary, #ff7900);
      }
      
      &.twitter:hover {
        border-color: #1da1f2;
        color: #1da1f2;
      }
    }
    
    .card-content {
      display: flex;
      flex-direction: column;
    }
    
    .card-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--docs-text, #1a1d23);
    }
    
    .card-desc {
      font-size: 0.75rem;
      color: var(--docs-text-muted, #8891a4);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsCommunityLinksComponent {
  @Input() title?: string;
  @Input() description?: string;
  @Input() githubUrl?: string;
  @Input() discordUrl?: string;
  @Input() discussionsUrl?: string;
  @Input() twitterUrl?: string;
}

// =============================================================================
// D100: CONTRIBUTION GUIDE
// =============================================================================

@Component({
  selector: 'app-docs-contribute',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="contribute-section">
      <div class="contribute-header">
        <lucide-icon name="heart" [size]="24" class="heart-icon"></lucide-icon>
        <h4>{{ title || 'Contribute to OSI Cards' }}</h4>
      </div>
      <p class="contribute-desc">
        {{ description || 'OSI Cards is open source and we welcome contributions! Whether it\'s fixing bugs, improving documentation, or adding new features.' }}
      </p>
      <div class="contribute-actions">
        @if (contributingUrl) {
          <a [href]="contributingUrl" target="_blank" rel="noopener noreferrer" class="contribute-btn primary">
            <lucide-icon name="book-open" [size]="16"></lucide-icon>
            Read Contributing Guide
          </a>
        }
        @if (issuesUrl) {
          <a [href]="issuesUrl" target="_blank" rel="noopener noreferrer" class="contribute-btn">
            <lucide-icon name="check-square" [size]="16"></lucide-icon>
            Good First Issues
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .contribute-section {
      margin: 2rem 0;
      padding: 1.5rem;
      background: linear-gradient(135deg, var(--docs-primary-bg, rgba(255,121,0,0.06)) 0%, rgba(255,87,34,0.04) 100%);
      border: 1px solid var(--docs-primary, #ff7900);
      border-radius: var(--docs-radius-xl, 16px);
    }
    
    .contribute-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      
      h4 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--docs-text, #1a1d23);
      }
    }
    
    .heart-icon {
      color: var(--docs-primary, #ff7900);
    }
    
    .contribute-desc {
      margin: 0 0 1.25rem;
      font-size: 0.875rem;
      color: var(--docs-text-secondary, #4a5568);
      line-height: 1.6;
    }
    
    .contribute-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    
    .contribute-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--docs-primary, #ff7900);
      background: var(--docs-surface, #fff);
      border: 1px solid var(--docs-primary, #ff7900);
      border-radius: var(--docs-radius, 6px);
      text-decoration: none;
      transition: all 0.15s ease;
      
      &:hover {
        background: var(--docs-primary, #ff7900);
        color: white;
      }
      
      &.primary {
        background: var(--docs-primary, #ff7900);
        color: white;
        
        &:hover {
          background: var(--docs-primary-dark, #e56d00);
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsContributeComponent {
  @Input() title?: string;
  @Input() description?: string;
  @Input() contributingUrl?: string;
  @Input() issuesUrl?: string;
}

