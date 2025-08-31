import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ThemeService, Theme } from '../../../core/services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.css'],
})
export class ThemeToggleComponent implements OnInit, OnDestroy {
  @Input() showDropdown = false;

  currentTheme: Theme = 'auto';
  isDarkTheme = false;
  availableThemes = this.themeService.getAvailableThemes();

  private subscriptions: Subscription[] = [];

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.subscriptions.push(
      this.themeService.getCurrentTheme$().subscribe(theme => {
        this.currentTheme = theme;
      }),
      this.themeService.getAppliedTheme$().subscribe(theme => {
        this.isDarkTheme = theme === 'dark';
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  getCurrentIcon(): string {
    const theme = this.availableThemes.find(t => t.value === this.currentTheme);
    return theme ? theme.icon : 'pi pi-sun';
  }

  getAriaLabel(): string {
    return `Switch to ${this.isDarkTheme ? 'light' : 'dark'} theme`;
  }
}
