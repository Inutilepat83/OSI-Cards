import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService, Language } from '../../core/services/translation.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="language-selector">
      <button
        class="language-button"
        (click)="toggleDropdown()"
        [attr.aria-expanded]="isDropdownOpen"
        aria-haspopup="listbox"
      >
        <span class="current-language">
          <span class="flag">{{ currentLanguage?.flag }}</span>
          <span class="name">{{ currentLanguage?.name }}</span>
        </span>
        <i class="pi pi-chevron-down" [class.rotated]="isDropdownOpen"></i>
      </button>

      <div class="dropdown" [class.open]="isDropdownOpen">
        <div class="language-list" role="listbox">
          <button
            *ngFor="let language of availableLanguages"
            class="language-option"
            [class.active]="language.code === currentLanguage?.code"
            (click)="selectLanguage(language)"
            role="option"
            [attr.aria-selected]="language.code === currentLanguage?.code"
          >
            <span class="flag">{{ language.flag }}</span>
            <span class="name">{{ language.name }}</span>
            <i class="pi pi-check" *ngIf="language.code === currentLanguage?.code"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .language-selector {
        position: relative;
        display: inline-block;
      }

      .language-button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: var(--bg-color, #fff);
        border: 1px solid var(--border-color, #ddd);
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
        min-width: 120px;
        justify-content: space-between;
      }

      .language-button:hover {
        border-color: var(--primary-color, #1976d2);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .language-button:focus {
        outline: none;
        border-color: var(--primary-color, #1976d2);
        box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
      }

      .current-language {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .flag {
        font-size: 16px;
      }

      .name {
        font-weight: 500;
        color: var(--text-color, #333);
      }

      .pi-chevron-down {
        transition: transform 0.2s ease;
        color: var(--text-color, #666);
      }

      .pi-chevron-down.rotated {
        transform: rotate(180deg);
      }

      .dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--bg-color, #fff);
        border: 1px solid var(--border-color, #ddd);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.2s ease;
        z-index: 1000;
        margin-top: 4px;
      }

      .dropdown.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .language-list {
        max-height: 200px;
        overflow-y: auto;
      }

      .language-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 10px 12px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s ease;
        text-align: left;
      }

      .language-option:hover {
        background: var(--hover-color, #f5f5f5);
      }

      .language-option.active {
        background: var(--primary-color, #1976d2);
        color: white;
      }

      .language-option.active:hover {
        background: var(--primary-hover-color, #1565c0);
      }

      .language-option .flag {
        margin-right: 8px;
      }

      .language-option .pi-check {
        color: var(--success-color, #4caf50);
        font-size: 12px;
      }

      .language-option.active .pi-check {
        color: white;
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .language-button {
          padding: 6px 10px;
          font-size: 13px;
          min-width: 100px;
        }

        .dropdown {
          position: fixed;
          top: auto;
          bottom: 20px;
          left: 20px;
          right: 20px;
          max-width: none;
        }

        .language-list {
          max-height: 150px;
        }
      }

      /* RTL support */
      [dir='rtl'] .current-language {
        flex-direction: row-reverse;
      }

      [dir='rtl'] .language-option {
        flex-direction: row-reverse;
        text-align: right;
      }

      [dir='rtl'] .language-option .flag {
        margin-right: 0;
        margin-left: 8px;
      }
    `,
  ],
})
export class LanguageSelectorComponent implements OnInit, OnDestroy {
  currentLanguage: Language | undefined;
  availableLanguages: Language[] = [];
  isDropdownOpen = false;
  private subscription: Subscription = new Subscription();

  constructor(private translationService: TranslationService) {}

  ngOnInit(): void {
    this.availableLanguages = this.translationService.getAvailableLanguages();

    this.subscription.add(
      this.translationService.getCurrentLanguage$().subscribe(langCode => {
        this.currentLanguage = this.translationService.getLanguageByCode(langCode);
      })
    );

    // Close dropdown when clicking outside
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    document.removeEventListener('click', this.handleClickOutside);
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectLanguage(language: Language): void {
    this.translationService.setLanguage(language.code);
    this.isDropdownOpen = false;
  }

  private handleClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    const selector = target.closest('.language-selector');

    if (!selector && this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }
}
