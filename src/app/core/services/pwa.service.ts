import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, fromEvent, timer, of } from 'rxjs';
import { filter, switchMap, catchError, tap } from 'rxjs/operators';

export interface PWAStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  installPromptEvent: any;
  updateAvailable: boolean;
  isOnline: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PWAService {
  private readonly platformId = inject(PLATFORM_ID);
  private deferredPrompt: any = null;
  private swUpdate: any = null;

  private readonly statusSubject = new BehaviorSubject<PWAStatus>({
    isInstallable: false,
    isInstalled: false,
    installPromptEvent: null,
    updateAvailable: false,
    isOnline: navigator.onLine
  });
  public readonly status$ = this.statusSubject.asObservable();

  private readonly updateAvailableSubject = new BehaviorSubject<boolean>(false);
  public readonly updateAvailable$ = this.updateAvailableSubject.asObservable();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializePWA();
    }
  }

  private async initializePWA(): Promise<void> {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (event: any) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.statusSubject.next({
        ...this.statusSubject.value,
        isInstallable: true,
        installPromptEvent: event
      });
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      this.statusSubject.next({
        ...this.statusSubject.value,
        isInstalled: true
      });
      this.deferredPrompt = null;
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.statusSubject.next({
        ...this.statusSubject.value,
        isInstalled: true
      });
    }

    // Try to load service worker update functionality
    try {
      const swModule = await import('@angular/service-worker');
      this.swUpdate = swModule.SwUpdate;

      if (this.swUpdate) {
        // Check for updates periodically
        timer(0, 30000) // Check every 30 seconds
          .pipe(
            switchMap(() => fromEvent(this.swUpdate, 'available')),
            catchError(() => of(null))
          )
          .subscribe(() => {
            this.updateAvailableSubject.next(true);
            this.statusSubject.next({
              ...this.statusSubject.value,
              updateAvailable: true
            });
          });

        // Listen for update activation
        fromEvent(this.swUpdate, 'activated')
          .subscribe(() => {
            this.updateAvailableSubject.next(false);
            this.statusSubject.next({
              ...this.statusSubject.value,
              updateAvailable: false,
              isInstalled: true
            });
          });
      }
    } catch (error) {
      // Service worker not available
      console.warn('Service worker not available:', error);
    }
  }

  public getStatus(): PWAStatus {
    return this.statusSubject.value;
  }

  public async installPWA(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const result = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;

      if (result.outcome === 'accepted') {
        this.statusSubject.next({
          ...this.statusSubject.value,
          isInstalled: true,
          isInstallable: false,
          installPromptEvent: null
        });
        return true;
      } else {
        this.statusSubject.next({
          ...this.statusSubject.value,
          isInstallable: false,
          installPromptEvent: null
        });
        return false;
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  }

  public async activateUpdate(): Promise<boolean> {
    if (!this.swUpdate) {
      return false;
    }

    try {
      await this.swUpdate.activateUpdate();
      this.updateAvailableSubject.next(false);
      this.statusSubject.next({
        ...this.statusSubject.value,
        updateAvailable: false,
        isInstalled: true
      });
      return true;
    } catch (error) {
      console.error('Error activating update:', error);
      return false;
    }
  }

  public async checkForUpdate(): Promise<void> {
    if (!this.swUpdate) {
      return;
    }

    try {
      const hasUpdate = await this.swUpdate.checkForUpdate();
      if (hasUpdate) {
        this.updateAvailableSubject.next(true);
        this.statusSubject.next({
          ...this.statusSubject.value,
          updateAvailable: true
        });
      }
    } catch (error) {
      console.error('Error checking for update:', error);
    }
  }
}
