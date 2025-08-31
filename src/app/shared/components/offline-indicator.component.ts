import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { OfflineSupportService, SyncStatus } from '../../core/services/offline-support.service';

@Component({
  selector: 'app-offline-indicator',
  template: `
    <div
      class="offline-indicator"
      [class.online]="syncStatus?.isOnline"
      [class.offline]="!syncStatus?.isOnline"
    >
      <div class="status-icon">
        <i class="pi" [class]="syncStatus?.isOnline ? 'pi-wifi' : 'pi-ban'"></i>
      </div>
      <div class="status-text">
        <span class="status-label">
          {{ syncStatus?.isOnline ? 'Online' : 'Offline' }}
        </span>
        <span class="sync-info" *ngIf="syncStatus && syncStatus.pendingItems > 0">
          {{ syncStatus.pendingItems }} pending
        </span>
      </div>
      <div class="sync-progress" *ngIf="syncStatus?.isSyncing">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="syncProgress"></div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .offline-indicator {
        position: fixed;
        top: 20px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      }

      .offline-indicator.online {
        background: rgba(76, 175, 80, 0.9);
        color: white;
      }

      .offline-indicator.offline {
        background: rgba(244, 67, 54, 0.9);
        color: white;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
        100% {
          opacity: 1;
        }
      }

      .status-icon {
        display: flex;
        align-items: center;
      }

      .status-icon .pi {
        font-size: 16px;
      }

      .status-text {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }

      .status-label {
        font-weight: 600;
      }

      .sync-info {
        font-size: 12px;
        opacity: 0.9;
      }

      .sync-progress {
        margin-left: 8px;
      }

      .progress-bar {
        width: 60px;
        height: 4px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 2px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: white;
        border-radius: 2px;
        transition: width 0.3s ease;
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .offline-indicator {
          top: 10px;
          right: 10px;
          padding: 6px 10px;
          font-size: 12px;
        }

        .status-icon .pi {
          font-size: 14px;
        }

        .progress-bar {
          width: 40px;
          height: 3px;
        }
      }
    `,
  ],
})
export class OfflineIndicatorComponent implements OnInit, OnDestroy {
  syncStatus: SyncStatus | null = null;
  syncProgress = 0;
  private subscription: Subscription = new Subscription();

  constructor(private offlineService: OfflineSupportService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.offlineService.getSyncStatus$().subscribe(status => {
        this.syncStatus = status;
        this.updateSyncProgress();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private updateSyncProgress(): void {
    if (this.syncStatus?.isSyncing) {
      // Simulate progress (in a real app, you'd track actual progress)
      this.syncProgress = Math.min(90, this.syncProgress + 10);
      if (this.syncProgress >= 90) {
        setTimeout(() => (this.syncProgress = 100), 500);
      }
    } else {
      this.syncProgress = 0;
    }
  }
}
