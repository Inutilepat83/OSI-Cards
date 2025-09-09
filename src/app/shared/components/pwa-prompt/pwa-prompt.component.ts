import { Component, inject, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, filter, tap } from 'rxjs/operators';

import { PWAService, PWAStatus } from '../../../core/services/pwa.service';

@Component({
  selector: 'app-pwa-prompt',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressBarModule
  ],
  template: `
    <div class="pwa-container" *ngIf="pwaStatus$ | async as status">
      <!-- Install Prompt -->
      <mat-card class="pwa-card install-prompt" *ngIf="status.isInstallable && !status.isInstalled">
        <mat-card-header>
          <mat-icon mat-card-avatar>install_mobile</mat-icon>
          <mat-card-title>Install OSI Cards</mat-card-title>
          <mat-card-subtitle>Get the full app experience</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="benefits-list">
            <div class="benefit-item">
              <mat-icon>offline_bolt</mat-icon>
              <span>Work offline</span>
            </div>
            <div class="benefit-item">
              <mat-icon>speed</mat-icon>
              <span>Faster loading</span>
            </div>
            <div class="benefit-item">
              <mat-icon>notifications</mat-icon>
              <span>Push notifications</span>
            </div>
            <div class="benefit-item">
              <mat-icon>home</mat-icon>
              <span>Home screen access</span>
            </div>
          </div>
          
          <div class="installation-instructions" *ngIf="showInstructions">
            <h4>Installation Instructions:</h4>
            <ol>
              <li *ngFor="let instruction of installInstructions">
                {{ instruction }}
              </li>
            </ol>
          </div>
        </mat-card-content>
        
        <mat-card-actions align="end">
          <button mat-button (click)="dismissInstallPrompt()">
            Maybe Later
          </button>
          <button mat-button (click)="toggleInstructions()" *ngIf="!status.installPromptEvent">
            How to Install
          </button>
          <button mat-raised-button color="primary" 
                  (click)="installApp()" 
                  *ngIf="status.installPromptEvent"
                  [disabled]="installing">
            <mat-icon *ngIf="!installing">install_mobile</mat-icon>
            <mat-icon *ngIf="installing" class="spinning">refresh</mat-icon>
            {{ installing ? 'Installing...' : 'Install App' }}
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Update Available Prompt -->
      <mat-card class="pwa-card update-prompt" *ngIf="status.updateAvailable">
        <mat-card-header>
          <mat-icon mat-card-avatar color="accent">system_update</mat-icon>
          <mat-card-title>Update Available</mat-card-title>
          <mat-card-subtitle>A new version of OSI Cards is ready</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <p>We've improved the app with new features and bug fixes.</p>
          
          <div class="update-features" *ngIf="updateFeatures.length > 0">
            <h4>What's New:</h4>
            <ul>
              <li *ngFor="let feature of updateFeatures">{{ feature }}</li>
            </ul>
          </div>
        </mat-card-content>
        
        <mat-card-actions align="end">
          <button mat-button (click)="dismissUpdatePrompt()">
            Update Later
          </button>
          <button mat-raised-button color="accent" 
                  (click)="applyUpdate()"
                  [disabled]="updating">
            <mat-icon *ngIf="!updating">system_update_alt</mat-icon>
            <mat-icon *ngIf="updating" class="spinning">refresh</mat-icon>
            {{ updating ? 'Updating...' : 'Update Now' }}
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Offline Status -->
      <mat-card class="pwa-card offline-status" *ngIf="!status.isOnline">
        <mat-card-header>
          <mat-icon mat-card-avatar color="warn">cloud_off</mat-icon>
          <mat-card-title>You're Offline</mat-card-title>
          <mat-card-subtitle>Using cached data</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <p>Don't worry! You can still:</p>
          
          <div class="offline-capabilities">
            <div class="capability-item" *ngFor="let capability of offlineCapabilities">
              <mat-icon>check_circle</mat-icon>
              <span>{{ capability }}</span>
            </div>
          </div>
          
          <p class="sync-message">
            <mat-icon>sync</mat-icon>
            Your changes will sync automatically when you're back online.
          </p>
        </mat-card-content>
        
        <mat-card-actions align="end">
          <button mat-button (click)="dismissOfflineStatus()">
            Got it
          </button>
          <button mat-raised-button color="primary" (click)="checkConnection()">
            <mat-icon>refresh</mat-icon>
            Check Connection
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- App Status Info -->
      <div class="pwa-status-info" *ngIf="showStatusInfo">
        <div class="status-item">
          <mat-icon [class.active]="status.isInstalled">
            {{ status.isInstalled ? 'check_circle' : 'radio_button_unchecked' }}
          </mat-icon>
          <span>App Installed</span>
        </div>
        
        <div class="status-item">
          <mat-icon [class.active]="status.isOnline">
            {{ status.isOnline ? 'cloud_done' : 'cloud_off' }}
          </mat-icon>
          <span>Online Status</span>
        </div>
        
        <div class="status-item">
          <mat-icon [class.active]="!status.updateAvailable">
            {{ status.updateAvailable ? 'system_update' : 'check_circle' }}
          </mat-icon>
          <span>Up to Date</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pwa-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 400px;
      width: calc(100vw - 40px);
    }

    .pwa-card {
      margin-bottom: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      border-radius: 12px;
      overflow: hidden;
    }

    .install-prompt {
      border-left: 4px solid #2196F3;
    }

    .update-prompt {
      border-left: 4px solid #FF9800;
    }

    .offline-status {
      border-left: 4px solid #F44336;
    }

    .benefits-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin: 16px 0;
    }

    .benefit-item,
    .capability-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.04);
      border-radius: 8px;
    }

    .benefit-item mat-icon,
    .capability-item mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #2196F3;
    }

    .installation-instructions {
      margin-top: 16px;
      padding: 12px;
      background: rgba(0, 0, 0, 0.04);
      border-radius: 8px;
    }

    .installation-instructions h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
    }

    .installation-instructions ol {
      margin: 0;
      padding-left: 20px;
    }

    .installation-instructions li {
      margin-bottom: 4px;
      font-size: 13px;
    }

    .update-features {
      margin: 16px 0;
    }

    .update-features h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
    }

    .update-features ul {
      margin: 0;
      padding-left: 20px;
    }

    .update-features li {
      margin-bottom: 4px;
      font-size: 13px;
    }

    .offline-capabilities {
      margin: 16px 0;
    }

    .sync-message {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 8px;
      background: rgba(76, 175, 80, 0.1);
      border-radius: 8px;
      font-size: 13px;
      color: #388E3C;
    }

    .sync-message mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .pwa-status-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: rgba(0, 0, 0, 0.04);
      border-radius: 8px;
      font-size: 12px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #757575;
    }

    .status-item mat-icon.active {
      color: #4CAF50;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .pwa-container {
        top: 10px;
        right: 10px;
        left: 10px;
        width: auto;
        max-width: none;
      }

      .benefits-list {
        grid-template-columns: 1fr;
      }

      .pwa-card {
        margin-bottom: 12px;
      }
    }

    @media (max-width: 480px) {
      .pwa-container {
        top: 5px;
        right: 5px;
        left: 5px;
      }

      mat-card-actions {
        flex-direction: column;
        align-items: stretch;
      }

      mat-card-actions button {
        margin: 4px 0;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PwaPromptComponent implements OnInit, OnDestroy {
  private readonly pwaService = inject(PWAService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  public readonly pwaStatus$ = new BehaviorSubject<PWAStatus>(this.pwaService.getStatus());
  
  public installing = false;
  public updating = false;
  public showInstructions = false;
  public showStatusInfo = false;
  public installInstructions: string[] = [];
  public offlineCapabilities: string[] = [];
  public updateFeatures: string[] = [
    'Improved performance and loading times',
    'Enhanced offline capabilities',
    'New card visualization features',
    'Bug fixes and stability improvements'
  ];

  ngOnInit(): void {
    this.setupUpdateHandling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupUpdateHandling(): void {
    this.pwaService.updateAvailable$.pipe(
      takeUntil(this.destroy$),
      tap(() => {
        this.snackBar.open('New version available!', 'Update', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        }).onAction().subscribe(() => {
          this.applyUpdate();
        });
      })
    ).subscribe();
  }

  public async installApp(): Promise<void> {
    if (this.installing) return;

    this.installing = true;
    
    try {
      const success = await this.pwaService.installPWA();
      
      if (success) {
        this.snackBar.open('App installed successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      } else {
        this.snackBar.open('Installation cancelled', 'Close', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    } catch (error) {
      console.error('Installation failed:', error);
      this.snackBar.open('Installation failed. Please try again.', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    } finally {
      this.installing = false;
    }
  }

  public async applyUpdate(): Promise<void> {
    if (this.updating) return;

    this.updating = true;
    
    try {
      const success = await this.pwaService.activateUpdate();
      
      if (success) {
        this.snackBar.open('Update applied! Reloading app...', 'Close', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      } else {
        this.snackBar.open('Update failed. Please try again.', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    } catch (error) {
      console.error('Update failed:', error);
      this.snackBar.open('Update failed. Please refresh the page.', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    } finally {
      this.updating = false;
    }
  }

  public dismissInstallPrompt(): void {
    // Hide the install prompt for this session
    // In a real app, you might want to store this preference
    this.snackBar.open('You can install the app later from your browser menu', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  public dismissUpdatePrompt(): void {
    // Hide the update prompt temporarily
    this.snackBar.open('Update reminder will show again later', 'Close', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  public dismissOfflineStatus(): void {
    // Hide the offline status for this session
  }

  public toggleInstructions(): void {
    this.showInstructions = !this.showInstructions;
  }

  public toggleStatusInfo(): void {
    this.showStatusInfo = !this.showStatusInfo;
  }

  public async checkConnection(): Promise<void> {
    // Force a network check
    try {
      await this.pwaService.checkForUpdate();
      this.snackBar.open('Connection check complete', 'Close', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    } catch (error) {
      this.snackBar.open('Still offline. Please check your connection.', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }
  }
}
